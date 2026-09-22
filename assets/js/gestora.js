/* ============================================================
   PENEIRAS ON — Gestora (dashboard · mapa · pipeline · eventos)
   ============================================================ */
const screenEl = document.querySelector('[data-screen]');
if (!screenEl) {
  throw new Error('gestora.html está sem [data-screen]; o script não pode inicializar.');
}
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
function sparkline(data, w=140, h=28, color='var(--color-ink)') {
  const max=Math.max(...data), min=Math.min(...data), range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1)*w).toFixed(1)},${(h-((v-min)/range)*h).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="block"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
}
function funnelHTML() {
  const max=MOCK.FUNNEL[0].value;
  return `<div class="flex flex-col">` + MOCK.FUNNEL.map((f,i)=>{
    const ratio=f.value/max;
    const prev=i>0?MOCK.FUNNEL[i-1].value:null;
    const drop=prev?f.value/prev:1;
    const last=i===MOCK.FUNNEL.length-1;
    const clip = !last ? `clip-path:polygon(0 0,100% 0,${(50+50*drop).toFixed(1)}% 100%,${(50-50*drop).toFixed(1)}% 100%)` : '';
    return `<div class="relative py-5 px-0 ${!last?'border-b border-line-soft':''}">
      <div class="flex items-baseline justify-between">
        <div class="flex items-baseline gap-3"><span class="mono text-mute">${String(i+1).padStart(2,'0')}</span><span class="font-display font-extrabold text-16 uppercase">${f.stage}</span><span class="font-mono text-11 text-ink-soft">${f.delta}</span></div>
        <span class="display text-28">${fmtNum(f.value)}</span>
      </div>
      <div class="mt-2 relative h-7 bg-bg-alt"><div class="funnel-bar ${last?'bg-accent':'bg-ink'}" style="width:${(ratio*100).toFixed(1)}%;${clip}"></div></div>
    </div>`;
  }).join('') + `</div>`;
}
function timelineChart() {
  const max=Math.max(...MOCK.TIMELINE.map(d=>d.v));
  return `<div class="flex items-end gap-0.75 h-40">` + MOCK.TIMELINE.map((d,i)=>`<div class="flex-1 flex flex-col items-center gap-1"><div class="w-full ${i===MOCK.TIMELINE.length-1?'bg-accent':'bg-ink'}" style="height:${(d.v/max*140).toFixed(0)}px"></div><span class="font-mono text-9 text-ink-mute">${d.d}</span></div>`).join('') + `</div>`;
}

