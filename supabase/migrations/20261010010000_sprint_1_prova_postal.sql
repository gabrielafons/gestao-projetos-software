-- A postal proof belongs to the exact Auth session that consumed the email OTP.
-- Password sessions, including preclaimed organizer accounts, cannot inherit it.
create table private.provas_postais (
 sessao uuid not null references auth.sessions(id) on delete cascade,
 usuario uuid not null references auth.users(id) on delete cascade,
 convite bigint not null references public.convites(id) on delete cascade,
 verificado_em timestamptz not null default now(),
 primary key(sessao,convite)
);
alter table private.provas_postais enable row level security;
revoke all on private.provas_postais from public,anon,authenticated,service_role;

create function private.tem_prova_postal(p_usuario uuid,p_sessao uuid,p_convite bigint default null)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.provas_postais p join auth.sessions s on s.id=p.sessao and s.user_id=p.usuario
 where p.usuario=p_usuario and p.sessao=p_sessao and (p_convite is null or p.convite=p_convite));
$$;
revoke all on function private.tem_prova_postal(uuid,uuid,bigint) from public,anon,authenticated;
grant execute on function private.tem_prova_postal(uuid,uuid,bigint) to service_role;

create function private.sessao_tem_prova(p_convite bigint default null)
returns boolean language sql stable security definer set search_path='' as $$
 select private.tem_prova_postal(auth.uid(),nullif(auth.jwt()->>'session_id','')::uuid,p_convite);
$$;
revoke all on function private.sessao_tem_prova(bigint) from public,anon;
grant execute on function private.sessao_tem_prova(bigint) to authenticated;

create function public.registrar_prova_postal(p_usuario uuid,p_sessao uuid,p_convite bigint)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from auth.sessions s join auth.users u on u.id=s.user_id
 join public.convites c on lower(c.email)=lower(u.email)
 where s.id=p_sessao and u.id=p_usuario and u.email_confirmed_at is not null and c.id=p_convite
 and c.expira_em>now() and c.status not in ('cancelado','transferido')
 and (c.convidado_id is null or c.convidado_id=p_usuario)) then
 raise exception using errcode='P0001',message='IDENTIDADE_NAO_VERIFICADA'; end if;
 insert into private.provas_postais(sessao,usuario,convite) values(p_sessao,p_usuario,p_convite)
 on conflict(sessao,convite) do nothing;
end $$;
create function public.verificar_prova_postal(p_usuario uuid,p_sessao uuid,p_convite bigint)
returns boolean language sql security invoker set search_path='' as $$
 select private.tem_prova_postal(p_usuario,p_sessao,p_convite);
$$;

-- Restrictive guards also cover any other permissive policy present on these tables.
create policy convidados_prova_postal on public.convidados as restrictive for select to authenticated
 using(id=auth.uid() and private.sessao_tem_prova());
create policy convites_prova_postal on public.convites as restrictive for select to authenticated
 using(exists(select 1 from public.eventos e where e.id=evento_id and e.organizador_id=auth.uid())
 or (convidado_id=auth.uid() and private.sessao_tem_prova(id)));
create or replace function private.tem_convite(p_evento bigint) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.convites c where c.evento_id=p_evento and c.convidado_id=auth.uid() and private.sessao_tem_prova(c.id));
$$;
create policy eventos_prova_postal on public.eventos as restrictive for select to authenticated
 using(organizador_id=auth.uid() or private.tem_convite(id));

-- Remove unsafe legacy signatures rather than leaving callable overloads.
drop function public.cadastrar_convidado(uuid,text,text,text,text);
drop function public.responder_convite(uuid,bigint,text);
create function public.cadastrar_convidado(p_usuario uuid,p_sessao uuid,p_token_hash text,p_nome text,p_cpf text,p_telefone text)
returns public.convidados language plpgsql security definer set search_path='' as $$
declare convite bigint;
begin
 select id into convite from public.convites where token_hash=p_token_hash;
 if convite is null or not private.tem_prova_postal(p_usuario,p_sessao,convite) then
 raise exception using errcode='P0001',message='IDENTIDADE_NAO_VERIFICADA'; end if;
 return private.cadastrar_convidado(p_usuario,p_token_hash,p_nome,p_cpf,p_telefone);
