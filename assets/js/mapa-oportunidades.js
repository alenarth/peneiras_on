/* ============================================================
   PENEIRAS ON — Mapa de oportunidades (gestora)
   ------------------------------------------------------------
   Seção completa, SEM biblioteca de mapa. SVG inline com um
   <path> por estado (malha real reaproveitada de BRAZIL_MAP).
   Estados com peneiras ativas ganham tons de --color-primary
   (laranja) por color-mix, com intensidade proporcional.
   Adaptação vanilla do spec React/TS: mesmos comportamentos
   (reveal, tooltip mouse+teclado, loading pulse, a11y, tokens).
   ============================================================ */
(function () {
  'use strict';

  /* UF: as 27 siglas (equivalente ao union type do spec; aqui vira
     validação em runtime já que é JS). */
  const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
               'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Dados: peneiras ativas por UF ----------
     Retorna uma Promise para exercitar o estado de loading, como faria
     o TanStack Query no spec original.
     TODO(Supabase): trocar o MOCK pela query real quando a tabela existir:
       window.DB → events com status='aberta' e data >= hoje, agrupado por UF:
       SELECT estado, count(*) FROM events
        WHERE status = 'aberta' AND data >= current_date
        GROUP BY estado;
     Deve continuar devolvendo Partial<Record<UF, number>>. NÃO remover
     esta estrutura — ela já está pronta para a integração real. */
  function useActiveTryoutsByState() {
    const MOCK = { SP: 2, RJ: 1, MG: 1, PE: 1 };
    return new Promise(resolve => setTimeout(() => resolve(MOCK), 450));
  }

  /* ---------- Reveal: IntersectionObserver, dispara uma vez ---------- */
  function observeReveal(el, onVisible) {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) { onVisible(); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { onVisible(); obs.disconnect(); }  // desconecta após visível
      });
    }, { threshold: 0.15 });
    io.observe(el);
  }

  /* ---------- Helpers de cor (só via token; nunca hex no componente) ---------- */
  function fillAtivo(count, max) {
    const ratio = max > 0 ? count / max : 0;
    const P = Math.round(55 + ratio * 30);           // 55%..85% conforme intensidade
    return `color-mix(in oklab, var(--color-primary) ${P}%, transparent)`;
  }
  const FILL_NEUTRO = 'color-mix(in oklab, var(--color-ink) 7%, transparent)';

  /* ---------- Markup da seção (colunas + placeholders) ---------- */
  function shell(total) {
    const revealBase =
      'transition-[opacity,transform,filter] duration-[900ms] ' +
      'ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ' +
      'translate-y-6 opacity-0 blur-sm';   // estado escondido inicial
    return `
      <section id="mapa" class="scroll-mt-16 border-y border-line bg-bg-alt/40">
        <div class="mx-auto grid max-w-[1400px] gap-12 px-6 py-16 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-10 lg:py-20">

          <div data-reveal class="${revealBase}" style="transition-delay:0ms">
            <div class="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
              <span class="h-px w-8 bg-primary/60"></span>Mapa de oportunidades
            </div>
            <h2 class="mt-6 font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-4xl lg:text-5xl uppercase">
              Onde estão as chances
            </h2>
            <p class="mt-5 text-ink-soft text-15 leading-normal max-w-[46ch]">
              Encontre oportunidades em diferentes regiões do Brasil. Atualmente existem
              <span data-total class="font-display font-black text-primary">${total}</span>
              peneira${total === 1 ? '' : 's'} ativa${total === 1 ? '' : 's'} distribuída${total === 1 ? '' : 's'} pelo país.
            </p>
            <div data-mini-cards class="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-6"></div>
          </div>

          <div data-reveal class="${revealBase}" style="transition-delay:140ms">
            <div class="relative mx-auto w-full max-w-[34rem]">
              <div data-map-svg></div>
              <div data-tooltip role="status" aria-live="polite"
                   class="pointer-events-none absolute z-20 hidden rounded-lg border border-line bg-card px-3 py-2 text-xs leading-tight shadow-[var(--shadow-menu)]"></div>
            </div>
            <div class="mt-6 flex flex-wrap items-center justify-center gap-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
              <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-sm bg-primary"></span>Com peneiras</span>
              <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-sm bg-ink/10"></span>Em breve</span>
              <a href="peneiras.html" class="underline underline-offset-2 hover:text-primary">Ver todas</a>
            </div>
          </div>

        </div>
      </section>`;
  }

  /* ---------- SVG do mapa (loading OU com dados) ---------- */
  function mapSVG(counts, loading) {
    const values = counts ? Object.values(counts) : [];
    const max = values.length ? Math.max(...values) : 0;
    const paths = BRAZIL_MAP.states.map(s => {
      const count = (!loading && counts && counts[s.uf]) ? counts[s.uf] : 0;
      const active = count > 0;
      const fill = active ? fillAtivo(count, max) : FILL_NEUTRO;
      const interativo = active
        ? `cursor-pointer" data-active="1" tabindex="0" role="button" aria-label="${s.name} — ${count} peneira${count === 1 ? '' : 's'} ativa${count === 1 ? '' : 's'}`
        : `" data-active="0" aria-hidden="true`;
      return `<path d="${s.d}" data-uf="${s.uf}" data-count="${count}"
                class="uf-opp transition-all duration-200 ${interativo}"
                style="--uf-fill:${fill}"></path>`;
    }).join('');
    return `<svg viewBox="${BRAZIL_MAP.viewBox}" class="h-auto w-full ${loading ? 'animate-pulse motion-reduce:animate-none' : ''}"
                 role="img" aria-label="Mapa do Brasil com os estados que têm peneiras ativas">${paths}</svg>`;
  }

  /* ---------- Siglas nos estados ativos (posição via getBBox) ---------- */
  function addLabels(svg) {
    const NS = 'http://www.w3.org/2000/svg';
    svg.querySelectorAll('path[data-active="1"]').forEach(p => {
      const b = p.getBBox();
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', (b.x + b.width / 2).toFixed(1));
      t.setAttribute('y', (b.y + b.height / 2 + 6).toFixed(1));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'pointer-events-none fill-ink text-[20px] font-bold tracking-[0.06em]');
      t.textContent = p.dataset.uf;
      svg.appendChild(t);
    });
  }

  /* ---------- Tooltip (mouse + teclado), preso ao container ---------- */
  function bindTooltip(root, svg) {
    const wrap = root.querySelector('.relative.mx-auto');
    const tip = root.querySelector('[data-tooltip]');
    const show = p => {
      const uf = p.dataset.uf, count = +p.dataset.count;
      const state = BRAZIL_MAP.states.find(s => s.uf === uf);
      tip.innerHTML = `<div class="font-semibold text-ink">${state.name}</div>
                       <div class="text-ink-mute">${count} peneira${count === 1 ? '' : 's'} ativa${count === 1 ? '' : 's'}</div>`;
      tip.classList.remove('hidden');
      const pr = p.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      const tr = tip.getBoundingClientRect();
      let left = pr.left - wr.left + pr.width / 2 - tr.width / 2;
      let top = pr.top - wr.top - tr.height - 8;
      left = Math.max(4, Math.min(left, wr.width - tr.width - 4));   // não ultrapassa o container
      top = Math.max(4, top);
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    };
    const hide = () => tip.classList.add('hidden');
    svg.querySelectorAll('path[data-active="1"]').forEach(p => {
      p.addEventListener('mouseenter', () => show(p));
      p.addEventListener('mouseleave', hide);
      p.addEventListener('focus', () => show(p));
      p.addEventListener('blur', hide);
    });
  }

  /* ---------- Interação: clique + teclado nos estados ativos ---------- */
  function bindInteraction(svg, onStateClick) {
    svg.querySelectorAll('path[data-active="1"]').forEach(p => {
      const uf = p.dataset.uf;
      p.addEventListener('click', () => onStateClick(uf));
      p.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStateClick(uf); }
      });
    });
  }

  /* ---------- Mini cards por estado (todos os 27, com 0 inclusive) ---------- */
  function miniCards(counts) {
    return BRAZIL_MAP.states.map(s => {
      const n = (counts && counts[s.uf]) || 0;
      const numCls = n > 0 ? 'text-primary' : 'text-ink-mute';
      return `<div class="border border-line-soft bg-card px-2 py-2 text-center">
                <div class="font-mono text-10 uppercase tracking-widest text-ink-mute">${s.uf}</div>
                <div class="font-display font-black text-22 tabular-nums ${numCls}">${n}</div>
              </div>`;
    }).join('');
  }

  /* ---------- Aplica dados após o loading (sem refazer o reveal) ---------- */
  function fill(root, counts) {
    const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
    const totalEl = root.querySelector('[data-total]');
    if (totalEl) totalEl.textContent = total;
    root.querySelector('[data-mini-cards]').innerHTML = miniCards(counts);
    const host = root.querySelector('[data-map-svg]');
    host.innerHTML = mapSVG(counts, false);
    const svg = host.querySelector('svg');
    addLabels(svg);
    bindTooltip(root, svg);
    bindInteraction(svg, uf => {
      const state = BRAZIL_MAP.states.find(s => s.uf === uf);
      if (window.announce) window.announce(`${state.name}: ${counts[uf]} peneira(s) ativa(s).`);
      location.href = 'peneiras.html?uf=' + uf;   // segue para as peneiras do estado
    });
  }

  function wireReveal(root) {
    root.querySelectorAll('[data-reveal]').forEach(col => {
      observeReveal(col, () => {
        col.classList.remove('translate-y-6', 'opacity-0', 'blur-sm');
        col.classList.add('translate-y-0', 'opacity-100', 'blur-none');
      });
    });
  }

  /* ---------- Entrada pública ---------- */
  function renderMapaOportunidades(root) {
    // 1) esqueleto imediato em loading (mapa neutro + animate-pulse, sem interação)
    root.innerHTML = shell(0);
    root.querySelector('[data-map-svg]').innerHTML = mapSVG(null, true);
    root.querySelector('[data-mini-cards]').innerHTML = miniCards(null);
    wireReveal(root);
    // 2) dados chegam → preenche mapa/cards/total e habilita interação
    useActiveTryoutsByState().then(raw => {
      const counts = {};
      Object.keys(raw).forEach(uf => { if (UFS.includes(uf)) counts[uf] = raw[uf]; });
      fill(root, counts);
    });
  }

  window.renderMapaOportunidades = renderMapaOportunidades;
})();
