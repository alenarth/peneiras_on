/* ============================================================
   PENEIRAS ON — Atleta (status · perfil · peneiras)
   ============================================================ */
const ME = MOCK.ATHLETES[0];
const screenEl = document.querySelector('[data-screen]');
const params = new URLSearchParams(location.search);
const SCREENS = { status: renderStatus, perfil: renderPerfil, peneiras: renderPeneiras };
const telaParam = params.get('tela') || 'status';
// ?tela= desconhecido cai na tela padrão em vez de deixar o <main> vazio
const tela = SCREENS[telaParam] ? telaParam : 'status';

// Link antigo: o wizard de cadastro virou página pública (cadastro.html).
// Redireciona preservando ?evento= em vez de cair em silêncio no status.
const legacyCadastro = telaParam === 'cadastro';
if (legacyCadastro) {
  const ev = params.get('evento');
  location.replace('cadastro.html' + (ev ? '?evento=' + encodeURIComponent(ev) : ''));
}

// marca aba ativa
document.querySelectorAll('.atleta-tab').forEach(t => {
  if (t.getAttribute('data-tab') === tela) t.classList.add('is-active');
});

if (!legacyCadastro) SCREENS[tela]();

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
