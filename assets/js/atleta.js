/* ============================================================
   PENEIRAS ON — Atleta (status · perfil · peneiras · cadastro)
   ============================================================ */
const ME = MOCK.ATHLETES[0];
const screenEl = document.querySelector('[data-screen]');
const params = new URLSearchParams(location.search);
const SCREENS = { status: renderStatus, perfil: renderPerfil, peneiras: renderPeneiras, cadastro: renderCadastro };
const telaParam = params.get('tela') || 'status';
// ?tela= desconhecido cai na tela padrão em vez de deixar o <main> vazio
const tela = SCREENS[telaParam] ? telaParam : 'status';

// marca aba ativa
document.querySelectorAll('.atleta-tab').forEach(t => {
  if (t.getAttribute('data-tab') === tela) t.classList.add('is-active');
});
// cadastro esconde as abas (fluxo isolado)
if (tela === 'cadastro') document.querySelector('[data-tabs]').style.display = 'none';

SCREENS[tela]();

/* ---------------- STATUS ---------------- */
function renderStatus() {
  const nextEvent = MOCK.SEASON.nextEvent;
  const eventDate = new Date(nextEvent.date + 'T08:00:00');
  screenEl.innerHTML = `<div class="atleta-main">
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:32px">
      <div>
        <div class="kicker" style="text-transform:uppercase">Olá, Lucas</div>
        <h1 class="display h1" style="margin:6px 0 0">Você foi <span class="mark">convocado.</span></h1>
      </div>
      <span class="tag tag--accent">● convocado</span>
    </div>

    <div class="g g-main" style="gap:24px;margin-bottom:24px">
      <div class="card--dark" style="padding:32px;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle at top right,rgba(84,245,66,.25),transparent 70%)"></div>
        <div style="position:relative">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px">
            <span class="kicker" style="color:rgba(245,244,238,.55)">Sua próxima peneira</span>
            <span style="font-family:var(--font-mono);font-size:11px;color:var(--accent)">● ATIVA</span>
          </div>
          <div class="display" style="font-size:56px;letter-spacing:-.04em">Rio · Caxias</div>
          <div class="g g-3" style="gap:24px;margin-top:32px;padding-top:24px;border-top:1px solid rgba(245,244,238,.2)">
            <div><div class="kicker" style="color:rgba(245,244,238,.55)">Data</div><div class="display" style="font-size:22px;margin-top:4px">${fmtDotDate(nextEvent.date, 'short')}</div></div>
            <div><div class="kicker" style="color:rgba(245,244,238,.55)">Horário</div><div class="display" style="font-size:22px;margin-top:4px">08h00</div></div>
            <div><div class="kicker" style="color:rgba(245,244,238,.55)">Sua vaga</div><div class="display" style="font-size:22px;margin-top:4px">#047/120</div></div>
          </div>
          <div style="margin-top:24px;font-size:14px;opacity:.85">Estádio Municipal de Caxias · Rua Manoel Reis, 380 · Duque de Caxias/RJ</div>
          <div class="btn-row" style="margin-top:20px;display:flex;gap:8px">
            <button class="btn btn--accent">Adicionar ao calendário</button>
            <button class="btn btn--ghost btn--on-dark">Ver instruções</button>
          </div>
        </div>
      </div>

      <div class="card" style="padding:28px">
        <div class="section-label"><span class="section-label__title">Seu score</span></div>
        <div class="g g-2" style="gap:20px;margin-bottom:20px">
          ${statHTML('Completude', ME.completeness+'%', {big:true, sub:'perfil'})}
          ${statHTML('Ranking', '#23', {big:true, sub:'entre 487'})}
        </div>
        ${progressHTML(ME.completeness, 100, {label:'Próximo passo: + 1 vídeo', sublabel:'+8 pts'})}
        <div class="btn-row" style="display:flex;gap:8px;margin-top:16px">
          <a href="atleta.html?tela=perfil" class="btn btn--primary btn--full">Ver perfil completo</a>
          <a href="atleta.html?tela=perfil" class="btn btn--ghost">Editar</a>
        </div>
      </div>
    </div>

    <div class="g g-main" style="gap:24px">
      <div class="card" style="padding:28px">
        <div class="section-label"><span class="section-label__title">Linha do tempo</span><span class="section-label__action">${tagHTML('RF-19','outline')}</span></div>
        ${[
          ['02·MAI','Inscrição realizada','completed'],
          ['04·MAI','Score consolidado em 92%','completed'],
          ['10·MAI','Convocação confirmada via SMS','completed'],
          ['15·JUN','Peneira presencial · Caxias','next'],
          ['—','Avaliação do olheiro','future'],
          ['—','Resposta final','future'],
        ].map((e,i)=>`<div class="g g-row-time" style="gap:12px;padding:14px 0;border-top:${i?'1px solid var(--line-soft)':'none'};align-items:center">
          <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">${e[0]}</span>
          <span style="width:12px;height:12px;border-radius:50%;background:${e[2]==='completed'?'var(--ink)':e[2]==='next'?'var(--accent)':'transparent'};border:1.5px solid var(--ink)"></span>
          <span style="font-size:14px;font-weight:${e[2]==='next'?700:400}">${e[1]}</span>
        </div>`).join('')}
      </div>

      <div class="card" style="padding:28px">
        <div class="section-label"><span class="section-label__title">Contagem regressiva</span><span class="section-label__action" data-countdown-state></span></div>
        <div class="g g-4" style="gap:12px;margin-bottom:20px" data-countdown></div>
        <div style="padding:16px;background:var(--accent);color:var(--accent-ink)">
          <div class="kicker" style="color:var(--accent-ink);margin-bottom:6px">Lembrete</div>
          <div style="font-size:13px;line-height:1.5">Chegue com 30 minutos de antecedência. Leve documento com foto e a confirmação SMS.</div>
        </div>
      </div>
    </div>
  </div>`;

  // contagem regressiva compartilhada com peneiras.html (components.js)
  startCountdown(eventDate, screenEl);
}

