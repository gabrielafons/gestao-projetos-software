-- =============================================================================
-- UH 01 - T1 - [Dados] Criar tabela de perfil do Organizador
-- Atributos do card: nome, cpf, telefone, e-mail, senha
--
-- NOTA SOBRE A SENHA:
-- A senha NAO e armazenada nesta tabela. Conforme a decisao de reuso registrada
-- na Wiki ("Supabase Auth - Reutilizar"), as credenciais ficam sob a guarda do
-- Supabase Auth, na tabela gerenciada `auth.users`, com hash bcrypt.
-- Esta tabela guarda o PERFIL do organizador e referencia `auth.users(id)`.
-- =============================================================================

-- Funcao compartilhada para manter `updated_at` sempre coerente.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizadores (
  -- O id do perfil e o proprio id do usuario no Supabase Auth (relacao 1:1).
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  cpf text not null,
  telefone text not null,
  email text not null,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Nome completo: ao menos dois nomes, no maximo 50 caracteres.
  constraint organizadores_nome_completo
    check (btrim(nome) ~ '^[^[:space:]]+([[:space:]]+[^[:space:]]+)+$'
           and length(btrim(nome)) between 5 and 50),
  -- CPF normalizado: apenas os 11 digitos, sem pontuacao.
  constraint organizadores_cpf_formato
    check (cpf ~ '^[0-9]{11}$'),
  -- Telefone normalizado: 10 (fixo) ou 11 (celular) digitos, com DDD.
  constraint organizadores_telefone_formato
    check (telefone ~ '^[0-9]{10,11}$'),
  -- 254 caracteres e o limite de um endereco de e-mail pela RFC 5321.
  constraint organizadores_email_formato
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$'
           and length(email) <= 254)
);

comment on table public.organizadores is
  'UH 01 - Perfil do organizador de eventos. Credenciais ficam em auth.users.';

-- CPF e e-mail sao identificadores de negocio: nao podem se repetir.
create unique index if not exists organizadores_cpf_key
  on public.organizadores (cpf);
create unique index if not exists organizadores_email_key
  on public.organizadores (lower(email));

create or replace trigger organizadores_set_updated_at
  before update on public.organizadores
  for each row execute function public.tg_set_updated_at();

-- --- Seguranca (RLS) ---------------------------------------------------------
alter table public.organizadores enable row level security;

-- O organizador enxerga e mantem apenas o proprio perfil.
-- auth.uid() vai dentro de um SELECT para ser avaliado uma vez, e nao por linha.
create policy organizadores_select_proprio
  on public.organizadores for select
  to authenticated
  using (id = (select auth.uid()));

create policy organizadores_insert_proprio
  on public.organizadores for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy organizadores_update_proprio
  on public.organizadores for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
