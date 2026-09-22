/* ============================================================
   PENEIRAS ON — Recuperar senha (wizard 4 passos)
   ============================================================ */
mountSimpleHeader('Recuperar senha', 'login.html?tipo=jogador', 'Voltar ao login');

const state = { step:1, channel:'sms', pwd:'', pwdConf:'', showPwd:false };
const barsEl = document.querySelector('[data-bars]');
const labelEl = document.querySelector('[data-step-label]');
const contentEl = document.querySelector('[data-step-content]');
if (!barsEl || !labelEl || !contentEl) {
  throw new Error('recuperar.html está sem os containers do wizard de recuperação.');
}

function strength(pwd) {
  let s = 0;
  if (pwd.length >= 8) s += 25;
  if (/[A-Z]/.test(pwd)) s += 20;
  if (/[a-z]/.test(pwd)) s += 15;
  if (/\d/.test(pwd)) s += 20;
  if (/[^A-Za-z0-9]/.test(pwd)) s += 20;
  return s;
}

let firstPaint = true;

function render() {
  // barras
  barsEl.innerHTML = [1,2,3,4].map(s => {
    const done = s <= state.step;
    const cls = done ? (s===4 && state.step===4 ? 'is-final' : 'is-done') : '';
    return `<div class="${cls}"></div>`;
  }).join('');

  const names = ['Identificação','Verificação','Nova senha','Concluído'];
  labelEl.textContent = `Passo ${state.step} de 4 · ${names[state.step-1]}`;

  if (state.step === 1) renderStep1(!firstPaint);
  else if (state.step === 2) renderStep2();
  else if (state.step === 3) renderStep3();
  else renderStep4();
  firstPaint = false;
}

/* focusField: no primeiro paint o foco fica no documento, para o skip-link ser
   o 1º Tab; quando o passo 1 é redesenhado por ação do usuário (trocar canal,
   voltar do código), o campo recebe o foco. */
function renderStep1(focusField) {
  contentEl.innerHTML = `
    <h1 class="display h3 text-44 mt-1.5 mb-4 mx-0">Esqueceu<br>a senha?</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8">Sem problema. Digite o CPF ou e-mail que você cadastrou e enviamos um código de verificação.</p>
    <div class="flex flex-col gap-4">
      <label class="field"><div class="field__label"><span>CPF ou e-mail</span></div><input class="input" id="ident" placeholder="000.000.000-00 ou seu@email.com"></label>
      <div>
        <div class="mono text-soft mb-2">Receber código por</div>
        <div class="flex gap-2" id="channels">
          <button type="button" data-ch="sms" class="ch-btn">SMS<br><span class="font-mono text-11 opacity-70">••• ••• ••42</span></button>
          <button type="button" data-ch="email" class="ch-btn">E-mail<br><span class="font-mono text-11 opacity-70">lu•••@gmail.com</span></button>
        </div>
      </div>
      <button class="btn btn--primary btn--lg btn--full" id="send">Enviar código →</button>
      <div class="pt-4 border-t border-t-line-soft flex justify-between">
        <span class="text-13 text-ink-soft">Lembrou a senha?</span>
        <a href="login.html?tipo=jogador" class="font-mono text-12 font-bold uppercase tracking-label text-ink no-underline">Entrar →</a>
      </div>
    </div>`;
  // estilo dos botões de canal
  contentEl.querySelectorAll('.ch-btn').forEach(b => {
    b.className = 'ch-btn flex-1 p-3.5 cursor-pointer border border-line text-left font-display font-extrabold text-14 uppercase ' + (b.dataset.ch === state.channel ? 'bg-ink text-bg' : 'bg-card text-ink');
    b.addEventListener('click', () => { state.channel = b.dataset.ch; render(); });
  });
  const ident = contentEl.querySelector('#ident');
  const send = contentEl.querySelector('#send');
  // validation.js: CPF (11 dígitos) ou e-mail válido; erro no blur ou ao enviar
  const v1 = Validation.bind(null, [{ el: ident, validate: v => Validation.rules.emailOrCpf(v) }]);
  send.addEventListener('click', () => {
    if (!v1.validateAll(true)) return;
    state.ident = ident.value.trim();
    toast(`Código enviado por ${state.channel === 'sms' ? 'SMS para ••• ••• ••42' : 'e-mail para lu•••@gmail.com'}.`, { type: 'success' });
    state.step = 2; render();
  });
  if (focusField) ident.focus();
}

