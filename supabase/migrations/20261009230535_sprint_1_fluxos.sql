-- Sprint 1: additive schema, server-only atomic operations and durable email outbox.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.convites add column if not exists cpf text;
alter table public.convites add column if not exists telefone text;
alter table public.convites add column if not exists token_hash text;
create unique index convites_token_hash_key on public.convites(token_hash) where token_hash is not null;
alter table public.convites add constraint convites_token_hash_formato check(token_hash is null or token_hash ~ '^[a-f0-9]{64}$');
alter table public.convites add constraint convites_cpf_formato check(cpf is null or cpf ~ '^[0-9]{11}$');
alter table public.convites add constraint convites_telefone_formato check(telefone is null or telefone ~ '^[0-9]{10,11}$');

-- A browser may read its own profile but cannot create an affiliation or change its identity.
drop policy organizadores_insert_proprio on public.organizadores;
drop policy organizadores_update_proprio on public.organizadores;
drop policy convidados_insert_proprio on public.convidados;
drop policy convidados_update_proprio on public.convidados;
revoke insert,update,delete on public.organizadores,public.convidados from anon,authenticated;

-- Resolve event visibility without an events->convites->events RLS recursion.
create function private.tem_convite(p_evento bigint) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.convites where evento_id=p_evento and convidado_id=(select auth.uid()));
$$;
revoke all on function private.tem_convite(bigint) from public;
grant usage on schema private to authenticated;
grant execute on function private.tem_convite(bigint) to authenticated;
create policy eventos_select_convidado on public.eventos for select to authenticated
  using(private.tem_convite(id));

-- Writes are performed only by transactional service-role RPCs after HTTP identity checks.
drop policy convites_gestao_do_organizador on public.convites;
create policy convites_select_organizador on public.convites for select to authenticated using(
 exists(select 1 from public.eventos e where e.id=convites.evento_id and e.organizador_id=(select auth.uid()))
);
revoke all on public.convites from anon,authenticated;
grant select(id,evento_id,nome_convidado,email,status,codigo,convidado_id,expira_em,cpf,telefone,criado_em,updated_at)
 on public.convites to authenticated;

