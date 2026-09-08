-- =============================================================================
-- UH 05 - T1 - [Dados] Vincular Convite ao Evento
-- Card: tabela "convites" com nome_convidado, e-mail, evento_id (FK),
--       status, codigo
--
-- O `codigo` e o codigo de acesso unico do participante, usado depois para o
-- registro de entrada/saida (UH 11) e para a retirada do brinde (UH 13).
-- =============================================================================

create table if not exists public.convites (
  id bigint generated always as identity primary key,
  evento_id bigint not null
    references public.eventos (id) on delete cascade,
  nome_convidado text not null,
  email text not null,
  status text not null default 'pendente',
  codigo text not null,
  -- Preenchido quando o convidado se cadastra a partir do convite (UH 02).
  convidado_id uuid
    references public.convidados (id) on delete set null,
  expira_em timestamptz,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint convites_nome_nao_vazio
    check (length(btrim(nome_convidado)) >= 3),
  constraint convites_email_formato
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$'),
  -- Ciclo de vida do convite (UH 05, UH 06 e UH 10).
  constraint convites_status_valido
    check (status in ('pendente', 'confirmado', 'recusado', 'cancelado', 'transferido'))
);

comment on table public.convites is
  'UH 05 - Convite nominal emitido para um evento. `codigo` e a credencial '
  'unica de acesso do participante (check-in, check-out e brinde).';

-- O codigo e lido por QR Code e precisa ser globalmente unico.
create unique index if not exists convites_codigo_key
  on public.convites (codigo);

-- Um mesmo e-mail nao pode ser convidado duas vezes para o mesmo evento.
create unique index if not exists convites_evento_email_key
  on public.convites (evento_id, lower(email));

-- Indices de FK (ver eventos): sustentam o JOIN e o CASCADE.
create index if not exists convites_evento_id_idx
  on public.convites (evento_id);
create index if not exists convites_convidado_id_idx
  on public.convites (convidado_id);

-- Indice parcial: a tela de acompanhamento consulta quase sempre os convites
-- ainda em aberto, que sao uma fracao do total.
create index if not exists convites_pendentes_idx
  on public.convites (evento_id)
  where status = 'pendente';

create or replace trigger convites_set_updated_at
  before update on public.convites
  for each row execute function public.tg_set_updated_at();

-- --- Seguranca (RLS) ---------------------------------------------------------
alter table public.convites enable row level security;

-- O organizador dono do evento gerencia os convites daquele evento.
create policy convites_gestao_do_organizador
  on public.convites for all
  to authenticated
  using (
    exists (
      select 1 from public.eventos e
      where e.id = convites.evento_id
        and e.organizador_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.eventos e
      where e.id = convites.evento_id
        and e.organizador_id = (select auth.uid())
    )
  );

-- O convidado enxerga os convites que ja estao vinculados a ele.
create policy convites_select_do_convidado
  on public.convites for select
  to authenticated
  using (convidado_id = (select auth.uid()));
