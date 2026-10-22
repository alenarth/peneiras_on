/* ============================================================
   PENEIRAS ON — Atleta (status · perfil · peneiras · mensagens)
   Os dados chegam por fetch (data.js): a tela mostra o carregando, e só
   então ME e a tela escolhida são montados.
   ============================================================ */
let ME = null;   // MOCK.ATHLETES[0] — o atleta "logado" do protótipo
const screenEl = document.querySelector('[data-screen]');
if (!screenEl) {
  throw new Error('atleta.html está sem [data-screen]; o script não pode inicializar.');
}
const params = new URLSearchParams(location.search);
const SCREENS = { status: renderStatus, perfil: renderPerfil, peneiras: renderPeneiras, mensagens: renderMensagens };
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

if (!legacyCadastro) Dados.iniciar(() => { ME = MOCK.ATHLETES[0]; SCREENS[tela](); }, {
  vitrine: screenEl,
  mensagem: 'Carregando sua conta…',
  erro: 'Os dados da sua conta não chegaram.',
});

/* ---------------- STATUS ---------------- */
function renderStatus() {
  const nextEvent = MOCK.SEASON.nextEvent;
  const eventDate = new Date(nextEvent.date + 'T08:00:00');
  screenEl.innerHTML = `<div class="atleta-main">
    <div class="flex items-baseline justify-between gap-3 flex-wrap mb-8">
      <div>
        <div class="kicker uppercase">Olá, Lucas</div>
        <h1 class="display h1 mt-1.5 mb-0 mx-0">Você foi <span class="mark">convocado.</span></h1>
      </div>
      <span class="tag tag--accent">● convocado</span>
    </div>

    <div class="g g-main gap-6 mb-6">
      <div class="card--dark p-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-50 h-50 glow-accent"></div>
        <div class="relative">
          <div class="flex justify-between items-baseline mb-4">
            <span class="kicker text-ink/55">Sua próxima peneira</span>
            <span class="font-mono text-11 text-accent">● ATIVA</span>
          </div>
          <div class="display text-56 tracking-display-lg">${eventShortName(nextEvent)}</div>
          <div class="g g-3 gap-6 mt-8 pt-6 border-t border-t-ink/20">
            <div><div class="kicker text-ink/55">Data</div><div class="display text-22 mt-1">${fmtDotDate(nextEvent.date, 'short')}</div></div>
            <div><div class="kicker text-ink/55">Horário</div><div class="display text-22 mt-1">08h00</div></div>
            <div><div class="kicker text-ink/55">Sua vaga</div><div class="display text-22 mt-1">#047/120</div></div>
          </div>
          <div class="mt-6 text-14 opacity-85">${nextEvent.city}/${nextEvent.state} · local exato e horário chegam por SMS na convocação</div>
          <div class="btn-row btn-row--even gap-2 mt-5 max-w-form">
            <button class="btn btn--accent">Adicionar ao calendário</button>
            <button class="btn btn--ghost btn--on-dark">Ver instruções</button>
          </div>
        </div>
      </div>

      <div class="card p-7">
        <div class="section-label"><span class="section-label__title">Seu score</span></div>
        <div class="g g-2 gap-5 mb-5">
          ${statHTML('Completude', ME.completeness+'%', {big:true, sub:'perfil'})}
          ${statHTML('Ranking', '#23', {big:true, sub:'entre 487'})}
        </div>
        ${progressHTML(ME.completeness, 100, {label:'Próximo passo: + 1 vídeo', sublabel:'+8 pts'})}
        <div class="btn-row flex gap-2 mt-4">
          <a href="atleta.html?tela=perfil" class="btn btn--primary btn--full">Ver perfil completo</a>
          <a href="atleta.html?tela=perfil" class="btn btn--ghost">Editar</a>
        </div>
      </div>
    </div>

    <div class="g g-main gap-6">
      <div class="card p-7">
        <div class="section-label"><span class="section-label__title">Linha do tempo</span><span class="section-label__action">${tagHTML('RF-19','outline')}</span></div>
        ${[
          ['02·MAI','Inscrição realizada','completed'],
          ['04·MAI','Score consolidado em 92%','completed'],
          ['10·MAI','Convocação confirmada via SMS','completed'],
          ['15·JUN','Peneira presencial · Caxias','next'],
          ['—','Avaliação do olheiro','future'],
          ['—','Resposta final','future'],
        ].map((e,i)=>`<div class="g g-row-time gap-3 py-3.5 px-0 items-center ${i?'border-t border-line-soft':''}">
          <span class="font-mono text-11 text-ink-soft">${e[0]}</span>
          <span class="w-3 h-3 rounded-full border-[1.5px] border-ink ${e[2]==='completed'?'bg-ink':e[2]==='next'?'bg-accent':'bg-transparent'}"></span>
          <span class="text-14 ${e[2]==='next'?'font-bold':'font-normal'}">${e[1]}</span>
        </div>`).join('')}
      </div>

      <div class="card p-7">
        <div class="section-label"><span class="section-label__title">Contagem regressiva</span><span class="section-label__action" data-countdown-state></span></div>
        <div class="g g-4 gap-3 mb-5" data-countdown></div>
        <div class="p-4 bg-accent text-accent-ink">
          <div class="kicker text-accent-ink mb-1.5">Lembrete</div>
          <div class="text-13 leading-normal">Chegue com 30 minutos de antecedência. Leve documento com foto e a confirmação SMS.</div>
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
  const runners = ranked.slice(1,4).map(r=>`<div class="g g-row-bar gap-2 items-center"><span class="font-mono text-11 text-ink-soft uppercase">${r.pos}</span><div class="h-1 bg-bg-alt relative"><div class="absolute inset-0" style="width:${(r.score*100).toFixed(0)}%;background:${MOCK.POS_COLORS[r.pos]}"></div></div><span class="font-mono text-11 text-ink-soft text-right">${(r.score*100).toFixed(0)}%</span></div>`).join('');

  screenEl.innerHTML = `<div class="atleta-main">
    <div class="mb-8">
      <span class="tag tag--outline">Seu perfil</span>
      <h1 class="display h1 mt-2 mb-0 mx-0">${ME.name}</h1>
      <div class="font-mono text-13 text-ink-soft mt-1.5">${ME.position.toUpperCase()} · ${ME.age} anos · ${ME.city}/${ME.state} · ${ME.club}</div>
    </div>

    <div class="g g-aside-md gap-6 mb-6">
      <div class="card p-6">
        ${Foto.campoHTML({ id: 'perfil-foto', rotulo: 'Foto de perfil', grande: true, previa: fotoPerfil, alt: `Pré-visualização da foto de perfil de ${ME.name}` })}
        <div class="g g-4 border-t border-t-line-soft mt-4">
          ${[['Altura',ME.height+'cm'],['Peso',ME.weight+'kg'],['Pé',ME.foot[0]],['Tempo',ME.yearsPlaying+'a']].map((s,i)=>`<div class="py-3.5 px-1.5 text-center ${i<3?'border-r border-line-soft':''}"><div class="display text-22">${s[1]}</div><div class="font-mono text-9 text-ink-mute uppercase tracking-widest mt-0.5">${s[0]}</div></div>`).join('')}
        </div>
        <button type="button" class="btn btn--ghost btn--full mt-4">Editar perfil</button>
      </div>

      <div class="card p-7">
        <div class="section-label"><span class="section-label__title">Perfil tático</span><span class="section-label__action">${tagHTML('IA','gold')}</span></div>
        <div class="g g-2 gap-6 items-center">
          <div class="flex justify-center">${buildRadarSVG(ME.attrs,{size:340,fill:MOCK.POS_COLORS[top.pos],compareProfile:MOCK.POSITION_PROFILES[top.pos]})}</div>
          <div>
            <div class="kicker uppercase mb-2">Perfil tático sugerido</div>
            <div class="display text-36">${top.pos}</div>
            <div class="display text-18 mt-1" style="color:${MOCK.POS_COLORS[top.pos]}">${(top.score*100).toFixed(0)}% match</div>
            <div class="mt-4 flex flex-col gap-1.5">${runners}</div>
          </div>
        </div>
        <div class="mt-5 p-3.5 bg-bg-alt font-mono text-11 text-ink-soft leading-normal">Classificação por similaridade dos seus atributos com perfis-base de cada posição. Atualizada a cada avaliação do olheiro.</div>
      </div>
    </div>

    <div class="card p-6 mb-6">
      <div class="section-label"><span class="section-label__title">Comunidade</span><span class="section-label__action">${Feed.followButtonHTML(ME)}</span></div>
      <div class="kicker uppercase mb-2">Atributos confirmados por quem viu você jogar</div>
      <div class="flex flex-wrap gap-1.5" data-tags>${Feed.attrTagsHTML(ME)}</div>
      <div class="font-mono text-10 text-ink-mute mt-3">As confirmações e os seguidores são os mesmos dos <a href="feed.html" class="text-ink underline underline-offset-3">destaques</a> e ficam salvos neste navegador.</div>
    </div>

    <div class="g g-main gap-6">
      <div class="card p-6">
        <div class="section-label"><span class="section-label__title">Mídias</span><span class="section-label__action">${tagHTML('+25 pts','outline')}</span></div>
        <div class="g g-4 gap-3">
          ${[1,2,3].map(i=>`<div class="player-img aspect-[3/4]">VÍDEO ${i}</div>`).join('')}
          <button class="player-img bg-card bg-none border border-dashed border-line cursor-pointer flex-col gap-1 text-ink aspect-[3/4]"><span class="text-24">+</span><span class="font-mono text-10 uppercase">Adicionar</span></button>
        </div>
      </div>

      <div class="card--dark p-6 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-30 h-30 glow-gold"></div>
        <div class="relative">
          <span class="tag tag--gold">Plano Premium</span>
          <div class="display text-26 mt-2"><span class="gold">Premium</span> · gratuito</div>
          <div class="font-mono text-11 opacity-70 mt-1.5">Concedido como aluno de escola parceira.</div>
          <ul class="mt-4 p-0 list-none flex flex-col gap-2">
            ${['Score detalhado por critério','Posição no ranking visível','Destaque visual para olheiros','Acesso antecipado a novas peneiras'].map(l=>`<li class="flex gap-2.5 text-13"><span class="gold">✓</span>${l}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  </div>`;
  Feed.bind(screenEl);
  // FileReader (foto.js): a prévia fica na memória da página; não há servidor
  // de imagens no protótipo, então nada é salvo nem enviado.
  Foto.ligar(screenEl, { id: 'perfil-foto', alt: `Pré-visualização da foto de perfil de ${ME.name}`, aoMudar: url => { fotoPerfil = url; } });
}
let fotoPerfil = null;

/* ---------------- PENEIRAS ---------------- */
/* Versão pessoal do calendário: mesmo card e mesmo filtro por status da
   peneiras.html (components.js), mais o que só faz sentido logado —
   "Minha região" (ME.state) e o estado de inscrição por evento. */
function renderPeneiras() {
  const filters = { status: 'all', mine: false };
  const registered = new Set(ME.registrations || []);

  function summaryHTML() {
    const n = registered.size;
    return `Você está inscrito em <strong>${n} ${n === 1 ? 'peneira' : 'peneiras'}</strong>${n ? ' nesta temporada.' : '. Escolha uma abaixo.'}`;
  }

  function rows() {
    return filterEvents(MOCK.EVENTS, { status: filters.status, state: filters.mine ? ME.state : 'all' });
  }

  function paint(announceResult) {
    const data = rows();
    const list = screenEl.querySelector('[data-rows]');
    // cronômetros dos cards antigos são limpos antes de trocar a lista (components.js)
    EventTimers.stop(list);
    list.innerHTML =
      data.length ? data.map(e => eventCardHTML(e, 'atleta', { registered: registered.has(e.id) })).join('') : eventsEmptyHTML();
    EventTimers.watch(list, MOCK.EVENTS);
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
    <div class="mb-8">
      <span class="tag tag--outline">Calendário</span>
      <h1 class="display h1 mt-2 mb-0 mx-0">Peneiras<br>na <span class="mark">temporada 2026.</span></h1>
      <div class="font-mono text-13 text-ink-soft mt-2">${MOCK.SEASON.events} PENEIRAS · ${MOCK.SEASON.states} ESTADOS · INSCRIÇÃO GRATUITA</div>
      <p class="text-15 mt-3 mb-0 mx-0" data-summary>${summaryHTML()}</p>
    </div>

    <div class="flex gap-2 mb-6 pb-4 border-b border-b-line flex-wrap" role="group" aria-label="Filtrar peneiras">
      ${EVENT_STATUS_FILTERS.map(([k, label]) => `<button type="button" class="btn btn--ghost btn--sm font-mono tracking-label" data-status="${k}" aria-pressed="false">${label}</button>`).join('')}
      <button type="button" class="btn btn--ghost btn--sm font-mono tracking-label" data-mine aria-pressed="false">Minha região · ${ME.state}</button>
      <span class="ml-auto self-center font-mono text-11 text-ink-soft" data-count></span>
    </div>

    <div class="g g-3 gap-5" data-rows></div>
  </div>`;

  screenEl.querySelectorAll('[data-status]').forEach(b => b.onclick = () => { filters.status = b.dataset.status; paint(true); });
  screenEl.querySelector('[data-mine]').onclick = () => { filters.mine = !filters.mine; paint(true); };
  paint(false);
}

/* ---------------- MENSAGENS ---------------- */
/* A conversa do atleta com o olheiro, pelo mesmo chat.js do painel do
   olheiro. A regra de proteção vale dos dois lados: é o atleta menor quem
   mais costuma passar o próprio número. */
function renderMensagens() {
  const conversa = MOCK.CONVERSAS.find(c => c.atleta === ME.id);
  screenEl.innerHTML = `<div class="atleta-main">
    <div class="mb-8">
      <span class="tag tag--outline">Mensagens</span>
      <h1 class="display h1 mt-2 mb-0 mx-0">Fale com<br>o <span class="mark">olheiro.</span></h1>
      <p class="text-15 text-ink-soft mt-3 mb-0 max-w-copy-sm">Toda conversa acontece aqui dentro, intermediada pela Peneiras On. Seu responsável pode acompanhar.</p>
    </div>
    <div class="max-w-copy" data-chat></div>
  </div>`;
  const host = screenEl.querySelector('[data-chat]');
  if (!conversa) {
    host.innerHTML = `<div class="card state-card"><p class="state-card__title">Nenhuma conversa ainda.</p><p class="state-card__text">Quando um olheiro credenciado escrever para você, a conversa aparece aqui.</p></div>`;
    return;
  }
  Chat.montar(host, {
    persona: 'atleta',
    conversa,
    menor: ME.age < 18,
    outro: { nome: conversa.olheiro, sub: 'Olheiro credenciado · ID 0042' },
  });
}
