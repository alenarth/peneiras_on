/* PENEIRAS ON — landing de confirmação de e-mail.
   O link de confirmação pode criar uma sessão automática, mas isso NÃO libera a
   aplicação: o acesso ainda exige login com senha + código. Encerramos essa
   sessão automática para evitar meia-sessão e mandamos a pessoa ao login. */
mountSimpleHeader('E-mail confirmado', 'index.html', 'Voltar à home', { cta: false });
const screenEl = document.querySelector('[data-screen]');

(async function () {
  const erroHash = /error=/i.test(location.hash) || new URLSearchParams(location.search).get('error');
  let confirmado = true;
  try {
    if (window.PeneirasAuth && PeneirasAuth.client) {
      const s = await PeneirasAuth.client.auth.getSession();
      if (!s.data.session && erroHash) confirmado = false;
      // encerra a sessão automática do link (não autoriza a aplicação)
      await PeneirasAuth.client.auth.signOut().catch(() => {});
    }
  } catch (e) { /* ignore */ }

  screenEl.innerHTML = confirmado ? `
    <div class="flex items-center justify-center w-20 h-20 bg-accent text-accent-ink font-display font-black text-48">✓</div>
    <h1 class="display h3 text-44 mt-6 mb-4 mx-0">E-mail confirmado.</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8 max-w-copy-sm">Sua conta está ativa. Agora entre com seu e-mail e senha — vamos enviar um código para concluir o acesso.</p>
    <div class="flex gap-2 flex-wrap">
      <a href="login.html?tipo=jogador" class="btn btn--primary btn--lg">Entrar como jogador →</a>
      <a href="login.html?tipo=olheiro" class="btn btn--ghost btn--lg">Sou olheiro</a>
      <a href="login.html?tipo=academia" class="btn btn--ghost btn--lg">Sou academia</a>
    </div>` : `
    <h1 class="display h3 text-44 mt-2 mb-4 mx-0">Link inválido ou expirado.</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8 max-w-copy-sm">Não foi possível confirmar o e-mail. Peça um novo link criando a conta novamente ou usando “Recuperar senha”.</p>
    <div class="flex gap-2 flex-wrap">
      <a href="cadastro.html" class="btn btn--primary btn--lg">Criar conta</a>
      <a href="login.html?tipo=jogador" class="btn btn--ghost btn--lg">Ir para o login</a>
    </div>`;
})();
