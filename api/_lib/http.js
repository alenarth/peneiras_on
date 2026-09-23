// Utilitários HTTP para as funções Vercel (Node runtime).
import { env } from './env.js';

export async function lerJson(req, limiteBytes = 16 * 1024) {
  if (req.body && typeof req.body === 'object') return req.body; // Vercel já parseou
  return await new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limiteBytes) { reject(new Error('payload_grande')); req.destroy(); return; }
      data += c;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(new Error('json_invalido')); }
    });
    req.on('error', reject);
  });
}

export function json(res, status, obj, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(obj));
}

// Verificação de origem/CSRF para endpoints com efeitos colaterais.
export function origemPermitida(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // navegação same-origin sem header Origin (GET simples)
  return env.allowedOrigins.includes(origin);
}

// Aplica CORS restrito (allowlist) — nunca "*".
export function aplicarCors(req, res) {
  const origin = req.headers.origin;
  if (origin && env.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
}

// IP confiável a partir de headers do deploy (Vercel). Não confia cegamente em
// X-Forwarded-For inteiro fornecido pelo cliente: usa o 1º hop do proxy da Vercel.
export function ipConfiavel(req) {
  const xreal = req.headers['x-real-ip'];
  if (xreal) return String(xreal).trim();
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || 'desconhecido';
}

// Cookies -------------------------------------------------------------------
export function lerCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  raw.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
export function cookieDesafio(nome, valor, maxAgeSeg) {
  const attrs = [
    `${nome}=${encodeURIComponent(valor)}`,
    'Path=/api/auth',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeg}`,
  ];
  if (env.isProd) attrs.push('Secure');
  return attrs.join('; ');
}
export function cookieLimpar(nome) {
  const attrs = [`${nome}=`, 'Path=/api/auth', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
  if (env.isProd) attrs.push('Secure');
  return attrs.join('; ');
}

// CAPTCHA (opcional; verifica só se CAPTCHA_SECRET estiver configurado).
export async function captchaOk(token, ip) {
  if (!env.captchaSecret) return true; // não configurado → não bloqueia no MVP
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: env.captchaSecret, response: token || '', remoteip: ip || '' }),
    });
    const j = await r.json();
    return !!j.success;
  } catch { return false; }
}
