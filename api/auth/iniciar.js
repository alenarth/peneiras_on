// POST /api/auth/iniciar — valida identificador+senha, envia código por e-mail,
// guarda a sessão pendente CIFRADA no servidor e devolve só um desafio opaco.
// Nunca devolve tokens aqui. Barreira real: nenhuma sessão vira "verificada"
// sem passar por /api/auth/verificar.
import { env, AUTH, ConfigError } from '../_lib/env.js';
import { adminClient, anonClientIsolado, usuarioDoToken } from '../_lib/supabaseAdmin.js';
import {
  lerJson, json, origemPermitida, aplicarCors, ipConfiavel, cookieDesafio,
} from '../_lib/http.js';
import { captchaOk } from '../_lib/http.js';
import {
  randomId, randomCodigo, hashCpf, hashCodigo, hashCookie, encryptSession, cpfValido, normalizarCpf,
} from '../_lib/crypto.js';
import { enviarCodigoLogin } from '../_lib/email.js';

function mascararEmail(email) {
  const [u, d] = String(email).split('@');
  if (!d) return '•••';
  const vis = u.slice(0, 2);
  return `${vis}${'•'.repeat(Math.max(1, u.length - 2))}@${d}`;
}
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

    // 1) Rate limit por IP (antes de tocar em credenciais).
    const limIp = await admin.rpc('rate_limit_touch', {
      p_chave: hashCpf(`ip:${ip}`), p_janela_seg: AUTH.rateJanelaSeg, p_max: AUTH.rateMaxIniciar,
    });
    if (limIp.data && limIp.data.permitido === false) {
      return json(res, 429, { ok: false, erro: 'rate', mensagem: 'Muitas tentativas. Tente mais tarde.' });
    }

    // 2) CAPTCHA (se configurado).
    if (!(await captchaOk(body.captchaToken, ip))) {
      return json(res, 400, { ok: false, erro: 'captcha', mensagem: 'Confirmação anti-robô falhou.' });
    }

    // 3) Resolver e-mail. CPF só para jogador.
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

    // 4) Validar a SENHA com cliente isolado (sem persistir sessão).
    const anon = anonClientIsolado();
    const { data: signin, error: signErr } = await anon.auth.signInWithPassword({
      email, password: senha, options: body.captchaToken ? { captchaToken: body.captchaToken } : undefined,
    });
    if (signErr || !signin?.session) {
      const msg = String(signErr?.message || '').toLowerCase();
      if (msg.includes('not confirmed') || msg.includes('confirm')) {
        return json(res, 403, { ok: false, erro: 'email_nao_confirmado',
          mensagem: 'Confirme seu e-mail pelo link enviado antes de entrar.' });
      }
      return json(res, 400, GENERICO);
    }

    const sess = signin.session;
    const info = await usuarioDoToken(sess.access_token);
    if (!info || !info.sessionId) return json(res, 400, GENERICO);
    const usuarioId = info.user.id;

    // 5) Rate limit por conta (pseudonimizada).
    const limConta = await admin.rpc('rate_limit_touch', {
      p_chave: hashCpf(`conta:${usuarioId}`), p_janela_seg: AUTH.rateJanelaSeg, p_max: AUTH.rateMaxIniciar,
    });
    if (limConta.data && limConta.data.permitido === false) {
      return json(res, 429, { ok: false, erro: 'rate', mensagem: 'Muitas tentativas. Tente mais tarde.' });
    }

    // 6) Gerar desafio + código, cifrar a sessão pendente, gravar.
    const desafioId = randomId(24);
    const codigo = randomCodigo(AUTH.codigoDigitos);
    const cookieVal = randomId(24);
    const { cifrada, nonce } = encryptSession({
      access_token: sess.access_token, refresh_token: sess.refresh_token, session_id: info.sessionId,
    });
    const expiracao = new Date(Date.now() + AUTH.codigoTtlSeg * 1000).toISOString();

    const criar = await admin.rpc('criar_desafio_login', {
      p_id: desafioId, p_usuario: usuarioId, p_session: info.sessionId,
      p_codigo_hash: hashCodigo(desafioId, codigo), p_expiracao: expiracao,
      p_sessao_cifrada: cifrada, p_sessao_nonce: nonce, p_cookie_hash: hashCookie(cookieVal),
    });
    if (criar.error) throw new Error('Falha ao gravar desafio: ' + criar.error.message);

    // 7) Enviar o código. Se falhar, invalida o desafio e NÃO anuncia sucesso.
    try {
      await enviarCodigoLogin(email, codigo, Math.round(AUTH.codigoTtlSeg / 60));
    } catch (e) {
      await admin.rpc('remover_desafio', { p_id: desafioId }).catch(() => {});
      return json(res, 502, { ok: false, erro: 'envio',
        mensagem: 'Não foi possível enviar o código agora. Tente novamente em instantes.' });
    }

    // 8) Cookie de vínculo HttpOnly + resposta neutra.
    return json(res, 200, {
      ok: true, desafio: desafioId, expira_em: expiracao,
      destino: mascararEmail(email), reenvio_em: AUTH.reenvioMinSeg,
    }, { 'Set-Cookie': cookieDesafio('po_desafio', cookieVal, AUTH.codigoTtlSeg) });

  } catch (e) {
    if (e instanceof ConfigError) {
      return json(res, 500, { ok: false, erro: 'config', mensagem: 'Serviço de login não configurado.' });
    }
    console.error('[iniciar]', e);
    return json(res, 500, { ok: false, erro: 'interno' });
  }
}