function renderStep2() {
  const chLabel = state.channel === 'sms' ? 'SMS' : 'e-mail';
  const chMask = state.channel === 'sms' ? '••• ••• ••42' : 'lu•••@gmail.com';
  contentEl.innerHTML = `
    <h1 class="display h3 text-44 mt-1.5 mb-4 mx-0">Confirme<br>quem é você.</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8">Enviamos um código de 6 dígitos por <strong>${chLabel}</strong> para <strong>${chMask}</strong>. Digite abaixo.</p>
    <div class="field mb-6">
      <div class="flex gap-2" id="code" role="group" aria-label="Código de 6 dígitos">
        ${[0,1,2,3,4,5].map(i=>`<input class="code-input" data-i="${i}" inputmode="numeric" autocomplete="one-time-code" aria-label="Dígito ${i+1} de 6">`).join('')}
      </div>
    </div>
    <div class="flex justify-between items-center mb-6">
      <span class="mono text-mute normal-case">Código expira em <strong class="text-ink">09:32</strong></span>
      <button class="bg-transparent border-0 cursor-pointer font-mono text-11 font-bold uppercase tracking-label text-ink underline underline-offset-3">Reenviar</button>
    </div>
    <button class="btn btn--primary btn--lg btn--full" id="verify">Verificar código →</button>
    <div class="mt-4 text-center"><button id="back1" class="bg-transparent border-0 cursor-pointer text-13 text-ink-soft underline underline-offset-3">← Voltar e trocar contato</button></div>`;

  const inputs = [...contentEl.querySelectorAll('.code-input')];
  const verify = contentEl.querySelector('#verify');
  const group = contentEl.querySelector('#code');
  // some o erro assim que os 6 dígitos estiverem preenchidos
  const check = () => { if (inputs.every(i => i.value)) Validation.clearError(group); };

  /* Distribui uma sequência de dígitos a partir de um campo — usado tanto
     na colagem dos 6 dígitos quanto no preenchimento automático do SMS. */
  const fill = (start, digits) => {
    [...digits].slice(0, inputs.length - start).forEach((d, n) => {
      inputs[start + n].value = d;
      inputs[start + n].classList.add('filled');
    });
    const last = Math.min(start + digits.length, inputs.length - 1);
    inputs[last].focus();
    check();
  };

  inputs.forEach((inp, i) => {
    inp.addEventListener('paste', e => {
      const digits = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'');
      if (!digits) return;
      e.preventDefault();
      fill(i, digits);
    });
    inp.addEventListener('input', () => {
      const digits = inp.value.replace(/\D/g,'');
      if (digits.length > 1) { fill(i, digits); return; }
      inp.value = digits.slice(-1);
      inp.classList.toggle('filled', !!inp.value);
      if (inp.value && i < 5) inputs[i+1].focus();
      check();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i-1].focus();
      if (e.key === 'ArrowLeft' && i > 0) inputs[i-1].focus();
      if (e.key === 'ArrowRight' && i < 5) inputs[i+1].focus();
    });
  });
  verify.addEventListener('click', () => {
    const code = inputs.map(i => i.value).join('');
    const msg = Validation.rules.code6(code);
    if (msg) { Validation.setError(group, msg); (inputs.find(i => !i.value) || inputs[0]).focus(); return; }
    state.step = 3; render();
  });
  contentEl.querySelector('#back1').addEventListener('click', () => { state.step = 1; render(); });
  inputs[0].focus();
}

