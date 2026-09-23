-- ============================================================================
-- PENEIRAS ON — Migração: PERSONA POR CONTA (separação jogador/olheiro/academia)
-- ----------------------------------------------------------------------------
-- Execute TODO este arquivo no SQL Editor do Supabase, DEPOIS do 01. Idempotente.
--
-- Problema: no login, uma conta de jogador conseguia entrar pela aba de olheiro
-- ou academia (e vice-versa), porque o backend não conferia a persona da conta.
-- Além disso, antes da aprovação, academia e jogador ficavam indistinguíveis
-- (ambos papel 'atleta').
--
-- Solução: persona_da_conta() resolve a persona EFETIVA de uma conta a partir de:
--   1. papel efetivo (gestora=academia, olheiro=olheiro) — pós-aprovação;
--   2. tipo do cadastro profissional (academia/olheiro) — solicitado;
--   3. intenção gravada no cadastro (user_metadata.persona) — recém-criado;
--   4. senão, 'jogador'.
-- O /api/auth/login usa isso para EXIGIR que a aba escolhida bata com a conta.
-- (Não concede acesso a painel: isso continua dependendo de papel + aprovação.)
-- ============================================================================
begin;
set local search_path = public;

select pg_advisory_xact_lock(728104935);

create or replace function public.persona_da_conta(p_usuario uuid)
returns text
language sql stable security definer set search_path = public, privado as $$
  select case
    when p.papel = 'gestora' then 'academia'
    when p.papel = 'olheiro' then 'olheiro'
    when exists (select 1 from public.cadastros_profissionais c
                 where c.usuario_id = p.id and c.tipo = 'academia') then 'academia'
    when exists (select 1 from public.cadastros_profissionais c
                 where c.usuario_id = p.id and c.tipo = 'olheiro') then 'olheiro'
    when coalesce((select u.raw_user_meta_data ->> 'persona'
                     from auth.users u where u.id = p.id), '') = 'academia' then 'academia'
    when coalesce((select u.raw_user_meta_data ->> 'persona'
                     from auth.users u where u.id = p.id), '') = 'olheiro' then 'olheiro'
    else 'jogador'
  end
  from public.profiles p
  where p.id = p_usuario;
$$;
revoke all on function public.persona_da_conta(uuid) from public, anon, authenticated;
grant execute on function public.persona_da_conta(uuid) to service_role;

notify pgrst, 'reload schema';
commit;
-- ============================================================================
-- Fim. Resultado esperado: "Success. No rows returned".
-- ============================================================================
