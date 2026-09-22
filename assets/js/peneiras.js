/* ============================================================
   PENEIRAS ON — Calendário público (peneiras.html)
   Mostra a temporada a quem ainda não tem conta e converte em cadastro.
   Nada de dado pessoal aqui: card, filtro e contagem vêm de components.js
   e são os mesmos da versão logada (atleta.html?tela=peneiras).
   ============================================================ */
mountSiteHeader('peneiras.html');
mountSiteFooter();

const season = MOCK.SEASON;
const seasonLine = document.querySelector('[data-season-line]');
const highlight = document.querySelector('[data-highlight]');
const rows = document.querySelector('[data-rows]');
const count = document.querySelector('[data-count]');
const stateFilter = document.querySelector('[data-state-filter]');
const statusFilters = document.querySelector('[data-status-filters]');

if (!seasonLine || !highlight || !rows || !count || !stateFilter || !statusFilters) {
  throw new Error('peneiras.html está incompleta: faltam elementos essenciais do calendário.');
}
const filters = { status: 'all', state: 'all' };

/* ---------- Linha da temporada ---------- */
document.querySelector('[data-season-line]').textContent =
  `${season.events} peneiras · ${season.states} estados · inscrição gratuita`;

/* ---------- Destaque: próxima peneira + contagem regressiva ---------- */
function renderHighlight() {
  const e = season.nextEvent;
  const status = eventStatus(e);
  const closed = status === 'encerrada';
  const cta = closed
    ? `<button class="btn btn--ghost btn--lg" disabled>Encerrada</button>`
    : `<a href="login.html?tipo=jogador&evento=${esc(e.id)}" class="btn btn--accent btn--lg">Quero participar →</a>`;
  document.querySelector('[data-highlight]').innerHTML = `
    <div class="card card--flush flex flex-col">
      <div class="py-3.5 px-5 border-b border-b-line flex justify-between items-center gap-2 flex-wrap">
        ${tagHTML('● ' + status, EVENT_STATUS_TONE[status] || 'outline')}
        <span class="font-mono text-10 text-ink-mute">${e.age.replace('-', ' – ')} anos</span>
      </div>
      <div class="pad flex flex-col gap-5 flex-1">
        <div>
          <div class="kicker uppercase">${e.name}</div>
          <h2 class="display h2 mt-2 mb-0 mx-0">${e.city}<span class="text-ink-mute"> · ${e.state}</span></h2>
          <div class="font-mono text-13 text-ink-soft mt-2">${fmtDate(e.date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
        <div class="g g-3 gap-3 pt-4 border-t border-t-line-soft">
          ${statHTML('Inscritos', fmtNum(e.registered))}
          ${statHTML('Vagas', e.capacity)}
          ${statHTML('Faixa etária', e.age.replace('-', '–'))}
        </div>
        ${progressHTML(Math.min(e.registered, e.capacity * 5), e.capacity * 5, { sm: true, tone: closed ? 'ink' : 'accent', label: 'Lotação', sublabel: `${fmtNum(e.registered)} / ${fmtNum(e.capacity * 5)}` })}
        <div class="mt-auto">${cta}</div>
      </div>
    </div>
    <div class="card p-7 flex flex-col gap-5">
      <div class="section-label"><span class="section-label__title">Contagem regressiva</span></div>
      <div class="g g-4 gap-3" data-countdown></div>
      <div class="p-4 bg-bg-alt border border-line-soft text-13 leading-normal text-ink-soft">
        Convocados recebem SMS com local e horário. Chegue com 30 minutos de antecedência e leve documento com foto.
      </div>
    </div>`;
  startCountdown(new Date(e.date + 'T08:00:00'), document);
}

/* ---------- Mapa interativo ----------
   O mapa e o <select> de estado são duas vistas do mesmo filtro: mudar um
   muda o outro. O painel ao lado resume o estado escolhido. */
