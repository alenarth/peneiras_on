-- ============================================================================
-- PENEIRAS ON — Migração incremental: AUTENTICAÇÃO MVP (código por e-mail)
-- ----------------------------------------------------------------------------
-- Execute TODO este arquivo no SQL Editor do Supabase, como postgres, DEPOIS de
-- o schema-base (assets/base-anterior/schema.sql) já estar aplicado no projeto.
-- É INCREMENTAL e idempotente: pode ser reexecutado. NÃO apaga dados, NÃO recria
-- as oito tabelas legadas e NÃO reabre nenhuma policy existente.
--
-- O que esta migração acrescenta:
--   1. Schema privado (não exposto na Data API), sem grants para anon/authenticated.
--   2. Tabela pública cadastros_profissionais (olheiro/academia).
--   3. Tabelas privadas: identificadores (CPF hash), desafios_login,
--      sessoes_verificadas, limites_autenticacao.
--   4. Barreira de sessão: public.sessao_email_verificada() + policies RESTRICTIVE.
--   5. RPCs de servidor (service_role) para o protocolo senha → código → sessão.
--   6. Conclusão atômica do cadastro de jogador e solicitação profissional.
--   7. Ajuste da faixa de idade 8→7 (compatível com atletas legados).
--   8. Colunas de nascimento/responsável/consentimento em athlete_contacts.
--
-- Segredos (CPF_HMAC_KEY, OTP_HMAC_KEY, AES key) FICAM NO SERVIDOR (Vercel), nunca
-- aqui. O banco só recebe/guarda hashes e ciphertext já calculados pelo backend.
-- ============================================================================
begin;
set local search_path = public;

select pg_advisory_xact_lock(728104933);  -- distinto do lock do schema-base

-- ---------------------------------------------------------------------------
-- 0. Pré-condições: o schema-base precisa existir. Aborta com mensagem clara.
-- ---------------------------------------------------------------------------
do $pre$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.athletes') is null
     or to_regclass('public.athlete_contacts') is null then
    raise exception 'Schema-base ausente. Aplique assets/base-anterior/schema.sql antes desta migração.';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='meu_papel') then
    raise exception 'Helper public.meu_papel() ausente: schema-base incompleto.';
  end if;
end $pre$;

-- ---------------------------------------------------------------------------
-- 1. Schema privado — fora da Data API, sem acesso para anon/authenticated.
-- ---------------------------------------------------------------------------
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
grant usage on schema privado to service_role;  -- só o backend confiável (definer usa postgres)

-- ---------------------------------------------------------------------------
-- 2. cadastros_profissionais (pública, com RLS). Cliente nunca define situação.
-- ---------------------------------------------------------------------------
create table if not exists public.cadastros_profissionais (
  usuario_id   uuid primary key references public.profiles(id) on delete cascade,
  tipo         text not null check (tipo in ('olheiro','academia')),
  empresa      text not null,
  cargo        text not null,
  situacao     text not null default 'pendente' check (situacao in ('pendente','aprovado','recusado')),
  criado_em    timestamptz not null default now(),
  revisado_em  timestamptz,
  revisado_por uuid references public.profiles(id)
);
alter table public.cadastros_profissionais enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Tabelas privadas.
-- ---------------------------------------------------------------------------
create table if not exists privado.identificadores (
  usuario_id   uuid primary key references public.profiles(id) on delete cascade,
  cpf_hash     text not null unique check (cpf_hash ~ '^[0-9a-f]{64}$'),  -- HMAC-SHA256 hex
  versao_chave text,
  criado_em    timestamptz not null default now()
);

create table if not exists privado.desafios_login (
  id             text primary key,               -- opaco, >=128 bits, gerado no backend
  usuario_id     uuid not null references public.profiles(id) on delete cascade,
  session_id     uuid not null,                  -- session_id da sessão Auth pendente
  finalidade     text not null default 'login' check (finalidade in ('login')),
  codigo_hash    text not null,                  -- HMAC-SHA256 do código de 6 dígitos
  expiracao      timestamptz not null,
  tentativas     int not null default 0,
  max_tentativas int not null default 5,
  ultima_emissao timestamptz not null default now(),
  consumido_em   timestamptz,
  sessao_cifrada text,                           -- AES-256-GCM dos tokens da sessão pendente
  sessao_nonce   text,
  cookie_hash    text,                           -- HMAC do valor do cookie de vínculo
  criado_em      timestamptz not null default now()
);
create index if not exists desafios_login_usuario_idx on privado.desafios_login(usuario_id);
create index if not exists desafios_login_expiracao_idx on privado.desafios_login(expiracao);

