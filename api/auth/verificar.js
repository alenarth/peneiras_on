// POST /api/auth/verificar — confere o código, consome o desafio ATOMICAMENTE e,
// só então, devolve a sessão Auth ao navegador para instalar. Uma confirmação só.
import { AUTH, ConfigError } from '../_lib/env.js';
import { adminClient } from '../_lib/supabaseAdmin.js';
import { lerJson, json, origemPermitida, aplicarCors, lerCookies, cookieLimpar } from '../_lib/http.js';
import { hashCodigo, hashCookie, decryptSession } from '../_lib/crypto.js';

const MENSAGENS = {
  invalido: 'Desafio inválido ou expirado. Reinicie o login.',
  consumido: 'Este código já foi usado. Reinicie o login.',
  expirado: 'O código expirou. Peça um novo.',
  bloqueado: 'Muitas tentativas. Reinicie o login.',
  vinculo: 'Sessão de verificação não confere. Reinicie o login neste dispositivo.',
  codigo_incorreto: 'Código incorreto.',
};

export default async function handler(req, res) {
  aplicarCors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return json(res, 405, { ok: false, erro: 'metodo' });
  if (!origemPermitida(req)) return json(res, 403, { ok: false, erro: 'origem' });

  let body;
  try { body = await lerJson(req); }
  catch { return json(res, 400, { ok: false, erro: 'payload' }); }

  const desafio = String(body.desafio || '').trim().slice(0, 128);
  const codigo = String(body.codigo || '').replace(/\D/g, '').slice(0, AUTH.codigoDigitos);
  if (!desafio || codigo.length !== AUTH.codigoDigitos) {
    return json(res, 400, { ok: false, erro: 'codigo', mensagem: 'Digite os 6 dígitos.' });
  }

  const cookieVal = lerCookies(req).po_desafio || '';
  const cookieHash = cookieVal ? hashCookie(cookieVal) : null;

  try {
    const admin = adminClient();
    const { data, error } = await admin.rpc('verificar_desafio_login', {
      p_id: desafio,
      p_codigo_hash: hashCodigo(desafio, codigo),
      p_cookie_hash: cookieHash,
      p_validade_seg: AUTH.sessaoVerificadaTtlSeg,
    });
    if (error) throw new Error('RPC verificar: ' + error.message);

    const status = data?.status;
    if (status !== 'ok') {
      const code = status === 'bloqueado' ? 429 : status === 'codigo_incorreto' ? 400 : 410;
      return json(res, code, {
        ok: false, erro: status || 'invalido',
        mensagem: MENSAGENS[status] || MENSAGENS.invalido,
        restam: data?.restam,
      });
    }

    // Sucesso: decifra a sessão pendente e entrega ao navegador (canal sem cache).
    const sessao = decryptSession(data.sessao_cifrada, data.sessao_nonce);
    await admin.rpc('limpar_expirados_auth').catch(() => {});

    return json(res, 200, {
      ok: true,
      usuario_id: data.usuario_id,
      session: { access_token: sessao.access_token, refresh_token: sessao.refresh_token },
    }, { 'Set-Cookie': cookieLimpar('po_desafio') });

  } catch (e) {
    if (e instanceof ConfigError) return json(res, 500, { ok: false, erro: 'config' });
    console.error('[verificar]', e);
    return json(res, 500, { ok: false, erro: 'interno' });
  }
}
