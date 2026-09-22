// Testes locais das primitivas de auth (não tocam Supabase/rede).
// Rodar: npm test    (ou: node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Segredos de TESTE (não usar em produção).
process.env.CPF_HMAC_KEY = 'teste-cpf-key-0123456789abcdef0123456789';
process.env.OTP_HMAC_KEY = 'teste-otp-key-0123456789abcdef0123456789';
process.env.AUTH_SESSION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

const crypto = await import('../api/_lib/crypto.js');

test('CPF: normalização remove máscara', () => {
  assert.equal(crypto.normalizarCpf('529.982.247-25'), '52998224725');
});

test('CPF: válidos e inválidos', () => {
  assert.equal(crypto.cpfValido('529.982.247-25'), true);   // CPF válido conhecido
  assert.equal(crypto.cpfValido('111.111.111-11'), false);  // sequência repetida
  assert.equal(crypto.cpfValido('123.456.789-00'), false);  // dígitos verificadores errados
  assert.equal(crypto.cpfValido('529.982.247-24'), false);  // 1 dígito trocado
  assert.equal(crypto.cpfValido('5299822472'), false);      // curto demais
});

test('CPF: mesma conta com/sem máscara → mesmo hash', () => {
  const h1 = crypto.hashCpf(crypto.normalizarCpf('529.982.247-25'));
  const h2 = crypto.hashCpf(crypto.normalizarCpf('52998224725'));
  assert.equal(h1, h2);
  assert.match(h1, /^[0-9a-f]{64}$/); // formato aceito pela constraint do banco
});

test('Código de login: 6 dígitos e hash ligado ao desafio', () => {
  const cod = crypto.randomCodigo(6);
  assert.match(cod, /^\d{6}$/);
  const hA = crypto.hashCodigo('desafio-A', cod);
  const hB = crypto.hashCodigo('desafio-B', cod);
  assert.notEqual(hA, hB); // mesmo código, desafios diferentes → hashes diferentes
});

test('randomId tem entropia suficiente (>=128 bits) e é único', () => {
  const a = crypto.randomId(24), b = crypto.randomId(24);
  assert.notEqual(a, b);
  assert.ok(Buffer.from(a, 'base64url').length >= 16);
});

test('Sessão pendente: AES-GCM round-trip', () => {
  const original = { access_token: 'abc.def.ghi', refresh_token: 'rt-123', session_id: 'sess-9' };
  const { cifrada, nonce } = crypto.encryptSession(original);
  const volta = crypto.decryptSession(cifrada, nonce);
  assert.deepEqual(volta, original);
});

test('Sessão pendente: adulteração do ciphertext falha (tag GCM)', () => {
  const { cifrada, nonce } = crypto.encryptSession({ a: 1 });
  const adulterado = Buffer.from(cifrada, 'base64');
  adulterado[0] ^= 0xff;
  assert.throws(() => crypto.decryptSession(adulterado.toString('base64'), nonce));
});