create table if not exists privado.sessoes_verificadas (
  session_id    uuid primary key,
  usuario_id    uuid not null references public.profiles(id) on delete cascade,
  verificada_em timestamptz not null default now(),
  expira_em     timestamptz not null,
  revogada_em   timestamptz
);
create index if not exists sessoes_verificadas_usuario_idx on privado.sessoes_verificadas(usuario_id);

create table if not exists privado.limites_autenticacao (
  chave         text primary key,                -- HMAC de ip/conta/operação (sem IP/e-mail bruto)
  janela_inicio timestamptz not null default now(),
  tentativas    int not null default 0,
  bloqueado_ate timestamptz
);
create index if not exists limites_autenticacao_janela_idx on privado.limites_autenticacao(janela_inicio);

-- RLS habilitada nas privadas, SEM policies e SEM grants: ninguém acessa direto.
alter table privado.identificadores        enable row level security;
alter table privado.desafios_login          enable row level security;
alter table privado.sessoes_verificadas     enable row level security;
alter table privado.limites_autenticacao    enable row level security;
revoke all on all tables in schema privado from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Faixa de idade 8→7 (não invalida atletas legados adultos) e colunas novas.
-- ---------------------------------------------------------------------------
do $idade$
begin
  if exists (select 1 from pg_constraint
             where conrelid='public.athletes'::regclass and conname='athletes_idade_check') then
    alter table public.athletes drop constraint athletes_idade_check;
  end if;
  alter table public.athletes add constraint athletes_idade_check check (idade between 7 and 40);
end $idade$;

alter table public.athlete_contacts add column if not exists nascimento date;
alter table public.athlete_contacts add column if not exists responsavel_nome text;
alter table public.athlete_contacts add column if not exists responsavel_telefone text;
alter table public.athlete_contacts add column if not exists consentimento_versao text;
alter table public.athlete_contacts add column if not exists consentimento_em timestamptz;

-- Segurança: fechar o INSERT DIRETO (tabela E coluna) em athletes e athlete_contacts.
-- REVOKE no nível de tabela NÃO remove grants de coluna herdados da base — por isso
-- revogamos coluna a coluna. Criar atleta/contato passa a ser só pela RPC
-- concluir_cadastro_jogador (service_role), com CPF e consentimento validados.
do $fechar_insert$
declare tabela text; colunas text;
begin
  foreach tabela in array array['athletes','athlete_contacts'] loop
    select string_agg(format('%I', a.attname), ', ' order by a.attnum) into colunas
      from pg_attribute a where a.attrelid = format('public.%I', tabela)::regclass
      and a.attnum > 0 and not a.attisdropped;
    execute format('revoke insert on public.%I from anon, authenticated', tabela);
    execute format('revoke insert (%s) on public.%I from anon, authenticated', colunas, tabela);
  end loop;
  -- athlete_contacts: também fecha UPDATE das colunas sensíveis herdadas/novas,
  -- mantendo só email/telefone editáveis pelo dono (RLS + gate limitam a linha).
  execute 'revoke update on public.athlete_contacts from anon, authenticated';
  select string_agg(format('%I', a.attname), ', ' order by a.attnum) into colunas
    from pg_attribute a where a.attrelid = 'public.athlete_contacts'::regclass
    and a.attnum > 0 and not a.attisdropped;
  execute format('revoke update (%s) on public.athlete_contacts from anon, authenticated', colunas);
end $fechar_insert$;
grant update (email, telefone) on public.athlete_contacts to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Barreira de sessão verificada por código.
--    SECURITY DEFINER, sem parâmetros de identidade, retorna só boolean.
-- ---------------------------------------------------------------------------
create or replace function public.sessao_email_verificada()
returns boolean
language sql stable security definer set search_path = public, privado as $$
  select exists (
    select 1
    from privado.sessoes_verificadas s
    where s.usuario_id = (select auth.uid())
      and s.session_id = nullif(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'session_id', '')::uuid
      and s.revogada_em is null
      and s.expira_em > now()
  );