create table public.notificacoes(
 id bigint generated always as identity primary key,
 convite_id bigint not null references public.convites(id) on delete cascade,
 tipo text not null check(tipo in ('convite','confirmacao','acesso')),
 chave text not null unique,
 destinatario text not null,
 payload jsonb not null,
 estado text not null default 'pendente' check(estado in ('pendente','processando','enviado','falhou')),
 tentativas integer not null default 0,
 lease uuid,
 lease_ate timestamptz,
 proxima_tentativa timestamptz not null default now(),
 provedor_id text,
 ultimo_erro text,
 criado_em timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index notificacoes_convite_idx on public.notificacoes(convite_id);
create index notificacoes_pendentes_idx on public.notificacoes(proxima_tentativa) where estado<>'enviado';
alter table public.notificacoes enable row level security;
revoke all on public.notificacoes from public,anon,authenticated;
grant all on public.notificacoes to service_role;
create trigger notificacoes_updated_at before update on public.notificacoes for each row execute function public.tg_set_updated_at();

create table private.limites(chave text primary key, janela timestamptz not null default now(),tentativas int not null default 1);

-- Existing affiliations are the migration source, never mutable user metadata.
update auth.users u set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||jsonb_build_object('perfil','organizador')
 where exists(select 1 from public.organizadores o where o.id=u.id);
update auth.users u set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||jsonb_build_object('perfil','convidado')
 where exists(select 1 from public.convidados c where c.id=u.id) and not exists(select 1 from public.organizadores o where o.id=u.id);

create function private.cadastrar_convidado(p_usuario uuid,p_token_hash text,p_nome text,p_cpf text,p_telefone text)
returns public.convidados language plpgsql security definer set search_path='' as $$
declare c public.convites; u auth.users; perfil public.convidados;
begin
 select * into u from auth.users where id=p_usuario and email_confirmed_at is not null;
 if not found then raise exception using errcode='P0001',message='IDENTIDADE_NAO_VERIFICADA'; end if;
 select * into c from public.convites where token_hash=p_token_hash for update;
 if not found or c.expira_em is null or c.expira_em<=now() or c.status in ('cancelado','transferido') then
   raise exception using errcode='P0001',message='CONVITE_INVALIDO'; end if;
 if lower(c.email)<>lower(u.email) or (c.convidado_id is not null and c.convidado_id<>p_usuario) then
   raise exception using errcode='P0001',message='CONVITE_NAO_PERTENCE'; end if;
 -- Preserve an existing profile; do not overwrite identity data when accepting another invitation.
 insert into public.convidados(id,nome,email,cpf,telefone) values(p_usuario,p_nome,lower(u.email),p_cpf,p_telefone)
 on conflict(id) do nothing;
 select * into perfil from public.convidados where id=p_usuario;
 update public.convites set convidado_id=p_usuario where id=c.id;
 update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||
  jsonb_build_object('perfil',case when exists(select 1 from public.organizadores where id=p_usuario) then 'organizador' else 'convidado' end)
 where id=p_usuario;
 return perfil;
end $$;

revoke all on function private.cadastrar_convidado(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function private.cadastrar_convidado(uuid,text,text,text,text) to service_role;
create function public.cadastrar_convidado(p_usuario uuid,p_token_hash text,p_nome text,p_cpf text,p_telefone text) returns public.convidados language sql security invoker set search_path='' as $$ select private.cadastrar_convidado(p_usuario,p_token_hash,p_nome,p_cpf,p_telefone); $$;

create function public.responder_convite(p_usuario uuid,p_convite bigint,p_status text)
returns public.convites language plpgsql security invoker set search_path='' as $$
declare c public.convites; e public.eventos;
begin
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
   values(c.id,'confirmacao','confirmacao:'||c.id,c.email,jsonb_build_object('nome',c.nome_convidado,'evento',e.nome,'data',e.data,'horario',e.horario,'local',e.local))
   on conflict(chave) do nothing;
 end if;
 return c;
end $$;

create function public.consumir_limite(p_chave text,p_limite int,p_segundos int) returns boolean
language plpgsql security invoker set search_path='' as $$
declare quantidade int;
begin
 insert into private.limites(chave) values(p_chave) on conflict(chave) do update
 set tentativas=case when private.limites.janela<=now()-make_interval(secs=>p_segundos) then 1 else private.limites.tentativas+1 end,
 janela=case when private.limites.janela<=now()-make_interval(secs=>p_segundos) then now() else private.limites.janela end
 returning tentativas into quantidade;
 return quantidade<=p_limite;
end $$;

create function public.claim_notificacoes(p_limite int,p_convite bigint default null) returns setof public.notificacoes
language sql security invoker set search_path='' as $$
 update public.notificacoes n set estado='processando',tentativas=tentativas+1,lease=gen_random_uuid(),lease_ate=now()+interval '5 minutes'
 where id in(select id from public.notificacoes
 where (p_convite is null or convite_id=p_convite) and proxima_tentativa<=now()
 and (estado in ('pendente','falhou') or (estado='processando' and lease_ate<now()))
 and tentativas<10 order by id for update skip locked limit least(p_limite,50))
 returning n.*;
$$;

-- These endpoints are deliberately not browser APIs, even for authenticated users.
revoke all on function public.emitir_convite(uuid,bigint,text,text,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.cadastrar_convidado(uuid,text,text,text,text) from public,anon,authenticated;
revoke all on function public.responder_convite(uuid,bigint,text) from public,anon,authenticated;
revoke all on function public.consumir_limite(text,int,int) from public,anon,authenticated;
revoke all on function public.claim_notificacoes(int,bigint) from public,anon,authenticated;
grant execute on function public.emitir_convite(uuid,bigint,text,text,text,text,text,text,text) to service_role;
grant execute on function public.cadastrar_convidado(uuid,text,text,text,text) to service_role;
grant execute on function public.responder_convite(uuid,bigint,text) to service_role;
grant execute on function public.consumir_limite(text,int,int) to service_role;
grant execute on function public.claim_notificacoes(int,bigint) to service_role;
grant usage on schema private to service_role;
grant all on private.limites to service_role;
