// Monta a pasta dist/ para deploy estático (Vercel): páginas + assets com o
// CSS já compilado. Sem dependências — só Node. Roda depois de `npm run build`.
import { cpSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const out = join(root, 'dist');
if (!existsSync(join(root, 'assets', 'css', 'tailwind.css'))) {
  console.error('assets/css/tailwind.css não existe — rode `npm run build` antes.');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// páginas + arquivos de raiz que o navegador pede pelo caminho fixo (favicon, manifest)
const ROOT_FILES = ['favicon.ico', 'site.webmanifest'];
for (const f of readdirSync(root)) {
  if (f.endsWith('.html') || ROOT_FILES.includes(f)) cpSync(join(root, f), join(out, f));
}
cpSync(join(root, 'assets'), join(out, 'assets'), {
  recursive: true,
  // fontes do Tailwind não vão para produção; o navegador só precisa do compilado
  filter: (src) => !/(input|residual)\.css$/.test(src),
});
console.log('dist/ pronto:', readdirSync(out).join(', '));