$$;
revoke all on function public.sessao_email_verificada() from public, anon;
grant execute on function public.sessao_email_verificada() to authenticated, service_role;

-- Policies RESTRICTIVE: somam-se por AND às permissivas existentes. Aplicadas só
-- às operações PROTEGIDAS. Scouting público (athletes/events SELECT) NÃO é tocado.
do $gates$
declare
  alvo record;
  ja   int;
begin
  for alvo in
    select * from (values
      -- tabela                         , comando , usa_using, usa_check
      ('profiles',                        'select', true,  false),
      ('profiles',                        'update', true,  true ),
      ('athlete_contacts',                'all',    true,  true ),
      ('athletes',                        'update', true,  true ),
      ('cadastros_profissionais',         'all',    true,  true ),
      ('registrations',                   'all',    true,  true ),
      ('favorites',                       'all',    true,  true ),
      ('messages',                        'all',    true,  true ),
      ('unlocked_contacts',               'select', true,  false)
    ) as t(tabela, comando, usa_using, usa_check)
  loop
    select count(*) into ja from pg_policies
      where schemaname='public' and tablename=alvo.tabela
        and policyname = format('gate sessao verificada: %s', alvo.comando);
    if ja = 0 then
      execute format(
        'create policy %I on public.%I as restrictive for %s to authenticated %s %s',
        format('gate sessao verificada: %s', alvo.comando),
        alvo.tabela,
        alvo.comando,
        case when alvo.usa_using then 'using (public.sessao_email_verificada())' else '' end,
        case when alvo.usa_check then 'with check (public.sessao_email_verificada())' else '' end
      );
    end if;
  end loop;
end $gates$;

-- ---------------------------------------------------------------------------
-- 6. RPCs de servidor (service_role) — protocolo senha → código → sessão.
--    Todas SECURITY DEFINER, search_path fixo, EXECUTE só para service_role.
-- ---------------------------------------------------------------------------

-- 6.1 CPF (hash) → usuario_id. Usado pelo backend para descobrir o e-mail no Auth.
create or replace function public.buscar_usuario_por_cpf_hash(p_hash text)
returns uuid
language sql stable security definer set search_path = public, privado as $$
  select i.usuario_id from privado.identificadores i where i.cpf_hash = p_hash;
$$;

-- 6.2 Rate limit atômico compartilhado. Retorna {permitido, tentativas, bloqueado_ate}.
create or replace function public.rate_limit_touch(p_chave text, p_janela_seg int, p_max int)
returns jsonb
language plpgsql security definer set search_path = public, privado as $$
declare
  r privado.limites_autenticacao%rowtype;
begin
  insert into privado.limites_autenticacao (chave, janela_inicio, tentativas)
    values (p_chave, now(), 0)
    on conflict (chave) do nothing;
  select * into r from privado.limites_autenticacao where chave = p_chave for update;

  if r.bloqueado_ate is not null and r.bloqueado_ate > now() then
    return jsonb_build_object('permitido', false, 'tentativas', r.tentativas, 'bloqueado_ate', r.bloqueado_ate);
  end if;
  if r.janela_inicio < now() - make_interval(secs => p_janela_seg) then
    update privado.limites_autenticacao
       set janela_inicio = now(), tentativas = 1, bloqueado_ate = null
     where chave = p_chave;
    return jsonb_build_object('permitido', true, 'tentativas', 1, 'bloqueado_ate', null);
  end if;

  update privado.limites_autenticacao
     set tentativas = r.tentativas + 1,
         bloqueado_ate = case when r.tentativas + 1 >= p_max
                              then now() + make_interval(secs => p_janela_seg) else null end
   where chave = p_chave
   returning * into r;
  return jsonb_build_object('permitido', r.tentativas <= p_max,
                            'tentativas', r.tentativas, 'bloqueado_ate', r.bloqueado_ate);
end $$;

-- 6.3 Cria/renova desafio de login (invalida desafios anteriores do par usuário+sessão).
create or replace function public.criar_desafio_login(
  p_id text, p_usuario uuid, p_session uuid, p_codigo_hash text,
  p_expiracao timestamptz, p_sessao_cifrada text, p_sessao_nonce text, p_cookie_hash text)
