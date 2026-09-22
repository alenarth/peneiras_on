/* PENEIRAS ON — configuração PÚBLICA do frontend.
   Copie este arquivo para assets/js/config.js e preencha com os valores do seu
   projeto Supabase (Project Settings → API). São valores PÚBLICOS:
   - a URL do projeto e a chave anon/publishable podem ir para o navegador.
   NUNCA coloque aqui service_role, senha do banco, SMTP ou chaves HMAC.

   Em produção (Vercel), o build gera config.js automaticamente a partir das
   variáveis SUPABASE_URL e SUPABASE_ANON_KEY (ver scripts/gerar-config.mjs). */
window.PENEIRAS_CONFIG = {
  SUPABASE_URL: 'https://kajdfncwgqenhdkrfzyo.supabase.co',
  SUPABASE_ANON_KEY: 'COLE_AQUI_A_CHAVE_ANON_OU_PUBLISHABLE',
  SITE_URL: 'https://peneirason.vercel.app',
};
