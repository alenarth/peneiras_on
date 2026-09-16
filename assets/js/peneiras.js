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
    <div class="card card--flush" style="display:flex;flex-direction:column">
      <div style="padding:14px 20px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        ${tagHTML('● ' + e.status, EVENT_STATUS_TONE[e.status] || 'outline')}
        <span style="font-family:var(--font-mono);font-size:10px;color:var(--ink-mute)">${e.age.replace('-', ' – ')} anos</span>
      </div>
      <div class="pad" style="display:flex;flex-direction:column;gap:20px;flex:1">
        <div>
          <div class="kicker" style="text-transform:uppercase">${e.name}</div>
          <h2 class="display h2" style="margin:8px 0 0">${e.city}<span style="color:var(--ink-mute)"> · ${e.state}</span></h2>
          <div style="font-family:var(--font-mono);font-size:13px;color:var(--ink-soft);margin-top:8px">${fmtDate(e.date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
        <div class="g g-3" style="gap:12px;padding-top:16px;border-top:1px solid var(--line-soft)">
          ${statHTML('Inscritos', fmtNum(e.registered))}
          ${statHTML('Vagas', e.capacity)}
          ${statHTML('Faixa etária', e.age.replace('-', '–'))}
        </div>
        ${progressHTML(Math.min(e.registered, e.capacity * 5), e.capacity * 5, { sm: true, tone: closed ? 'ink' : 'accent', label: 'Lotação', sublabel: `${fmtNum(e.registered)} / ${fmtNum(e.capacity * 5)}` })}
        <div style="margin-top:auto">${cta}</div>
      </div>
    </div>
    <div class="card" style="padding:28px;display:flex;flex-direction:column;gap:20px">
      <div class="section-label"><span class="section-label__title">Contagem regressiva</span></div>
      <div class="g g-4" style="gap:12px" data-countdown></div>
      <div style="padding:16px;background:var(--bg-alt);border:1px solid var(--line-soft);font-size:13px;line-height:1.5;color:var(--ink-soft)">
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
  .map(([k, label]) => `<button type="button" class="btn btn--ghost btn--sm" data-status="${k}" aria-pressed="false" style="font-family:var(--font-mono);letter-spacing:.08em">${label}</button>`)
  .join('');
document.querySelector('[data-state-filter]').innerHTML =
  `<option value="all">Todos os estados</option>` +
  eventStates(MOCK.EVENTS).map(uf => `<option value="${uf}">${uf}</option>`).join('');

document.querySelectorAll('[data-status]').forEach(b => b.onclick = () => { filters.status = b.dataset.status; paint(true); });
document.querySelector('[data-state-filter]').onchange = e => { filters.state = e.target.value; paint(true); };

renderHighlight();
paint(false);
