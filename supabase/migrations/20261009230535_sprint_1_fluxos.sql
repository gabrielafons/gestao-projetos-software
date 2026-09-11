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