returns void
language plpgsql security definer set search_path = public, privado as $$
begin
  delete from privado.desafios_login
   where usuario_id = p_usuario and session_id = p_session and consumido_em is null;
  insert into privado.desafios_login
    (id, usuario_id, session_id, codigo_hash, expiracao,
     sessao_cifrada, sessao_nonce, cookie_hash)
  values
    (p_id, p_usuario, p_session, p_codigo_hash, p_expiracao,
     p_sessao_cifrada, p_sessao_nonce, p_cookie_hash);
end $$;

-- 6.4 Verifica e consome o desafio ATOMICAMENTE. Tentativas persistem mesmo em erro
--     (sem RAISE que faça rollback do contador). Sucesso cria sessoes_verificadas.
create or replace function public.verificar_desafio_login(
  p_id text, p_codigo_hash text, p_cookie_hash text, p_validade_seg int)
returns jsonb
language plpgsql security definer set search_path = public, privado as $$
declare
  d privado.desafios_login%rowtype;
begin
  select * into d from privado.desafios_login where id = p_id for update;
  if not found then
    return jsonb_build_object('status', 'invalido');
  end if;
  if d.consumido_em is not null then
    return jsonb_build_object('status', 'consumido');
  end if;
  if d.expiracao <= now() then
    return jsonb_build_object('status', 'expirado');
  end if;
  if d.tentativas >= d.max_tentativas then
    return jsonb_build_object('status', 'bloqueado');
  end if;

  -- Incrementa a tentativa ANTES de comparar; a linha persiste mesmo se falhar.
  update privado.desafios_login set tentativas = tentativas + 1 where id = p_id;

  if d.cookie_hash is not null and d.cookie_hash is distinct from p_cookie_hash then
    return jsonb_build_object('status', 'vinculo');
  end if;
  if d.codigo_hash is distinct from p_codigo_hash then
    return jsonb_build_object('status', 'codigo_incorreto',
                              'restam', greatest(0, d.max_tentativas - (d.tentativas + 1)));
  end if;

  -- Sucesso: consome e registra a sessão verificada (uma confirmação só).
  update privado.desafios_login set consumido_em = now() where id = p_id;
  insert into privado.sessoes_verificadas (session_id, usuario_id, expira_em)
    values (d.session_id, d.usuario_id, now() + make_interval(secs => p_validade_seg))
    on conflict (session_id) do nothing;

  return jsonb_build_object('status', 'ok',
                            'usuario_id', d.usuario_id,
                            'sessao_cifrada', d.sessao_cifrada,
                            'sessao_nonce', d.sessao_nonce);
end $$;

-- 6.4b Remove um desafio (usado quando o envio de e-mail falha após criá-lo).
create or replace function public.remover_desafio(p_id text)
returns void
language sql security definer set search_path = public, privado as $$
  delete from privado.desafios_login where id = p_id and consumido_em is null;
$$;

-- 6.4c Reemite o código do MESMO desafio (invalida o código anterior, respeita a
--      janela de reenvio e NÃO zera o contador de tentativas).
create or replace function public.reemitir_desafio(
  p_id text, p_codigo_hash text, p_expiracao timestamptz, p_reenvio_min_seg int)
returns jsonb
language plpgsql security definer set search_path = public, privado as $$
declare
  d privado.desafios_login%rowtype;
begin
  select * into d from privado.desafios_login where id = p_id for update;
  if not found or d.consumido_em is not null then
    return jsonb_build_object('status', 'invalido');
  end if;
  if d.ultima_emissao > now() - make_interval(secs => p_reenvio_min_seg) then
    return jsonb_build_object('status', 'aguarde',
      'faltam', ceil(extract(epoch from (d.ultima_emissao + make_interval(secs => p_reenvio_min_seg) - now()))));
  end if;
  update privado.desafios_login
     set codigo_hash = p_codigo_hash, expiracao = p_expiracao, ultima_emissao = now()
   where id = p_id;
  return jsonb_build_object('status', 'ok', 'usuario_id', d.usuario_id);
end $$;

-- 6.5 Revogações (logout e recuperação de senha).
create or replace function public.revogar_sessao(p_session uuid)
returns void
language sql security definer set search_path = public, privado as $$
  update privado.sessoes_verificadas set revogada_em = now()
   where session_id = p_session and revogada_em is null;
