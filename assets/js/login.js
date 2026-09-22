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
    tips:['Jogador entra por CPF (depois de concluir o cadastro) ou por e-mail.','Menores de 18 concluem o cadastro com dados do responsável.','Todo login pede um código enviado ao seu e-mail.'],
  },
  olheiro: {
    label:'Olheiro', tag:'Acesso credenciado', title:'Veja talento. Não planilha.',
    sub:'Lista otimizada e perfil completo dos atletas.',
    idLabel:'E-mail', idPlaceholder:'olheiro@exemplo.com',
    persona:'olheiro',
    tips:['Acesso liberado após aprovação da gestão.','Enquanto pendente, você vê a tela de aguardo.','Todo login pede um código enviado ao seu e-mail.'],
  },
  academia: {
    label:'Academia', tag:'Gestão estratégica', title:'Operação vira estratégia.',
    sub:'Painel de gestão da Pelé Academia.',
    idLabel:'E-mail', idPlaceholder:'gestor@exemplo.com',
    persona:'academia',
    tips:['Acesso restrito a administradores aprovados.','Solicitação de conta não concede acesso sozinha.','Todo login pede um código enviado ao seu e-mail.'],
  },
};

const params = new URLSearchParams(location.search);
const role = ROLES[params.get('tipo')] ? params.get('tipo') : 'jogador';
const cfg = ROLES[role];
const proximo = params.get('proximo') || '';

// preencher lado
const set = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
set('[data-side-tag]', cfg.tag); set('[data-side-title]', cfg.title); set('[data-side-sub]', cfg.sub);
const sideTips = document.querySelector('[data-side-tips]');
if (sideTips) sideTips.innerHTML =
  `<div class="kicker text-bg/55">Lembretes</div>` +
  cfg.tips.map((t,i)=>`<div class="g g-row-tip gap-3 text-14 leading-normal pt-2.5 border-t border-t-bg/15"><span class="accent font-display font-black">0${i+1}</span><span>${esc(t)}</span></div>`).join('');

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

// linha inferior
const bottom = document.querySelector('[data-bottom-row]');
if (bottom) {
  if (role === 'jogador') {
    bottom.innerHTML = `<span class="text-13 text-ink-soft">Ainda não tem conta?</span>
      <a href="cadastro.html" class="font-mono text-12 font-bold uppercase tracking-label text-ink no-underline">Criar conta grátis →</a>`;
  } else {
    bottom.innerHTML = `<span class="text-13 text-ink-soft">Ainda não tem conta?</span>
      <a href="cadastro.html?tipo=${role}" class="font-mono text-12 font-bold uppercase tracking-label text-ink no-underline">Solicitar acesso →</a>`;
  }
}

// Se já indisponível (config/CDN faltando), avisa sem quebrar a página.
if (window.PeneirasAuth && window.PeneirasAuth.indisponivel) {
  toast('Login indisponível: ' + window.PeneirasAuth.indisponivel, { type: 'error', duration: 8000 });
}

// ------------------------------------------------------------------
// Estado do fluxo. Etapa 'senha' → 'codigo'.
// ------------------------------------------------------------------
let desafioAtual = null;

if (form && idInput && pwdInput) {
  const v = Validation.bind(form, [
    { el: idInput, validate: x => role === 'jogador' ? Validation.rules.emailOrCpf(x) : Validation.rules.email(x) },
    { el: pwdInput, validate: x => Validation.rules.password(x) },
  ], enviarSenha);
}

