-- Preserve this browser's already-proven invitations when a second OTP rotates
-- its Auth session. The server obtains both session ids from verified claims;
-- neither is supplied by the browser request, nor discovered by looking up a user.
create function public.registrar_prova_postal_com_continuidade(
 p_usuario uuid,p_sessao uuid,p_convite bigint,p_sessao_anterior uuid default null
) returns void language plpgsql security definer set search_path='' as $$
begin
 -- This validates the new Auth session, identity and current invitation first.
 perform public.registrar_prova_postal(p_usuario,p_sessao,p_convite);
 if p_sessao_anterior is not null and p_sessao_anterior<>p_sessao then
  if not exists(select 1 from auth.sessions where id=p_sessao_anterior and user_id=p_usuario)
   or not exists(select 1 from auth.sessions where id=p_sessao and user_id=p_usuario) then
   raise exception using errcode='P0001',message='IDENTIDADE_NAO_VERIFICADA';
  end if;
  -- Copy only proofs the authenticated predecessor actually had, including
  -- historical invitations. Password sessions with no proofs transfer nothing.
  insert into private.provas_postais(sessao,usuario,convite,verificado_em)
  select p_sessao,p_usuario,p.convite,p.verificado_em
  from private.provas_postais p
  where p.sessao=p_sessao_anterior and p.usuario=p_usuario
  on conflict(sessao,convite) do nothing;
 end if;
end $$;
revoke all on function public.registrar_prova_postal_com_continuidade(uuid,uuid,bigint,uuid) from public,anon,authenticated;
grant execute on function public.registrar_prova_postal_com_continuidade(uuid,uuid,bigint,uuid) to service_role;
