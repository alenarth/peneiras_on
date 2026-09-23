/* ============================================================================
   PENEIRAS ON — supabase.js
   Cliente Supabase (chave pública) + funções de autenticação do MVP.
   Carregado por scripts globais (NÃO é módulo ESM). Requer, ANTES dele:
     <script src="assets/js/config.js"></script>            (gerado no build)
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   Exposto como window.PeneirasAuth.
   ============================================================================ */
(function () {
  'use strict';

  var cfg = window.PENEIRAS_CONFIG || null;
  var lib = window.supabase; // UMD da CDN
  var client = null;
  var indisponivel = null;

  if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    indisponivel = 'Configuração pública ausente (assets/js/config.js). Copie assets/js/config.example.js.';
  } else if (!lib || !lib.createClient) {
    indisponivel = 'Biblioteca supabase-js não carregou (verifique a tag <script> da CDN).';
  } else {
    client = lib.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }

  function precisaCliente() {
    if (!client) throw new Error(indisponivel || 'Supabase indisponível.');
    return client;
  }

  async function api(caminho, opts) {
    opts = opts || {};
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    var resp = await fetch(caminho, {
      method: opts.method || 'POST',
      headers: headers,
      credentials: 'same-origin',
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    var dados = null;
    try { dados = await resp.json(); } catch (e) { dados = null; }
    return { status: resp.status, ok: resp.ok, dados: dados || {} };
  }

  async function tokenAtual() {
    var s = await precisaCliente().auth.getSession();
    return s && s.data && s.data.session ? s.data.session.access_token : null;
  }

  var PeneirasAuth = {
    indisponivel: indisponivel,
    client: client,
    config: cfg,

    /* ---- 1. Criar conta (confirmação de e-mail obrigatória) ---- */
    async cadastrarConta(opts) {
      var c = precisaCliente();
      // Cliente só cria atleta/olheiro; academia solicitada permanece sem gestão.
      var papel = opts.papelSolicitado === 'olheiro' ? 'olheiro' : 'atleta';
      var redirect = (cfg.SITE_URL || location.origin) + '/confirmado.html';
      var res = await c.auth.signUp({
        email: String(opts.email || '').trim().toLowerCase(),
        password: opts.senha,
        options: {
          data: { nome: String(opts.nome || '').trim(), papel: papel },
          emailRedirectTo: redirect,
          captchaToken: opts.captchaToken,
        },
      });
      if (res.error) return { ok: false, erro: res.error.message };
      // Resposta neutra: duplicidade de e-mail no Auth não deve afirmar conta nova.
      var identities = res.data && res.data.user && res.data.user.identities;
      var provavelExistente = identities && identities.length === 0;
      // Com "Confirm email" desligado, o signUp já devolve sessão ativa: não há
      // e-mail de confirmação a esperar — o cadastro segue direto pro app.
      var sessaoAtiva = !!(res.data && res.data.session);
      return { ok: true, provavelExistente: !!provavelExistente, sessaoAtiva: sessaoAtiva };
    },

    /* ---- 2. Login: e-mail/CPF + senha → sessão (sem código) ---- */
    async login(opts) {
      var r = await api('/api/auth/login', {
        body: {
          identificador: opts.identificador, senha: opts.senha, persona: opts.persona,
        },
      });
      if (!r.ok || !r.dados.ok) return Object.assign({ ok: false }, r.dados);
      // Instala a sessão devolvida pelo servidor com a API oficial do SDK.
      var s = r.dados.session;
      var set = await precisaCliente().auth.setSession({
        access_token: s.access_token, refresh_token: s.refresh_token,
      });
      if (set.error) return { ok: false, erro: set.error.message };
      return { ok: true, usuario_id: r.dados.usuario_id };
    },

    /* ---- 3. Estado da conta (servidor valida sessão verificada) ---- */
    async carregarMinhaConta() {
      var c = precisaCliente();
      var sess = await c.auth.getSession();
      if (!sess.data.session) return { status: 'sem_login' };
      var r = await c.rpc('minha_conta');
      if (r.error) return { status: 'erro', erro: r.error.message };
      return r.data || { status: 'erro' };
    },

    /* exigirAcesso: garante sessão + sessão verificada + papel. Erro de rede NÃO
       vira sucesso. Retorna a conta ou redireciona para o login. */
    async exigirAcesso(opts) {
      opts = opts || {};
      if (!client) { document.body.innerHTML = mensagemBloqueio(indisponivel); return null; }
      var conta;
      try { conta = await this.carregarMinhaConta(); }
      catch (e) { document.body.innerHTML = mensagemBloqueio('Falha de rede ao validar sua sessão.'); return null; }

      if (conta.status === 'sem_login' || conta.status === 'sem_sessao') {
        location.replace('login.html?tipo=' + (opts.persona || 'jogador') + '&proximo=' + encodeURIComponent(location.pathname.replace(/^\//, '')));
        return null;
      }
      if (conta.status !== 'ok') { document.body.innerHTML = mensagemBloqueio('Não foi possível validar sua sessão.'); return null; }

      var permitidos = opts.papeis || (opts.papel ? [opts.papel] : null);
      if (permitidos && permitidos.indexOf(conta.papel) < 0) {
        location.replace(destinoPorPapel(conta));
        return null;
      }
      // Exigência extra: profissional aprovado (para olheiro/academia).
      if (opts.exigirAprovado) {
        if (!conta.profissional) { location.replace('cadastro.html?fluxo=completar'); return null; }
        if (conta.profissional.situacao !== 'aprovado') { location.replace('aguardando.html'); return null; }
      }
      return conta;
    },

    /* ---- 4. Conclusão de cadastro do jogador (API, CPF hasheado no servidor) ---- */
    async concluirCadastroJogador(dados) {
      var token = await tokenAtual();
      if (!token) return { ok: false, erro: 'sem_login' };
      var r = await api('/api/cadastro/jogador', {
        headers: { Authorization: 'Bearer ' + token }, body: dados,
      });
      return Object.assign({ ok: r.ok && r.dados.ok }, r.dados);
    },

    /* ---- Solicitação profissional (RPC exige sessão verificada) ---- */
    async solicitarAcessoProfissional(opts) {
      var c = precisaCliente();
      var r = await c.rpc('solicitar_acesso_profissional', {
        p_tipo: opts.tipo, p_empresa: opts.empresa, p_cargo: opts.cargo,
      });
      if (r.error) return { ok: false, erro: r.error.message };
      return Object.assign({ ok: (r.data && r.data.status === 'ok') }, r.data || {});
    },

    /* ---- 5. Sair ---- */
    async sair() {
      var token = await tokenAtual();
      if (token) { try { await api('/api/auth/logout', { headers: { Authorization: 'Bearer ' + token } }); } catch (e) {} }
      try { await precisaCliente().auth.signOut(); } catch (e) {}
    },

    /* ---- Recuperação de senha (RF-25) ---- */
    async solicitarRecuperacao(email) {
      var c = precisaCliente();
      var redirect = (cfg.SITE_URL || location.origin) + '/recuperar.html?fluxo=recovery';
      var r = await c.auth.resetPasswordForEmail(String(email || '').trim().toLowerCase(), { redirectTo: redirect });
      // Resposta neutra: não revela se o e-mail existe.
      return { ok: !r.error, erro: r.error && r.error.message };
    },

    async concluirRecuperacao(novaSenha) {
      var token = await tokenAtual(); // sessão de recuperação criada pelo link
      if (!token) return { ok: false, erro: 'sem_contexto' };
      var r = await api('/api/auth/recuperacao', { body: { access_token: token, nova_senha: novaSenha } });
      if (r.ok && r.dados.ok) { try { await precisaCliente().auth.signOut(); } catch (e) {} }
      return Object.assign({ ok: r.ok && r.dados.ok }, r.dados);
    },

    destinoPorPapel: destinoPorPapel,
  };

  function destinoPorPapel(conta) {
    var prof = conta && conta.profissional;
    if (prof) {
      if (prof.situacao !== 'aprovado') return 'aguardando.html';
      return prof.tipo === 'academia' ? 'gestora.html?tela=dashboard' : 'olheiro.html?tela=lista';
    }
    if (conta && conta.papel === 'gestora') return 'gestora.html?tela=dashboard';
    if (conta && conta.atleta_id) return 'atleta.html?tela=status';
    // olheiro sem solicitação, ou atleta sem perfil concluído → conclusão de cadastro.
    if (conta && conta.papel === 'olheiro') return 'cadastro.html?fluxo=completar';
    return 'cadastro.html?fluxo=completar';
  }

  function mensagemBloqueio(msg) {
    return '<main style="max-width:560px;margin:80px auto;padding:24px;font-family:Inter,system-ui">' +
      '<h1 style="font-family:Archivo,sans-serif">Acesso indisponível</h1>' +
      '<p style="color:#555">' + (msg || 'Sessão inválida.') + '</p>' +
      '<p><a href="login.html?tipo=jogador">Ir para o login →</a></p></main>';
  }

  window.PeneirasAuth = PeneirasAuth;
})();
