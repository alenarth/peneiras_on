/* ============================================================
   PENEIRAS ON — Recuperar senha (RF-25), fluxo real
   Dois modos:
     A) Pedir o link  → resetPasswordForEmail (link oficial por e-mail)
     B) Concluir      → chegou pelo link (sessão de recuperação): define nova
                        senha via /api/auth/recuperacao e força novo login.
   O código de LOGIN é outro fluxo — aqui não há código de 6 dígitos.
   ============================================================ */
mountSimpleHeader('Recuperar senha', 'login.html?tipo=jogador', 'Voltar ao login');

const barsEl = document.querySelector('[data-bars]');
const labelEl = document.querySelector('[data-step-label]');
const contentEl = document.querySelector('[data-step-content]');
if (!contentEl) throw new Error('recuperar.html sem containers.');

const params = new URLSearchParams(location.search);
let modoRecovery = params.get('fluxo') === 'recovery' || /type=recovery/.test(location.hash);

function bars(ativo, total) {
  if (!barsEl) return;
  barsEl.innerHTML = Array.from({ length: total }, (_, i) => `<div class="${i < ativo ? 'is-done' : ''}"></div>`).join('');
}

if (window.PeneirasAuth && window.PeneirasAuth.indisponivel) {
  if (labelEl) labelEl.textContent = 'Indisponível';
  contentEl.innerHTML = `<p class="text-15 text-ink-soft mt-4">Recuperação indisponível: ${esc(window.PeneirasAuth.indisponivel)}</p>`;
} else {
  // Se o link de recuperação criar a sessão de forma assíncrona, capturamos o evento.
  if (PeneirasAuth.client) {
    PeneirasAuth.client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { modoRecovery = true; renderNovaSenha(); }
    });
  }
  if (modoRecovery) renderNovaSenha();
  else renderPedirLink();
}

/* ---- A) Pedir link ---- */
function renderPedirLink() {
  bars(1, 2);
  if (labelEl) labelEl.textContent = 'Passo 1 de 2 · Identificação';
  contentEl.innerHTML = `
    <h1 class="display h3 text-44 mt-1.5 mb-4 mx-0">Esqueceu<br>a senha?</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8">Digite o e-mail da sua conta. Enviamos um link seguro para você criar uma nova senha.</p>
    <div class="flex flex-col gap-4">
      <label class="field"><div class="field__label"><span>E-mail</span></div>
        <input class="input" id="rec-email" type="email" autocomplete="email" placeholder="voce@exemplo.com"></label>
      <button class="btn btn--primary btn--lg btn--full" id="rec-enviar">Enviar link →</button>
      <div class="pt-4 border-t border-t-line-soft flex justify-between">
        <span class="text-13 text-ink-soft">Lembrou a senha?</span>
        <a href="login.html?tipo=jogador" class="font-mono text-12 font-bold uppercase tracking-label text-ink no-underline">Entrar →</a>
      </div>
    </div>`;
  const email = contentEl.querySelector('#rec-email');
  const btn = contentEl.querySelector('#rec-enviar');
  const v = Validation.bind(null, [{ el: email, validate: x => Validation.rules.email(x) }]);
  btn.addEventListener('click', async () => {
    if (!v.validateAll(true)) return;
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      await PeneirasAuth.solicitarRecuperacao(email.value);
      // Resposta neutra: não revela se o e-mail existe.
      renderLinkEnviado(email.value);
    } catch (e) { toast('Falha de rede. Tente novamente.', { type: 'error' }); btn.disabled = false; btn.textContent = 'Enviar link →'; }
  });
  email.focus();
}

function renderLinkEnviado(email) {
  bars(2, 2);
  if (labelEl) labelEl.textContent = 'Passo 2 de 2 · Verifique o e-mail';
  contentEl.innerHTML = `
    <h1 class="display h3 text-44 mt-1.5 mb-4 mx-0">Confira<br>seu e-mail.</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8">Se existir uma conta com <strong>${esc(email)}</strong>, enviamos um link para redefinir a senha. Abra o link neste dispositivo para continuar.</p>
    <a href="login.html?tipo=jogador" class="btn btn--ghost btn--full">Voltar ao login</a>`;
}

/* ---- B) Definir nova senha (chegou pela sessão de recuperação) ---- */
function renderNovaSenha() {
  bars(2, 2);
  if (labelEl) labelEl.textContent = 'Redefinir senha';
  contentEl.innerHTML = `
    <h1 class="display h3 text-44 mt-1.5 mb-4 mx-0">Crie uma<br>nova senha.</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8">Use pelo menos 8 caracteres, com 1 maiúscula e 1 número. Depois de salvar, você entra de novo com senha e código.</p>
    <div class="flex flex-col gap-4">
      <label class="field"><div class="field__label"><span>Nova senha</span></div>
        <input class="input" id="np" type="password" autocomplete="new-password" placeholder="••••••••"></label>
      <label class="field"><div class="field__label"><span>Confirmar nova senha</span></div>
        <input class="input" id="np2" type="password" autocomplete="new-password" placeholder="••••••••"></label>
      <button class="btn btn--primary btn--lg btn--full" id="salvar">Salvar nova senha →</button>
    </div>`;
  const np = contentEl.querySelector('#np');
  const np2 = contentEl.querySelector('#np2');
  const btn = contentEl.querySelector('#salvar');
  const v = Validation.bind(null, [
    { el: np, validate: x => Validation.rules.strongPassword(x) },
    { el: np2, validate: x => Validation.rules.match(x, np.value, 'As senhas não conferem.'), dependsOn: np },
  ]);
  btn.addEventListener('click', async () => {
    if (!v.validateAll(true)) return;
    btn.disabled = true; btn.textContent = 'Salvando…';
    try {
      const r = await PeneirasAuth.concluirRecuperacao(np.value);
      if (!r.ok) {
        btn.disabled = false; btn.textContent = 'Salvar nova senha →';
        toast(r.mensagem || 'Não foi possível redefinir. O link pode ter expirado.', { type: 'error', duration: 7000 });
        return;
      }
      renderConcluido();
    } catch (e) { btn.disabled = false; btn.textContent = 'Salvar nova senha →'; toast('Falha de rede.', { type: 'error' }); }
  });
  np.focus();
}

function renderConcluido() {
  bars(2, 2);
  if (labelEl) labelEl.textContent = 'Concluído';
  contentEl.innerHTML = `
    <div class="flex items-center justify-center w-20 h-20 mt-4 bg-accent text-accent-ink font-display font-black text-48">✓</div>
    <h1 class="display h3 text-44 mt-6 mb-4 mx-0">Senha<br>atualizada.</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8">Sua senha foi alterada. Por segurança, os acessos anteriores foram encerrados — entre de novo com senha e código.</p>
    <a href="login.html?tipo=jogador" class="btn btn--primary btn--lg btn--full">Entrar agora →</a>`;
}
