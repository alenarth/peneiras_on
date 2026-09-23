// Configuração e segredos — SÓ SERVIDOR. Nunca importe este arquivo no browser.
// Falha de forma clara quando um segredo obrigatório não está configurado.

function req(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new ConfigError(`Variável de ambiente ausente: ${name}`);
  }
  return v.trim();
}
function opt(name, fallback = null) {
  const v = process.env[name];
  return v && String(v).trim() ? v.trim() : fallback;
}

export class ConfigError extends Error {}

export const env = {
  get supabaseUrl() { return req('SUPABASE_URL'); },
  get anonKey() { return req('SUPABASE_ANON_KEY'); },
  get serviceRoleKey() { return req('SUPABASE_SERVICE_ROLE_KEY'); },
  get cpfHmacKey() { return req('CPF_HMAC_KEY'); },
  get cpfKeyVersion() { return opt('CPF_HMAC_KEY_VERSION', 'v1'); },
  get otpHmacKey() { return req('OTP_HMAC_KEY'); },
  get sessionEncKey() { return req('AUTH_SESSION_ENCRYPTION_KEY'); },
  get cookieHmacKey() { return opt('AUTH_COOKIE_HMAC_KEY') || req('OTP_HMAC_KEY'); },
  // Provedor de e-mail transacional (para o código de login). Resend por padrão.
  get resendKey() { return opt('RESEND_API_KEY'); },
  get smtp() {
    const host = opt('SMTP_HOST');
    if (!host) return null;
    return {
      host,
      port: parseInt(opt('SMTP_PORT', '587'), 10),
      user: opt('SMTP_USER'),
      pass: opt('SMTP_PASS'),
      secure: opt('SMTP_SECURE', 'false') === 'true',
    };
  },
  get mailFrom() { return opt('AUTH_MAIL_FROM', 'Peneiras On <no-reply@peneirason.vercel.app>'); },
  get siteUrl() { return opt('SITE_URL', 'https://peneirason.vercel.app'); },
  get allowedOrigins() {
    const base = ['https://peneirason.vercel.app'];
    const extra = opt('EXTRA_ALLOWED_ORIGINS', '');
    if (extra) extra.split(',').forEach((o) => base.push(o.trim()));
    // dev local
    base.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173');
    return base.filter(Boolean);
  },
  get captchaSecret() { return opt('CAPTCHA_SECRET'); },
  get isProd() { return opt('VERCEL_ENV', 'development') === 'production'; },
};

// Defaults do protocolo (documentados em references/05-autenticacao.md).
export const AUTH = {
  codigoDigitos: 6,
  codigoTtlSeg: 5 * 60, // 5 minutos
  maxTentativas: 5,
  reenvioMinSeg: 60,
  sessaoVerificadaTtlSeg: 12 * 60 * 60, // 12h de autorização explícita
  rateJanelaSeg: 5 * 60,   // janela de contagem e duração do bloqueio (5 min)
  rateMaxIniciar: 30,      // tentativas de login por IP na janela (antes de bloquear)
};
