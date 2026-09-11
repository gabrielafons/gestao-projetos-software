-- A browser may read its own profile but cannot create an affiliation or change its identity.
drop policy organizadores_insert_proprio on public.organizadores;
drop policy organizadores_update_proprio on public.organizadores;