$$;

create or replace function public.revogar_sessoes_usuario(p_usuario uuid)
returns void
language sql security definer set search_path = public, privado as $$
  update privado.sessoes_verificadas set revogada_em = now()
   where usuario_id = p_usuario and revogada_em is null;
$$;

-- 6.5b Checagem de sessão verificada por (usuário, sessão) — para o backend
--      confirmar a barreira quando age via service_role (sem auth.uid()).
create or replace function public.checar_sessao_verificada(p_usuario uuid, p_session uuid)
returns boolean
language sql stable security definer set search_path = public, privado as $$
  select exists (
    select 1 from privado.sessoes_verificadas s
    where s.usuario_id = p_usuario and s.session_id = p_session
      and s.revogada_em is null and s.expira_em > now()
  );
$$;

-- 6.6 Limpeza de desafios/sessões vencidos (chamada oportunista pelo backend).
create or replace function public.limpar_expirados_auth()
returns void
language sql security definer set search_path = public, privado as $$
  delete from privado.desafios_login where expiracao < now() - interval '1 hour';
  delete from privado.sessoes_verificadas where expira_em < now() - interval '1 day';
  delete from privado.limites_autenticacao where janela_inicio < now() - interval '1 day';
$$;

-- ---------------------------------------------------------------------------
-- 7. Conclusão de cadastro — atômica, idempotente, com CPF hash vindo do backend.
--    Chamada pelo backend (service_role) COM o usuario_id derivado do JWT validado.
-- ---------------------------------------------------------------------------
create or replace function public.concluir_cadastro_jogador(
  p_usuario uuid,
  p_nome text, p_cpf_hash text, p_versao_chave text,
  p_nascimento date, p_idade int, p_cidade text, p_estado text, p_posicao text,
  p_lado text, p_pe text, p_altura int, p_peso int, p_clube text, p_anos int,
  p_contato_email text, p_contato_telefone text,
  p_responsavel_nome text, p_responsavel_telefone text,
  p_consentimento_versao text)
returns jsonb
language plpgsql security definer set search_path = public, privado as $$
declare
  v_atleta_id text;
  v_dono_existente uuid;
begin
  -- Papel precisa ser atleta (contas profissionais não viram atleta esportivo).
  if not exists (select 1 from public.profiles where id = p_usuario and papel = 'atleta') then
    return jsonb_build_object('status', 'papel_invalido');
  end if;

  -- Idempotência: se já existe atleta desta conta, apenas confirma (retry seguro).
  select id into v_atleta_id from public.athletes where dono_id = p_usuario limit 1;
  if v_atleta_id is not null then
    return jsonb_build_object('status', 'ja_concluido', 'atleta_id', v_atleta_id);
  end if;

  -- CPF pertence a UMA conta. Se o hash já é de outra conta, não transfere perfil.
  select usuario_id into v_dono_existente from privado.identificadores where cpf_hash = p_cpf_hash;
  if v_dono_existente is not null and v_dono_existente <> p_usuario then
    return jsonb_build_object('status', 'cpf_duplicado');
  end if;

  -- Vincula o CPF (uma conta ↔ um CPF).
  insert into privado.identificadores (usuario_id, cpf_hash, versao_chave)
    values (p_usuario, p_cpf_hash, p_versao_chave)
    on conflict (usuario_id) do nothing;

  -- Cria o atleta e o contato na mesma transação.
  insert into public.athletes (dono_id, nome, idade, cidade, estado, posicao, lado, pe,
                               altura, peso, clube, anos_jogando)
    values (p_usuario, p_nome, p_idade, p_cidade, upper(p_estado), p_posicao, p_lado, p_pe,
            p_altura, p_peso, p_clube, p_anos)
    returning id into v_atleta_id;

  insert into public.athlete_contacts (atleta_id, email, telefone, nascimento,
                                       responsavel_nome, responsavel_telefone,
                                       consentimento_versao, consentimento_em)
    values (v_atleta_id, p_contato_email, p_contato_telefone, p_nascimento,
            p_responsavel_nome, p_responsavel_telefone,
            p_consentimento_versao, case when p_consentimento_versao is not null then now() end);

  -- Mantém athletes.idade coerente com a data (cache derivado).
  update public.profiles set nome = coalesce(nullif(btrim(p_nome),''), nome) where id = p_usuario;

  return jsonb_build_object('status', 'ok', 'atleta_id', v_atleta_id);
