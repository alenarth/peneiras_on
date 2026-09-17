/* ============================================================
   PENEIRAS ON — Criar perfil (cadastro.html)
   Wizard de 5 passos, página pública. Veio de atleta.html?tela=cadastro:
   quem está criando conta não pode ver o shell da conta de outra pessoa.
   ============================================================ */
mountSimpleHeader('Criar perfil', 'index.html', 'Voltar à home', { cta: false });

const screenEl = document.querySelector('[data-screen]');

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
const evento = MOCK.EVENTS.find(e => e.id === params.get('evento')) || null;
const nearest = evento || MOCK.SEASON.nextEvent;

function renderCadastro() {
  const STEPS = ['Identificação','Origem','Futebol','Mídias','Responsável'];
  const form = { name:'',dob:'',cpf:'',state:'RJ',city:'',position:'',foot:'',height:'',weight:'',club:'',years:'',videos:'',photo:false,consent:false,responsible:'',responsiblePhone:'' };
  let step = 1;

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
  function valid() {
    const a=age(), bad=a!=null&&(a<7||a>19), needs=a!=null&&a<18;
    return { 1: form.name&&form.dob&&!bad&&form.cpf.length===11, 2: form.state&&form.city, 3: form.position&&form.foot, 4: true, 5: needs?(form.consent&&form.responsible&&form.responsiblePhone.replace(/\D/g,'').length>=10):true };
  }

  /* Bloco do score — redesenhado a cada tecla, não só a cada troca de passo. */
  function scoreBlockHTML() {
    const sc = score();
    return `${progressHTML(sc,100,{label:'Score de completude',sublabel:sc+'%'})}
          <div class="font-mono text-10 text-ink-mute flex justify-between">
            <span>0 → 100% · cada campo adicional sobe seu score</span>
            <span class="${sc>=60?'text-success':'text-ink-mute'}">${sc>=80?'◆ alto':sc>=60?'◐ bom':'○ inicial'}</span>
          </div>`;
  }

  function render() {
    const a = age();
    const bad = a!=null&&(a<7||a>19), needs = a!=null&&a<18;
    const v = valid();
    screenEl.innerHTML = `
      <div class="cad-head" data-cad-head>
        <div class="max-w-narrow my-0 mx-auto py-5 px-8 flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <span class="kicker uppercase">${evento ? 'Inscrição · ' + eventShortName(evento) : 'Criar perfil gratuito'}</span>
            ${tagHTML('PASSO '+step+'/5 · '+STEPS[step-1],'outline')}
          </div>
          ${evento ? `<p class="mono m-0 py-2.5 px-3.5 bg-accent-soft border border-line-soft text-12 normal-case tracking-normal" data-event-context>Você está se inscrevendo em ${esc(evento.name)} · ${fmtDotDate(evento.date, 'full')}</p>` : ''}
          <div data-score>${scoreBlockHTML()}</div>
        </div>
      </div>

      <div class="cad-body w-full max-w-narrow my-0 mx-auto pt-10 pb-30 px-8">
        <h1 class="display text-fluid-sm mt-0 mb-8 mx-0">${stepTitle()}</h1>
        <div class="flex flex-col gap-5 max-w-copy">${stepFields()}</div>
      </div>

      <div class="cad-footer">
        <div class="max-w-narrow my-0 mx-auto flex gap-3 items-center">
          <span class="mono text-mute">${STEPS[step-1]} · ${step}/5</span>
          <div class="ml-auto flex gap-2">
            ${step>1?`<button class="btn btn--ghost" id="back">← Voltar</button>`:''}
            ${step<5?`<button class="btn btn--primary" id="next" ${v[step]?'':'disabled'}>Próximo passo →</button>`:''}
            ${step===5?`<button class="btn btn--accent" id="finish" ${v[5]?'':'disabled'}>✓ Confirmar inscrição</button>`:''}
          </div>
        </div>
      </div>`;

    bindFields();
    if (measure) measure.observe(screenEl.querySelector('[data-cad-head]'));
    const back=screenEl.querySelector('#back'), next=screenEl.querySelector('#next'), finish=screenEl.querySelector('#finish');
    if(back) back.onclick=()=>{ step--; render(); };
    if(next) next.onclick=()=>{ step++; render(); };
    if(finish) finish.onclick=()=>{ renderDone(); };

    function stepTitle() {
      return ['Quem é você?','De onde vem<br>o futebol?','Como você joga?','Mostre o seu jogo.','Falta só o responsável.'][step-1];
    }
    function stepFields() {
      if(step===1) return `
        ${field('Nome completo',`<input class="input" id="f-name" placeholder="Seu nome completo" value="${esc(form.name)}">`)}
        ${field('Data de nascimento',`<input class="input" type="date" id="f-dob" value="${esc(form.dob)}">`, a!=null?(bad?'':'Você tem '+a+' anos'):'', bad?'Idade fora da faixa permitida (07–19)':'')}
        ${field('CPF',`<input class="input" id="f-cpf" inputmode="numeric" placeholder="000.000.000-00" value="${esc(form.cpf)}">`,'11 dígitos, só números')}`;
      if(step===2) return `
        ${field('Estado',`<select class="select" id="f-state">${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(s=>`<option ${s===form.state?'selected':''}>${s}</option>`).join('')}</select>`)}
        ${field('Cidade',`<input class="input" id="f-city" placeholder="Sua cidade" value="${esc(form.city)}">`)}
        <div class="bg-bg-alt p-4 border border-line-soft">
          <div class="kicker uppercase mb-1.5">${evento ? 'Peneira escolhida' : 'Peneira mais próxima'}</div>
          <div class="flex items-baseline justify-between"><span class="display text-18">${eventShortName(nearest)}</span><span class="font-mono text-12">${fmtDotDate(nearest.date)}</span></div>
          <div class="mt-1 font-mono text-11 text-ink-soft">${evento ? nearest.city + '/' + nearest.state : '0 km de você · alocação automática'}</div>
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
        <div class="bg-accent text-accent-ink p-4 border border-ink flex items-center gap-3">
          <span class="display text-36">+25</span>
          <div><div class="font-display font-extrabold text-14 uppercase">Vídeos aumentam seu score</div><div class="font-mono text-11">até 25 pontos no ranking do olheiro</div></div>
        </div>
        ${field('Link do Instagram com vídeos',`<input class="input" id="f-videos" placeholder="instagram.com/seu.usuario" value="${esc(form.videos)}">`,'@usuario ou link direto',null,true)}
        ${field('Foto de rosto',`<button type="button" id="f-photo" class="h-30 w-full bg-bg-alt border border-dashed border-ink cursor-pointer flex flex-col items-center justify-center gap-1.5 text-ink">${form.photo?'<span class="display text-20">✓ Foto adicionada</span><span class="font-mono text-11 text-ink-soft">clique para remover</span>':'<span class="display text-20">+ enviar</span><span class="font-mono text-11 text-ink-soft">jpg, png · até 5MB</span>'}</button>`,'',null,true)}`;
      // step 5
      if(needs) return `
        ${field('Nome do responsável legal',`<input class="input" id="f-resp" placeholder="Nome completo do responsável" value="${esc(form.responsible)}">`)}
        ${field('Celular do responsável',`<input class="input" id="f-resp-phone" inputmode="tel" placeholder="(21) 9 9999-9999" value="${esc(form.responsiblePhone)}">`,'Receberá SMS de confirmação')}
        <button type="button" id="f-consent" class="flex gap-3 items-start border border-ink p-4 cursor-pointer text-left ${form.consent?'bg-accent text-accent-ink':'bg-card text-ink'}">
          <span class="w-5.5 h-5.5 shrink-0 border-[1.5px] border-ink flex items-center justify-center text-accent font-display ${form.consent?'bg-ink':'bg-transparent'}">${form.consent?'✓':''}</span>
          <span><span class="font-display font-extrabold text-13 uppercase">Aceito o termo de responsável</span><br><span class="text-12 leading-normal">Autorizo a participação do menor na peneira e o tratamento dos dados conforme LGPD/ECA.</span></span>
        </button>`;
      return `<div class="p-6 bg-accent text-accent-ink border border-ink"><div class="display text-24">Você é maior.</div><div class="text-13 mt-2">Sem necessidade de responsável. Confirme sua inscrição.</div></div>`;
    }
  }

  function field(label, control, hint, error, optional) {
    const ctrl = error ? control.replace(/<(input|select|textarea)\b/, '<$1 aria-invalid="true"') : control;
    return `<label class="field"><div class="field__label"><span>${label}</span>${optional?'<span class="field__optional">opcional</span>':''}</div>${ctrl}${hint?`<span class="field__hint">${hint}</span>`:''}${error?`<span class="field__error" role="alert">${error}</span>`:''}</label>`;
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
    const photo=screenEl.querySelector('#f-photo'); if(photo) photo.onclick=()=>{ form.photo=!form.photo; render(); };
    const cons=screenEl.querySelector('#f-consent'); if(cons) cons.onclick=()=>{ form.consent=!form.consent; render(); };
  }
  /* Conclusão: confirma antes de mandar para o login — sem isto a pessoa
     preenchia cinco passos e caía num formulário de entrada, como se tivesse
     dado errado. Sem bloco sticky nem barra fixa. */
  function renderDone() {
    const sc = score();
    const loginHref = 'login.html?tipo=jogador' + (evento ? '&evento=' + encodeURIComponent(evento.id) : '');
    document.documentElement.style.setProperty('--cad-head-h', '0px');
    screenEl.innerHTML = `
      <div class="cad-body w-full max-w-narrow my-0 mx-auto pt-10 pb-16 px-8">
        ${tagHTML('Inscrição enviada', 'accent')}
        <h1 class="display text-fluid-sm mt-4 mb-3 mx-0" tabindex="-1" data-done-title>Perfil criado.<br>Você está no jogo.</h1>
        <p class="text-16 leading-copy text-ink-soft max-w-copy-sm mt-0 mb-8 mx-0">${evento
          ? `Sua inscrição em <strong>${esc(evento.name)}</strong> (${fmtDotDate(evento.date, 'full')}) foi registrada. Você recebe SMS com a confirmação e, se for convocado, com local e horário.`
          : 'Seu perfil foi registrado. Você recebe SMS com a confirmação e será alocado na peneira mais próxima com vaga.'}</p>
        <div class="card max-w-copy-sm">
          <div class="g g-2 gap-4 mb-5">
            ${statHTML('Score de completude', sc + '%', { sub: sc >= 80 ? 'alto' : sc >= 60 ? 'bom' : 'inicial' })}
            ${statHTML('Passos concluídos', '5/5', { sub: STEPS.length + ' etapas' })}
          </div>
          ${progressHTML(sc, 100, { sm: true })}
          <div class="font-mono text-10 text-ink-mute mt-2">Você pode completar o perfil depois, pela sua área — cada campo adicional sobe o score.</div>
        </div>
        <div class="btn-row flex gap-2 flex-wrap mt-8">
          <a href="${loginHref}" class="btn btn--accent btn--lg">Entrar para acompanhar →</a>
          <a href="peneiras.html" class="btn btn--ghost btn--lg">Ver outras peneiras</a>
        </div>
      </div>`;
    const title = screenEl.querySelector('[data-done-title]');
    window.scrollTo(0, 0);
    title.focus({ preventScroll: true });
    announce('Inscrição enviada. Perfil criado com ' + sc + '% de completude.');
  }

  /* Idade calculada sem redesenhar o passo: redesenhar recriava o <input type="date">
     e derrubava o foco no meio da digitação por teclado (o Chromium dispara o
     evento a cada segmento dia/mês/ano). Só a dica e o erro são trocados. */
  function paintDobHint(dob) {
    const wrap = dob.closest('.field'); if (!wrap) return;
    const a = age(), bad = a != null && (a < 7 || a > 19);
    wrap.querySelectorAll('.field__hint, .field__error').forEach(e => e.remove());
    if (bad) dob.setAttribute('aria-invalid', 'true'); else dob.removeAttribute('aria-invalid');
    if (bad) wrap.insertAdjacentHTML('beforeend', '<span class="field__error" role="alert">Idade fora da faixa permitida (07–19)</span>');
    else if (a != null) wrap.insertAdjacentHTML('beforeend', `<span class="field__hint">Você tem ${a} anos</span>`);
  }

  /* Atualiza o que muda a cada tecla sem recriar os campos:
     estado dos botões e a barra de score. */
  function updateLive() {
    const v=valid();
    const next=screenEl.querySelector('#next'), finish=screenEl.querySelector('#finish');
    if(next) next.disabled=!v[step];
    if(finish) finish.disabled=!v[5];
    const sc=screenEl.querySelector('[data-score]');
    if(sc) sc.innerHTML=scoreBlockHTML();
  }

  render();
}

renderCadastro();
