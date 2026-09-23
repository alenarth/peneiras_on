// Clientes Supabase — SÓ SERVIDOR.
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Cliente com service_role: ignora RLS. Usado APENAS para RPCs de auth e admin,
// sempre com identidade derivada de token validado, nunca do body cru.
export function adminClient() {
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Cliente isolado por requisição para VALIDAR a senha (sem persistir sessão).
export function anonClientIsolado() {
  return createClient(env.supabaseUrl, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

// Valida um access token e devolve o usuário + claims (sub, session_id). Não
// confia no JWT apenas decodificado: usa a verificação do servidor Auth.
export async function usuarioDoToken(accessToken) {
  const admin = adminClient();
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  // Decodifica claims não-sensíveis (session_id) do payload do próprio token
  // que acabou de ser validado pelo servidor Auth acima.
  let sessionId = null;
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'));
    sessionId = payload.session_id || null;
  } catch { /* ignore */ }
  return { user: data.user, sessionId };
}
