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
    return { 1: form.name&&form.dob&&!bad&&form.cpf.length>=11, 2: form.state&&form.city, 3: form.position&&form.foot, 4: true, 5: needs?(form.consent&&form.responsible):true };
  }

  /* Bloco do score — redesenhado a cada tecla, não só a cada troca de passo. */
  function scoreBlockHTML() {
    const sc = score();
    return `${progressHTML(sc,100,{label:'Score de completude',sublabel:sc+'%'})}
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-mute);display:flex;justify-content:space-between">
            <span>0 → 100% · cada campo adicional sobe seu score</span>
            <span style="color:${sc>=60?'var(--success)':'var(--ink-mute)'}">${sc>=80?'◆ alto':sc>=60?'◐ bom':'○ inicial'}</span>
          </div>`;
  }

  function render() {
    const a = age();
    const bad = a!=null&&(a<7||a>19), needs = a!=null&&a<18;
    const v = valid();
    screenEl.innerHTML = `
      <div class="cad-head" data-cad-head>
        <div style="max-width:920px;margin:0 auto;padding:20px 32px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <span class="kicker" style="text-transform:uppercase">${evento ? 'Inscrição · ' + eventShortName(evento) : 'Criar perfil gratuito'}</span>
            ${tagHTML('PASSO '+step+'/5 · '+STEPS[step-1],'outline')}
          </div>
          ${evento ? `<p class="mono" style="margin:0;padding:10px 14px;background:var(--accent-soft);border:1px solid var(--line-soft);font-size:12px;text-transform:none;letter-spacing:0" data-event-context>Você está se inscrevendo em ${esc(evento.name)} · ${fmtDotDate(evento.date, 'full')}</p>` : ''}
          <div data-score>${scoreBlockHTML()}</div>
        </div>
      </div>

      <div class="cad-body" style="width:100%;max-width:920px;margin:0 auto;padding:40px 32px 120px">
        <h1 class="display" style="font-size:clamp(32px,7vw,56px);margin:0 0 32px">${stepTitle()}</h1>
        <div style="display:flex;flex-direction:column;gap:20px;max-width:720px">${stepFields()}</div>
      </div>

      <div class="cad-footer">
        <div style="max-width:920px;margin:0 auto;display:flex;gap:12px;align-items:center">
          <span class="mono text-mute">${STEPS[step-1]} · ${step}/5</span>
          <div style="margin-left:auto;display:flex;gap:8px">
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
        <div style="background:var(--bg-alt);padding:16px;border:1px solid var(--line-soft)">
          <div class="kicker" style="text-transform:uppercase;margin-bottom:6px">${evento ? 'Peneira escolhida' : 'Peneira mais próxima'}</div>
          <div style="display:flex;align-items:baseline;justify-content:space-between"><span class="display" style="font-size:18px">${eventShortName(nearest)}</span><span style="font-family:var(--font-mono);font-size:12px">${fmtDotDate(nearest.date)}</span></div>
          <div style="margin-top:4px;font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">${evento ? nearest.city + '/' + nearest.state : '0 km de você · alocação automática'}</div>
        </div>`;
      if(step===3) return `
        ${field('Posição principal',`<div class="g g-2" style="gap:8px" id="f-pos">${['Goleiro','Zagueiro','Lateral','Volante','Meia','Ponta','Atacante'].map(p=>`<button type="button" class="choice ${form.position===p?'is-active':''}" data-pos="${p}">${p}</button>`).join('')}</div>`)}
        ${field('Pé dominante',`<div style="display:flex;gap:8px" id="f-foot">${['Direito','Esquerdo','Ambidestro'].map(p=>`<button type="button" class="choice choice--accent ${form.foot===p?'is-active':''}" data-foot="${p}" style="flex:1;height:44px">${p}</button>`).join('')}</div>`)}
        <div class="g g-2" style="gap:12px">
          ${field('Altura (cm)',`<input class="input" id="f-h" inputmode="numeric" placeholder="ex.: 165" value="${esc(form.height)}">`,'',null,true)}
          ${field('Peso (kg)',`<input class="input" id="f-w" inputmode="numeric" placeholder="ex.: 58" value="${esc(form.weight)}">`,'',null,true)}
        </div>
        ${field('Onde joga hoje',`<input class="input" id="f-club" placeholder="Nome da escolinha ou clube" value="${esc(form.club)}">`,'',null,true)}
        ${field('Tempo de prática (anos)',`<input class="input" id="f-years" inputmode="numeric" placeholder="ex.: 2" value="${esc(form.years)}">`,'',null,true)}`;
      if(step===4) return `
        <div style="background:var(--accent);color:var(--accent-ink);padding:16px;border:1px solid var(--ink);display:flex;align-items:center;gap:12px">
          <span class="display" style="font-size:36px">+25</span>
          <div><div style="font-family:var(--font-display);font-weight:800;font-size:14px;text-transform:uppercase">Vídeos aumentam seu score</div><div style="font-family:var(--font-mono);font-size:11px">até 25 pontos no ranking do olheiro</div></div>
        </div>
        ${field('Link do Instagram com vídeos',`<input class="input" id="f-videos" placeholder="instagram.com/seu.usuario" value="${esc(form.videos)}">`,'@usuario ou link direto',null,true)}
        ${field('Foto de rosto',`<button type="button" id="f-photo" style="height:120px;width:100%;background:var(--bg-alt);border:1px dashed var(--ink);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--ink)">${form.photo?'<span class="display" style="font-size:20px">✓ Foto adicionada</span><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">clique para remover</span>':'<span class="display" style="font-size:20px">+ enviar</span><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">jpg, png · até 5MB</span>'}</button>`,'',null,true)}`;
      // step 5
      if(needs) return `
        ${field('Nome do responsável legal',`<input class="input" id="f-resp" placeholder="Nome completo do responsável" value="${esc(form.responsible)}">`)}
        ${field('Celular do responsável',`<input class="input" id="f-resp-phone" inputmode="tel" placeholder="(21) 9 9999-9999" value="${esc(form.responsiblePhone)}">`,'Receberá SMS de confirmação')}
        <button type="button" id="f-consent" style="display:flex;gap:12px;align-items:flex-start;background:${form.consent?'var(--accent)':'var(--card)'};color:${form.consent?'var(--accent-ink)':'var(--ink)'};border:1px solid var(--ink);padding:16px;cursor:pointer;text-align:left">
          <span style="width:22px;height:22px;flex-shrink:0;border:1.5px solid var(--ink);background:${form.consent?'var(--ink)':'transparent'};display:flex;align-items:center;justify-content:center;color:var(--accent);font-family:var(--font-display)">${form.consent?'✓':''}</span>
          <span><span style="font-family:var(--font-display);font-weight:800;font-size:13px;text-transform:uppercase">Aceito o termo de responsável</span><br><span style="font-size:12px;line-height:1.5">Autorizo a participação do menor na peneira e o tratamento dos dados conforme LGPD/ECA.</span></span>
        </button>`;
      return `<div style="padding:24px;background:var(--accent);color:var(--accent-ink);border:1px solid var(--ink)"><div class="display" style="font-size:24px">Você é maior.</div><div style="font-size:13px;margin-top:8px">Sem necessidade de responsável. Confirme sua inscrição.</div></div>`;
    }
  }

  function field(label, control, hint, error, optional) {
    const ctrl = error ? control.replace(/<(input|select|textarea)\b/, '<$1 aria-invalid="true"') : control;
    return `<label class="field"><div class="field__label"><span>${label}</span>${optional?'<span class="field__optional">opcional</span>':''}</div>${ctrl}${hint?`<span class="field__hint">${hint}</span>`:''}${error?`<span class="field__error" role="alert">${error}</span>`:''}</label>`;
  }

  function bindFields() {
    const n=screenEl.querySelector('#f-name'); if(n) n.oninput=()=>{ form.name=n.value; updateLive(); };
    const dob=screenEl.querySelector('#f-dob'); if(dob) dob.onchange=()=>{ form.dob=dob.value; render(); };
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
      <div class="cad-body" style="width:100%;max-width:920px;margin:0 auto;padding:40px 32px 64px">
        ${tagHTML('Inscrição enviada', 'accent')}
        <h1 class="display" style="font-size:clamp(32px,7vw,56px);margin:16px 0 12px" tabindex="-1" data-done-title>Perfil criado.<br>Você está no jogo.</h1>
        <p style="font-size:16px;line-height:1.6;color:var(--ink-soft);max-width:600px;margin:0 0 32px">${evento
          ? `Sua inscrição em <strong>${esc(evento.name)}</strong> (${fmtDotDate(evento.date, 'full')}) foi registrada. Você recebe SMS com a confirmação e, se for convocado, com local e horário.`
          : 'Seu perfil foi registrado. Você recebe SMS com a confirmação e será alocado na peneira mais próxima com vaga.'}</p>
        <div class="card" style="max-width:600px">
          <div class="g g-2" style="gap:16px;margin-bottom:20px">
            ${statHTML('Score de completude', sc + '%', { sub: sc >= 80 ? 'alto' : sc >= 60 ? 'bom' : 'inicial' })}
            ${statHTML('Passos concluídos', '5/5', { sub: STEPS.length + ' etapas' })}
          </div>
          ${progressHTML(sc, 100, { sm: true })}
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-mute);margin-top:8px">Você pode completar o perfil depois, pela sua área — cada campo adicional sobe o score.</div>
        </div>
        <div class="btn-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:32px">
          <a href="${loginHref}" class="btn btn--accent btn--lg">Entrar para acompanhar →</a>
          <a href="peneiras.html" class="btn btn--ghost btn--lg">Ver outras peneiras</a>
        </div>
      </div>`;
    const title = screenEl.querySelector('[data-done-title]');
    window.scrollTo(0, 0);
    title.focus({ preventScroll: true });
    announce('Inscrição enviada. Perfil criado com ' + sc + '% de completude.');
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