/* ---------------- DASHBOARD ---------------- */
function renderDashboard() {
  const active = ['SP','RJ','PE','PR','AM'];
  screenEl.innerHTML = `
    <div class="page-head">
      <div><div class="kicker uppercase">Boa tarde, Marina</div><h1 class="display h2 my-1.5 mx-0">Dashboard</h1></div>
      <div class="page-head__actions flex gap-2">
        <label class="sr-only" for="period">Período do dashboard</label>
        <select class="sel2" id="period"><option>Temporada 2026 · até hoje</option><option>Últimos 30 dias</option><option>Comparar com 2025</option></select>
        <button class="btn btn--ghost btn--sm">Exportar PDF</button>
        <a href="gestora.html?tela=eventos" class="btn btn--primary btn--sm">+ Nova peneira</a>
      </div>
    </div>

    <div class="kpi-strip g g-5" >
      <div>${statHTML('Inscritos · campanha','18.420',{delta:'+412 hoje'})}<div class="mt-2">${sparkline(MOCK.TIMELINE.map(t=>t.v))}</div></div>
      <div>${statHTML('Cidades atingidas','127',{delta:'+24 vs 2025'})}</div>
      <div>${statHTML('Conversão final','12,7%',{delta:'aprovados/convocados'})}</div>
      <div>${statHTML('ROI médio','R$ 38',{delta:'por inscrição válida'})}</div>
      <div>${statHTML('Aprovados','187',{delta:'em formação'})}</div>
    </div>

    <div class="g g-main-wide pad gap-6">
      <div class="card p-6">
        <div class="section-label"><span class="section-label__title">Funil de conversão · temporada</span><span class="section-label__action">${tagHTML('RF-22 · RF-30','outline')}</span></div>
        ${funnelHTML()}
      </div>
      <div class="card p-6">
        <div class="section-label"><span class="section-label__title">Inscrições · 14 dias</span></div>
        ${timelineChart()}
        <div class="g g-2 mt-4 pt-4 border-t border-t-line-soft gap-3">
          ${statHTML('Pico semanal','2.210',{sub:'Sáb'})}
          ${statHTML('Média / dia','1.318',{delta:'+12% WoW'})}
        </div>
      </div>
    </div>

    <div class="g g-main pt-0 pb-8 px-8 gap-6">
      <div class="card p-6">
        <div class="section-label"><span class="section-label__title">Demanda por região</span><span class="section-label__action"><a href="gestora.html?tela=mapa" class="btn btn--ghost btn--sm">Abrir mapa →</a></span></div>
        <div class="table-scroll"><table class="table text-13">
          <thead><tr>${['Região','Inscritos','Peneira ativa?','Demanda','Sugestão'].map(h=>`<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${MOCK.REGIONS.slice().sort((a,b)=>b.value-a.value).slice(0,8).map(r=>{
              const act=active.includes(r.state);
              const sug=!act&&r.demand>0.6?'Abrir peneira':act?'—':'Monitorar';
              return `<tr class="cursor-default">
                <td class="font-semibold">${r.label} <span class="font-mono text-10 text-ink-soft">(${r.state})</span></td>
                <td class="font-mono">${fmtNum(r.value)}</td>
                <td>${tagHTML(act?'● sim':'○ não', act?'success':'outline')}</td>
                <td class="w-45"><div class="flex items-center gap-2"><div class="flex-1 h-1 bg-bg-alt"><div class="h-full ${r.demand>0.8?'bg-danger':r.demand>0.6?'bg-accent':'bg-ink'}" style="width:${(r.demand*100).toFixed(0)}%"></div></div><span class="font-mono text-11 w-8 text-right">${Math.round(r.demand*100)}</span></div></td>
                <td>${tagHTML(sug, sug==='Abrir peneira'?'accent':'outline')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>
      <div class="card p-6">
        <div class="section-label"><span class="section-label__title">Próximas peneiras</span></div>
        ${MOCK.EVENTS.slice(0,4).map((e,i)=>`<div class="py-3 px-0 ${i?'border-t border-line-soft':''}">
          <div class="flex justify-between items-baseline"><span class="font-display font-extrabold text-14 uppercase">${e.city}</span><span class="font-mono text-11 text-ink-soft">${fmtDate(e.date,{day:'2-digit',month:'short'})}</span></div>
          <div class="mt-1.5">${progressHTML(Math.min(e.registered,e.capacity*5),e.capacity*5,{xs:true,tone:e.registered/e.capacity>3?'accent':'ink'})}</div>
          <div class="mt-1 font-mono text-10 text-ink-soft flex justify-between"><span>${fmtNum(e.registered)} insc.</span><span>${e.capacity} vagas</span></div>
        </div>`).join('')}
      </div>
    </div>`;
}

/* ---------------- MAPA DE CALOR ----------------
   Choropleth sobre a malha real dos estados (mapa-calor.js), no lugar das
   bolhas posicionadas em % sobre um contorno decorativo: a cor de cada estado
   é a intensidade da demanda, e a legenda explica faixa a faixa. */
function renderMapa() {
  const FILTERS = [['all','Tudo'],['demanda','Demanda alta'],['cobertura','Com peneira'],['gap','Demanda reprimida']];
  let selected = null, filter = 'all', mapa = null;

  function filterHint() {
    return {
      all: 'Todas as regiões monitoradas.',
      demanda: 'Destaque: regiões com demanda acima de 65%.',
      cobertura: 'Destaque: regiões com peneira aberta na temporada.',
      gap: 'Destaque: demanda alta ainda sem peneira aberta.',
    }[filter];
  }

  function render() {
    screenEl.innerHTML = `
      <div class="page-head">
        <div><div class="kicker uppercase">Inteligência geográfica · RF-29</div><h1 class="display h2 my-1.5 mx-0">Mapa de calor</h1></div>
        <div class="page-head__actions flex gap-2 flex-wrap">
          ${FILTERS.map(f=>`<button class="map-filter ${filter===f[0]?'is-active':''}" data-f="${f[0]}" aria-pressed="${filter===f[0]}">${f[1]}</button>`).join('')}
        </div>
      </div>
      <div class="g g-panel-md pad gap-6 items-start">
        <div class="flex flex-col gap-4">
          <div class="card p-6" data-map></div>
          <div class="font-mono text-11 text-ink-soft" data-hint>${filterHint()}</div>
        </div>
        <div class="flex flex-col gap-4">
          <div data-panel></div>
          <div class="card p-5">
            <div class="section-label"><span class="section-label__title">Top demandas reprimidas</span></div>
            ${topGaps()}
          </div>
        </div>
      </div>`;

    const host = screenEl.querySelector('[data-map]');
    mapa = MapaCalor.mount(host, {
      filter,
      selectedId: selected && selected.id,
      onSelect: r => {
        // clicar de novo no mesmo estado limpa a seleção
        selected = selected && selected.id === r.id ? null : r;
        render();
        if (selected) announce(`${selected.label}: demanda ${Math.round(selected.demand*100)}%, ${MapaCalor.bandOf(selected.demand).label.toLowerCase()}.`);
      },
    });
    host.insertAdjacentHTML('beforeend', MapaCalor.legendHTML(mapa.covered));

    renderPanel();
    screenEl.querySelectorAll('.map-filter').forEach(f=>f.onclick=()=>{
      filter=f.dataset.f;
      render();
      announce(filterHint());
    });
  }

  /* Demanda alta sem peneira aberta: a lista que justifica a próxima peneira. */
  function topGaps() {
    const covered = MapaCalor.coveredStates(MOCK.EVENTS);
    const gaps = MOCK.REGIONS.filter(r=>!covered.has(r.state)).sort((a,b)=>b.demand-a.demand).slice(0,5);
    if (!gaps.length) return `<p class="text-13 text-ink-soft m-0">Todas as regiões monitoradas já têm peneira aberta.</p>`;
    return gaps.map((r,i)=>{
      const band = MapaCalor.bandOf(r.demand);
      return `<button type="button" class="g g-row-rank items-center gap-2.5 w-full py-3 px-0 text-left cursor-pointer bg-transparent border-0 ${i?'border-t border-line-soft':''} transition-colors duration-150 hover:text-accent-text" data-gap="${esc(r.id)}">
        <span class="mono text-mute">${String(i+1).padStart(2,'0')}</span>
        <span class="text-13 font-semibold">${esc(r.label)} <span class="font-mono text-10 text-ink-soft">(${r.state})</span></span>
        <span class="inline-flex items-center gap-1.5 font-mono text-11"><span class="size-2.5 rounded-sm" style="background:${band.color}"></span>${Math.round(r.demand*100)}%</span>
      </button>`;
    }).join('');
  }

  function renderPanel() {
    const p = screenEl.querySelector('[data-panel]');
    if (!selected) {
      p.innerHTML = `<div class="card p-6">
        <div class="kicker">Escolha um estado</div>
        <div class="display text-28 leading-heading-sm mt-3">Clique num estado<br>do mapa.</div>
        <p class="mt-4 mb-0 text-14 leading-copy-lg text-ink-soft">A cor mostra a intensidade da demanda; o ponto claro marca quem já tem peneira aberta. Ao escolher, você vê inscritos, demanda e a sugestão do sistema.</p>
      </div>`;
    } else {
      const band = MapaCalor.bandOf(selected.demand);
      const hasEvent = mapa.covered.has(selected.state);
      p.innerHTML = `<div class="card p-6">
        <div class="flex items-baseline justify-between gap-3">
          ${tagHTML(selected.state,'accent')}
          <span class="inline-flex items-center gap-2 font-mono text-11 uppercase tracking-label"><span class="size-3 rounded-sm" style="background:${band.color}"></span>Demanda ${band.label.toLowerCase()}</span>
        </div>
        <div class="display text-28 leading-heading-sm mt-3 tracking-display">${esc(selected.label)}</div>
        <div class="g g-2 gap-4 mt-5">
          ${statHTML('Inscritos', fmtNum(selected.value))}
          ${statHTML('Demanda', Math.round(selected.demand*100)+'%', { sub: hasEvent ? 'com peneira aberta' : 'sem peneira aberta' })}
        </div>
        <div class="mt-5 p-4 rounded-lg bg-bg-alt border-l-4" style="border-color:${band.color}">
          <div class="kicker uppercase">Sugestão do sistema</div>
          <p class="text-13 mt-2 leading-copy m-0">${
            selected.demand > 0.85 && !hasEvent ? 'Demanda crítica e sem peneira aberta. Abrir nova peneira nos próximos 30 dias para evitar perda de talentos.'
            : selected.demand > 0.65 && !hasEvent ? 'Demanda alta sem peneira aberta. Avaliar abertura ainda nesta temporada.'
            : hasEvent ? 'Peneira aberta atende a demanda atual. Manter a campanha até o encerramento das inscrições.'
            : 'Demanda em monitoramento. Manter campanha digital ativa.'}</p>
        </div>
        <div class="btn-row btn-row--even gap-2 mt-5">
          <a class="btn btn--primary btn--sm" href="gestora.html?tela=eventos">+ Criar peneira</a>
          <button type="button" class="btn btn--ghost btn--sm" data-clear-sel>Limpar</button>
        </div>
      </div>`;
      p.querySelector('[data-clear-sel]').onclick = () => { selected = null; render(); };
    }
    // a lista de demanda reprimida seleciona o estado no mapa
    screenEl.querySelectorAll('[data-gap]').forEach(b => b.onclick = () => {
      selected = MOCK.REGIONS.find(r => r.id === b.dataset.gap);
      render();
      announce(`${selected.label} selecionado no mapa.`);
    });
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
    <div class="page-head items-start"><div><div class="kicker uppercase">RF-33 · RF-34 · revenue share</div><h1 class="display h2 my-1.5 mx-0">Pipeline de talentos</h1></div></div>
    <div class="pad">
      <div class="g g-4 mb-6 border border-line">
        ${[['Aprovados ativos','187','em formação',false],['Contratados','24','desde 2025',false],['Negociados','3','transferências',false],['Valor gerado','R$ 2,1M','revenue share acumulado',true]].map((s,i)=>`<div class="py-5 px-6 relative overflow-hidden ${i<3?'border-r border-line-soft':''}">${s[3]?'<div class="absolute top-0 right-0 w-15 h-15 glow-gold-softer"></div>':''}<div class="relative"><span class="stat__label">${s[0]}</span><div class="display text-36 mt-1" style="color:${s[3]?'var(--color-gold)':'var(--color-ink)'}">${s[1]}</div><span class="stat__delta ${s[3]?'text-gold':'text-success'}">${s[2]}</span></div></div>`).join('')}
      </div>
      <div class="card card--flush table-scroll">
        <table class="table">
          <thead><tr class="bg-bg-alt">${['Atleta','Estágio','Desde','Região','Score','Valor atual',''].map(h=>`<th class="py-3.5 px-4">${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${pipeline.map(p=>`<tr class="cursor-default">
              <td class="py-3.5 px-4"><div class="flex items-center gap-2.5">${avatarHTML(p.name,{size:36})}<span class="font-semibold text-14">${p.name}</span></div></td>
              <td class="py-3.5 px-4">${tagHTML(p.stage, p.stage==='Negociado'?'accent':p.stage==='Contratado'?'ink':'outline')}</td>
              <td class="py-3.5 px-4 font-mono text-12">${p.since}</td>
              <td class="py-3.5 px-4 text-13">${p.region}</td>
              <td class="py-3.5 px-4 font-display font-extrabold text-16">${p.score}</td>
              <td class="py-3.5 px-4 font-display font-black text-18 tracking-display">${p.valuation}</td>
              <td class="py-3.5 px-4 text-right"><button class="btn btn--ghost btn--sm">Ver histórico</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ---------------- EVENTOS ---------------- */
function renderEventos() {
  screenEl.innerHTML = `
    <div class="page-head"><div><div class="kicker uppercase">Operação</div><h1 class="display h2 my-1.5 mx-0">Peneiras</h1></div><button class="btn btn--primary">+ Nova peneira</button></div>
    <div class="g g-3 pad gap-4">
      ${MOCK.EVENTS.map(e=>{
        const tone=e.status==='aberta'?'success':e.status==='encerrada'?'outline':'accent';
        return `<div class="card card--flush">
          <div class="py-3.5 px-4 border-b border-b-line flex justify-between items-center">${tagHTML('● '+e.status,tone)}<span class="font-mono text-10 text-ink-mute">${e.id.toUpperCase()}</span></div>
          <div class="p-5">
            <div class="display text-24 tracking-display">${e.city}</div>
            <div class="font-mono text-11 text-ink-soft mt-1">${fmtDate(e.date)} · ${e.age}</div>
            <div class="g g-2 mt-4 gap-3">${statHTML('Inscritos',fmtNum(e.registered))}${statHTML('Vagas',(e.called||0)+'/'+e.capacity)}</div>
            ${e.present>0?`<div class="mt-4 pt-4 border-t border-t-line-soft"><div class="kicker uppercase mb-2">Resultado</div><div class="flex gap-1.5 font-mono text-11"><span>${e.present} pres.</span><span class="text-ink-mute">·</span><span class="text-success">${e.approved} aprov.</span><span class="text-ink-mute">·</span><span>${Math.round(e.approved/e.present*100)}% taxa</span></div></div>`:''}
          </div>
          <div class="btn-row p-3 border-t border-t-line-soft flex gap-2"><button class="btn btn--ghost btn--sm">Editar</button><button class="btn btn--ghost btn--sm">Inscritos</button><button class="btn btn--primary btn--sm ml-auto">Relatório →</button></div>
        </div>`;
      }).join('')}
    </div>`;
}
