/* ============================================================
   PENEIRAS ON — Cadastro (criar conta) + Conclusão de cadastro
   Fluxo real:
     1) criar conta (nome, e-mail, senha, persona) → confirmar e-mail
     2) confirmar e-mail → login (senha + código)
     3) cadastro.html?fluxo=completar → concluir perfil (jogador ou profissional)
   ============================================================ */
mountSimpleHeader('Criar perfil', 'index.html', 'Voltar à home', { cta: false });

const screenEl = document.querySelector('[data-screen]');
if (!screenEl) throw new Error('cadastro.html está sem [data-screen].');
const params = new URLSearchParams(location.search);
const tipo = ['olheiro','academia','jogador'].includes(params.get('tipo')) ? params.get('tipo') : 'jogador';
const fluxo = params.get('fluxo');

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const POSICOES = ['Goleiro','Zagueiro','Lateral','Volante','Meia','Ponta','Atacante'];

function fieldHTML(label, control, hint, optional) {
  return `<label class="field"><div class="field__label"><span>${esc(label)}</span>${optional?'<span class="field__optional">opcional</span>':''}</div>${control}${hint?`<span class="field__hint">${esc(hint)}</span>`:''}</label>`;
}
function indisponivelGuard() {
  if (window.PeneirasAuth && window.PeneirasAuth.indisponivel) {
    toast('Cadastro indisponível: ' + window.PeneirasAuth.indisponivel, { type: 'error', duration: 8000 });
    return true;
  }
  return false;
}

if (fluxo === 'completar') iniciarConclusao();
else renderCriarConta();

/* ------------------------------------------------------------------ */
/* 1) CRIAR CONTA                                                      */
/* ------------------------------------------------------------------ */
function renderCriarConta() {
  const titulos = {
    jogador: 'Crie sua conta<br>de jogador.',
    olheiro: 'Crie sua conta<br>de olheiro.',
    academia: 'Crie a conta<br>da academia.',
  };
  const nota = {
    jogador: 'Depois de entrar, você conclui o cadastro com CPF e dados do futebol.',
    olheiro: 'E-mail e senha bastam. Depois de entrar, você já acessa o painel de olheiro.',
    academia: 'E-mail e senha bastam. Depois de entrar, você já acessa o painel de gestão.',
  };
  screenEl.innerHTML = `
    <div class="cad-body w-full max-w-narrow my-0 mx-auto pt-10 pb-16 px-8">
      <span class="kicker uppercase">Conta gratuita</span>
      <h1 class="display text-fluid-sm mt-3 mb-3 mx-0">${titulos[tipo]}</h1>
      <p class="text-15 leading-copy text-ink-soft max-w-copy-sm mb-8">${esc(nota[tipo])}</p>
      <form class="flex flex-col gap-4 max-w-copy" data-form-conta novalidate>
        ${fieldHTML('Nome completo', `<input class="input" id="c-nome" autocomplete="name" placeholder="Seu nome completo">`)}
        ${fieldHTML('E-mail', `<input class="input" id="c-email" type="email" autocomplete="email" placeholder="voce@exemplo.com">`)}
        ${fieldHTML('Senha', `<input class="input" id="c-senha" type="password" autocomplete="new-password" placeholder="Mínimo 8, com maiúscula e número">`,'Pelo menos 8 caracteres, 1 maiúscula e 1 número.')}
        ${fieldHTML('Confirmar senha', `<input class="input" id="c-senha2" type="password" autocomplete="new-password" placeholder="Repita a senha">`)}
        <button type="submit" class="btn btn--accent btn--lg btn--full mt-2">Criar conta →</button>
      </form>
      <p class="mono text-mute mt-6 normal-case leading-copy">Já tem conta? <a href="login.html?tipo=${tipo}" class="text-ink">Entrar →</a></p>
    </div>`;

  const form = screenEl.querySelector('[data-form-conta]');
  const nome = screenEl.querySelector('#c-nome');
  const email = screenEl.querySelector('#c-email');
  const senha = screenEl.querySelector('#c-senha');
  const senha2 = screenEl.querySelector('#c-senha2');
  Validation.bind(form, [
    { el: nome, validate: v => Validation.rules.required(v, 'Digite seu nome completo.') },
    { el: email, validate: v => Validation.rules.email(v) },
    { el: senha, validate: v => Validation.rules.strongPassword(v) },
    { el: senha2, validate: v => Validation.rules.match(v, senha.value, 'As senhas não conferem.'), dependsOn: senha },
  ], async () => {
    if (indisponivelGuard()) return;
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent; btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      // guarda a intenção (não-secreta) para rotear a conclusão profissional depois
      try { localStorage.setItem('po_intencao', tipo); } catch (e) {}
      const r = await PeneirasAuth.cadastrarConta({ nome: nome.value, email: email.value, senha: senha.value, papelSolicitado: tipo });
      if (!r.ok) { toast(r.erro || 'Não foi possível criar a conta.', { type: 'error', duration: 7000 }); return; }
      // Conta já nasce ativa (Confirm email desligado): segue direto pra conclusão.
      if (r.sessaoAtiva) {
        toast('Conta criada! Vamos concluir seu perfil.', { type: 'success' });
        location.replace('cadastro.html?fluxo=completar');
        return;
      }
      renderConfirmeEmail(email.value, r.provavelExistente);
    } catch (e) {
      toast('Falha de rede. Tente novamente.', { type: 'error' });
    } finally { btn.disabled = false; btn.textContent = orig; }
  });
}

