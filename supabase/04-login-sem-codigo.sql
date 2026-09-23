-- ============================================================================
-- PENEIRAS ON — Migração: LOGIN SEM CÓDIGO (remove a etapa OTP)
-- ----------------------------------------------------------------------------
-- Execute TODO este arquivo no SQL Editor do Supabase, DEPOIS do
-- 01-migracao-auth-mvp.sql. É idempotente (create or replace) e NÃO apaga dados.
--
-- O que muda:
--   A barreira public.sessao_email_verificada() passa a valer para QUALQUER
--   sessão autenticada (auth.uid() presente), em vez de exigir o código por
--   e-mail. Assim o login vira apenas e-mail/CPF + senha, sem OTP, mantendo o
--   RLS (as policies RESTRICTIVE continuam ativas — só a definição do "verificada"
--   ficou mais simples).
--
-- Observação: a confirmação de e-mail (link no cadastro) continua sendo
-- controlada pelo Supabase (Authentication → Providers → Email → Confirm email).
-- Se ela estiver LIGADA, contas não confirmadas não conseguem senha (o próprio
-- Supabase bloqueia). Se estiver DESLIGADA, qualquer e-mail entra direto.
--
-- As tabelas/funções do OTP (desafios_login, verificar_desafio_login, etc.)
-- deixam de ser usadas pelo backend, mas ficam no banco sem causar efeito.
-- ============================================================================
begin;
set local search_path = public;

select pg_advisory_xact_lock(728104934);

-- Barreira de sessão: agora "verificada" == autenticada (sem OTP).
-- Mantém SECURITY DEFINER e a mesma assinatura, então todas as policies e RPCs
-- que já chamam esta função continuam funcionando sem alteração.
create or replace function public.sessao_email_verificada()
returns boolean
language sql stable security definer set search_path = public, privado as $$
  select (select auth.uid()) is not null;
$$;
revoke all on function public.sessao_email_verificada() from public, anon;
grant execute on function public.sessao_email_verificada() to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
-- ============================================================================
-- Fim. Resultado esperado: "Success. No rows returned".
-- ============================================================================
