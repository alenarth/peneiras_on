// POST /api/auth/logout — revoga o registro da sessão verificada no servidor.
// O navegador também deve chamar supabase.auth.signOut(). Falha de rede aqui não
// pode virar mensagem falsa de "sessão encerrada" no cliente.
import { ConfigError } from '../_lib/env.js';
import { adminClient, usuarioDoToken } from '../_lib/supabaseAdmin.js';
import { json, origemPermitida, aplicarCors } from '../_lib/http.js';

export default async function handler(req, res) {
  aplicarCors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return json(res, 405, { ok: false, erro: 'metodo' });
  if (!origemPermitida(req)) return json(res, 403, { ok: false, erro: 'origem' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return json(res, 401, { ok: false, erro: 'sem_token' });

  try {
    const info = await usuarioDoToken(token);
    if (!info || !info.sessionId) return json(res, 401, { ok: false, erro: 'token_invalido' });
    const admin = adminClient();
    const { error } = await admin.rpc('revogar_sessao', { p_session: info.sessionId });
    if (error) throw new Error(error.message);
    return json(res, 200, { ok: true });
  } catch (e) {
    if (e instanceof ConfigError) return json(res, 500, { ok: false, erro: 'config' });
    console.error('[logout]', e);
    return json(res, 500, { ok: false, erro: 'interno' });
  }
}
