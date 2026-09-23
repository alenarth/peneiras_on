// POST /api/auth/login — login direto: e-mail/CPF + senha → sessão.
// SEM código por e-mail (OTP removido). CPF só para jogador; olheiro/academia
// entram apenas por e-mail. A resolução de CPF→e-mail acontece no servidor
// (o CPF é hasheado com CPF_HMAC_KEY, que nunca sai do backend).
import { env, AUTH, ConfigError } from '../_lib/env.js';
import { adminClient, anonClientIsolado } from '../_lib/supabaseAdmin.js';
import { lerJson, json, origemPermitida, aplicarCors, ipConfiavel } from '../_lib/http.js';
import { hashCpf, cpfValido, normalizarCpf } from '../_lib/crypto.js';

const GENERICO = { ok: false, erro: 'credenciais', mensagem: 'CPF/e-mail ou senha incorretos.' };

export default async function handler(req, res) {
  aplicarCors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return json(res, 405, { ok: false, erro: 'metodo' });
  if (!origemPermitida(req)) return json(res, 403, { ok: false, erro: 'origem' });

  let body;
  try { body = await lerJson(req); }
  catch { return json(res, 400, { ok: false, erro: 'payload' }); }

  const identificador = String(body.identificador || '').trim().slice(0, 160);
  const senha = String(body.senha || '');
  const persona = ['jogador', 'olheiro', 'academia'].includes(body.persona) ? body.persona : 'jogador';
  if (!identificador || !senha || senha.length > 200) return json(res, 400, GENERICO);

  const ip = ipConfiavel(req);

  try {
    const admin = adminClient();

    // 1) Rate limit por IP (anti brute force), antes de tocar em credenciais.
    const limIp = await admin.rpc('rate_limit_touch', {
      p_chave: hashCpf(`ip:${ip}`), p_janela_seg: AUTH.rateJanelaSeg, p_max: AUTH.rateMaxIniciar,
    });
    if (limIp.data && limIp.data.permitido === false) {
      return json(res, 429, { ok: false, erro: 'rate', mensagem: 'Muitas tentativas. Tente mais tarde.' });
    }

    // 2) Resolver e-mail. CPF só para jogador (olheiro/academia não têm CPF).
    let email = null;
    const soDigitos = normalizarCpf(identificador);
    const pareceCpf = /^[\d.\-\s]+$/.test(identificador) && soDigitos.length === 11;

    if (pareceCpf) {
      if (persona !== 'jogador' || !cpfValido(identificador)) return json(res, 400, GENERICO);
      const { data: uid } = await admin.rpc('buscar_usuario_por_cpf_hash', { p_hash: hashCpf(soDigitos) });
      if (!uid) return json(res, 400, GENERICO); // não revela que o CPF não existe
      const { data: u } = await admin.auth.admin.getUserById(uid);
      email = u?.user?.email || null;
      if (!email) return json(res, 400, GENERICO);
    } else {
      email = identificador.toLowerCase();
    }

    // 3) Validar a senha com cliente isolado (sem persistir sessão no servidor).
    const anon = anonClientIsolado();
    const { data: signin, error: signErr } = await anon.auth.signInWithPassword({ email, password: senha });
    if (signErr || !signin?.session) {
      const msg = String(signErr?.message || '').toLowerCase();
      if (msg.includes('not confirmed') || msg.includes('confirm')) {
        return json(res, 403, { ok: false, erro: 'email_nao_confirmado',
          mensagem: 'Confirme seu e-mail pelo link enviado antes de entrar.' });
      }
      return json(res, 400, GENERICO);
    }

    // 4) Entrega a sessão ao navegador (sem cache). O front instala com setSession.
    const sess = signin.session;
    return json(res, 200, {
      ok: true,
      usuario_id: signin.user?.id || null,
      session: { access_token: sess.access_token, refresh_token: sess.refresh_token },
    });

  } catch (e) {
    if (e instanceof ConfigError) {
      return json(res, 500, { ok: false, erro: 'config', mensagem: 'Serviço de login não configurado.' });
    }
    console.error('[login]', e);
    return json(res, 500, { ok: false, erro: 'interno' });
  }
}
