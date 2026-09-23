-- ============================================================================
-- PENEIRAS ON — Bootstrap do PRIMEIRO administrador do SITE
-- ----------------------------------------------------------------------------
-- Promove joaotheescs@gmail.com a papel 'gestora' no banco da aplicação.
-- NÃO é credencial do painel Supabase. NÃO cria senha. NÃO promove por domínio.
--
-- Pré-requisitos (a operação FALHA de forma clara se algum não for atendido):
--   1. A pessoa já criou a conta pelo site (cadastro com esse e-mail).
--   2. O e-mail foi CONFIRMADO (clicou no link de confirmação).
--   3. Já existe a linha em public.profiles (criada pelo trigger handle_new_user).
--
-- Execute no SQL Editor como postgres, DEPOIS da migração 01.
-- ============================================================================
begin;
set local search_path = public;

do $bootstrap$
declare
  v_uid uuid;
  v_confirmado timestamptz;
  v_email constant text := 'joaotheescs@gmail.com';
begin
  select u.id, u.email_confirmed_at into v_uid, v_confirmado
    from auth.users u where lower(u.email) = lower(v_email);

  if v_uid is null then
    raise exception 'Conta % ainda não existe no Auth. Crie e confirme a conta pelo site primeiro.', v_email;
  end if;
  if v_confirmado is null then
    raise exception 'Conta % existe mas o e-mail NÃO foi confirmado. Confirme antes de promover.', v_email;
  end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'Profile de % ausente. O trigger handle_new_user deveria tê-lo criado.', v_email;
  end if;

  update public.profiles set papel = 'gestora' where id = v_uid;

  -- Se houver solicitação profissional de academia pendente para essa conta, aprova.
  if to_regclass('public.cadastros_profissionais') is not null then
    update public.cadastros_profissionais
       set situacao = 'aprovado', revisado_em = now(), revisado_por = v_uid
     where usuario_id = v_uid and tipo = 'academia' and situacao <> 'aprovado';
  end if;

  raise notice 'OK: % promovido a gestora (usuario_id=%).', v_email, v_uid;
end $bootstrap$;

commit;
-- ============================================================================
-- A promoção NÃO confirma código nem cria sessão: o admin ainda precisa fazer
-- login completo (senha + código por e-mail) para entrar no painel.
-- ============================================================================
