/* ============================================================
   PENEIRAS ON — Login real (senha → código por e-mail → sessão)
   Jogador entra por CPF ou e-mail; Olheiro/Academia por e-mail.
   Google é apenas visual (indisponível). Sem bypass de navegação.
   ============================================================ */
mountSimpleHeader('Entrar', 'index.html', 'Voltar à home');

const ROLES = {
  jogador: {
    label:'Jogador', tag:'Atleta', title:'Mostre seu futebol.',
    sub:'Acompanhe sua inscrição e seu perfil.',
    idLabel:'CPF ou e-mail', idPlaceholder:'000.000.000-00 ou seu@email.com',
    persona:'jogador',
    tips:['Jogador entra por CPF (depois de concluir o cadastro) ou por e-mail.','Menores de 18 concluem o cadastro com dados do responsável.','Login com e-mail (ou CPF) e senha.'],
  },
  olheiro: {
    label:'Olheiro', tag:'Acesso credenciado', title:'Veja talento. Não planilha.',
    sub:'Lista otimizada e perfil completo dos atletas.',
    idLabel:'E-mail', idPlaceholder:'olheiro@exemplo.com',
    persona:'olheiro',
    tips:['E-mail e senha bastam — sem aprovação.','Você acessa o painel de olheiro assim que entra.','Login com e-mail e senha.'],
  },
  academia: {
    label:'Academia', tag:'Gestão estratégica', title:'Operação vira estratégia.',
    sub:'Painel de gestão da Pelé Academia.',
    idLabel:'E-mail', idPlaceholder:'gestor@exemplo.com',
    persona:'academia',
    tips:['E-mail e senha bastam — sem aprovação.','Você acessa o painel de gestão assim que entra.','Login com e-mail e senha.'],
  },
};

const params = new URLSearchParams(location.search);
const role = ROLES[params.get('tipo')] ? params.get('tipo') : 'jogador';
const cfg = ROLES[role];
const proximo = params.get('proximo') || '';

/* ?evento=<id> vindo do card de uma peneira (landing, calendário ou mapa): a
   inscrição exige conta, então o caminho passa por aqui. Só nesse caso a tela
   explica o porquê e oferece o cadastro — quem abre o login direto não vê nada
   disso. Id inválido ou ausente cai no login normal. */
const evento = MOCK.EVENTS.find(e => e.id === params.get('evento'));
const ctx = document.querySelector('[data-event-context]');
if (evento && role === 'jogador' && ctx) {
  ctx.innerHTML = `<span class="event-note__icon" aria-hidden="true">◆</span>
    <span><strong>Para se inscrever em ${esc(eventShortName(evento))} (${fmtDotDate(evento.date, 'full')}) você precisa de uma conta.</strong>
    Entre abaixo ou <a href="cadastro.html?evento=${esc(evento.id)}">crie a sua em 4 minutos</a>. A inscrição é gratuita.</span>`;
  ctx.hidden = false;
}

// preencher lado
const set = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
set('[data-side-tag]', cfg.tag); set('[data-side-title]', cfg.title); set('[data-side-sub]', cfg.sub);
const sideTips = document.querySelector('[data-side-tips]');
if (sideTips) sideTips.innerHTML =
  `<div class="kicker text-ink/55">Lembretes</div>` +
  cfg.tips.map((t,i)=>`<div class="g g-row-tip gap-3 text-14 leading-normal pt-2.5 border-t border-t-ink/15"><span class="accent font-display font-black">0${i+1}</span><span>${esc(t)}</span></div>`).join('');

document.querySelectorAll('.role-tab').forEach(t => {
  if (t.getAttribute('data-role') === role) t.classList.add('is-active');
});

const formKicker = document.querySelector('[data-form-kicker]');
const idLabel = document.querySelector('[data-id-label]');
const idInput = document.querySelector('[data-id-input]');
if (formKicker) formKicker.textContent = 'Entrar como ' + cfg.label.toLowerCase();
if (idLabel) idLabel.textContent = cfg.idLabel;
if (idInput) { idInput.placeholder = cfg.idPlaceholder; idInput.id = idInput.id || 'login-id'; }

