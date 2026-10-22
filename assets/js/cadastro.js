/* ============================================================
   PENEIRAS ON — Criar perfil (cadastro.html)
   Wizard de 5 passos, página pública. Veio de atleta.html?tela=cadastro:
   quem está criando conta não pode ver o shell da conta de outra pessoa.
   ============================================================ */
mountSimpleHeader('Criar perfil', 'index.html', 'Voltar à home', { cta: false });

const screenEl = document.querySelector('[data-screen]');
if (!screenEl) {
  throw new Error('cadastro.html está sem [data-screen]; o script não pode inicializar.');
}

// Alturas reais do cabeçalho e do bloco de score → variáveis CSS (sticky e
// scroll-padding acompanham o que está na tela, sem 65px chumbado).
const measure = 'ResizeObserver' in window ? new ResizeObserver(entries => {
  entries.forEach(en => {
    const key = en.target.classList.contains('site-header') ? '--header-h' : '--cad-head-h';
    // offsetHeight, não contentRect: a borda de 1px do cabeçalho conta
    document.documentElement.style.setProperty(key, en.target.offsetHeight + 'px');
  });
}) : null;
if (measure) measure.observe(document.querySelector('.site-header'));

// Ao focar por Tab, o Chromium ignora scroll-padding e deixa o campo parcialmente
// sob o bloco sticky ou a barra fixa. Corrige a rolagem só quando isso acontece.
screenEl.addEventListener('focusin', e => {
  const el = e.target;
  if (!el.getBoundingClientRect || el.closest('.cad-footer')) return;
  const r = el.getBoundingClientRect();
  const bar = screenEl.querySelector('.cad-footer');
  const head = screenEl.querySelector('.cad-head');
  const bottomLimit = (bar ? bar.getBoundingClientRect().top : innerHeight) - 16;
  const topLimit = (head && getComputedStyle(head).position === 'sticky' ? head.getBoundingClientRect().bottom : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0) + 16;
  // instantâneo: rolagem suave a cada Tab atrapalharia quem navega por teclado
  if (r.bottom > bottomLimit) window.scrollBy({ top: r.bottom - bottomLimit, behavior: 'instant' });
  else if (r.top < topLimit) window.scrollBy({ top: r.top - topLimit, behavior: 'instant' });
});
const params = new URLSearchParams(location.search);

// ?evento=<id> vindo de peneiras.html → login → aqui. Id inválido ou ausente
// cai no cadastro normal; o passo 2 então mostra a peneira mais próxima.
// Preenchidos quando os dados chegam (data.js → fetch), antes do 1º passo.
let evento = null, nearest = null;
// peneira escolhida cujas inscrições encerraram (o cronômetro do card pode ter
// zerado no caminho até aqui): a pessoa é avisada e segue no cadastro normal
let eventoEncerrado = null;

