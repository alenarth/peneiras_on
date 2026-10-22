/* ============================================================
   PENEIRAS ON — data.js (Sprint 4: dados por fetch + async/await)
   Até a Sprint 3 os dados mockados moravam aqui, como constantes. Agora
   ficam em assets/data/mock.json, servido junto com o site, e este
   arquivo é o carregador:
     · Dados.carregar() → Promise<MOCK>: um fetch só por página (a promessa
       fica guardada); se falhar, a próxima chamada tenta de novo
     · Dados.iniciar(init, opts): contrato das telas — carregando enquanto
       busca, init(MOCK) quando chega, erro com "Tentar de novo" se falhar.
       Nenhuma tela fica em branco.
     · MOCK: o mesmo objeto global de antes (MOCK.ATHLETES, MOCK.EVENTS,
       MOCK.SEASON…), preenchido depois do carregamento — os módulos de tela
       só leem MOCK dentro do init.
   O que é CÓDIGO e não dado continua aqui: classifyPosition, posLabel e os
   derivados (SEASON, encerraEm).
   Carregar ANTES de ui.js; Dados.iniciar usa UI.busy/announce na chamada.
   ============================================================ */

/* ⚠ PENEIRA DE DEMONSTRAÇÃO — RETIRAR ANTES DA ENTREGA FINAL (25/10) ⚠
   Só para a gravação do vídeo: a peneira e-11 (Porto Alegre) encerra as
   inscrições N minutos depois de a página abrir, para o cronômetro dos cards
   aparecer zerando. Para retirar, apague a linha 'e-11' abaixo e deixe o
   objeto vazio; a e-11 volta a encerrar pela data real (inscricoesAte). */
const DEMO_ENCERRA_EM_MINUTOS = {
  'e-11': 3,
};

const MOCK = {};