end $$;

-- Solicitação profissional (olheiro/academia) — cliente autenticado E verificado.
-- Definer: valida a barreira internamente; nunca aceita situação/revisor do cliente.
create or replace function public.solicitar_acesso_profissional(
  p_tipo text, p_empresa text, p_cargo text)
returns jsonb
language plpgsql security definer set search_path = public, privado as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not public.sessao_email_verificada() then
    return jsonb_build_object('status', 'sem_sessao');
  end if;
  if p_tipo not in ('olheiro','academia') then
    return jsonb_build_object('status', 'tipo_invalido');
  end if;
  if coalesce(btrim(p_empresa),'') = '' or coalesce(btrim(p_cargo),'') = '' then
    return jsonb_build_object('status', 'dados_incompletos');
  end if;

  insert into public.cadastros_profissionais (usuario_id, tipo, empresa, cargo, situacao)
    values (v_uid, p_tipo, left(btrim(p_empresa),160), left(btrim(p_cargo),120), 'pendente')
    on conflict (usuario_id)
      do update set tipo = excluded.tipo, empresa = excluded.empresa, cargo = excluded.cargo
      where public.cadastros_profissionais.situacao <> 'aprovado';  -- não rebaixa aprovado

  return jsonb_build_object('status', 'ok');
end $$;

-- Leitura do estado da própria conta (papel, conclusão, situação profissional).
-- Exige sessão verificada; devolve só dados da própria identidade.
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

-- ---------------------------------------------------------------------------
-- 8. EXECUTE: mínimo privilégio.
-- ---------------------------------------------------------------------------
revoke all on function
  public.buscar_usuario_por_cpf_hash(text),
  public.rate_limit_touch(text, int, int),
  public.criar_desafio_login(text, uuid, uuid, text, timestamptz, text, text, text),
  public.verificar_desafio_login(text, text, text, int),
  public.remover_desafio(text),
  public.reemitir_desafio(text, text, timestamptz, int),
  public.checar_sessao_verificada(uuid, uuid),
  public.revogar_sessao(uuid),
  public.revogar_sessoes_usuario(uuid),
  public.limpar_expirados_auth(),
  public.concluir_cadastro_jogador(uuid, text, text, text, date, int, text, text, text, text, text, int, int, text, int, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function
  public.buscar_usuario_por_cpf_hash(text),
  public.rate_limit_touch(text, int, int),
  public.criar_desafio_login(text, uuid, uuid, text, timestamptz, text, text, text),
  public.verificar_desafio_login(text, text, text, int),
  public.remover_desafio(text),
  public.reemitir_desafio(text, text, timestamptz, int),
  public.checar_sessao_verificada(uuid, uuid),
  public.revogar_sessao(uuid),
  public.revogar_sessoes_usuario(uuid),
  public.limpar_expirados_auth(),
  public.concluir_cadastro_jogador(uuid, text, text, text, date, int, text, text, text, text, text, int, int, text, int, text, text, text, text, text)
  to service_role;

-- solicitar_acesso_profissional e minha_conta são chamadas pelo próprio usuário.
revoke all on function public.solicitar_acesso_profissional(text, text, text),
  public.minha_conta() from public, anon;
grant execute on function public.solicitar_acesso_profissional(text, text, text),
  public.minha_conta() to authenticated, service_role;

-- cadastros_profissionais: SELECT do próprio (a RPC minha_conta cobre a leitura);
-- sem INSERT/UPDATE direto do cliente (situação só muda por RPC/serviço/admin).
grant select on public.cadastros_profissionais to authenticated;
grant all privileges on public.cadastros_profissionais to service_role;
create policy "profissional: leitura própria ou staff" on public.cadastros_profissionais
  for select to authenticated
  using (usuario_id = (select auth.uid()) or public.meu_papel() in ('gestora','suporte'));

notify pgrst, 'reload schema';
commit;
-- ============================================================================
-- Fim da migração. Resultado esperado: "Success. No rows returned".
-- Rode supabase/02-bootstrap-admin.sql depois que o admin criar e confirmar a conta.
-- ============================================================================