function renderCadastro() {
  const STEPS = ['Identificação','Origem','Futebol','Mídias','Responsável'];
  const form = { name:'',dob:'',cpf:'',state:'RJ',city:'',position:'',foot:'',height:'',weight:'',club:'',years:'',videos:'',photo:false,consent:false,responsible:'',responsiblePhone:'' };
  let step = 1;
  let fotoPreview = null;   // dataURL da prévia (foto.js); nunca sai desta página
  const FOTO_ALT = 'Pré-visualização da sua foto de rosto';

  function score() {
    let s=0;
    if(form.name)s+=8; if(form.dob)s+=8; if(form.cpf.length>=11)s+=10;
    if(form.state&&form.city)s+=8; if(form.position)s+=10; if(form.foot)s+=4;
    if(form.height)s+=4; if(form.weight)s+=4; if(form.club)s+=6; if(form.years)s+=4;
    if(form.videos)s+=18; if(form.photo)s+=8; if(form.consent)s+=8;
    return Math.min(100,s);
  }
  function age() {
    if(!form.dob) return null;
    const d=new Date(form.dob), now=new Date();
    let a=now.getFullYear()-d.getFullYear();
    const m=now.getMonth()-d.getMonth();
    if(m<0||(m===0&&now.getDate()<d.getDate()))a--;
    return isNaN(a)?null:a;
  }

  /* Bloco do score — montado uma vez por passo; a cada tecla só a largura da
     barra, o número e o rótulo mudam (paintScore), sem recriar elementos: é o
     que deixa a barra deslizar em vez de pular. Um segundo de percurso: rápido
     o bastante para acompanhar a digitação, lento o bastante para se ver. */
  function scoreBlockHTML() {
    return `${progressHTML(0,100,{label:'Score de completude',sublabel:'0%'})}
          <div class="font-mono text-10 text-ink-mute flex justify-between">
            <span>0 → 100% · cada campo adicional sobe seu score</span>
            <span data-score-tier></span>
          </div>`;
  }
  let shownScore = 0;   // último valor exibido — ponto de partida da animação
  function paintScore() {
    const sc = score();
    const host = screenEl.querySelector('[data-score]'); if (!host) return;
    const fill = host.querySelector('.progress__fill');
    const num = host.querySelector('.progress-head .font-display');
    const tier = host.querySelector('[data-score-tier]');
    fill.classList.add('progress__fill--live');
    // barra: parte de onde estava (mesmo depois de trocar de passo) e desliza até o novo valor
    fill.style.width = shownScore + '%';
    void fill.offsetWidth;                       // força o layout antes de trocar o destino
    fill.style.width = sc + '%';
    // número: conta do valor anterior até o novo, acompanhando a barra
    const from = shownScore, to = sc, t0 = performance.now(), dur = 1000;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (function tick(now) {
      const t = reduced ? 1 : Math.min(1, (now - t0) / dur);
      num.textContent = Math.round(from + (to - from) * ease(t)) + '%';
      if (t < 1) requestAnimationFrame(tick);
    })(t0);
    tier.className = sc >= 60 ? 'text-success' : 'text-ink-mute';
    tier.textContent = sc >= 80 ? '◆ alto' : sc >= 60 ? '◐ bom' : '○ inicial';
    shownScore = sc;
  }

  function render() {
    const a = age();
    const bad = a!=null&&(a<7||a>19), needs = a!=null&&a<18;
    screenEl.innerHTML = `
      <div class="cad-head" data-cad-head>
        <div class="max-w-narrow my-0 mx-auto py-5 px-8 flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <span class="kicker uppercase">${evento ? 'Inscrição · ' + eventShortName(evento) : 'Criar perfil gratuito'}</span>
            ${tagHTML('PASSO '+step+'/5 · '+STEPS[step-1],'outline')}
          </div>
          ${evento ? `<p class="mono m-0 py-2.5 px-3.5 bg-accent-soft border border-line-soft text-12 normal-case tracking-normal" data-event-context>Você está se inscrevendo em ${esc(evento.name)} · ${fmtDotDate(evento.date, 'full')}</p>` : ''}
          ${eventoEncerrado && step === 1 ? `<p class="mono m-0 py-2.5 px-3.5 bg-bg-alt border border-line text-12 normal-case tracking-normal" data-event-closed>As inscrições para ${esc(eventoEncerrado.name)} encerraram. Seu cadastro segue normalmente e a equipe indica a peneira mais próxima com vaga.</p>` : ''}
          <div data-score>${scoreBlockHTML()}</div>
        </div>
      </div>

      <div class="cad-body w-full max-w-narrow my-0 mx-auto pt-10 pb-30 px-8">
        <h1 class="display text-fluid-sm mt-0 mb-8 mx-0">${stepTitle()}</h1>
        <div class="flex flex-col gap-5 max-w-copy">${stepFields()}</div>
        <p class="font-mono text-11 leading-relaxed text-ink-mute max-w-copy mt-8 mb-0" data-triagem>◆ Quem analisa sua inscrição é uma pessoa da nossa equipe, não um sistema automático. A resposta sai em até ${Envio.PRAZO_DIAS_UTEIS} dias úteis.</p>
      </div>

      <div class="cad-footer">
        <div class="max-w-narrow my-0 mx-auto flex gap-3 items-center">
          <span class="mono text-mute">${STEPS[step-1]} · ${step}/5</span>
          <div class="ml-auto flex gap-2">
            ${step>1?`<button class="btn btn--ghost" id="back">← Voltar</button>`:''}
            ${step<5?`<button class="btn btn--primary" id="next">Próximo passo →</button>`:''}
            ${step===5?`<button class="btn btn--accent" id="finish">✓ Confirmar inscrição</button>`:''}
          </div>
        </div>
      </div>`;

    bindFields();
    paintScore();
    if (measure) measure.observe(screenEl.querySelector('[data-cad-head]'));
    const back=screenEl.querySelector('#back'), next=screenEl.querySelector('#next'), finish=screenEl.querySelector('#finish');
    if(back) back.onclick=()=>{ step--; render(); };
    // Regras do passo (validation.js): erro aparece no blur ou na tentativa de
    // avançar; aí o foco vai para o primeiro campo inválido. Grupos de botões
    // (posição, pé, termo) validam pelo estado do formulário.
    const q = id => screenEl.querySelector('#' + id);
    const R = Validation.rules;
    const stepRules = {
      1: [{ el: q('f-name'), validate: v => R.required(v, 'Digite seu nome completo.') },
          { el: q('f-dob'), validate: v => R.ageRange(v, 7, 19) },
          { el: q('f-cpf'), validate: v => R.cpf(v) }],
      2: [{ el: q('f-city'), validate: v => R.required(v, 'Informe a cidade onde você mora.') }],
      3: [{ el: q('f-pos'), validate: () => form.position ? '' : 'Escolha sua posição principal.' },
          { el: q('f-foot'), validate: () => form.foot ? '' : 'Escolha o pé dominante.' }],
      4: [],
      5: needs ? [{ el: q('f-resp'), validate: v => R.required(v, 'Informe o nome completo do responsável legal.') },
                  { el: q('f-resp-phone'), validate: v => R.phone(v) },
                  { el: q('f-consent'), validate: () => form.consent ? '' : 'Aceite o termo de responsável para continuar.' }] : [],
    };
    const validator = Validation.bind(null, (stepRules[step] || []).filter(f => f.el));
    if(next) next.onclick=()=>{ if (validator.validateAll(true)) { step++; render(); } };
    // Envia para a planilha da equipe (envio.js). Estado de carregando (ui.js):
    // o <main> fica aria-busy, a frase vai para a região aria-live e os dois
    // botões travam — um clique duplo geraria duas inscrições. A rede de evento
    // é lenta (o envio espera até 15 s), então a espera é real e precisa aparecer.
    if(finish) finish.onclick=async()=>{
      if (!validator.validateAll(true)) return;
      const restore = UI.busyButton(finish, 'Enviando…');
      const done = UI.busy(screenEl, 'Enviando sua inscrição para a equipe. Aguarde.', { controls: [back] });
      const resultado = await Envio.enviar(form, evento);
      done();
      restore();
      renderDone(resultado);
    };

    function stepTitle() {
      return ['Quem é você?','De onde vem<br>o futebol?','Como você joga?','Mostre o seu jogo.','Falta só o responsável.'][step-1];
    }
    function stepFields() {
      if(step===1) return `
        ${field('Nome completo',`<input class="input" id="f-name" placeholder="Seu nome completo" value="${esc(form.name)}">`)}
        ${field('Data de nascimento',`<input class="input" type="date" id="f-dob" value="${esc(form.dob)}">`, a!=null&&!bad?'Você tem '+a+' anos':'')}
        ${field('CPF',`<input class="input" id="f-cpf" inputmode="numeric" placeholder="000.000.000-00" value="${esc(form.cpf)}">`,'11 dígitos, só números')}`;
      if(step===2) return `
        ${field('Estado',`<select class="select" id="f-state">${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(s=>`<option ${s===form.state?'selected':''}>${s}</option>`).join('')}</select>`)}
        ${field('Cidade',`<input class="input" id="f-city" placeholder="Sua cidade" value="${esc(form.city)}">`)}
        <div class="bg-bg-alt p-4 border border-line-soft">
          <div class="kicker uppercase mb-1.5">${evento ? 'Peneira escolhida' : 'Peneira mais próxima'}</div>
          <div class="flex items-baseline justify-between"><span class="display text-18">${eventShortName(nearest)}</span><span class="font-mono text-12">${fmtDotDate(nearest.date)}</span></div>
          <div class="mt-1 font-mono text-11 text-ink-soft">${nearest.city}/${nearest.state}${evento ? '' : ' · a equipe confirma sua peneira na análise'}</div>
        </div>`;
      if(step===3) return `
        ${field('Posição principal',`<div class="g g-2 gap-2" id="f-pos">${['Goleiro','Zagueiro','Lateral','Volante','Meia','Ponta','Atacante'].map(p=>`<button type="button" class="choice ${form.position===p?'is-active':''}" data-pos="${p}">${p}</button>`).join('')}</div>`)}
        ${field('Pé dominante',`<div class="flex gap-2" id="f-foot">${['Direito','Esquerdo','Ambidestro'].map(p=>`<button type="button" class="choice choice--accent ${form.foot===p?'is-active':''} flex-1 h-11" data-foot="${p}">${p}</button>`).join('')}</div>`)}
        <div class="g g-2 gap-3">
          ${field('Altura (cm)',`<input class="input" id="f-h" inputmode="numeric" placeholder="ex.: 165" value="${esc(form.height)}">`,'',null,true)}
          ${field('Peso (kg)',`<input class="input" id="f-w" inputmode="numeric" placeholder="ex.: 58" value="${esc(form.weight)}">`,'',null,true)}
        </div>
        ${field('Onde joga hoje',`<input class="input" id="f-club" placeholder="Nome da escolinha ou clube" value="${esc(form.club)}">`,'',null,true)}
        ${field('Tempo de prática (anos)',`<input class="input" id="f-years" inputmode="numeric" placeholder="ex.: 2" value="${esc(form.years)}">`,'',null,true)}`;
      if(step===4) return `
        <div class="bg-accent text-accent-ink p-4 border border-accent flex items-center gap-3">
          <span class="display text-36">+25</span>
          <div><div class="font-display font-extrabold text-14 uppercase">Vídeos aumentam seu score</div><div class="font-mono text-11">até 25 pontos no ranking do olheiro</div></div>
        </div>
        ${field('Link do Instagram com vídeos',`<input class="input" id="f-videos" placeholder="instagram.com/seu.usuario" value="${esc(form.videos)}">`,'@usuario ou link direto',null,true)}
        ${Foto.campoHTML({ id: 'f-photo', rotulo: 'Foto de rosto', opcional: true, previa: fotoPreview, alt: FOTO_ALT })}`;
      // step 5
      if(needs) return `
        ${field('Nome do responsável legal',`<input class="input" id="f-resp" placeholder="Nome completo do responsável" value="${esc(form.responsible)}">`)}
        ${field('Celular do responsável',`<input class="input" id="f-resp-phone" inputmode="tel" placeholder="(21) 9 9999-9999" value="${esc(form.responsiblePhone)}">`,'Receberá SMS de confirmação')}
        <button type="button" id="f-consent" class="flex gap-3 items-start border border-line p-4 cursor-pointer text-left ${form.consent?'bg-accent text-accent-ink':'bg-card text-ink'}">
          <span class="w-5.5 h-5.5 shrink-0 border-[1.5px] border-ink flex items-center justify-center text-accent font-display ${form.consent?'bg-ink':'bg-transparent'}">${form.consent?'✓':''}</span>
          <span><span class="font-display font-extrabold text-13 uppercase">Aceito o termo de responsável</span><br><span class="text-12 leading-normal">Autorizo a participação do menor na peneira e o tratamento dos dados conforme LGPD/ECA.</span></span>
        </button>`;
      return `<div class="p-6 bg-accent text-accent-ink border border-accent"><div class="display text-24">Você é maior.</div><div class="text-13 mt-2">Sem necessidade de responsável. Confirme sua inscrição.</div></div>`;
    }
  }

  /* <label> só quando o controle é um campo de texto/select. Com um grupo de
     botões dentro, o navegador associa o rótulo ao PRIMEIRO botão: passar o
     mouse em "Esquerdo" acendia o :hover de "Direito", e um clique na área vazia
     do rótulo disparava o primeiro botão. Grupos viram <div role="group">. */
  function field(label, control, hint, error, optional) {
    const ctrl = error ? control.replace(/<(input|select|textarea)\b/, '<$1 aria-invalid="true"') : control;
    const single = /^\s*<(input|select|textarea)\b/.test(control);
    const tag = single ? 'label' : 'div';
    const id = 'lbl-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const attrs = single ? '' : ` role="group" aria-labelledby="${id}"`;
    return `<${tag} class="field"${attrs}><div class="field__label"><span id="${id}">${label}</span>${optional?'<span class="field__optional">opcional</span>':''}</div>${ctrl}${hint?`<span class="field__hint">${hint}</span>`:''}${error?`<span class="field__error" role="alert">${error}</span>`:''}</${tag}>`;
  }

  function bindFields() {
    const n=screenEl.querySelector('#f-name'); if(n) n.oninput=()=>{ form.name=n.value; updateLive(); };
    const dob=screenEl.querySelector('#f-dob'); if(dob) dob.oninput=()=>{ form.dob=dob.value; updateLive(); paintDobHint(dob); };
    const cpf=screenEl.querySelector('#f-cpf'); if(cpf) cpf.oninput=()=>{ form.cpf=cpf.value.replace(/\D/g,'').slice(0,11); cpf.value=form.cpf; updateLive(); };
    const st=screenEl.querySelector('#f-state'); if(st) st.onchange=()=>{ form.state=st.value; updateLive(); };
    const city=screenEl.querySelector('#f-city'); if(city) city.oninput=()=>{ form.city=city.value; updateLive(); };
    screenEl.querySelectorAll('[data-pos]').forEach(b=>b.onclick=()=>{ form.position=b.dataset.pos; render(); });
    screenEl.querySelectorAll('[data-foot]').forEach(b=>b.onclick=()=>{ form.foot=b.dataset.foot; render(); });
    ['f-h:height','f-w:weight','f-club:club','f-years:years','f-videos:videos','f-resp:responsible','f-resp-phone:responsiblePhone'].forEach(pair=>{
      const [id,key]=pair.split(':'); const e=screenEl.querySelector('#'+id);
      if(e) e.oninput=()=>{ form[key]=e.value; updateLive(); };
    });
    // FileReader (foto.js): prévia na hora, sem servidor. Para a planilha vai
    // só "foto: S/N" — a imagem fica nesta página (contrato em python/CONTRATO.md).
    Foto.ligar(screenEl, { id: 'f-photo', alt: FOTO_ALT, aoMudar: url => { fotoPreview = url; form.photo = !!url; updateLive(); } });
    const cons=screenEl.querySelector('#f-consent'); if(cons) cons.onclick=()=>{ form.consent=!form.consent; render(); };
  }
  /* ---------- Confirmação (MVP concierge) ----------
     O envio grava uma linha na planilha; quem lê, confere e responde é uma
     pessoa da equipe (CLI em Python). A tela diz exatamente isso:
       1. o que acabou de acontecer, em uma frase;
       2. o que vem a seguir e em quanto tempo — em dias úteis, com a data;
       3. por onde a pessoa será procurada;
       4. o que fazer se não houver retorno;
       5. o código da inscrição (gerado em envio.js), para guardar.
     Se o envio caiu na fila offline, a tela NÃO finge que chegou: diz que
     está guardado no aparelho, que o prazo só começa quando chegar, e troca
     sozinha para a versão "recebida" quando o reenvio der certo. */
  function renderDone(envio) {
    const sc = score();
    const codigo = envio.codigo;
    const naFila = envio.situacao !== 'enviado';
    const prazo = Envio.PRAZO_DIAS_UTEIS;
    const ate = fmtDiaUtil(addDiasUteis(new Date(), prazo));
    const menor = !!form.responsible;
    const fimTel = form.responsiblePhone.replace(/\D/g, '').slice(-4);
    const peneira = evento ? `${esc(evento.name)} (${fmtDotDate(evento.date, 'full')})` : '';

    const contato = menor
      ? `No celular do responsável, ${esc(form.responsible.split(' ')[0])}, terminado em <strong>${fimTel}</strong>. É também por ele que chega a convocação, com local e horário.`
      : `Para quem tem 18 anos ou mais este cadastro ainda não pede telefone, então a equipe não tem como avisar você sozinha. Depois do prazo, procure a equipe pelo <a href="sobre.html#contato" class="text-ink underline underline-offset-3">Fale com a gente</a> informando o código abaixo.`;

    // cada passo: [rótulo, título, texto]
    const passos = naFila ? [
      ['Agora', 'Guardada neste aparelho', 'Ela ainda não chegou à equipe. O envio é automático assim que a internet voltar: basta abrir o site de novo neste mesmo navegador. Se limpar os dados do navegador antes disso, ela se perde.'],
      ['Prazo', `${prazo} dias úteis a partir do envio`, 'O prazo só começa a contar quando a inscrição chegar à equipe. Esta tela muda sozinha quando isso acontecer.'],
      ['Contato', 'Depois que chegar', contato],
      ['Sem retorno?', 'Fale com a equipe', 'Se a conexão voltou e nada mudou aqui, use o botão "Tentar enviar agora". Não preencha de novo: isso criaria uma inscrição duplicada.'],
    ] : [
      ['Análise', 'Uma pessoa da equipe confere seus dados', `Não é um sistema automático: alguém da Peneiras On lê cada inscrição${evento ? ', confirma sua vaga na peneira escolhida' : ', escolhe a peneira mais próxima com vaga'} e calcula seu ranking.`],
      ['Prazo', `Até ${prazo} dias úteis · ${ate}`, 'Dias úteis contam de segunda a sexta; feriados podem somar um dia.'],
      ['Contato', menor ? 'Por SMS' : 'Você procura a equipe', contato],
      ['Sem retorno?', `Se nada chegar até ${ate}`, `Escreva pelo <a href="sobre.html#contato" class="text-ink underline underline-offset-3">Fale com a gente</a> com o código abaixo. Não se inscreva de novo: isso criaria uma inscrição duplicada e atrasaria a análise.`],
    ];

    document.documentElement.style.setProperty('--cad-head-h', '0px');
    screenEl.innerHTML = `
      <div class="cad-body w-full max-w-narrow my-0 mx-auto pt-10 pb-16 px-8" data-done>
        ${naFila ? tagHTML('⏸ Guardada no aparelho', 'outline') : tagHTML('✓ Inscrição recebida', 'success')}
        <h1 class="display text-fluid-sm mt-4 mb-3 mx-0" tabindex="-1" data-done-title>${naFila ? 'Sua inscrição<br>ainda não foi enviada.' : 'Recebemos sua<br>inscrição.'}</h1>
        <p class="lead max-w-copy-sm mt-0 mb-8 mx-0">${naFila
          ? 'A internet caiu na hora do envio: seus dados ficaram guardados neste aparelho e seguem para a equipe sozinhos quando a conexão voltar.'
          : `Ela já está na fila da nossa equipe${peneira ? ` para a ${peneira}` : ''}.`}</p>

        <div class="g g-main gap-6 items-start">
          <section class="card p-6" aria-labelledby="done-next">
            <h2 class="section-label m-0 mb-1" id="done-next"><span class="section-label__title">O que acontece agora</span></h2>
            <ol class="list-none m-0 p-0">
              ${passos.map((p, i) => `<li class="g g-label gap-x-4 gap-y-1 py-4 ${i ? 'border-t border-line-soft' : ''}">
                <span class="font-mono text-10 uppercase tracking-kicker text-ink-mute pt-0.5">${p[0]}</span>
                <div><div class="font-display font-extrabold text-15 uppercase tracking-display-sm">${p[1]}</div><p class="text-14 leading-copy text-ink-soft mt-1 mb-0">${p[2]}</p></div>
              </li>`).join('')}
            </ol>
            ${naFila ? `<div class="mt-2 pt-4 border-t border-line-soft flex items-center gap-3 flex-wrap" data-fila>
              <button type="button" class="btn btn--primary btn--sm" data-reenviar>Tentar enviar agora</button>
              <span class="font-mono text-11 text-ink-mute" data-fila-status>${navigator.onLine === false ? 'Sem conexão neste momento.' : ''}</span>
            </div>` : ''}
          </section>

          <div class="flex flex-col gap-4">
            <section class="card p-6" aria-labelledby="done-code">
              <div class="kicker uppercase" id="done-code">Código da inscrição</div>
              <p class="font-mono text-15 font-semibold text-ink break-all mt-2 mb-0 select-all" data-codigo>${esc(codigo)}</p>
              <p class="text-13 leading-copy text-ink-soft mt-3 mb-4">Anote ou copie. É por ele que a equipe encontra sua inscrição sem precisar do seu CPF. Se pedirem, os 8 primeiros caracteres bastam: <strong class="font-mono text-ink">${esc(codigo.slice(0, 8).toUpperCase())}</strong>.</p>
              <button type="button" class="btn btn--ghost btn--sm" data-copiar>Copiar código</button>
            </section>
            <section class="card p-6" aria-label="Score de completude">
              ${progressHTML(sc, 100, { sm: true, label: 'Score de completude', sublabel: sc + '%' })}
              <div class="font-mono text-10 text-ink-mute mt-2">Perfil mais completo, ranking melhor. Vídeos e foto contam pontos.</div>
            </section>
          </div>
        </div>

        <div class="btn-row btn-row--even gap-2 mt-8 max-w-form">
          <a href="peneiras.html" class="btn btn--accent btn--lg">Ver outras peneiras →</a>
          <a href="index.html" class="btn btn--ghost btn--lg">Voltar ao início</a>
        </div>
      </div>`;

    const title = screenEl.querySelector('[data-done-title]');
    window.scrollTo(0, 0);
    title.focus({ preventScroll: true });
    if (naFila) toast('Sem conexão: a inscrição ficou guardada neste aparelho e será enviada quando a internet voltar.', { type: 'info', duration: 8000 });
    else toast(`Inscrição recebida. Resposta da equipe em até ${prazo} dias úteis.`, { type: 'success', duration: 6000 });

    // Copiar: Clipboard API quando há contexto seguro; senão, seleciona o texto
    // (o select-all também ajuda quem toca no código no celular).
    screenEl.querySelector('[data-copiar]').onclick = async () => {
      try {
        await navigator.clipboard.writeText(codigo);
        toast('Código copiado.', { type: 'success' });
      } catch (e) {
        const sel = getSelection(), range = document.createRange();
        range.selectNodeContents(screenEl.querySelector('[data-codigo]'));
        sel.removeAllRanges(); sel.addRange(range);
        toast('Não deu para copiar sozinho: o código ficou selecionado, use Ctrl+C.', { type: 'info' });
      }
    };

    if (!naFila) return;
    // Fila offline: quando o envio.js conseguir mandar ESTA inscrição, a tela
    // vira a confirmação de recebida — sem recarregar e sem fingir antes.
    const onFila = e => {
      if (!e.detail.enviados.includes(codigo)) return;
      window.removeEventListener('peneiras:fila', onFila);
      renderDone({ situacao: 'enviado', codigo });
    };
    window.addEventListener('peneiras:fila', onFila);
    const retry = screenEl.querySelector('[data-reenviar]');
    const status = screenEl.querySelector('[data-fila-status]');
    retry.onclick = async () => {
      const restore = UI.busyButton(retry, 'Enviando…');
      const done = UI.busy(screenEl.querySelector('[data-fila]'), 'Tentando enviar a inscrição guardada.');
      const r = await Envio.reenviarAgora();
      if (r.enviados.includes(codigo)) return;   // onFila já redesenhou a tela
      done('Ainda sem conexão. A inscrição continua guardada neste aparelho.');
      restore();
      status.textContent = 'Ainda sem conexão. Continua guardada; tentamos de novo sozinhos quando a internet voltar.';
    };
  }

  /* Prazo em dias úteis: pula sábado e domingo (feriados não entram — a tela
     avisa). Exibido como "quinta-feira, 23/10". */
  function addDiasUteis(data, n) {
    const d = new Date(data);
    while (n > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) n--;
    }
    return d;
  }
  function fmtDiaUtil(d) {
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  }

  /* Idade calculada sem redesenhar o passo: redesenhar recriava o <input type="date">
     e derrubava o foco no meio da digitação por teclado (o Chromium dispara o
     evento a cada segmento dia/mês/ano). Só a dica e o erro são trocados. */
  function paintDobHint(dob) {
    const wrap = dob.closest('.field'); if (!wrap) return;
    const a = age(), bad = a != null && (a < 7 || a > 19);
    wrap.querySelectorAll('.field__hint').forEach(e => e.remove());
    // o erro de faixa etária é responsabilidade do validation.js (blur / tentativa)
    if (a != null && !bad) wrap.insertAdjacentHTML('beforeend', `<span class="field__hint">Você tem ${a} anos</span>`);
  }

  /* Atualiza o que muda a cada tecla sem recriar os campos:
     estado dos botões e a barra de score. */
  function updateLive() { paintScore(); }

  render();
}

Dados.iniciar(() => {
  const pedido = MOCK.EVENTS.find(e => e.id === params.get('evento')) || null;
  if (pedido && eventStatus(pedido) === 'encerrada') eventoEncerrado = pedido;
  else evento = pedido;
  nearest = evento || MOCK.SEASON.nextEvent;
  renderCadastro();
}, {
  vitrine: screenEl,
  mensagem: 'Preparando o formulário…',
  erro: 'O formulário de inscrição não carregou.',
});
