-- =============================================================================
-- UH 02 - T1 - [Dados] Criar tabela de cadastro do convidado
-- Atributos do card: nome, CPF, email, telefone
--
-- O convidado tambem acessa a plataforma (UH 02: "permitir seu acesso"), entao
-- seu perfil segue o mesmo padrao do organizador: 1:1 com `auth.users`.
-- =============================================================================

create table if not exists public.convidados (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  cpf text not null,
  email text not null,
  telefone text not null,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Nome completo: ao menos dois nomes, no maximo 50 caracteres.
  constraint convidados_nome_completo
    check (btrim(nome) ~ '^[^[:space:]]+([[:space:]]+[^[:space:]]+)+$'
           and length(btrim(nome)) between 5 and 50),
  constraint convidados_cpf_formato
    check (cpf ~ '^[0-9]{11}$'),
  constraint convidados_telefone_formato
    check (telefone ~ '^[0-9]{10,11}$'),
  -- 254 caracteres e o limite de um endereco de e-mail pela RFC 5321.
  constraint convidados_email_formato
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$'
           and length(email) <= 254)
);

comment on table public.convidados is
  'UH 02 - Perfil do convidado. Cadastro nasce a partir de um convite valido.';

create unique index if not exists convidados_cpf_key
  on public.convidados (cpf);
create unique index if not exists convidados_email_key
  on public.convidados (lower(email));

create or replace trigger convidados_set_updated_at
  before update on public.convidados
  for each row execute function public.tg_set_updated_at();

-- --- Seguranca (RLS) ---------------------------------------------------------
alter table public.convidados enable row level security;

create policy convidados_select_proprio
  on public.convidados for select
  to authenticated
  using (id = (select auth.uid()));

create policy convidados_insert_proprio
  on public.convidados for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy convidados_update_proprio
  on public.convidados for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
