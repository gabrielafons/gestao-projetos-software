-- =============================================================================
-- UH 03 - T1 - [Dados] Criar tabela de Evento
-- Card: tabela "eventos" com nome, data, horario, local, organizador_id (FK)
-- =============================================================================

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  nome text not null,
  data date not null,
  horario time not null,
  local text not null,
  organizador_id uuid not null
    references public.organizadores (id) on delete cascade,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint eventos_nome_nao_vazio
    check (length(btrim(nome)) >= 3),
  constraint eventos_local_nao_vazio
    check (length(btrim(local)) >= 3)
);

comment on table public.eventos is
  'UH 03 - Evento corporativo criado por um organizador.';

-- Postgres nao indexa FK automaticamente; sem este indice o JOIN com
-- organizadores e o ON DELETE CASCADE varrem a tabela inteira.
create index if not exists eventos_organizador_id_idx
  on public.eventos (organizador_id);

-- A agenda do organizador e sempre lida por data: indice composto atende
-- "meus eventos ordenados por data" com uma unica varredura.
create index if not exists eventos_organizador_data_idx
  on public.eventos (organizador_id, data);

create or replace trigger eventos_set_updated_at
  before update on public.eventos
  for each row execute function public.tg_set_updated_at();

-- --- Seguranca (RLS) ---------------------------------------------------------
alter table public.eventos enable row level security;

-- O organizador so enxerga e gerencia os eventos que ele mesmo criou.
create policy eventos_select_do_organizador
  on public.eventos for select
  to authenticated
  using (organizador_id = (select auth.uid()));

create policy eventos_insert_do_organizador
  on public.eventos for insert
  to authenticated
  with check (organizador_id = (select auth.uid()));

create policy eventos_update_do_organizador
  on public.eventos for update
  to authenticated
  using (organizador_id = (select auth.uid()))
  with check (organizador_id = (select auth.uid()));

create policy eventos_delete_do_organizador
  on public.eventos for delete
  to authenticated
  using (organizador_id = (select auth.uid()));