/* ---------------- PERFIL ---------------- */
function renderPerfil() {
  const ranked = MOCK.classifyPosition(ME.attrs);
  const top = ranked[0];
  const runners = ranked.slice(1,4).map(r=>`<div class="g g-row-bar" style="gap:8px;align-items:center"><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);text-transform:uppercase">${r.pos}</span><div style="height:4px;background:var(--bg-alt);position:relative"><div style="position:absolute;inset:0;width:${(r.score*100).toFixed(0)}%;background:${MOCK.POS_COLORS[r.pos]}"></div></div><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);text-align:right">${(r.score*100).toFixed(0)}%</span></div>`).join('');

  screenEl.innerHTML = `<div class="atleta-main">
    <div style="margin-bottom:32px">
      <span class="tag tag--outline">Seu perfil</span>
      <h1 class="display h1" style="margin:8px 0 0">${ME.name}</h1>
      <div style="font-family:var(--font-mono);font-size:13px;color:var(--ink-soft);margin-top:6px">${ME.position.toUpperCase()} · ${ME.age} anos · ${ME.city}/${ME.state} · ${ME.club}</div>
    </div>

    <div class="g g-aside-md" style="gap:24px;margin-bottom:24px">
      <div class="card" style="padding:24px">
        <div class="player-img" style="height:300px">3x4</div>
        <div class="g g-4" style="border-top:1px solid var(--line-soft);margin-top:16px">
          ${[['Altura',ME.height+'cm'],['Peso',ME.weight+'kg'],['Pé',ME.foot[0]],['Tempo',ME.yearsPlaying+'a']].map((s,i)=>`<div style="padding:14px 6px;text-align:center;border-right:${i<3?'1px solid var(--line-soft)':'none'}"><div class="display" style="font-size:22px">${s[1]}</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--ink-mute);text-transform:uppercase;letter-spacing:.1em;margin-top:2px">${s[0]}</div></div>`).join('')}
        </div>
        <button type="button" class="btn btn--ghost btn--full" style="margin-top:16px">Editar perfil</button>
      </div>

      <div class="card" style="padding:28px">
        <div class="section-label"><span class="section-label__title">Perfil tático</span><span class="section-label__action">${tagHTML('IA','gold')}</span></div>
        <div class="g g-2" style="gap:24px;align-items:center">
          <div style="display:flex;justify-content:center">${buildRadarSVG(ME.attrs,{size:340,fill:MOCK.POS_COLORS[top.pos],compareProfile:MOCK.POSITION_PROFILES[top.pos]})}</div>
          <div>
            <div class="kicker" style="text-transform:uppercase;margin-bottom:8px">Perfil tático sugerido</div>
            <div class="display" style="font-size:36px">${top.pos}</div>
            <div class="display" style="font-size:18px;color:${MOCK.POS_COLORS[top.pos]};margin-top:4px">${(top.score*100).toFixed(0)}% match</div>
            <div style="margin-top:16px;display:flex;flex-direction:column;gap:6px">${runners}</div>
          </div>
        </div>
        <div style="margin-top:20px;padding:14px;background:var(--bg-alt);font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);line-height:1.5">Classificação por similaridade dos seus atributos com perfis-base de cada posição. Atualizada a cada avaliação do olheiro.</div>
      </div>
    </div>

    <div class="g g-main" style="gap:24px">
      <div class="card" style="padding:24px">
        <div class="section-label"><span class="section-label__title">Mídias</span><span class="section-label__action">${tagHTML('+25 pts','outline')}</span></div>
        <div class="g g-4" style="gap:12px">
          ${[1,2,3].map(i=>`<div class="player-img" style="aspect-ratio:3/4">VÍDEO ${i}</div>`).join('')}
          <button class="player-img" style="aspect-ratio:3/4;background:var(--card);border:1px dashed var(--ink);cursor:pointer;flex-direction:column;gap:4px;color:var(--ink)"><span style="font-size:24px">+</span><span style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase">Adicionar</span></button>
        </div>
      </div>

      <div class="card--dark" style="padding:24px;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;right:0;width:120px;height:120px;background:radial-gradient(circle at top right,rgba(200,164,21,.45),transparent 70%)"></div>
        <div style="position:relative">
          <span class="tag tag--gold">Plano Premium</span>
          <div class="display" style="font-size:26px;margin-top:8px"><span class="gold">Premium</span> · gratuito</div>
          <div style="font-family:var(--font-mono);font-size:11px;opacity:.7;margin-top:6px">Concedido como aluno de escola parceira.</div>
          <ul style="margin-top:16px;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px">
            ${['Score detalhado por critério','Posição no ranking visível','Destaque visual para olheiros','Acesso antecipado a novas peneiras'].map(l=>`<li style="display:flex;gap:10px;font-size:13px"><span class="gold">✓</span>${l}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  </div>`;
}

/* ---------------- PENEIRAS ---------------- */
/* Versão pessoal do calendário: mesmo card e mesmo filtro por status da
   peneiras.html (components.js), mais o que só faz sentido logado —
   "Minha região" (ME.state) e o estado de inscrição por evento. */
function renderPeneiras() {
  const filters = { status: 'all', mine: false };
  const registered = new Set(ME.registrations || []);

  function summaryHTML() {
    const n = registered.size;
    return `Você está inscrito em <strong>${n} ${n === 1 ? 'peneira' : 'peneiras'}</strong>${n ? ' nesta temporada.' : ' — escolha uma abaixo.'}`;
  }

  function rows() {
    return filterEvents(MOCK.EVENTS, { status: filters.status, state: filters.mine ? ME.state : 'all' });
  }

  function paint(announceResult) {
    const data = rows();
    screenEl.querySelector('[data-rows]').innerHTML =
      data.length ? data.map(e => eventCardHTML(e, 'atleta', { registered: registered.has(e.id) })).join('') : eventsEmptyHTML();
    screenEl.querySelector('[data-count]').textContent = `${data.length} de ${MOCK.EVENTS.length} peneiras`;
    screenEl.querySelectorAll('[data-status]').forEach(b => {
      const on = b.dataset.status === filters.status;
      b.classList.toggle('btn--primary', on); b.classList.toggle('btn--ghost', !on);
      b.setAttribute('aria-pressed', String(on));
    });
    const mine = screenEl.querySelector('[data-mine]');
    mine.classList.toggle('btn--primary', filters.mine); mine.classList.toggle('btn--ghost', !filters.mine);
    mine.setAttribute('aria-pressed', String(filters.mine));
    const clear = screenEl.querySelector('[data-clear-filters]');
    if (clear) clear.onclick = () => { filters.status = 'all'; filters.mine = false; paint(true); };
    // Inscrever-se: registra em memória (o protótipo não tem sessão), repinta o
    // card como "Inscrito" e devolve o foco ao "Ver comprovante" do mesmo card.
    screenEl.querySelectorAll('[data-register]').forEach(b => b.onclick = () => {
      const ev = MOCK.EVENTS.find(x => x.id === b.dataset.register);
      registered.add(ev.id);
      paint(false);
      screenEl.querySelector('[data-summary]').innerHTML = summaryHTML();
      const card = screenEl.querySelector(`[data-event="${ev.id}"] .btn`);
      if (card) card.focus();
      announce(`Inscrição confirmada em ${ev.name}. Você está inscrito em ${registered.size} ${registered.size === 1 ? 'peneira' : 'peneiras'}.`);
    });
    if (announceResult) announce(`${data.length} peneiras na lista`);
  }

  screenEl.innerHTML = `<div class="atleta-main">
    <div style="margin-bottom:32px">
      <span class="tag tag--outline">Calendário</span>
      <h1 class="display h1" style="margin:8px 0 0">Peneiras<br>na <span class="mark">temporada 2026.</span></h1>
      <div style="font-family:var(--font-mono);font-size:13px;color:var(--ink-soft);margin-top:8px">${MOCK.SEASON.events} PENEIRAS · ${MOCK.SEASON.states} ESTADOS · INSCRIÇÃO GRATUITA</div>
      <p style="font-size:15px;margin:12px 0 0" data-summary>${summaryHTML()}</p>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--line);flex-wrap:wrap" role="group" aria-label="Filtrar peneiras">
      ${EVENT_STATUS_FILTERS.map(([k, label]) => `<button type="button" class="btn btn--ghost btn--sm" data-status="${k}" aria-pressed="false" style="font-family:var(--font-mono);letter-spacing:.08em">${label}</button>`).join('')}
      <button type="button" class="btn btn--ghost btn--sm" data-mine aria-pressed="false" style="font-family:var(--font-mono);letter-spacing:.08em">Minha região · ${ME.state}</button>
      <span style="margin-left:auto;align-self:center;font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)" data-count></span>
    </div>

    <div class="g g-3" style="gap:20px" data-rows></div>
  </div>`;

  screenEl.querySelectorAll('[data-status]').forEach(b => b.onclick = () => { filters.status = b.dataset.status; paint(true); });
  screenEl.querySelector('[data-mine]').onclick = () => { filters.mine = !filters.mine; paint(true); };
  paint(false);
}

/* ---------------- CADASTRO (wizard 5 passos) ---------------- */
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
      <div style="border-bottom:1px solid var(--line);background:var(--bg);position:sticky;top:65px;z-index:5">
        <div style="max-width:920px;margin:0 auto;padding:20px 32px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="kicker" style="text-transform:uppercase">Inscrição · Peneira Rio · Caxias</span>
            ${tagHTML('PASSO '+step+'/5 · '+STEPS[step-1],'outline')}
          </div>
          <div data-score>${scoreBlockHTML()}</div>
        </div>
      </div>

      <div style="max-width:920px;margin:0 auto;padding:40px 32px 120px">
        <h1 class="display" style="font-size:56px;margin:0 0 32px">${stepTitle()}</h1>
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
    const back=screenEl.querySelector('#back'), next=screenEl.querySelector('#next'), finish=screenEl.querySelector('#finish');
    if(back) back.onclick=()=>{ step--; render(); };
    if(next) next.onclick=()=>{ step++; render(); };
    if(finish) finish.onclick=()=>{ location.href='atleta.html?tela=status'; };

    function stepTitle() {
      return ['Quem é você?','De onde vem<br>o futebol?','Como você joga?','Mostre o seu jogo.','Falta só o responsável.'][step-1];
    }
    function stepFields() {
      if(step===1) return `
        ${field('Nome completo',`<input class="input" id="f-name" placeholder="Lucas Oliveira" value="${esc(form.name)}">`)}
        ${field('Data de nascimento',`<input class="input" type="date" id="f-dob" value="${esc(form.dob)}">`, a!=null?(bad?'':'Você tem '+a+' anos'):'', bad?'Idade fora da faixa permitida (07–19)':'')}
        ${field('CPF',`<input class="input" id="f-cpf" inputmode="numeric" placeholder="000.000.000-00" value="${esc(form.cpf)}">`,'11 dígitos, só números')}`;
      if(step===2) return `
        ${field('Estado',`<select class="select" id="f-state">${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(s=>`<option ${s===form.state?'selected':''}>${s}</option>`).join('')}</select>`)}
        ${field('Cidade',`<input class="input" id="f-city" placeholder="Duque de Caxias" value="${esc(form.city)}">`)}
        <div style="background:var(--bg-alt);padding:16px;border:1px solid var(--line-soft)">
          <div class="kicker" style="text-transform:uppercase;margin-bottom:6px">Peneira mais próxima</div>
          <div style="display:flex;align-items:baseline;justify-content:space-between"><span class="display" style="font-size:18px">Rio · Caxias</span><span style="font-family:var(--font-mono);font-size:12px">15·jun</span></div>
          <div style="margin-top:4px;font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">0 km de você · alocação automática</div>
        </div>`;
      if(step===3) return `
        ${field('Posição principal',`<div class="g g-2" style="gap:8px" id="f-pos">${['Goleiro','Zagueiro','Lateral','Volante','Meia','Ponta','Atacante'].map(p=>`<button type="button" class="choice ${form.position===p?'is-active':''}" data-pos="${p}">${p}</button>`).join('')}</div>`)}
        ${field('Pé dominante',`<div style="display:flex;gap:8px" id="f-foot">${['Direito','Esquerdo','Ambidestro'].map(p=>`<button type="button" class="choice choice--accent ${form.foot===p?'is-active':''}" data-foot="${p}" style="flex:1;height:44px">${p}</button>`).join('')}</div>`)}
        <div class="g g-2" style="gap:12px">
          ${field('Altura (cm)',`<input class="input" id="f-h" inputmode="numeric" placeholder="172" value="${esc(form.height)}">`,'',null,true)}
          ${field('Peso (kg)',`<input class="input" id="f-w" inputmode="numeric" placeholder="64" value="${esc(form.weight)}">`,'',null,true)}
        </div>
        ${field('Onde joga hoje',`<input class="input" id="f-club" placeholder="Escolinha Vila Operária" value="${esc(form.club)}">`,'',null,true)}
        ${field('Tempo de prática (anos)',`<input class="input" id="f-years" inputmode="numeric" placeholder="3" value="${esc(form.years)}">`,'',null,true)}`;
      if(step===4) return `
        <div style="background:var(--accent);color:var(--accent-ink);padding:16px;border:1px solid var(--ink);display:flex;align-items:center;gap:12px">
          <span class="display" style="font-size:36px">+25</span>
          <div><div style="font-family:var(--font-display);font-weight:800;font-size:14px;text-transform:uppercase">Vídeos aumentam seu score</div><div style="font-family:var(--font-mono);font-size:11px">até 25 pontos no ranking do olheiro</div></div>
        </div>
        ${field('Link do Instagram com vídeos',`<input class="input" id="f-videos" placeholder="instagram.com/lucas.10" value="${esc(form.videos)}">`,'@usuario ou link direto',null,true)}
        ${field('Foto de rosto',`<button type="button" id="f-photo" style="height:120px;width:100%;background:var(--bg-alt);border:1px dashed var(--ink);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--ink)">${form.photo?'<span class="display" style="font-size:20px">✓ Foto adicionada</span><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">clique para remover</span>':'<span class="display" style="font-size:20px">+ enviar</span><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">jpg, png · até 5MB</span>'}</button>`,'',null,true)}`;
      // step 5
      if(needs) return `
        ${field('Nome do responsável legal',`<input class="input" id="f-resp" placeholder="Maria Oliveira" value="${esc(form.responsible)}">`)}
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
