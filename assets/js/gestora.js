/* ============================================================
   PENEIRAS ON — Gestora (dashboard · mapa · pipeline · eventos)
   ============================================================ */
const screenEl = document.querySelector('[data-screen]');
const params = new URLSearchParams(location.search);
const SCREENS = { dashboard: renderDashboard, mapa: renderMapa, pipeline: renderPipeline, eventos: renderEventos };
const telaParam = params.get('tela') || 'dashboard';
// ?tela= desconhecido cai na tela padrão em vez de deixar o <main> vazio
const tela = SCREENS[telaParam] ? telaParam : 'dashboard';

document.querySelectorAll('.nav-item').forEach(n => {
  if (n.getAttribute('data-nav') === tela) n.classList.add('is-active');
});

SCREENS[tela]();

/* ---------------- helpers de gráfico ---------------- */
function sparkline(data, w=140, h=28, color='var(--ink)') {
  const max=Math.max(...data), min=Math.min(...data), range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1)*w).toFixed(1)},${(h-((v-min)/range)*h).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
}
function funnelHTML() {
  const max=MOCK.FUNNEL[0].value;
  return `<div style="display:flex;flex-direction:column">` + MOCK.FUNNEL.map((f,i)=>{
    const ratio=f.value/max;
    const prev=i>0?MOCK.FUNNEL[i-1].value:null;
    const drop=prev?f.value/prev:1;
    const last=i===MOCK.FUNNEL.length-1;
    const clip = !last ? `clip-path:polygon(0 0,100% 0,${(50+50*drop).toFixed(1)}% 100%,${(50-50*drop).toFixed(1)}% 100%)` : '';
    return `<div style="position:relative;padding:20px 0;border-bottom:${!last?'1px solid var(--line-soft)':'none'}">
      <div style="display:flex;align-items:baseline;justify-content:space-between">
        <div style="display:flex;align-items:baseline;gap:12px"><span class="mono text-mute">${String(i+1).padStart(2,'0')}</span><span style="font-family:var(--font-display);font-weight:800;font-size:16px;text-transform:uppercase">${f.stage}</span><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">${f.delta}</span></div>
        <span class="display" style="font-size:28px">${fmtNum(f.value)}</span>
      </div>
      <div style="margin-top:8px;position:relative;height:28px;background:var(--bg-alt)"><div style="position:absolute;top:0;left:50%;width:${(ratio*100).toFixed(1)}%;height:100%;background:${last?'var(--accent)':'var(--ink)'};transform:translateX(-50%);${clip}"></div></div>
    </div>`;
  }).join('') + `</div>`;
}
function timelineChart() {
  const max=Math.max(...MOCK.TIMELINE.map(d=>d.v));
  return `<div style="display:flex;align-items:flex-end;gap:3px;height:160px">` + MOCK.TIMELINE.map((d,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:100%;height:${(d.v/max*140).toFixed(0)}px;background:${i===MOCK.TIMELINE.length-1?'var(--accent)':'var(--ink)'}"></div><span style="font-family:var(--font-mono);font-size:9px;color:var(--ink-mute)">${d.d}</span></div>`).join('') + `</div>`;
}

/* ---------------- DASHBOARD ---------------- */
function renderDashboard() {
  const active = ['SP','RJ','PE','PR','AM'];
  screenEl.innerHTML = `
    <div class="page-head">
      <div><div class="kicker" style="text-transform:uppercase">Boa tarde, Marina</div><h1 class="display h2" style="margin:6px 0">Dashboard</h1></div>
      <div class="page-head__actions" style="display:flex;gap:8px">
        <select class="sel2"><option>Temporada 2026 · até hoje</option><option>Últimos 30 dias</option><option>Comparar com 2025</option></select>
        <button class="btn btn--ghost btn--sm">Exportar PDF</button>
        <a href="gestora.html?tela=eventos" class="btn btn--primary btn--sm">+ Nova peneira</a>
      </div>
    </div>

    <div class="kpi-strip g g-5" >
      <div>${statHTML('Inscritos · campanha','18.420',{delta:'+412 hoje'})}<div style="margin-top:8px">${sparkline(MOCK.TIMELINE.map(t=>t.v))}</div></div>
      <div>${statHTML('Cidades atingidas','127',{delta:'+24 vs 2025'})}</div>
      <div>${statHTML('Conversão final','12,7%',{delta:'aprovados/convocados'})}</div>
      <div>${statHTML('ROI médio','R$ 38',{delta:'por inscrição válida'})}</div>
      <div>${statHTML('Aprovados','187',{delta:'em formação'})}</div>
    </div>

    <div class="g g-main-wide pad" style="gap:24px">
      <div class="card" style="padding:24px">
        <div class="section-label"><span class="section-label__title">Funil de conversão · temporada</span><span class="section-label__action">${tagHTML('RF-22 · RF-30','outline')}</span></div>
        ${funnelHTML()}
      </div>
      <div class="card" style="padding:24px">
        <div class="section-label"><span class="section-label__title">Inscrições · 14 dias</span></div>
        ${timelineChart()}
        <div class="g g-2" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line-soft);gap:12px">
          ${statHTML('Pico semanal','2.210',{sub:'Sáb'})}
          ${statHTML('Média / dia','1.318',{delta:'+12% WoW'})}
        </div>
      </div>
    </div>

    <div class="g g-main" style="padding:0 32px 32px;gap:24px">
      <div class="card" style="padding:24px">
        <div class="section-label"><span class="section-label__title">Demanda por região</span><span class="section-label__action"><a href="gestora.html?tela=mapa" class="btn btn--ghost btn--sm">Abrir mapa →</a></span></div>
        <div class="table-scroll"><table class="table" style="font-size:13px">
          <thead><tr>${['Região','Inscritos','Peneira ativa?','Demanda','Sugestão'].map(h=>`<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${MOCK.REGIONS.slice().sort((a,b)=>b.value-a.value).slice(0,8).map(r=>{
              const act=active.includes(r.state);
              const sug=!act&&r.demand>0.6?'Abrir peneira':act?'—':'Monitorar';
              return `<tr style="cursor:default">
                <td style="font-weight:600">${r.label} <span style="font-family:var(--font-mono);font-size:10px;color:var(--ink-soft)">(${r.state})</span></td>
                <td style="font-family:var(--font-mono)">${fmtNum(r.value)}</td>
                <td>${tagHTML(act?'● sim':'○ não', act?'success':'outline')}</td>
                <td style="width:180px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:4px;background:var(--bg-alt)"><div style="width:${(r.demand*100).toFixed(0)}%;height:100%;background:${r.demand>0.8?'var(--danger)':r.demand>0.6?'var(--accent)':'var(--ink)'}"></div></div><span style="font-family:var(--font-mono);font-size:11px;width:32px;text-align:right">${Math.round(r.demand*100)}</span></div></td>
                <td>${tagHTML(sug, sug==='Abrir peneira'?'accent':'outline')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>
      <div class="card" style="padding:24px">
        <div class="section-label"><span class="section-label__title">Próximas peneiras</span></div>
        ${MOCK.EVENTS.slice(0,4).map((e,i)=>`<div style="padding:12px 0;border-top:${i?'1px solid var(--line-soft)':'none'}">
          <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-family:var(--font-display);font-weight:800;font-size:14px;text-transform:uppercase">${e.city}</span><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">${fmtDate(e.date,{day:'2-digit',month:'short'})}</span></div>
          <div style="margin-top:6px">${progressHTML(Math.min(e.registered,e.capacity*5),e.capacity*5,{xs:true,tone:e.registered/e.capacity>3?'accent':'ink'})}</div>
          <div style="margin-top:4px;font-family:var(--font-mono);font-size:10px;color:var(--ink-soft);display:flex;justify-content:space-between"><span>${fmtNum(e.registered)} insc.</span><span>${e.capacity} vagas</span></div>
        </div>`).join('')}
      </div>
    </div>`;
}

/* ---------------- MAPA ---------------- */
function renderMapa() {
  const active = ['SP','RJ','PE','PR','AM'];
  const FILTERS = [['all','Tudo'],['demanda','Demanda'],['cobertura','Cobertura'],['gap','Demanda reprimida']];
  let selected = null, filter = 'all';

  /* As bolhas têm raio em px sobre posição em %: num mapa estreito elas se
     sobrepunham (a 360px, SP sumia atrás de RJ). --dot-scale encolhe raio,
     deslocamento e rótulo na mesma proporção; 752px é a largura do desenho
     no desktop, onde o fator é 1. */
  const MAP_REF_WIDTH = 752;
  const setDotScale = el => el.style.setProperty('--dot-scale', Math.min(1, el.clientWidth / MAP_REF_WIDTH).toFixed(3));
  const dotScaler = 'ResizeObserver' in window ? new ResizeObserver(entries => entries.forEach(en => setDotScale(en.target))) : null;

  /* Cada filtro destaca um recorte diferente atenuando o resto.
     Antes só 'gap' tinha efeito — 'demanda' e 'cobertura' eram botões inertes. */
  function dotOpacity(r) {
    const covered = active.includes(r.state);
    if (filter === 'demanda') return r.demand > 0.65 ? 0.85 : 0.15;
    if (filter === 'cobertura') return covered ? 0.85 : 0.15;
    if (filter === 'gap') return covered ? 0.15 : 0.85;
    return 0.85;
  }
  function filterHint() {
    return {
      all: 'Todas as regiões monitoradas.',
      demanda: 'Destaque: regiões com demanda acima de 65%.',
      cobertura: 'Destaque: regiões com peneira ativa na temporada.',
      gap: 'Destaque: demanda alta ainda sem peneira ativa.',
    }[filter];
  }

  function render() {
    screenEl.innerHTML = `
      <div class="page-head">
        <div><div class="kicker" style="text-transform:uppercase">Inteligência geográfica · RF-29</div><h1 class="display h2" style="margin:6px 0">Mapa de calor</h1></div>
        <div class="page-head__actions" style="display:flex;gap:8px">
          ${FILTERS.map(f=>`<button class="map-filter ${filter===f[0]?'is-active':''}" data-f="${f[0]}" aria-pressed="${filter===f[0]}">${f[1]}</button>`).join('')}
        </div>
      </div>
      <div class="g g-panel-md pad" style="gap:24px;height:calc(100% - 116px)">
        <div class="card card--flush" data-map style="position:relative;overflow:hidden;min-height:640px">
          <div style="position:absolute;inset:0;background-image:linear-gradient(var(--line-soft) 1px,transparent 1px),linear-gradient(90deg,var(--line-soft) 1px,transparent 1px);background-size:40px 40px;opacity:.5"></div>
          <svg viewBox="0 0 800 700" style="position:absolute;inset:0;width:100%;height:100%">
            <defs><pattern id="dot" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.7" fill="var(--ink-soft)" opacity="0.3"/></pattern></defs>
            <path d="M 230 80 L 360 70 L 480 90 L 560 130 L 620 200 L 660 280 L 680 360 L 660 440 L 600 500 L 540 560 L 460 590 L 380 600 L 310 580 L 250 540 L 200 480 L 170 400 L 160 320 L 170 240 L 195 160 Z" fill="url(#dot)" stroke="var(--line)" stroke-width="1.5"/>
          </svg>
          ${MOCK.REGIONS.map(r=>{
            const radius=14+r.value/40;
            const color=r.demand>0.85?'var(--danger)':r.demand>0.65?'var(--accent)':'var(--ink)';
            const op=dotOpacity(r);
            const sel=selected&&selected.id===r.id;
            const fs=Math.min(11,radius*0.5).toFixed(0);
            return `<button class="map-dot" data-id="${r.id}" style="position:absolute;left:calc(${r.x*100}% - ${radius}px * var(--dot-scale,1));top:calc(${r.y*100}% - ${radius}px * var(--dot-scale,1));width:calc(${radius*2}px * var(--dot-scale,1));height:calc(${radius*2}px * var(--dot-scale,1));border-radius:50%;background:${color};opacity:${op};border:${sel?'3px solid var(--ink)':'none'};cursor:pointer;display:flex;align-items:center;justify-content:center;color:${r.demand>0.65?'var(--ink)':'var(--bg)'};font-family:var(--font-display);font-weight:900;font-size:max(8px, calc(${fs}px * var(--dot-scale,1)))">${r.state}</button>`;
          }).join('')}
          <div style="position:absolute;bottom:16px;left:16px;background:var(--card);border:1px solid var(--line);padding:12px">
            <div class="kicker" style="text-transform:uppercase;margin-bottom:8px">Intensidade</div>
            ${[['var(--danger)','Demanda crítica · >85%'],['var(--accent)','Demanda forte · 65–85%'],['var(--ink)','Demanda média · <65%']].map(i=>`<div style="display:flex;align-items:center;gap:8px;margin-top:6px"><div style="width:12px;height:12px;border-radius:50%;background:${i[0]}"></div><span style="font-family:var(--font-mono);font-size:10px">${i[1]}</span></div>`).join('')}
          </div>
          <div style="position:absolute;top:16px;right:16px;font-family:var(--font-mono);font-size:10px;color:var(--ink-mute);text-transform:uppercase;letter-spacing:.1em">BR · TEMPORADA 2026 · LIVE</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div data-panel></div>
          <div class="card" style="padding:20px">
            <div class="section-label"><span class="section-label__title">Top demandas reprimidas</span></div>
            ${MOCK.REGIONS.filter(r=>!active.includes(r.state)).sort((a,b)=>b.demand-a.demand).slice(0,5).map((r,i)=>`<div class="g g-row-rank" style="align-items:center;gap:10px;padding:10px 0;border-top:${i?'1px solid var(--line-soft)':'none'}"><span class="mono text-mute">${String(i+1).padStart(2,'0')}</span><span style="font-size:13px;font-weight:600">${r.label} <span style="font-family:var(--font-mono);font-size:10px;color:var(--ink-soft)">(${r.state})</span></span>${tagHTML(Math.round(r.demand*100), r.demand>0.7?'danger':'outline')}</div>`).join('')}
          </div>
        </div>
      </div>`;

    renderPanel();
    const map = screenEl.querySelector('[data-map]');
    setDotScale(map);
    if (dotScaler) dotScaler.observe(map);
    screenEl.querySelectorAll('.map-dot').forEach(d=>d.onclick=()=>{
      selected=MOCK.REGIONS.find(r=>r.id===d.dataset.id);
      render();
      announce(`${selected.label}: ${Math.round(selected.demand*100)}% de demanda.`);
    });
    screenEl.querySelectorAll('.map-filter').forEach(f=>f.onclick=()=>{
      filter=f.dataset.f;
      render();
      announce(filterHint());
    });
  }
  function renderPanel() {
    const p = screenEl.querySelector('[data-panel]');
    if (!selected) { p.innerHTML = `<div class="card" style="padding:20px"><div class="mono text-mute" style="text-transform:uppercase">Clique em uma região</div><p style="margin-top:8px;color:var(--ink-soft);font-size:13px">Veja detalhes de demanda, inscritos, peneiras ativas e sugestão automática de ação.</p></div>`; return; }
    p.innerHTML = `<div class="card" style="padding:20px">
      ${tagHTML(selected.state,'accent')}
      <div class="display" style="font-size:28px;margin-top:8px;letter-spacing:-.02em">${selected.label}</div>
      <div class="g g-2" style="gap:16px;margin-top:20px">
        ${statHTML('Inscritos', fmtNum(selected.value))}
        ${statHTML('Demanda', Math.round(selected.demand*100)+'%')}
      </div>
      <div style="margin-top:20px;padding:16px;background:var(--bg-alt)">
        <div class="kicker" style="text-transform:uppercase">Sugestão do sistema</div>
        <p style="font-size:13px;margin-top:8px;line-height:1.5">${selected.demand>0.8?'Demanda crítica. Abrir nova peneira nos próximos 30 dias para evitar perda de talentos.':'Demanda em monitoramento. Manter campanha digital ativa.'}</p>
      </div>
      <a class="btn btn--primary btn--full" style="margin-top:16px" href="gestora.html?tela=eventos">+ Criar peneira em ${selected.state}</a>
    </div>`;
  }
  render();
}

/* ---------------- PIPELINE ---------------- */
function renderPipeline() {
  const pipeline = [
    {name:'Rafael Mendes',stage:'Em formação',since:'12·MAI·2026',region:'Sul',score:89,valuation:'R$ 0'},
    {name:'Gabriel Lima',stage:'Em formação',since:'03·MAI·2026',region:'Sudeste',score:79,valuation:'R$ 0'},
    {name:'Diego Ramos',stage:'Contratado',since:'14·SET·2025',region:'Nordeste',score:88,valuation:'R$ 80k'},
    {name:'Felipe Souza',stage:'Em formação',since:'20·ABR·2026',region:'Centro-Oeste',score:81,valuation:'R$ 0'},
    {name:'André Pinto',stage:'Negociado',since:'02·FEV·2025',region:'Sudeste',score:91,valuation:'R$ 1,4M'},
  ];
  screenEl.innerHTML = `
    <div class="page-head" style="align-items:flex-start"><div><div class="kicker" style="text-transform:uppercase">RF-33 · RF-34 · revenue share</div><h1 class="display h2" style="margin:6px 0">Pipeline de talentos</h1></div></div>
    <div class="pad">
      <div class="g g-4" style="margin-bottom:24px;border:1px solid var(--line)">
        ${[['Aprovados ativos','187','em formação',false],['Contratados','24','desde 2025',false],['Negociados','3','transferências',false],['Valor gerado','R$ 2,1M','revenue share acumulado',true]].map((s,i)=>`<div style="padding:20px 24px;border-right:${i<3?'1px solid var(--line-soft)':'none'};position:relative;overflow:hidden">${s[3]?'<div style="position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle at top right,rgba(200,164,21,.35),transparent 70%)"></div>':''}<div style="position:relative"><span class="stat__label">${s[0]}</span><div class="display" style="font-size:36px;color:${s[3]?'var(--gold)':'var(--ink)'};margin-top:4px">${s[1]}</div><span class="stat__delta" style="color:${s[3]?'var(--gold)':'var(--success)'}">${s[2]}</span></div></div>`).join('')}
      </div>
      <div class="card card--flush table-scroll">
        <table class="table">
          <thead><tr style="background:var(--bg-alt)">${['Atleta','Estágio','Desde','Região','Score','Valor atual',''].map(h=>`<th style="padding:14px 16px">${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${pipeline.map(p=>`<tr style="cursor:default">
              <td style="padding:14px 16px"><div style="display:flex;align-items:center;gap:10px">${avatarHTML(p.name,{size:36})}<span style="font-weight:600;font-size:14px">${p.name}</span></div></td>
              <td style="padding:14px 16px">${tagHTML(p.stage, p.stage==='Negociado'?'accent':p.stage==='Contratado'?'ink':'outline')}</td>
              <td style="padding:14px 16px;font-family:var(--font-mono);font-size:12px">${p.since}</td>
              <td style="padding:14px 16px;font-size:13px">${p.region}</td>
              <td style="padding:14px 16px;font-family:var(--font-display);font-weight:800;font-size:16px">${p.score}</td>
              <td style="padding:14px 16px;font-family:var(--font-display);font-weight:900;font-size:18px;letter-spacing:-.02em">${p.valuation}</td>
              <td style="padding:14px 16px;text-align:right"><button class="btn btn--ghost btn--sm">Ver histórico</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ---------------- EVENTOS ---------------- */
function renderEventos() {
  screenEl.innerHTML = `
    <div class="page-head"><div><div class="kicker" style="text-transform:uppercase">Operação</div><h1 class="display h2" style="margin:6px 0">Peneiras</h1></div><button class="btn btn--primary">+ Nova peneira</button></div>
    <div class="g g-3 pad" style="gap:16px">
      ${MOCK.EVENTS.map(e=>{
        const tone=e.status==='aberta'?'success':e.status==='encerrada'?'outline':'accent';
        return `<div class="card card--flush">
          <div style="padding:14px 16px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">${tagHTML('● '+e.status,tone)}<span style="font-family:var(--font-mono);font-size:10px;color:var(--ink-mute)">${e.id.toUpperCase()}</span></div>
          <div style="padding:20px">
            <div class="display" style="font-size:24px;letter-spacing:-.02em">${e.city}</div>
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);margin-top:4px">${fmtDate(e.date)} · ${e.age}</div>
            <div class="g g-2" style="margin-top:16px;gap:12px">${statHTML('Inscritos',fmtNum(e.registered))}${statHTML('Vagas',(e.called||0)+'/'+e.capacity)}</div>
            ${e.present>0?`<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line-soft)"><div class="kicker" style="text-transform:uppercase;margin-bottom:8px">Resultado</div><div style="display:flex;gap:6px;font-family:var(--font-mono);font-size:11px"><span>${e.present} pres.</span><span style="color:var(--ink-mute)">·</span><span style="color:var(--success)">${e.approved} aprov.</span><span style="color:var(--ink-mute)">·</span><span>${Math.round(e.approved/e.present*100)}% taxa</span></div></div>`:''}
          </div>
          <div class="btn-row" style="padding:12px;border-top:1px solid var(--line-soft);display:flex;gap:8px"><button class="btn btn--ghost btn--sm">Editar</button><button class="btn btn--ghost btn--sm">Inscritos</button><button class="btn btn--primary btn--sm" style="margin-left:auto">Relatório →</button></div>
        </div>`;
      }).join('')}
    </div>`;
}
