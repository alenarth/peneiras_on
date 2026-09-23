-- ============================================================================
-- PENEIRAS ON — Migração: MVP SEM APROVAÇÃO PROFISSIONAL
-- ----------------------------------------------------------------------------
-- Execute TODO este arquivo no SQL Editor do Supabase, DEPOIS do 01 e do 05.
-- Idempotente. NÃO apaga dados.
--
-- Mudança: olheiro e academia deixam de precisar de análise/aprovação. O acesso
-- ao painel passa a ser por PERSONA (não por aprovação). Para isso, minha_conta()
-- passa a devolver a persona efetiva da conta, e o front libera o painel por ela.
--   - jogador  -> painel do atleta
--   - olheiro  -> painel do olheiro (papel 'olheiro', sem aprovação)
--   - academia -> painel da gestão (persona 'academia'; papel continua 'atleta',
--                 pois o trigger não permite auto-conceder 'gestora' — o painel é
--                 liberado pela persona, sem conceder poderes de staff no banco).
--
-- A tabela cadastros_profissionais e a RPC de solicitação continuam existindo,
-- mas não são mais usadas no fluxo (ficam inertes).
-- ============================================================================
begin;
set local search_path = public;

select pg_advisory_xact_lock(728104936);

create or replace function public.minha_conta()
returns jsonb
language plpgsql stable security definer set search_path = public, privado as $$
declare
  v_uid uuid := (select auth.uid());
  v jsonb;
begin
  if v_uid is null or not public.sessao_email_verificada() then
    return jsonb_build_object('status', 'sem_sessao');
  end if;
  select jsonb_build_object(
    'status', 'ok',
    'usuario_id', p.id,
    'nome', p.nome,
    'papel', p.papel,
    'persona', public.persona_da_conta(p.id),
    'atleta_id', (select a.id from public.athletes a where a.dono_id = p.id limit 1),
    'cadastro_concluido', exists (select 1 from public.athletes a where a.dono_id = p.id)
                          or exists (select 1 from public.cadastros_profissionais c where c.usuario_id = p.id),
    'profissional', (select jsonb_build_object('tipo', c.tipo, 'situacao', c.situacao,
                                               'empresa', c.empresa, 'cargo', c.cargo)
                     from public.cadastros_profissionais c where c.usuario_id = p.id)
  ) into v
  from public.profiles p where p.id = v_uid;
  return coalesce(v, jsonb_build_object('status', 'sem_perfil'));
end $$;

notify pgrst, 'reload schema';
commit;
-- ============================================================================
-- Fim. Resultado esperado: "Success. No rows returned".
-- ============================================================================
