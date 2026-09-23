// Primitivas de criptografia — SÓ SERVIDOR.
import crypto from 'node:crypto';
import { env } from './env.js';

// ---- Random ----------------------------------------------------------------
export function randomId(bytes = 24) {
  // >=128 bits de entropia (24 bytes = 192 bits), base64url opaco.
  return crypto.randomBytes(bytes).toString('base64url');
}
export function randomCodigo(digitos = 6) {
  // Código numérico uniforme, criptograficamente seguro.
  const max = 10 ** digitos;
  let n;
  do {
    n = crypto.randomBytes(4).readUInt32BE(0);
  } while (n >= Math.floor(0xffffffff / max) * max); // rejeição para uniformidade
  return String(n % max).padStart(digitos, '0');
}

// ---- HMAC (comparação em tempo constante) ----------------------------------
function hmacHex(key, data) {
  return crypto.createHmac('sha256', Buffer.from(key, 'utf8')).update(data, 'utf8').digest('hex');
}
export function hashCpf(cpfDigitos) {
  // HMAC-SHA256 com segredo estável do servidor (não SHA simples: espaço pequeno).
  return hmacHex(env.cpfHmacKey, `cpf:${cpfDigitos}`);
}
export function hashCodigo(desafioId, codigo) {
  // Liga o código ao desafio e à finalidade.
  return hmacHex(env.otpHmacKey, `login:${desafioId}:${codigo}`);
}
export function hashCookie(valor) {
  return hmacHex(env.cookieHmacKey, `cookie:${valor}`);
}
export function timingSafeEqualHex(a, b) {
  const ba = Buffer.from(String(a), 'hex');
  const bb = Buffer.from(String(b), 'hex');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ---- AES-256-GCM para a sessão Auth pendente -------------------------------
function encKey() {
  // Aceita chave em base64 (32 bytes) ou texto; deriva 32 bytes por SHA-256.
  const raw = env.sessionEncKey;
  try {
    const b = Buffer.from(raw, 'base64');
    if (b.length === 32) return b;
  } catch { /* ignore */ }
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}
export function encryptSession(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const pt = Buffer.from(JSON.stringify(obj), 'utf8');
  const ct = Buffer.concat([cipher.update(pt), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    cifrada: Buffer.concat([ct, tag]).toString('base64'),
    nonce: iv.toString('base64'),
  };
}
export function decryptSession(cifrada, nonce) {
  const iv = Buffer.from(nonce, 'base64');
  const buf = Buffer.from(cifrada, 'base64');
  const tag = buf.subarray(buf.length - 16);
  const ct = buf.subarray(0, buf.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', encKey(), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(pt.toString('utf8'));
}

// ---- CPF: normalização e verificação dos dígitos verificadores -------------
export function normalizarCpf(v) {
  return String(v || '').replace(/\D/g, '');
}
export function cpfValido(v) {
  const c = normalizarCpf(v);
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false; // sequências repetidas (000..., 111...)
  const calc = (base, pesoInicial) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = calc(c.slice(0, 9), 10);
  const d2 = calc(c.slice(0, 10), 11);
  return d1 === Number(c[9]) && d2 === Number(c[10]);
}