function renderConfirmeEmail(email, provavelExistente) {
  screenEl.innerHTML = `
    <div class="cad-body w-full max-w-narrow my-0 mx-auto pt-10 pb-16 px-8">
      ${tagHTML('Confira seu e-mail', 'accent')}
      <h1 class="display text-fluid-sm mt-4 mb-3 mx-0">Confirme seu e-mail.</h1>
      <p class="text-16 leading-copy text-ink-soft max-w-copy-sm mt-0 mb-6 mx-0">
        Enviamos um link de confirmação para <strong>${esc(email)}</strong>. Abra o link para ativar sua conta e depois volte para entrar.
      </p>
      ${provavelExistente ? `<p class="mono py-3 px-3.5 bg-accent-soft border border-line-soft text-12 normal-case tracking-normal">Se você já tinha conta com esse e-mail, use <a href="login.html?tipo=${tipo}" class="text-ink">Entrar</a> ou <a href="recuperar.html" class="text-ink">Recuperar senha</a>.</p>` : ''}
      <div class="btn-row flex gap-2 flex-wrap mt-8">
        <a href="login.html?tipo=${tipo}" class="btn btn--accent btn--lg">Ir para o login →</a>
        <a href="index.html" class="btn btn--ghost btn--lg">Voltar à home</a>
      </div>
      <p class="mono text-mute mt-6 normal-case">Não recebeu? Verifique spam. O link expira conforme a configuração do provedor.</p>
    </div>`;
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------------ */
/* 2) CONCLUIR CADASTRO (guarded)                                     */
/* ------------------------------------------------------------------ */
async function iniciarConclusao() {
  if (indisponivelGuard()) { screenEl.innerHTML = mensagem('Configuração ausente. Tente mais tarde.'); return; }
  screenEl.innerHTML = mensagem('Validando sua sessão…');
  const conta = await PeneirasAuth.exigirAcesso({});
  if (!conta) return; // exigirAcesso já redirecionou

  // Olheiro/Academia: MVP sem aprovação — e-mail + senha bastam. Vão direto ao painel.
  if (conta.persona === 'olheiro' || conta.persona === 'academia') {
    try { localStorage.removeItem('po_intencao'); } catch (e) {}
    location.replace(PeneirasAuth.destinoPorPapel(conta));
    return;
  }
  // Jogador já concluído? Vai para a área certa.
  if (conta.atleta_id) { location.replace(PeneirasAuth.destinoPorPapel(conta)); return; }
  // Jogador: formulário de perfil (CPF + dados do futebol).
  renderConclusaoJogador(conta);
}

function renderConclusaoJogador(conta) {
  const form = { nome: conta.nome || '', cpf:'', dob:'', estado:'RJ', cidade:'', posicao:'', pe:'', altura:'', peso:'', clube:'', anos:'', telefone:'', respNome:'', respTel:'', consent:false };
  function idade() { const a = Validation.ageFromISO ? Validation.ageFromISO(form.dob) : null; return a; }
  function render() {
    const a = idade();
    const menor = a != null && a < 18;
    screenEl.innerHTML = `
      <div class="cad-body w-full max-w-narrow my-0 mx-auto pt-10 pb-24 px-8">
        <span class="kicker uppercase">Concluir cadastro · jogador</span>
        <h1 class="display text-fluid-sm mt-3 mb-3 mx-0">Complete seu perfil.</h1>
        <p class="text-15 leading-copy text-ink-soft max-w-copy-sm mb-8">Olá, ${esc(conta.nome||'')}. Faltam alguns dados para o seu perfil ficar completo. O CPF fica <strong>privado</strong> e vira também uma forma de login.</p>
        <form class="flex flex-col gap-5 max-w-copy" data-form-jog novalidate>
          ${fieldHTML('Nome completo', `<input class="input" id="j-nome" value="${esc(form.nome)}" autocomplete="name">`)}
          ${fieldHTML('CPF', `<input class="input" id="j-cpf" inputmode="numeric" placeholder="000.000.000-00" value="${esc(form.cpf)}">`,'11 dígitos — vira um identificador de login.')}
          ${fieldHTML('Data de nascimento', `<input class="input" type="date" id="j-dob" value="${esc(form.dob)}">`, a!=null? 'Você tem '+a+' anos' : '7 a 19 anos')}
          <div class="g g-2 gap-3">
            ${fieldHTML('Estado', `<select class="select" id="j-uf">${UFS.map(s=>`<option ${s===form.estado?'selected':''}>${s}</option>`).join('')}</select>`)}
            ${fieldHTML('Cidade', `<input class="input" id="j-cidade" value="${esc(form.cidade)}" placeholder="Sua cidade">`)}
          </div>
          ${fieldHTML('Posição principal', `<div class="g g-2 gap-2" id="j-pos">${POSICOES.map(p=>`<button type="button" class="choice ${form.posicao===p?'is-active':''}" data-pos="${p}">${p}</button>`).join('')}</div>`)}
          ${fieldHTML('Pé dominante', `<div class="flex gap-2" id="j-pe">${['Direito','Esquerdo','Ambidestro'].map(p=>`<button type="button" class="choice choice--accent ${form.pe===p?'is-active':''} flex-1 h-11" data-pe="${p}">${p}</button>`).join('')}</div>`, null, true)}
          <div class="g g-2 gap-3">
            ${fieldHTML('Altura (cm)', `<input class="input" id="j-alt" inputmode="numeric" value="${esc(form.altura)}" placeholder="ex.: 165">`,'',true)}
            ${fieldHTML('Peso (kg)', `<input class="input" id="j-peso" inputmode="numeric" value="${esc(form.peso)}" placeholder="ex.: 58">`,'',true)}
          </div>
          ${fieldHTML('Onde joga hoje', `<input class="input" id="j-clube" value="${esc(form.clube)}" placeholder="Escolinha ou clube">`,'',true)}
          ${fieldHTML('Tempo de prática (anos)', `<input class="input" id="j-anos" inputmode="numeric" value="${esc(form.anos)}" placeholder="ex.: 2">`,'',true)}
          ${fieldHTML('Telefone de contato', `<input class="input" id="j-tel" inputmode="tel" value="${esc(form.telefone)}" placeholder="(21) 9 9999-9999">`,'',true)}
          ${menor ? `
            <div class="pt-2 border-t border-t-line-soft"><div class="kicker uppercase mb-2">Responsável (menor de 18)</div></div>
            ${fieldHTML('Nome do responsável legal', `<input class="input" id="j-resp" value="${esc(form.respNome)}" placeholder="Nome completo do responsável">`)}
            ${fieldHTML('Celular do responsável', `<input class="input" id="j-resp-tel" inputmode="tel" value="${esc(form.respTel)}" placeholder="(21) 9 9999-9999">`)}
            <button type="button" id="j-consent" class="flex gap-3 items-start border border-ink p-4 cursor-pointer text-left ${form.consent?'bg-accent text-accent-ink':'bg-card text-ink'}">
              <span class="w-5.5 h-5.5 shrink-0 border-[1.5px] border-ink flex items-center justify-center font-display ${form.consent?'bg-ink text-accent':''}">${form.consent?'✓':''}</span>
              <span><span class="font-display font-extrabold text-13 uppercase">Aceito o termo de responsável</span><br><span class="text-12 leading-normal">Autorizo o tratamento dos dados do menor conforme LGPD/ECA.</span></span>
            </button>` : ''}
          <button type="submit" class="btn btn--accent btn--lg btn--full mt-2">Concluir cadastro →</button>
        </form>
      </div>`;

    // bind campos
    const bind = (id, key, digitsOnly, max) => { const e = screenEl.querySelector('#'+id); if (e) e.oninput = () => { let v = e.value; if (digitsOnly) { v = v.replace(/\D/g,'').slice(0, max||99); e.value = v; } form[key]=v; }; };
    bind('j-nome','nome'); bind('j-cpf','cpf',true,11); bind('j-cidade','cidade'); bind('j-alt','altura',true,3);
    bind('j-peso','peso',true,3); bind('j-clube','clube'); bind('j-anos','anos',true,2); bind('j-tel','telefone');
    const uf = screenEl.querySelector('#j-uf'); if (uf) uf.onchange = () => form.estado = uf.value;
    const dob = screenEl.querySelector('#j-dob'); if (dob) dob.onchange = () => { form.dob = dob.value; render(); };
    screenEl.querySelectorAll('[data-pos]').forEach(b => b.onclick = () => { form.posicao = b.dataset.pos; render(); });
    screenEl.querySelectorAll('[data-pe]').forEach(b => b.onclick = () => { form.pe = b.dataset.pe; render(); });
    if (menor) {
      bind('j-resp','respNome'); bind('j-resp-tel','respTel');
      const cons = screenEl.querySelector('#j-consent'); if (cons) cons.onclick = () => { form.consent = !form.consent; render(); };
    }

    const el = screenEl.querySelector('[data-form-jog]');
    const q = id => screenEl.querySelector('#'+id);
    const regras = [
      { el: q('j-nome'), validate: v => Validation.rules.required(v, 'Digite seu nome completo.') },
      { el: q('j-cpf'), validate: v => Validation.rules.cpf(v) },
      { el: q('j-dob'), validate: v => Validation.rules.ageRange(v, 7, 19) },
      { el: q('j-cidade'), validate: v => Validation.rules.required(v, 'Informe a cidade.') },
    ];
    if (menor) regras.push(
      { el: q('j-resp'), validate: v => Validation.rules.required(v, 'Informe o responsável.') },
      { el: q('j-resp-tel'), validate: v => Validation.rules.phone(v) });

    Validation.bind(el, regras.filter(r => r.el), async () => {
      if (!form.posicao) { toast('Escolha sua posição principal.', { type: 'error' }); return; }
      if (menor && !form.consent) { toast('Aceite o termo de responsável.', { type: 'error' }); return; }
      const btn = el.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = 'Concluindo…';
      try {
        const r = await PeneirasAuth.concluirCadastroJogador({
          nome: form.nome, cpf: form.cpf, nascimento: form.dob, estado: form.estado, cidade: form.cidade,
          posicao: form.posicao, pe: form.pe || null, altura: form.altura || null, peso: form.peso || null,
          clube: form.clube || null, anos_jogando: form.anos || null, contato_telefone: form.telefone || null,
          responsavel_nome: menor ? form.respNome : null, responsavel_telefone: menor ? form.respTel : null,
          consentimento: menor ? true : undefined, consentimento_versao: 'resp-v1',
        });
        if (!r.ok) {
          btn.disabled = false; btn.textContent = 'Concluir cadastro →';
          toast(r.mensagem || 'Não foi possível concluir. Revise os dados.', { type: 'error', duration: 7000 });
          return;
        }
        try { localStorage.removeItem('po_intencao'); } catch (e) {}
        toast('Cadastro concluído!', { type: 'success' });
        location.replace('atleta.html?tela=status');
      } catch (e) { btn.disabled = false; btn.textContent = 'Concluir cadastro →'; toast('Falha de rede.', { type: 'error' }); }
    });
  }
  render();
}

function mensagem(txt) {
  return `<div class="cad-body w-full max-w-narrow my-0 mx-auto pt-16 pb-16 px-8"><p class="text-16 text-ink-soft">${esc(txt)}</p></div>`;
}