async function enviarSenha() {
  const btn = form.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Enviando…';
  try {
    const r = await PeneirasAuth.iniciarLogin({
      identificador: idInput.value, senha: pwdInput.value, persona: cfg.persona,
    });
    if (r.ok && r.desafio) {
      desafioAtual = r.desafio;
      renderCodigo(r.destino, r.reenvio_em || 60);
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

function renderCodigo(destino, reenvioSeg) {
  const formArea = form;
  formArea.innerHTML = `
    <p class="mono py-3 px-3.5 bg-accent-soft border border-line-soft text-12 normal-case tracking-normal">
      Enviamos um código de 6 dígitos para <strong>${esc(destino || 'seu e-mail')}</strong>. Ele expira em 5 minutos.</p>
    <div class="field">
      <div class="field__label"><span>Código de verificação</span></div>
      <div class="flex gap-2" id="code" role="group" aria-label="Código de 6 dígitos">
        ${[0,1,2,3,4,5].map(i=>`<input class="code-input input text-center" data-i="${i}" inputmode="numeric" autocomplete="one-time-code" maxlength="1" aria-label="Dígito ${i+1} de 6">`).join('')}
      </div>
    </div>
    <button type="button" id="verificar" class="btn btn--primary btn--lg btn--full">Verificar e entrar →</button>
    <div class="flex justify-between items-center mt-2">
      <button type="button" id="reenviar" class="bg-transparent border-0 cursor-pointer font-mono text-11 uppercase tracking-label text-ink-soft underline underline-offset-3" disabled>Reenviar (${reenvioSeg}s)</button>
      <button type="button" id="voltar" class="bg-transparent border-0 cursor-pointer text-13 text-ink-soft underline underline-offset-3">← Trocar credenciais</button>
    </div>`;

  const inputs = [...formArea.querySelectorAll('.code-input')];
  const group = formArea.querySelector('#code');
  const collect = () => inputs.map(i => i.value).join('');
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      const d = inp.value.replace(/\D/g,'');
      if (d.length > 1) { [...d].slice(0, 6 - i).forEach((c,n)=>{ inputs[i+n].value=c; }); inputs[Math.min(i+d.length,5)].focus(); }
      else { inp.value = d; if (d && i < 5) inputs[i+1].focus(); }
    });
    inp.addEventListener('keydown', e => { if (e.key==='Backspace' && !inp.value && i>0) inputs[i-1].focus(); });
    inp.addEventListener('paste', e => {
      const d = (e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'');
      if (d) { e.preventDefault(); [...d].slice(0,6).forEach((c,n)=>{ if(inputs[n]) inputs[n].value=c; }); inputs[Math.min(d.length,6)-1].focus(); }
    });
  });
  inputs[0].focus();

  formArea.querySelector('#verificar').addEventListener('click', () => verificar(collect(), group, inputs));
  const reBtn = formArea.querySelector('#reenviar');
  let restante = reenvioSeg;
  const tick = setInterval(() => {
    restante--;
    if (restante <= 0) { clearInterval(tick); reBtn.disabled = false; reBtn.textContent = 'Reenviar código'; }
    else reBtn.textContent = `Reenviar (${restante}s)`;
  }, 1000);
  reBtn.addEventListener('click', async () => {
    if (reBtn.disabled) return;
    reBtn.disabled = true;
    const r = await PeneirasAuth.reenviarCodigo(desafioAtual);
    if (r.ok) { toast('Novo código enviado.', { type: 'success' }); restante = reenvioSeg;
      reBtn.textContent = `Reenviar (${restante}s)`;
      const t2 = setInterval(()=>{ restante--; if(restante<=0){clearInterval(t2);reBtn.disabled=false;reBtn.textContent='Reenviar código';} else reBtn.textContent=`Reenviar (${restante}s)`; },1000);
    } else { reBtn.disabled = false; toast(r.mensagem || 'Não foi possível reenviar.', { type: 'error' }); }
  });
  formArea.querySelector('#voltar').addEventListener('click', () => location.reload());
}

async function verificar(codigo, group, inputs) {
  const msg = Validation.rules.code6(codigo);
  if (msg) { Validation.setError(group, msg); (inputs.find(i=>!i.value)||inputs[0]).focus(); return; }
  Validation.clearError(group);
  const btn = form.querySelector('#verificar');
  btn.disabled = true; btn.textContent = 'Verificando…';
  try {
    const r = await PeneirasAuth.verificarCodigo({ desafio: desafioAtual, codigo });
    if (!r.ok) {
      btn.disabled = false; btn.textContent = 'Verificar e entrar →';
      Validation.setError(group, r.mensagem || 'Código inválido.');
      inputs.forEach(i=>i.value=''); inputs[0].focus();
      return;
    }
    // Sessão liberada: descobrir destino pelo papel/estado.
    const conta = await PeneirasAuth.carregarMinhaConta();
    let destino;
    if (proximo && /^[a-z0-9_\-./?=&]+\.html/i.test(proximo)) destino = proximo;
    else destino = PeneirasAuth.destinoPorPapel(conta.status === 'ok' ? conta : { papel: cfg.persona === 'jogador' ? 'atleta' : cfg.persona });
    location.replace(destino);
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Verificar e entrar →';
    toast('Falha de rede ao verificar. Tente novamente.', { type: 'error' });
  }
}