function renderStep3() {
  contentEl.innerHTML = `
    <h1 class="display h3 text-44 mt-1.5 mb-4 mx-0">Crie uma<br>nova senha.</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8">Use pelo menos 8 caracteres, com letras e números. Senhas fortes deixam sua conta mais protegida.</p>
    <div class="flex flex-col gap-4">
      <label class="field"><div class="field__label"><span>Nova senha</span></div>
        <div class="relative">
          <input class="input" id="pwd" type="${state.showPwd?'text':'password'}" placeholder="••••••••" value="${esc(state.pwd)}">
          <button type="button" id="tog" class="absolute right-2 top-1/2 -translate-y-1/2 h-8 py-0 px-2.5 bg-transparent border-0 cursor-pointer font-mono text-10 uppercase tracking-label text-ink-soft">${state.showPwd?'Ocultar':'Mostrar'}</button>
        </div>
      </label>
      <div id="meter"></div>
      <label class="field"><div class="field__label"><span>Confirmar nova senha</span></div>
        <input class="input" id="pwd2" type="${state.showPwd?'text':'password'}" placeholder="••••••••" value="${esc(state.pwdConf)}">
      </label>
      <button class="btn btn--primary btn--lg btn--full" id="save">Salvar e entrar →</button>
    </div>`;

  const pwd = contentEl.querySelector('#pwd');
  const pwd2 = contentEl.querySelector('#pwd2');
  const meter = contentEl.querySelector('#meter');
  const save = contentEl.querySelector('#save');
  // validation.js: força mínima (8+, maiúscula, número) e confirmação igual
  const v3 = Validation.bind(null, [
    { el: pwd, validate: v => Validation.rules.strongPassword(v) },
    { el: pwd2, validate: v => Validation.rules.match(v, pwd.value, 'As senhas não conferem. Digite a mesma senha nos dois campos.'), dependsOn: pwd },
  ]);

  function update() {
    state.pwd = pwd.value; state.pwdConf = pwd2.value;
    const s = strength(pwd.value);
    const label = s>=80?'Forte':s>=50?'Boa':s>0?'Fraca':'—';
    // classes literais completas: o Tailwind só gera o que encontra no código-fonte
    const tone = s>=80?['text-success','bg-success']:s>=50?['text-accent-text','bg-accent']:s>0?['text-danger','bg-danger']:['text-ink-mute','bg-ink-mute'];
    meter.innerHTML = `
      <div class="flex justify-between mb-1.5"><span class="mono text-soft">Força</span><span class="font-display font-extrabold text-12 uppercase ${tone[0]}">${label}</span></div>
      <div class="strength-bar">${[20,40,60,80,100].map(t=>`<div class="${s>=t?tone[1]:'bg-transparent'}"></div>`).join('')}</div>
      <div class="g g-2 mt-2.5 gap-1.5 font-mono text-11">
        ${req(pwd.value.length>=8,'Mínimo 8 caracteres')}
        ${req(/[A-Z]/.test(pwd.value),'1 letra maiúscula')}
        ${req(/\d/.test(pwd.value),'1 número')}
        ${req(/[^A-Za-z0-9]/.test(pwd.value),'1 caractere especial')}
      </div>`;
  }
  function req(ok, text) {
    return `<span class="req ${ok?'text-success':'text-ink-mute'}"><span class="w-3.5 text-center">${ok?'✓':'○'}</span>${text}</span>`;
  }
  pwd.addEventListener('input', update);
  pwd2.addEventListener('input', update);
  pwd.focus();
  contentEl.querySelector('#tog').addEventListener('click', () => { state.showPwd = !state.showPwd; render(); });
  save.addEventListener('click', () => { if (v3.validateAll(true)) { toast('Senha atualizada com sucesso.', { type: 'success' }); state.step = 4; render(); } });
  update();
}

function renderStep4() {
  contentEl.innerHTML = `
    <div class="flex items-center justify-center w-20 h-20 mt-4 bg-accent text-accent-ink font-display font-black text-48">✓</div>
    <h1 class="display h3 text-44 mt-6 mb-4 mx-0">Senha<br>atualizada.</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8">Sua senha foi alterada com sucesso. Por segurança, todas as outras sessões foram encerradas. Você precisará entrar de novo em qualquer outro dispositivo.</p>
    <div class="flex flex-col gap-3">
      <a href="login.html?tipo=jogador" class="btn btn--primary btn--lg btn--full">Entrar agora →</a>
      <a href="index.html" class="btn btn--ghost btn--full">Voltar à home</a>
    </div>`;
}

render();
