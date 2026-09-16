/* ============================================================
   PENEIRAS ON — Recuperar senha (wizard 4 passos)
   ============================================================ */
mountSimpleHeader('Recuperar senha', 'login.html?tipo=jogador', 'Voltar ao login');

const state = { step:1, channel:'sms', pwd:'', pwdConf:'', showPwd:false };
const barsEl = document.querySelector('[data-bars]');
const labelEl = document.querySelector('[data-step-label]');
const contentEl = document.querySelector('[data-step-content]');

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
    <h1 class="display h3" style="font-size:44px;margin:6px 0 16px">Esqueceu<br>a senha?</h1>
    <p style="font-size:15px;line-height:1.6;color:var(--ink-soft);margin-bottom:32px">Sem problema. Digite o CPF ou e-mail que você cadastrou e enviamos um código de verificação.</p>
    <div style="display:flex;flex-direction:column;gap:16px">
      <label class="field"><div class="field__label"><span>CPF ou e-mail</span></div><input class="input" id="ident" placeholder="000.000.000-00 ou seu@email.com"></label>
      <div>
        <div class="mono text-soft" style="margin-bottom:8px">Receber código por</div>
        <div style="display:flex;gap:8px" id="channels">
          <button type="button" data-ch="sms" class="ch-btn">SMS<br><span style="font-family:var(--font-mono);font-size:11px;opacity:.7">••• ••• ••42</span></button>
          <button type="button" data-ch="email" class="ch-btn">E-mail<br><span style="font-family:var(--font-mono);font-size:11px;opacity:.7">lu•••@gmail.com</span></button>
        </div>
      </div>
      <button class="btn btn--primary btn--lg btn--full" id="send" disabled>Enviar código →</button>
      <div style="padding-top:16px;border-top:1px solid var(--line-soft);display:flex;justify-content:space-between">
        <span style="font-size:13px;color:var(--ink-soft)">Lembrou a senha?</span>
        <a href="login.html?tipo=jogador" style="font-family:var(--font-mono);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink);text-decoration:none">Entrar →</a>
      </div>
    </div>`;
  // estilo dos botões de canal
  contentEl.querySelectorAll('.ch-btn').forEach(b => {
    b.style.cssText = 'flex:1;padding:14px;cursor:pointer;border:1px solid var(--ink);text-align:left;font-family:var(--font-display);font-weight:800;font-size:14px;text-transform:uppercase;background:var(--card);color:var(--ink)';
    if (b.dataset.ch === state.channel) { b.style.background = 'var(--ink)'; b.style.color = 'var(--bg)'; }
    b.addEventListener('click', () => { state.channel = b.dataset.ch; render(); });
  });
  const ident = contentEl.querySelector('#ident');
  const send = contentEl.querySelector('#send');
  ident.addEventListener('input', () => { send.disabled = !ident.value; });
  send.addEventListener('click', () => { state.step = 2; render(); });
  if (focusField) ident.focus();
}

function renderStep2() {
  const chLabel = state.channel === 'sms' ? 'SMS' : 'e-mail';
  const chMask = state.channel === 'sms' ? '••• ••• ••42' : 'lu•••@gmail.com';
  contentEl.innerHTML = `
    <h1 class="display h3" style="font-size:44px;margin:6px 0 16px">Confirme<br>quem é você.</h1>
    <p style="font-size:15px;line-height:1.6;color:var(--ink-soft);margin-bottom:32px">Enviamos um código de 6 dígitos por <strong>${chLabel}</strong> para <strong>${chMask}</strong>. Digite abaixo.</p>
    <div style="display:flex;gap:8px;margin-bottom:24px" id="code">
      ${[0,1,2,3,4,5].map(i=>`<input class="code-input" data-i="${i}" inputmode="numeric" autocomplete="one-time-code" aria-label="Dígito ${i+1} de 6">`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <span class="mono text-mute" style="text-transform:none">Código expira em <strong style="color:var(--ink)">09:32</strong></span>
      <button style="background:transparent;border:none;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink);text-decoration:underline;text-underline-offset:3px">Reenviar</button>
    </div>
    <button class="btn btn--primary btn--lg btn--full" id="verify" disabled>Verificar código →</button>
    <div style="margin-top:16px;text-align:center"><button id="back1" style="background:transparent;border:none;cursor:pointer;font-size:13px;color:var(--ink-soft);text-decoration:underline;text-underline-offset:3px">← Voltar e trocar contato</button></div>`;

  const inputs = [...contentEl.querySelectorAll('.code-input')];
  const verify = contentEl.querySelector('#verify');
  const check = () => { verify.disabled = !inputs.every(i => i.value); };

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
  verify.addEventListener('click', () => { state.step = 3; render(); });
  contentEl.querySelector('#back1').addEventListener('click', () => { state.step = 1; render(); });
  inputs[0].focus();
}

function renderStep3() {
  contentEl.innerHTML = `
    <h1 class="display h3" style="font-size:44px;margin:6px 0 16px">Crie uma<br>nova senha.</h1>
    <p style="font-size:15px;line-height:1.6;color:var(--ink-soft);margin-bottom:32px">Use pelo menos 8 caracteres, com letras e números. Senhas fortes deixam sua conta mais protegida.</p>
    <div style="display:flex;flex-direction:column;gap:16px">
      <label class="field"><div class="field__label"><span>Nova senha</span></div>
        <div style="position:relative">
          <input class="input" id="pwd" type="${state.showPwd?'text':'password'}" placeholder="••••••••" value="${esc(state.pwd)}">
          <button type="button" id="tog" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);height:32px;padding:0 10px;background:transparent;border:none;cursor:pointer;font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-soft)">${state.showPwd?'Ocultar':'Mostrar'}</button>
        </div>
      </label>
      <div id="meter"></div>
      <label class="field"><div class="field__label"><span>Confirmar nova senha</span></div>
        <input class="input" id="pwd2" type="${state.showPwd?'text':'password'}" placeholder="••••••••" value="${esc(state.pwdConf)}">
        <span class="field__error" id="mismatch" role="alert" style="display:none">As senhas não conferem</span>
      </label>
      <button class="btn btn--primary btn--lg btn--full" id="save" disabled>Salvar e entrar →</button>
    </div>`;

  const pwd = contentEl.querySelector('#pwd');
  const pwd2 = contentEl.querySelector('#pwd2');
  const meter = contentEl.querySelector('#meter');
  const save = contentEl.querySelector('#save');
  const mismatch = contentEl.querySelector('#mismatch');

  function update() {
    state.pwd = pwd.value; state.pwdConf = pwd2.value;
    const s = strength(pwd.value);
    const label = s>=80?'Forte':s>=50?'Boa':s>0?'Fraca':'—';
    const color = s>=80?'var(--success)':s>=50?'var(--accent)':s>0?'var(--danger)':'var(--ink-mute)';
    meter.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="mono text-soft">Força</span><span style="font-family:var(--font-display);font-weight:800;font-size:12px;color:${color};text-transform:uppercase">${label}</span></div>
      <div class="strength-bar">${[20,40,60,80,100].map(t=>`<div style="background:${s>=t?color:'transparent'}"></div>`).join('')}</div>
      <div class="g g-2" style="margin-top:10px;gap:6px;font-family:var(--font-mono);font-size:11px">
        ${req(pwd.value.length>=8,'Mínimo 8 caracteres')}
        ${req(/[A-Z]/.test(pwd.value),'1 letra maiúscula')}
        ${req(/\d/.test(pwd.value),'1 número')}
        ${req(/[^A-Za-z0-9]/.test(pwd.value),'1 caractere especial')}
      </div>`;
    const valid = pwd.value.length>=8 && pwd.value===pwd2.value && s>=50;
    mismatch.style.display = (pwd2.value && pwd2.value !== pwd.value) ? 'block' : 'none';
    save.disabled = !valid;
  }
  function req(ok, text) {
    return `<span class="req" style="color:${ok?'var(--success)':'var(--ink-mute)'}"><span style="width:14px;text-align:center">${ok?'✓':'○'}</span>${text}</span>`;
  }
  pwd.addEventListener('input', update);
  pwd2.addEventListener('input', update);
  pwd.focus();
  contentEl.querySelector('#tog').addEventListener('click', () => { state.showPwd = !state.showPwd; render(); });
  save.addEventListener('click', () => { state.step = 4; render(); });
  update();
}

function renderStep4() {
  contentEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;width:80px;height:80px;margin-top:16px;background:var(--accent);color:var(--accent-ink);font-family:var(--font-display);font-weight:900;font-size:48px">✓</div>
    <h1 class="display h3" style="font-size:44px;margin:24px 0 16px">Senha<br>atualizada.</h1>
    <p style="font-size:15px;line-height:1.6;color:var(--ink-soft);margin-bottom:32px">Sua senha foi alterada com sucesso. Por segurança, todas as outras sessões foram encerradas — você precisará entrar de novo em qualquer outro dispositivo.</p>
    <div style="display:flex;flex-direction:column;gap:12px">
      <a href="atleta.html?tela=status" class="btn btn--primary btn--lg btn--full">Entrar agora →</a>
      <a href="index.html" class="btn btn--ghost btn--full">Voltar à home</a>
    </div>`;
}

render();
