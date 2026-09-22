/* ============================================================
   PENEIRAS ON — Mapa de calor da demanda (gestora.html?tela=mapa)
   Mesma malha do mapa público (BRAZIL_MAP, brazil-map.js), mas em vez de
   contar peneiras ele pinta a INTENSIDADE DA DEMANDA por estado.
   · escala sequencial de 4 faixas, cada uma com significado próprio:
     baixa (verde) → média (âmbar) → alta (laranja) → crítica (vermelho);
     estado sem dado fica cinza e não é clicável
   · cobertura (peneira aberta na temporada) aparece como contorno claro +
     um ponto: é outra dimensão, não cabe na mesma cor
   · filtros atenuam o que está fora do recorte, nunca escondem
   · clique / Enter / Espaço → onSelect(região); tooltip no mouse e no teclado
   Os estados com peneira vêm de MOCK.EVENTS pelas mesmas funções do
   calendário (eventStatus), então cobertura no mapa e lista não divergem.
   ============================================================ */
const MapaCalor = (() => {
  const NS = 'http://www.w3.org/2000/svg';

  /* Faixas da escala. `max` é o limite superior (exclusivo) de cada uma.
     As cores saem dos tokens do tema — nenhum hex escrito aqui. */
  const BANDS = [
    { key: 'baixa',   max: 0.45, color: 'var(--color-success)',   label: 'Baixa',   hint: 'até 45%' },
    { key: 'media',   max: 0.65, color: 'var(--color-gold-deep)', label: 'Média',   hint: '45–65%' },
    { key: 'alta',    max: 0.85, color: 'var(--color-accent)',    label: 'Alta',    hint: '65–85%' },
    { key: 'critica', max: 1.01, color: 'var(--color-danger)',    label: 'Crítica', hint: 'acima de 85%' },
  ];
  const bandOf = d => BANDS.find(b => d < b.max) || BANDS[BANDS.length - 1];

  /* Estados pequenos ou muito irregulares: o centro do bbox cai fora do
     desenho ou em cima do vizinho (DF sobre GO, RJ sobre a baía).
     Deslocamento em unidades do viewBox. */
  const NUDGE = { DF: [6, -9], GO: [-6, 6], RJ: [6, 7], ES: [7, 0], SE: [5, 0], AL: [7, -2],
                  PB: [8, 0], RN: [6, -4], PE: [12, 2], SC: [4, 1], AP: [0, 5], MA: [2, 6],
                  PA: [-4, -4], MG: [-4, 6], BA: [2, 4], RS: [-4, 3], SP: [6, 1], PI: [0, 4] };

  function stateName(uf) {
    const s = BRAZIL_MAP.states.find(x => x.uf === uf);
    return s ? s.name : uf;
  }

  /* UFs com peneira de inscrição aberta — a mesma regra do calendário. */
  function coveredStates(events) {
    const open = new Set(['aberta', 'inscrições']);
    return new Set(events.filter(e => open.has(eventStatus(e))).map(e => e.state));
  }

  /**
   * @param host    elemento onde o mapa é montado
   * @param opts    { regions, events, filter, selectedId, onSelect }
   */
  function mount(host, opts = {}) {
    const regions = opts.regions || MOCK.REGIONS;
    const covered = coveredStates(opts.events || MOCK.EVENTS);
    const byState = {};
    regions.forEach(r => { byState[r.state] = r; });
    const filter = opts.filter || 'all';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Cada filtro realça um recorte e atenua o resto — nada some do mapa. */
    const inFocus = r => {
      if (!r) return false;
      if (filter === 'demanda') return r.demand > 0.65;
      if (filter === 'cobertura') return covered.has(r.state);
      if (filter === 'gap') return r.demand > 0.65 && !covered.has(r.state);
      return true;
    };

    host.innerHTML = `
      <div class="heat-map" data-heat-wrap>
        <svg class="heat-map__svg" viewBox="${BRAZIL_MAP.viewBox}" role="group" aria-label="Mapa de calor da demanda por estado">
          <g data-states></g>
          <g data-marks aria-hidden="true"></g>
        </svg>
        <div class="heat-map__tip" data-tip role="status" aria-live="polite" hidden></div>
      </div>`;
    const svg = host.querySelector('svg');
    const gStates = svg.querySelector('[data-states]');
    const gMarks = svg.querySelector('[data-marks]');
    const tip = host.querySelector('[data-tip]');
    const wrap = host.querySelector('[data-heat-wrap]');

    // 1) um path por estado, pintado pela faixa da demanda
    BRAZIL_MAP.states.forEach((s, i) => {
      const r = byState[s.uf];
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', s.d);
      p.dataset.uf = s.uf;
      p.classList.add('heat-map__state');
      p.style.setProperty('--i', String(i));
      if (r) {
        const band = bandOf(r.demand);
        p.dataset.band = band.key;
        p.dataset.id = r.id;
        // a opacidade do preenchimento varia dentro da faixa: dá o degradê
        // sem perder a leitura por cor, que é o que a legenda explica
        p.style.setProperty('--fill', band.color);
        p.style.setProperty('--fill-a', (0.45 + 0.55 * Math.min(1, r.demand)).toFixed(2));
        p.classList.toggle('is-covered', covered.has(s.uf));
        p.classList.toggle('is-dim', !inFocus(r));
        p.classList.toggle('is-selected', opts.selectedId === r.id);
        p.setAttribute('tabindex', '0');
        p.setAttribute('role', 'button');
        p.setAttribute('aria-pressed', String(opts.selectedId === r.id));
        p.setAttribute('aria-label',
          `${s.name}: demanda ${Math.round(r.demand * 100)} por cento, ${band.label.toLowerCase()}; ` +
          `${fmtNum(r.value)} inscritos; ${covered.has(s.uf) ? 'com peneira aberta' : 'sem peneira aberta'}`);
      } else {
        p.classList.add('is-empty');
        p.setAttribute('aria-hidden', 'true');
      }
      gStates.appendChild(p);
    });

    // 2) sigla + marca de cobertura (ponto) no centro de cada estado com dado
    svg.querySelectorAll('.heat-map__state[role="button"]').forEach(p => {
      const uf = p.dataset.uf, b = p.getBBox();
      const [dx, dy] = NUDGE[uf] || [0, 0];
      const cx = b.x + b.width / 2 + dx, cy = b.y + b.height / 2 + dy;
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', cx.toFixed(1)); t.setAttribute('y', (cy + 4).toFixed(1));
      t.setAttribute('class', 'heat-map__label'); t.textContent = uf;
      gMarks.appendChild(t);
      if (!covered.has(uf)) return;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', cx.toFixed(1)); c.setAttribute('cy', (cy - 11).toFixed(1));
      c.setAttribute('r', '3.2'); c.setAttribute('class', 'heat-map__covered-dot');
      gMarks.appendChild(c);
    });

    // 3) tooltip preso ao contêiner (mouse e teclado)
    function showTip(p) {
      const r = byState[p.dataset.uf];
      const band = bandOf(r.demand);
      tip.innerHTML =
        `<strong>${esc(r.label)}</strong>` +
        `<span class="heat-map__tip-band"><i style="background:${band.color}"></i>Demanda ${band.label.toLowerCase()} · ${Math.round(r.demand * 100)}%</span>` +
        `<span>${fmtNum(r.value)} inscritos</span>` +
        `<em>${covered.has(r.state) ? 'peneira aberta na temporada' : 'sem peneira aberta'}</em>`;
      tip.hidden = false;
      const pr = p.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), tr = tip.getBoundingClientRect();
      let left = pr.left - wr.left + pr.width / 2 - tr.width / 2;
      let top = pr.top - wr.top - tr.height - 10;
      left = Math.max(4, Math.min(left, wr.width - tr.width - 4));
      if (top < 4) top = pr.bottom - wr.top + 10;
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
    }
    const hideTip = () => { tip.hidden = true; };

    svg.querySelectorAll('.heat-map__state[role="button"]').forEach(p => {
      const pick = () => opts.onSelect && opts.onSelect(byState[p.dataset.uf]);
      p.addEventListener('click', pick);
      p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      p.addEventListener('mouseenter', () => showTip(p));
      p.addEventListener('mouseleave', hideTip);
      p.addEventListener('focus', () => showTip(p));
      p.addEventListener('blur', hideTip);
    });

    // 4) entrada em cascata quando o mapa aparece
    if (!reduced && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(en => en.isIntersecting)) { wrap.classList.add('is-in'); io.disconnect(); }
      }, { threshold: 0.15 });
      io.observe(wrap);
    } else {
      wrap.classList.add('is-in');
    }
    return { covered, bandOf };
  }

  /* Legenda: a escala inteira, faixa a faixa, mais a marca de cobertura.
     É ela que torna as cores legíveis sem precisar de tooltip. */
  function legendHTML(covered) {
    const scale = BANDS.map(b =>
      `<div class="heat-legend__band">
         <span class="heat-legend__swatch" style="background:${b.color}"></span>
         <span class="heat-legend__label">${b.label}</span>
         <span class="heat-legend__hint">${b.hint}</span>
       </div>`).join('');
    return `
      <div class="heat-legend">
        <div class="heat-legend__title">Intensidade da demanda</div>
        <div class="heat-legend__scale">${scale}</div>
        <div class="heat-legend__foot">
          <span class="heat-legend__note"><span class="heat-legend__dot"></span>Peneira aberta na temporada${covered ? ` (${covered.size})` : ''}</span>
          <span class="heat-legend__note"><span class="heat-legend__swatch heat-legend__swatch--empty"></span>Sem dado de demanda</span>
        </div>
      </div>`;
  }

  return { mount, legendHTML, bandOf, BANDS, stateName, coveredStates };
})();
