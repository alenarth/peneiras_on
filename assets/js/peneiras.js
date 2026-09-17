/* ============================================================
   PENEIRAS ON — Calendário público (peneiras.html)
   Mostra a temporada a quem ainda não tem conta e converte em cadastro.
   Nada de dado pessoal aqui: card, filtro e contagem vêm de components.js
   e são os mesmos da versão logada (atleta.html?tela=peneiras).
   ============================================================ */
mountSiteHeader('peneiras.html');
mountSiteFooter();

const season = MOCK.SEASON;
const filters = { status: 'all', state: 'all' };

/* ---------- Linha da temporada ---------- */
document.querySelector('[data-season-line]').textContent =
  `${season.events} peneiras · ${season.states} estados · inscrição gratuita`;

/* ---------- Destaque: próxima peneira + contagem regressiva ---------- */
function renderHighlight() {
  const e = season.nextEvent;
  const closed = e.status === 'encerrada';
  const cta = closed
    ? `<button class="btn btn--ghost btn--lg" disabled>Encerrada</button>`
    : `<a href="login.html?tipo=jogador&evento=${esc(e.id)}" class="btn btn--accent btn--lg">Quero participar →</a>`;
  document.querySelector('[data-highlight]').innerHTML = `
    <div class="card card--flush flex flex-col">
      <div class="py-3.5 px-5 border-b border-b-line flex justify-between items-center gap-2 flex-wrap">
        ${tagHTML('● ' + e.status, EVENT_STATUS_TONE[e.status] || 'outline')}
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

/* ---------- Filtros + grade ---------- */
function paint(announceResult) {
  const data = filterEvents(MOCK.EVENTS, filters);
  document.querySelector('[data-rows]').innerHTML =
    data.length ? data.map(e => eventCardHTML(e, 'publico')).join('') : eventsEmptyHTML();
  document.querySelector('[data-count]').textContent = `${data.length} de ${MOCK.EVENTS.length} peneiras`;
  document.querySelectorAll('[data-status]').forEach(b => {
    const on = b.dataset.status === filters.status;
    b.classList.toggle('btn--primary', on); b.classList.toggle('btn--ghost', !on);
    b.setAttribute('aria-pressed', String(on));
  });
  document.querySelector('[data-state-filter]').value = filters.state;
  const clear = document.querySelector('[data-clear-filters]');
  if (clear) clear.onclick = () => { filters.status = 'all'; filters.state = 'all'; paint(true); };
  if (announceResult) announce(`${data.length} peneiras na lista`);
}

document.querySelector('[data-status-filters]').innerHTML = EVENT_STATUS_FILTERS
  .map(([k, label]) => `<button type="button" class="btn btn--ghost btn--sm font-mono tracking-label" data-status="${k}" aria-pressed="false">${label}</button>`)
  .join('');
document.querySelector('[data-state-filter]').innerHTML =
  `<option value="all">Todos os estados</option>` +
  eventStates(MOCK.EVENTS).map(uf => `<option value="${uf}">${uf}</option>`).join('');

document.querySelectorAll('[data-status]').forEach(b => b.onclick = () => { filters.status = b.dataset.status; paint(true); });
document.querySelector('[data-state-filter]').onchange = e => { filters.state = e.target.value; paint(true); };

renderHighlight();
paint(false);
