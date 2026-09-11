-- A browser may read its own profile but cannot create an affiliation or change its identity.
drop policy organizadores_insert_proprio on public.organizadores;
drop policy organizadores_update_proprio on public.organizadores;
drop policy convidados_insert_proprio on public.convidados;
drop policy convidados_update_proprio on public.convidados;
revoke insert,update,delete on public.organizadores,public.convidados from anon,authenticated;

