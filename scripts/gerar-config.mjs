// Gera assets/js/config.js a partir de uma ALLOWLIST de variáveis públicas.
// Nunca imprime nem embute segredos (service_role, HMAC, SMTP, senha do banco).
// Rodado no build (npm run build:site). Fora da Vercel, se as envs não existirem,
// mantém um config.js já existente (ex.: copiado do config.example.js) e avisa.
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const destino = join(root, 'assets', 'js', 'config.js');

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const site = process.env.SITE_URL || 'https://peneirason.vercel.app';

if (!url || !anon) {
  if (existsSync(destino)) {
    console.warn('[gerar-config] SUPABASE_URL/ANON ausentes; mantendo assets/js/config.js existente.');
    process.exit(0);
  }
  console.error('[gerar-config] Faltam SUPABASE_URL e SUPABASE_ANON_KEY e não há config.js. ' +
    'Defina as envs na Vercel ou copie assets/js/config.example.js para config.js.');
  process.exit(1);
}

const conteudo =
`/* GERADO NO BUILD — não editar à mão. Valores PÚBLICOS (URL + chave anon). */
window.PENEIRAS_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(url)},
  SUPABASE_ANON_KEY: ${JSON.stringify(anon)},
  SITE_URL: ${JSON.stringify(site)},
};
`;
writeFileSync(destino, conteudo, 'utf8');
console.log('[gerar-config] assets/js/config.js gerado a partir das envs públicas.');
