// POST /api/auth/reenviar — reemite o código do mesmo desafio (respeita 60s,
// invalida o código anterior e não zera o orçamento de tentativas).
import { AUTH, ConfigError } from '../_lib/env.js';
import { adminClient } from '../_lib/supabaseAdmin.js';
import { lerJson, json, origemPermitida, aplicarCors, lerCookies } from '../_lib/http.js';
import { hashCodigo, hashCookie, randomCodigo } from '../_lib/crypto.js';
import { enviarCodigoLogin } from '../_lib/email.js';

export default async function handler(req, res) {
  aplicarCors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return json(res, 405, { ok: false, erro: 'metodo' });
  if (!origemPermitida(req)) return json(res, 403, { ok: false, erro: 'origem' });

  let body;
  try { body = await lerJson(req); } catch { return json(res, 400, { ok: false, erro: 'payload' }); }
  const desafio = String(body.desafio || '').trim().slice(0, 128);
  if (!desafio) return json(res, 400, { ok: false, erro: 'desafio' });

  // Vínculo com o navegador (mesmo cookie do iniciar).
  const cookieVal = lerCookies(req).po_desafio || '';
  if (!cookieVal) return json(res, 403, { ok: false, erro: 'vinculo' });

  try {
    const admin = adminClient();
    const codigo = randomCodigo(AUTH.codigoDigitos);
    const expiracao = new Date(Date.now() + AUTH.codigoTtlSeg * 1000).toISOString();
    const { data, error } = await admin.rpc('reemitir_desafio', {
      p_id: desafio, p_codigo_hash: hashCodigo(desafio, codigo),
      p_expiracao: expiracao, p_reenvio_min_seg: AUTH.reenvioMinSeg,
    });
    if (error) throw new Error('RPC reemitir: ' + error.message);

    if (data?.status === 'aguarde') {
      return json(res, 429, { ok: false, erro: 'aguarde', faltam: data.faltam,
        mensagem: `Aguarde ${data.faltam}s para reenviar.` });
    }
    if (data?.status !== 'ok') {
      return json(res, 410, { ok: false, erro: 'invalido', mensagem: 'Reinicie o login.' });
    }

    const { data: u } = await admin.auth.admin.getUserById(data.usuario_id);
    const email = u?.user?.email;
    if (!email) throw new Error('conta sem e-mail');
    await enviarCodigoLogin(email, codigo, Math.round(AUTH.codigoTtlSeg / 60));

    return json(res, 200, { ok: true, expira_em: expiracao, reenvio_em: AUTH.reenvioMinSeg });
  } catch (e) {
    if (e instanceof ConfigError) return json(res, 500, { ok: false, erro: 'config' });
    console.error('[reenviar]', e);
    return json(res, 502, { ok: false, erro: 'envio', mensagem: 'Falha ao reenviar. Tente novamente.' });
  }
}
