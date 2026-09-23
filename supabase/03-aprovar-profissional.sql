-- ============================================================================
-- PENEIRAS ON — Aprovar/recusar solicitação profissional (olheiro / academia)
-- ----------------------------------------------------------------------------
-- Template para o administrador aprovar uma conta profissional via SQL revisável.
-- O cliente NUNCA aprova a si mesmo. Documente por e-mail/usuario_id exato.
--
-- 1) Localize a solicitação (troque o e-mail):
--    select c.usuario_id, u.email, c.tipo, c.empresa, c.cargo, c.situacao
--      from public.cadastros_profissionais c
--      join auth.users u on u.id = c.usuario_id
--     where lower(u.email) = lower('olheiro@exemplo.com');
--
-- 2) Aprove (para OLHEIRO, promove o papel para 'olheiro' também; para ACADEMIA,
--    o papel efetivo de gestão é 'gestora' — confirme que é a equipe Pelé Academia).
-- ============================================================================
begin;
set local search_path = public;

do $aprovar$
declare
  v_email  constant text := 'olheiro@exemplo.com';   -- <<< troque aqui
  v_aprova constant boolean := true;                 -- true = aprovar, false = recusar
  v_uid    uuid;
  v_tipo   text;
  v_admin  uuid;
begin
  select c.usuario_id, c.tipo into v_uid, v_tipo
    from public.cadastros_profissionais c
    join auth.users u on u.id = c.usuario_id
   where lower(u.email) = lower(v_email);

  if v_uid is null then
    raise exception 'Nenhuma solicitação profissional para %.', v_email;
  end if;

  -- admin que está revisando (o primeiro gestora encontrado; ajuste se necessário)
  select id into v_admin from public.profiles where papel = 'gestora' order by criado_em limit 1;

  update public.cadastros_profissionais
     set situacao = case when v_aprova then 'aprovado' else 'recusado' end,
         revisado_em = now(), revisado_por = v_admin
   where usuario_id = v_uid;

  if v_aprova then
    -- Papel efetivo: olheiro credenciado ou gestora (academia = equipe Pelé).
    update public.profiles
       set papel = case when v_tipo = 'academia' then 'gestora'::public.papel_usuario
                        else 'olheiro'::public.papel_usuario end
     where id = v_uid;
    raise notice 'OK: % aprovado como %.', v_email, v_tipo;
  else
    raise notice 'Solicitação de % recusada.', v_email;
  end if;
end $aprovar$;

commit;
-- ============================================================================
-- A aprovação não confirma código nem libera sessão: a pessoa ainda faz login
-- completo (senha + código) para entrar na área correspondente.
-- ============================================================================
