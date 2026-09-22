/* ============================================================
   PENEIRAS ON — hero.js
   Carrossel de fundo do hero da landing (index.html).
   · slides: [data-slide] dentro de [data-hero-slides] — imagens decorativas,
     trocadas por crossfade longo, com panorâmica lenta enquanto visíveis
     (CSS: .hero__slide / .is-active / @keyframes hero-pan)
   · indicadores: gerados em [data-hero-dots], um botão por slide; são o único
     controle e servem também ao teclado (Tab + Enter/Espaço, ← →)
   · avanço automático a cada INTERVAL ms (3,8 s por padrão); pausa com o mouse sobre o hero, com
     foco em algum controle e com a aba oculta — retoma ao sair
   · prefers-reduced-motion: sem avanço automático nem crossfade (CSS); os
     indicadores continuam funcionando
   Sem dependência: JavaScript vanilla, manipulação direta do DOM.
   ============================================================ */
function mountHeroSlider(root, opts = {}) {
  if (!root) return;
  const slides = [...root.querySelectorAll('[data-slide]')];
  const dotsHost = root.querySelector('[data-hero-dots]');
  if (slides.length < 2 || !dotsHost) return;

  const INTERVAL = opts.interval || 3800;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));
  let timer = null;
  let paused = false;

  dotsHost.innerHTML = slides.map((_, i) =>
    `<button type="button" class="hero__dot" aria-label="Imagem ${i + 1} de ${slides.length}"></button>`).join('');
  const dots = [...dotsHost.querySelectorAll('.hero__dot')];

  function show(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === current));
    dots.forEach((d, k) => {
      if (k === current) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  }

  function stop() { clearInterval(timer); timer = null; }
  function start() {
    if (reduced || paused || document.hidden || timer) return;
    timer = setInterval(() => show(current + 1), INTERVAL);
  }
  // troca manual reinicia a contagem: ninguém quer a imagem pulando logo depois de escolher
  function go(i) { stop(); show(i); start(); }

  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  dotsHost.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    go(current + (e.key === 'ArrowRight' ? 1 : -1));
    dots[current].focus();
  });

  root.addEventListener('mouseenter', () => { paused = true; stop(); });
  root.addEventListener('mouseleave', () => { paused = false; start(); });
  dotsHost.addEventListener('focusin', () => { paused = true; stop(); });
  dotsHost.addEventListener('focusout', e => {
    if (dotsHost.contains(e.relatedTarget)) return;
    paused = false; start();
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  show(current);
  start();
}
