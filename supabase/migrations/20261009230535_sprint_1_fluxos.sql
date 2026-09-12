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