const Dados = (() => {
  const URL_DADOS = 'assets/data/mock.json';
  const TEMPO_LIMITE = 10000; // ms — sem resposta em 10 s, vira erro com "Tentar de novo"
  let promessa = null;

  /* Similaridade de cosseno entre os atributos e o perfil-base de cada posição. */
  function classifyPosition(attrs) {
    const profiles = MOCK.POSITION_PROFILES;
    const keys = Object.keys(profiles.Goleiro);
    function cos(a, b) {
      let dot = 0, na = 0, nb = 0;
      for (const k of keys) { dot += a[k] * b[k]; na += a[k] * a[k]; nb += b[k] * b[k]; }
      return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
    }
    return Object.entries(profiles)
      .map(([pos, prof]) => ({ pos, score: cos(attrs, prof) }))
      .sort((a, b) => b.score - a.score);
  }

  /* Rótulo de posição para exibição: junta a posição canônica ao lado, quando houver. */
  function posLabel(athlete) {
    return athlete.side ? athlete.position + ' ' + athlete.side : athlete.position;
  }

  /* JSON → MOCK. Datas de encerramento viram Date; a peneira de demonstração
     (DEMO_ENCERRA_EM_MINUTOS, no topo do arquivo) encerra N minutos depois de
     a página abrir. */
  function montar(json) {
    const agora = Date.now();
    const EVENTS = json.EVENTS.map(e => ({
      ...e,
      encerraEm: DEMO_ENCERRA_EM_MINUTOS[e.id] != null
        ? new Date(agora + DEMO_ENCERRA_EM_MINUTOS[e.id] * 60000)
        : (e.inscricoesAte ? new Date(e.inscricoesAte) : null),
    }));
    // Números da temporada derivados de EVENTS — fonte única para landing,
    // tela de peneiras e página institucional.
    const SEASON = {
      events: EVENTS.length,
      states: new Set(EVENTS.map(e => e.state)).size,
      statesGoal: 27,
      nextEvent: EVENTS.slice().sort((a, b) => a.date.localeCompare(b.date))
        .find(e => new Date(e.date + 'T00:00:00') >= new Date(new Date().toDateString())) || EVENTS[0],
    };
    Object.assign(MOCK, {
      ATHLETES: json.ATHLETES, EVENTS, REGIONS: json.REGIONS,
      POSITION_PROFILES: json.POSITION_PROFILES, POS_COLORS: json.POS_COLORS,
      FUNNEL: json.FUNNEL, TIMELINE: json.TIMELINE, CONVERSAS: json.CONVERSAS || [],
      SEASON, classifyPosition, posLabel,
    });
    return MOCK;
  }

  async function buscar() {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE);
    try {
      const resp = await fetch(URL_DADOS, { signal: controle.signal });
      if (!resp.ok) throw new Error(`o servidor respondeu ${resp.status}`);
      return montar(await resp.json());
    } finally {
      clearTimeout(relogio);
    }
  }

  function carregar() {
    // uma busca por página; uma falha não fica guardada, então "Tentar de novo" busca de verdade
    if (!promessa) promessa = buscar().catch(erro => { promessa = null; throw erro; });
    return promessa;
  }

  /* ---------- contrato de tela ----------
     opts.vitrine  elemento (ou lista) onde aparecem o carregando e o erro.
                   O conteúdo que já estava lá fica escondido (hidden) e volta
                   quando os dados chegam — serve tanto para telas montadas por
                   JS quanto para cards com markup fixo.
     opts.ocupado  container que recebe aria-busy (padrão: a 1ª vitrine)
     opts.mensagem frase do carregando (vai também para a região aria-live)
     opts.erro     frase do erro, dita do ponto de vista de quem usa */
  function iniciar(init, opts = {}) {
    const vitrines = [].concat(opts.vitrine || document.querySelector('main')).filter(Boolean);
    const ocupado = opts.ocupado || vitrines[0];
    const mensagem = opts.mensagem || 'Carregando dados…';

    const status = vitrines.map((v, i) => {
      [...v.children].forEach(c => { if (!c.hasAttribute('data-dados-status')) { c.dataset.dadosEscondido = c.hidden ? 'ja' : '1'; c.hidden = true; } });
      let s = v.querySelector(':scope > [data-dados-status]');
      if (!s) { s = document.createElement('div'); s.setAttribute('data-dados-status', ''); v.prepend(s); }
      s.className = 'col-span-full';   // dentro de uma grade, ocupa a linha inteira
      s.innerHTML = UI.loadingHTML(i === 0 ? mensagem : 'Carregando…', { block: i === 0 });
      return s;
    });
    const done = UI.busy(ocupado, mensagem);

    carregar().then(() => {
      // devolve o conteúdo original antes do init (que pode reescrever a vitrine)
      vitrines.forEach((v, i) => {
        status[i].remove();
        [...v.children].forEach(c => { if (c.dataset.dadosEscondido === '1') c.hidden = false; delete c.dataset.dadosEscondido; });
      });
      done();
      init(MOCK);
    }, erro => {
      done();
      status.forEach((s, i) => {
        s.innerHTML = i === 0
          ? `<div class="card state-card state-card--error" role="alert">
              <p class="state-card__title">Não deu para carregar.</p>
              <p class="state-card__text">${opts.erro || 'Os dados desta tela não chegaram.'} Confira sua conexão e tente de novo.</p>
              <button type="button" class="btn btn--ghost btn--sm mt-2" data-dados-retry>Tentar de novo</button>
              <span class="font-mono text-10 text-ink-mute mt-1">detalhe: ${esc(erro && erro.message || 'erro desconhecido')}</span>
            </div>`
          : `<p class="font-mono text-11 text-ink-mute m-0 py-3">Indisponível no momento — veja o aviso no início da página.</p>`;
      });
      const retry = status[0].querySelector('[data-dados-retry]');
      retry.addEventListener('click', () => {
        iniciar(init, opts);
        // o foco estava no botão que sumiu: vai para o container, sem anel (tabindex -1)
        if (!ocupado.hasAttribute('tabindex')) ocupado.setAttribute('tabindex', '-1');
        ocupado.focus({ preventScroll: true });
      });
    });
  }

  return { carregar, iniciar };
})();