// Google: apenas visual, indisponível (sem OAuth, sem sessão, sem redirect).
const googleBtn = document.querySelector('[data-google]');
if (googleBtn) {
  googleBtn.setAttribute('aria-disabled', 'true');
  googleBtn.setAttribute('title', 'Login com Google indisponível nesta versão.');
  googleBtn.classList.add('opacity-60', 'cursor-not-allowed');
  googleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toast('Entrar com Google ainda está indisponível. Use e-mail e senha.', { type: 'info' });
  });
}

const form = document.querySelector('[data-login-form]');
const pwdInput = document.querySelector('[data-pwd]');
if (pwdInput) pwdInput.id = pwdInput.id || 'login-pwd';

// mostrar/ocultar senha
const togglePwdBtn = document.querySelector('[data-toggle-pwd]');
if (togglePwdBtn && pwdInput) togglePwdBtn.addEventListener('click', function () {
  const show = pwdInput.type === 'password';
  pwdInput.type = show ? 'text' : 'password';
  this.textContent = show ? 'Ocultar' : 'Mostrar';
});

// linha inferior — jogador leva o ?evento adiante (se veio de um card de peneira)
const bottom = document.querySelector('[data-bottom-row]');
if (bottom) {
  if (role === 'jogador') {
    bottom.innerHTML = `<span class="text-13 text-ink-soft">Ainda não tem conta?</span>
      <a href="cadastro.html${evento ? '?evento=' + encodeURIComponent(evento.id) : ''}" class="font-mono text-12 font-bold uppercase tracking-label text-ink no-underline">Criar conta grátis →</a>`;
  } else {
    bottom.innerHTML = `<span class="text-13 text-ink-soft">Ainda não tem conta?</span>
      <a href="cadastro.html?tipo=${role}" class="font-mono text-12 font-bold uppercase tracking-label text-ink no-underline">Criar conta →</a>`;
  }
}

// Se já indisponível (config/CDN faltando), avisa sem quebrar a página.
if (window.PeneirasAuth && window.PeneirasAuth.indisponivel) {
  toast('Login indisponível: ' + window.PeneirasAuth.indisponivel, { type: 'error', duration: 8000 });
}

// ------------------------------------------------------------------
// Login direto: e-mail/CPF + senha → sessão (sem código por e-mail).
// ------------------------------------------------------------------
if (form && idInput && pwdInput) {
  Validation.bind(form, [
    { el: idInput, validate: x => role === 'jogador' ? Validation.rules.emailOrCpf(x) : Validation.rules.email(x) },
    { el: pwdInput, validate: x => Validation.rules.password(x) },
  ], entrar);
}

async function entrar() {
  const btn = form.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Entrando…';
  try {
    const r = await PeneirasAuth.login({
      identificador: idInput.value, senha: pwdInput.value, persona: cfg.persona,
    });
    if (r.ok) {
      const conta = await PeneirasAuth.carregarMinhaConta();
      let destino;
      if (proximo && /^[a-z0-9_\-./?=&]+\.html/i.test(proximo)) destino = proximo;
      else destino = PeneirasAuth.destinoPorPapel(conta.status === 'ok' ? conta : { papel: cfg.persona === 'jogador' ? 'atleta' : cfg.persona });
      location.replace(destino);
      return;
    }
    if (r.erro === 'email_nao_confirmado') {
      toast(r.mensagem || 'Confirme seu e-mail antes de entrar.', { type: 'error', duration: 8000 });
    } else if (r.erro === 'rate') {
      toast(r.mensagem || 'Muitas tentativas. Tente mais tarde.', { type: 'error' });
    } else {
      toast(r.mensagem || 'CPF/e-mail ou senha incorretos.', { type: 'error' });
    }
  } catch (e) {
    toast('Falha de rede. Tente novamente.', { type: 'error' });
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}

// Fluxo de código por e-mail (OTP) removido — login agora é senha direta.
