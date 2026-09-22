/* ============================================================
   PENEIRAS ON — Mapa interativo do Brasil (peneiras.html)
   Um <path> por estado (BRAZIL_MAP, brazil-map.js). Os números vêm de
   MOCK.EVENTS pelas mesmas funções do calendário (eventStatus, em
   components.js): o que o mapa mostra é o que a lista mostra.
   · estado com peneira aberta ("aberta"/"inscrições"): laranja, com um
     selo numérico em cima dizendo quantas estão abertas
   · estado só com peneiras encerradas: cinza claro, sem selo
   · clique / Enter / Espaço → onSelect(uf) — peneiras.js filtra a lista;
     clicar de novo no mesmo estado desmarca
   · tooltip com nome, abertas e total; teclado (Tab entre estados com peneira)
   · animação: estados entram em cascata quando o mapa aparece, selos dão
     "pop", selo aberto pulsa; nada disso sob prefers-reduced-motion
   Ideia e malha vindas do protótipo do João (mapa-oportunidades, joao_mapa).
   ============================================================ */
const MapaPeneiras = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const OPEN = new Set(['aberta', 'inscrições']);

  /* Ajuste do centro do selo nos estados pequenos ou muito irregulares:
     o centro do bbox cairia fora do desenho. Valores em unidades do viewBox. */
  const NUDGE = { DF: [0, -6], RJ: [4, 6], ES: [6, 0], SE: [4, 0], AL: [6, -2], PB: [8, 0], RN: [6, -4], PE: [10, 2], SC: [4, 0], AP: [0, 4], MA: [4, 8], PA: [0, -8], MG: [-6, 8], BA: [0, 4], RS: [-4, 4], SP: [8, 0] };

  /* Conta por UF: total e abertas, a partir da lista atual de eventos. */
  function countByState(events) {
    const out = {};
    events.forEach(e => {
      const c = out[e.state] || (out[e.state] = { total: 0, open: 0 });
      c.total++;
      if (OPEN.has(eventStatus(e))) c.open++;
    });
    return out;
  }

  function stateName(uf) {
    const s = BRAZIL_MAP.states.find(x => x.uf === uf);
    return s ? s.name : uf;
  }

  function mount(host, opts = {}) {
    const events = opts.events || MOCK.EVENTS;
    const counts = countByState(events);
    const maxOpen = Math.max(1, ...Object.values(counts).map(c => c.open));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let selected = null;

    host.innerHTML = `
      <div class="br-map" data-map-wrap>
        <svg class="br-map__svg" viewBox="${BRAZIL_MAP.viewBox}" role="group" aria-label="Mapa do Brasil: escolha um estado para ver as peneiras dele">
          <g data-states></g>
          <g data-labels aria-hidden="true"></g>
          <g data-badges aria-hidden="true"></g>
        </svg>
        <div class="br-map__tip" data-tip role="status" aria-live="polite" hidden></div>
      </div>`;
    const svg = host.querySelector('svg');
    const gStates = svg.querySelector('[data-states]');
    const gLabels = svg.querySelector('[data-labels]');
    const gBadges = svg.querySelector('[data-badges]');
    const tip = host.querySelector('[data-tip]');
    const wrap = host.querySelector('[data-map-wrap]');

    // 1) estados
    BRAZIL_MAP.states.forEach((s, i) => {
      const c = counts[s.uf];
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', s.d);
      p.dataset.uf = s.uf;
      p.classList.add('br-map__state');
      if (c) {
        p.classList.add(c.open ? 'is-open' : 'is-closed');
        if (c.open) p.style.setProperty('--heat', String(0.55 + 0.45 * (c.open / maxOpen)));
        p.setAttribute('tabindex', '0');
        p.setAttribute('role', 'button');
        p.setAttribute('aria-label', `${s.name}: ${c.open} aberta${c.open === 1 ? '' : 's'} de ${c.total} peneira${c.total === 1 ? '' : 's'}`);
      } else {
        p.setAttribute('aria-hidden', 'true');
      }
      p.style.setProperty('--i', String(i));
      gStates.appendChild(p);
    });

    // 2) siglas (só onde há peneira) e selos com o número de abertas
    svg.querySelectorAll('.br-map__state.is-open, .br-map__state.is-closed').forEach((p, i) => {
      const uf = p.dataset.uf, c = counts[uf], b = p.getBBox();
      const [dx, dy] = NUDGE[uf] || [0, 0];
      const cx = b.x + b.width / 2 + dx, cy = b.y + b.height / 2 + dy;
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', cx.toFixed(1)); t.setAttribute('y', (cy + (c.open ? 20 : 5)).toFixed(1));
      t.setAttribute('class', 'br-map__label'); t.textContent = uf;
      gLabels.appendChild(t);
      if (!c.open) return;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'br-map__badge');
      g.setAttribute('transform', `translate(${cx.toFixed(1)} ${(cy - 6).toFixed(1)})`);
      g.style.setProperty('--i', String(i));
      g.innerHTML = `<circle class="br-map__badge-ring" r="13"/><circle class="br-map__badge-dot" r="11"/><text class="br-map__badge-num" y="5">${c.open}</text>`;
      gBadges.appendChild(g);
    });

    // 3) tooltip (mouse + teclado), preso ao contêiner
    function showTip(p) {
      const uf = p.dataset.uf, c = counts[uf];
      tip.innerHTML = `<strong>${stateName(uf)}</strong><span>${c.open ? `${c.open} aberta${c.open === 1 ? '' : 's'} · ` : ''}${c.total} peneira${c.total === 1 ? '' : 's'}${c.open ? '' : ' · encerrada' + (c.total === 1 ? '' : 's')}</span><em>${selected === uf ? 'clique para limpar' : 'clique para filtrar'}</em>`;
      tip.hidden = false;
      const pr = p.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), tr = tip.getBoundingClientRect();
      let left = pr.left - wr.left + pr.width / 2 - tr.width / 2;
      let top = pr.top - wr.top - tr.height - 10;
      left = Math.max(4, Math.min(left, wr.width - tr.width - 4));
      if (top < 4) top = pr.bottom - wr.top + 10;
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
    }
    const hideTip = () => { tip.hidden = true; };

    // 4) seleção
    function select(uf, fromUser) {
      selected = uf && counts[uf] ? uf : null;
      svg.querySelectorAll('.br-map__state').forEach(p => {
        const on = p.dataset.uf === selected;
        p.classList.toggle('is-selected', on);
        if (p.hasAttribute('role')) p.setAttribute('aria-pressed', String(on));
      });
      svg.classList.toggle('has-selection', !!selected);
      if (fromUser && opts.onSelect) opts.onSelect(selected);
    }

    svg.querySelectorAll('.br-map__state[role="button"]').forEach(p => {
      const toggle = () => { select(selected === p.dataset.uf ? null : p.dataset.uf, true); showTip(p); };
      p.addEventListener('click', toggle);
      p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      p.addEventListener('mouseenter', () => showTip(p));
      p.addEventListener('mouseleave', hideTip);
      p.addEventListener('focus', () => showTip(p));
      p.addEventListener('blur', hideTip);
    });
    // selo em cima do estado: o clique passa para o estado
    svg.querySelectorAll('.br-map__badge').forEach(g => { g.style.pointerEvents = 'none'; });

    // 5) entrada: estados e selos em cascata quando o mapa aparece
    if (!reduced && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(en => en.isIntersecting)) { wrap.classList.add('is-in'); io.disconnect(); }
      }, { threshold: 0.2 });
      io.observe(wrap);
    } else {
      wrap.classList.add('is-in');
    }

    return { select, counts, stateName };
  }

  return { mount, countByState, stateName };
})();