let mapa = null;
function renderMapPanel() {
  const panel = document.querySelector('[data-map-panel]');
  const uf = filters.state;
  if (!mapa || !panel) return;
  const c = mapa.counts[uf];
  if (uf === 'all' || !c) {
    const open = Object.values(mapa.counts).reduce((a, x) => a + x.open, 0);
    panel.innerHTML = `
      <div class="kicker">Escolha um estado</div>
      <div class="display text-28 mt-2">Toque num estado<br>do mapa.</div>
      <p class="text-13 leading-copy text-ink-soft mt-3 mb-0">${open ? `Há ${open} peneira${open === 1 ? '' : 's'} com inscrição aberta agora. Estados em cinza já tiveram peneira nesta temporada; os apagados recebem em breve.` : 'Nenhuma inscrição aberta neste momento. Novas peneiras abrem onde a demanda aparece.'}</p>`;
    return;
  }
  const list = filterEvents(MOCK.EVENTS, { state: uf });
  panel.innerHTML = `
    <div class="flex items-baseline justify-between gap-3">
      <div class="kicker">${esc(mapa.stateName(uf))}</div>
      ${tagHTML(c.open ? `${c.open} aberta${c.open === 1 ? '' : 's'}` : 'só encerradas', c.open ? 'accent' : 'outline')}
    </div>
    <div class="display text-28 mt-2">${uf} · ${c.total} peneira${c.total === 1 ? '' : 's'}</div>
    <div class="flex flex-col mt-4 border-t border-line-soft">
      ${list.map(e => { const st = eventStatus(e); return `
        <div class="flex items-center justify-between gap-3 py-2.5 border-b border-line-soft text-13">
          <span><span class="font-semibold">${esc(e.city)}</span> <span class="font-mono text-11 text-ink-mute">· ${fmtDotDate(e.date)}</span></span>
          ${tagHTML(st, EVENT_STATUS_TONE[st] || 'outline')}
        </div>`; }).join('')}
    </div>
    <div class="flex gap-2 mt-4 flex-wrap">
      <a href="#calendario" class="btn btn--primary btn--sm" data-map-go>Ver na lista ↓</a>
      <button type="button" class="btn btn--ghost btn--sm" data-map-clear>Limpar</button>
    </div>`;
  panel.querySelector('[data-map-clear]').onclick = () => setState('all', true);
  panel.querySelector('[data-map-go]').onclick = e => {
    e.preventDefault();
    document.getElementById('calendario').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}
/* Único ponto que muda o filtro de estado: mapa, select e painel seguem juntos. */
function setState(uf, announceResult) {
  filters.state = uf || 'all';
  if (mapa) mapa.select(filters.state === 'all' ? null : filters.state);
  renderMapPanel();
  paint(announceResult);
}
function mountMap() {
  const host = document.querySelector('[data-map]');
  if (!host || typeof MapaPeneiras === 'undefined' || typeof BRAZIL_MAP === 'undefined') return;
  mapa = MapaPeneiras.mount(host, {
    events: MOCK.EVENTS,
    onSelect: uf => {
      setState(uf || 'all', true);
      if (uf) announce(`${mapa.stateName(uf)}: ${mapa.counts[uf].open} aberta(s) de ${mapa.counts[uf].total}. Lista filtrada.`);
    },
  });
  const counts = Object.values(mapa.counts);
  const open = counts.reduce((a, x) => a + x.open, 0);
  document.querySelector('[data-map-kpis]').innerHTML =
    statHTML('Abertas agora', open) + statHTML('Na temporada', MOCK.EVENTS.length) + statHTML('Estados', counts.length, { sub: `meta ${MOCK.SEASON.statesGoal}` });
  renderMapPanel();
}

/* ---------- Filtros + grade ---------- */
function paint(announceResult) {
  const data = filterEvents(MOCK.EVENTS, filters);
  document.querySelector('[data-rows]').innerHTML =
    data.length ? data.map((e, i) => eventCardHTML(e, 'publico').replace('<article ', `<article style="--i:${i}" `)).join('') : eventsEmptyHTML();
  document.querySelector('[data-count]').textContent = `${data.length} de ${MOCK.EVENTS.length} peneiras`;
  document.querySelectorAll('[data-status]').forEach(b => {
    const on = b.dataset.status === filters.status;
    b.classList.toggle('btn--primary', on); b.classList.toggle('btn--ghost', !on);
    b.setAttribute('aria-pressed', String(on));
  });
  document.querySelector('[data-state-filter]').value = filters.state;
  const clear = document.querySelector('[data-clear-filters]');
  if (clear) clear.onclick = () => { filters.status = 'all'; setState('all', true); };
  if (announceResult) announce(`${data.length} peneiras na lista`);
}

document.querySelector('[data-status-filters]').innerHTML = EVENT_STATUS_FILTERS
  .map(([k, label]) => `<button type="button" class="btn btn--ghost btn--sm font-mono tracking-label" data-status="${k}" aria-pressed="false">${label}</button>`)
  .join('');
document.querySelector('[data-state-filter]').innerHTML =
  `<option value="all">Todos os estados</option>` +
  eventStates(MOCK.EVENTS).map(uf => `<option value="${uf}">${uf}</option>`).join('');

document.querySelectorAll('[data-status]').forEach(b => b.onclick = () => { filters.status = b.dataset.status; paint(true); });
document.querySelector('[data-state-filter]').onchange = e => setState(e.target.value, true);

renderHighlight();
mountMap();
// ?uf=RJ (link vindo de outra tela) já chega com o estado escolhido
const ufParam = (new URLSearchParams(location.search).get('uf') || '').toUpperCase();
setState(eventStates(MOCK.EVENTS).includes(ufParam) ? ufParam : 'all', false);