end $$;
-- The legacy implementation is now an internal helper only.
revoke all on function private.cadastrar_convidado(uuid,text,text,text,text) from service_role;

create function public.responder_convite(p_usuario uuid,p_sessao uuid,p_convite bigint,p_status text)
returns public.convites language plpgsql security definer set search_path='' as $$
declare c public.convites; e public.eventos;
begin
 if not private.tem_prova_postal(p_usuario,p_sessao,p_convite) then
 raise exception using errcode='P0001',message='IDENTIDADE_NAO_VERIFICADA'; end if;
 if p_status not in ('confirmado','recusado') then raise exception using errcode='P0001',message='STATUS_INVALIDO'; end if;
 select * into c from public.convites where id=p_convite and convidado_id=p_usuario for update;
 if not found then raise exception using errcode='P0001',message='CONVITE_NAO_ENCONTRADO'; end if;
 if c.status=p_status then return c; end if;
 if c.expira_em is null or c.expira_em<=now() then raise exception using errcode='P0001',message='CONVITE_EXPIRADO'; end if;
 if c.status<>'pendente' then raise exception using errcode='P0001',message='RESPOSTA_JA_REGISTRADA'; end if;
 update public.convites set status=p_status where id=c.id returning * into c;
 if p_status='confirmado' then
 select * into e from public.eventos where id=c.evento_id;
 insert into public.notificacoes(convite_id,tipo,chave,destinatario,payload)
 values(c.id,'confirmacao','confirmacao:'||c.id,c.email,jsonb_build_object('nome',c.nome_convidado,'evento',e.nome,'data',e.data,'horario',e.horario,'local',e.local)) on conflict(chave) do nothing;
 end if;
 return c;
end $$;

create function public.recuperar_notificacao(p_usuario uuid,p_sessao uuid,p_convite bigint,p_tipo text)
returns void language plpgsql security definer set search_path='' as $$
declare c public.convites; dono boolean;
begin
 if p_tipo not in ('convite','confirmacao') then raise exception using errcode='P0001',message='STATUS_INVALIDO'; end if;
 select * into c from public.convites where id=p_convite for update;
 if not found then raise exception using errcode='P0001',message='CONVITE_NAO_ENCONTRADO'; end if;
 select exists(select 1 from public.eventos where id=c.evento_id and organizador_id=p_usuario) into dono;
 if not dono and not (p_tipo='confirmacao' and c.convidado_id=p_usuario and private.tem_prova_postal(p_usuario,p_sessao,p_convite)) then
 raise exception using errcode='P0001',message='CONVITE_NAO_PERTENCE'; end if;
 if p_tipo='convite' and (c.expira_em is null or c.expira_em<=now() or c.status in ('cancelado','transferido')) then
 raise exception using errcode='P0001',message='CONVITE_INVALIDO'; end if;
 if p_tipo='confirmacao' and c.status<>'confirmado' then raise exception using errcode='P0001',message='CONVITE_INVALIDO'; end if;
 -- Keep the row, payload, provider id and stable idempotency key. Never reclaim a live lease or delivered message.
 update public.notificacoes set tentativas=0,proxima_tentativa=now(),estado='pendente',lease=null,lease_ate=null
 where convite_id=p_convite and tipo=p_tipo and (estado in ('falhou','pendente') or (estado='processando' and lease_ate<now()));
end $$;

revoke all on function public.registrar_prova_postal(uuid,uuid,bigint) from public,anon,authenticated;
revoke all on function public.verificar_prova_postal(uuid,uuid,bigint) from public,anon,authenticated;
revoke all on function public.cadastrar_convidado(uuid,uuid,text,text,text,text) from public,anon,authenticated;
revoke all on function public.responder_convite(uuid,uuid,bigint,text) from public,anon,authenticated;
revoke all on function public.recuperar_notificacao(uuid,uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.registrar_prova_postal(uuid,uuid,bigint) to service_role;
grant execute on function public.verificar_prova_postal(uuid,uuid,bigint) to service_role;
grant execute on function public.cadastrar_convidado(uuid,uuid,text,text,text,text) to service_role;
grant execute on function public.responder_convite(uuid,uuid,bigint,text) to service_role;
grant execute on function public.recuperar_notificacao(uuid,uuid,bigint,text) to service_role;
