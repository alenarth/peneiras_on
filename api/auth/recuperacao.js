// POST /api/auth/recuperacao — conclui a recuperação de senha (RF-25).
// Recebe o access_token da SESSÃO DE RECUPERAÇÃO (criada pelo link oficial) e a
// nova senha. Troca a senha via admin e REVOGA todas as sessões verificadas do
// usuário, forçando novo login (senha + código). Não aprova sessoes_verificadas.
import { ConfigError } from '../_lib/env.js';
import { adminClient, usuarioDoToken } from '../_lib/supabaseAdmin.js';
import { lerJson, json, origemPermitida, aplicarCors } from '../_lib/http.js';

function senhaForte(s) {
  return typeof s === 'string' && s.length >= 8 && /[A-Z]/.test(s) && /\d/.test(s) && s.length <= 200;
}

export default async function handler(req, res) {
  aplicarCors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return json(res, 405, { ok: false, erro: 'metodo' });
  if (!origemPermitida(req)) return json(res, 403, { ok: false, erro: 'origem' });

  let body;
  try { body = await lerJson(req); } catch { return json(res, 400, { ok: false, erro: 'payload' }); }

  const token = String(body.access_token || '');
  const novaSenha = String(body.nova_senha || '');
  if (!token) return json(res, 401, { ok: false, erro: 'sem_token' });
  if (!senhaForte(novaSenha)) {
    return json(res, 400, { ok: false, erro: 'senha_fraca',
      mensagem: 'A senha precisa ter ao menos 8 caracteres, 1 maiúscula e 1 número.' });
  }

  try {
    // Valida o token da sessão de recuperação no servidor Auth.
    const info = await usuarioDoToken(token);
    if (!info) return json(res, 401, { ok: false, erro: 'token_invalido',
      mensagem: 'Link de recuperação inválido ou expirado.' });

    const admin = adminClient();
    const { error: upErr } = await admin.auth.admin.updateUserById(info.user.id, { password: novaSenha });
    if (upErr) throw new Error('updateUser: ' + upErr.message);

    // Invalida autorizações verificadas: acessos antigos não sobrevivem à troca.
    await admin.rpc('revogar_sessoes_usuario', { p_usuario: info.user.id }).catch(() => {});

    return json(res, 200, { ok: true, mensagem: 'Senha atualizada. Entre novamente com e-mail e senha.' });
  } catch (e) {
    if (e instanceof ConfigError) return json(res, 500, { ok: false, erro: 'config' });
    console.error('[recuperacao]', e);
    return json(res, 500, { ok: false, erro: 'interno' });
  }
}
