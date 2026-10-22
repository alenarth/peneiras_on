/* ============================================================
   PENEIRAS ON — ui.js
   Camada de interface genérica, consumida pelos outros módulos:
     · helpers de DOM (qs, qsa, setPressed, debounce, reducedMotion)
     · storage: localStorage com try/catch (vazio ou corrompido → fallback)
     · announce(): região aria-live global para leitores de tela
     · toast(): avisos dinâmicos (sucesso / erro / informação)
     · loadingHTML() / busy() / busyButton(): estado de carregando (Sprint 4)
   Carregar ANTES de components.js e dos módulos de tela.
   Nenhuma dependência: JavaScript vanilla, manipulação direta do DOM.
   ============================================================ */
const UI = (() => {
  /* ---------- helpers de DOM ---------- */
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
  /* Estado de um botão de alternância: o atributo é a fonte da verdade para
     leitor de tela e para o CSS ([aria-pressed="true"]). */
  const setPressed = (btn, on) => btn.setAttribute('aria-pressed', String(!!on));
  const debounce = (fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- localStorage defensivo ----------
     Toda leitura/escrita em try/catch: modo privado, cota cheia ou JSON
     corrompido nunca podem derrubar a página — cai no fallback. */
  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (raw == null) return fallback;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : fallback;
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(key); return true; }
      catch (e) { return false; }
    },
  };

  /* ---------- região aria-live global ----------
     Uma região polite, invisível, criada uma vez. announce(msg) troca o texto
     (esvazia antes para que a mesma frase repetida seja lida de novo). Usada
     para mudanças que acontecem sem recarregar: filtros, busca, check-in… */
  function liveRegion() {
    let lr = document.querySelector('[data-live-region]');
    if (!lr) {
      lr = document.createElement('div');
      lr.setAttribute('data-live-region', '');
      lr.setAttribute('aria-live', 'polite');
      lr.setAttribute('aria-atomic', 'true');
      lr.className = 'sr-only';
      document.body.appendChild(lr);
    }
    return lr;
  }
  function announce(msg) {
    const lr = liveRegion();
    lr.textContent = '';
    setTimeout(() => { lr.textContent = msg; }, 50);
  }

  /* ---------- toasts ----------
     Pilha fixa no canto inferior direito. O container é uma região polite,
     então o texto de cada toast é lido pelo leitor de tela sem passar por
     announce() — quem chama toast() NÃO deve repetir a frase em announce().
     · type: 'success' | 'error' | 'info'
     · erro recebe role="alert" (assertivo); os outros role="status"
     · não rouba foco; o botão de fechar entra na ordem normal do Tab
     · fecha sozinho depois de `duration` ms (pausa com o mouse/foco em cima)
     · sob prefers-reduced-motion não há animação de entrada (motion-safe:) */
  const ICON = { success: '✓', error: '⚠', info: 'ℹ' };
  const LABEL = { success: 'Sucesso', error: 'Erro', info: 'Aviso' };
  function toastStack() {
    let stack = document.querySelector('[data-toast-stack]');
    if (!stack) {
      stack = document.createElement('div');
      stack.setAttribute('data-toast-stack', '');
      stack.setAttribute('aria-live', 'polite');
      stack.setAttribute('aria-relevant', 'additions');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }
  function toast(message, opts = {}) {
    const type = ['success', 'error', 'info'].includes(opts.type) ? opts.type : 'info';
    const duration = opts.duration == null ? (type === 'error' ? 7000 : 4000) : opts.duration;
    const stack = toastStack();
    const el = document.createElement('div');
    // classes literais completas (o Tailwind só gera o que encontra no fonte)
    el.className = 'toast ' + (type === 'success' ? 'toast--success' : type === 'error' ? 'toast--error' : 'toast--info') + ' motion-safe:animate-toast-in';
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML =
      `<span class="toast__icon" aria-hidden="true">${ICON[type]}</span>` +
      `<span class="toast__body"><span class="sr-only">${LABEL[type]}: </span>${message}</span>` +
      `<button type="button" class="toast__close" aria-label="Fechar aviso">×</button>`;
    let timer = null;
    const close = () => { clearTimeout(timer); if (el.parentNode) el.parentNode.removeChild(el); };
    const arm = () => { if (duration > 0) timer = setTimeout(close, duration); };
    const disarm = () => clearTimeout(timer);
    el.querySelector('.toast__close').addEventListener('click', close);
    el.addEventListener('mouseenter', disarm); el.addEventListener('mouseleave', arm);
    el.addEventListener('focusin', disarm);    el.addEventListener('focusout', arm);
    stack.appendChild(el);
    arm();
    return { close, el };
  }

  /* ---------- estado de carregando ----------
     Toda espera real (envio, busca de dados, leitura de arquivo) segue o mesmo
     contrato, para nenhuma tela ficar em branco ou aceitar clique duplo:
       · o container que espera recebe aria-busy="true" (leitor de tela sabe
         que o conteúdo ainda vai mudar);
       · a frase vai para a região aria-live via announce();
       · o controle que disparou fica travado (disabled) até terminar;
       · visual: giro + texto; sob prefers-reduced-motion o giro some (CSS:
         motion-reduce:hidden) e fica só o texto.
     busy() devolve done(msgFinal?) — chame sempre, no sucesso ou no erro. */
  function loadingHTML(msg, opts = {}) {
    return `<div class="loading${opts.block ? ' loading--block' : ''}">` +
      `<span class="loading__spinner" aria-hidden="true"></span><span>${msg}</span></div>`;
  }
  function busy(container, msg, opts = {}) {
    const controls = (opts.controls || []).filter(Boolean);
    const was = controls.map(c => c.disabled);
    if (container) {
      container.setAttribute('aria-busy', 'true');
      if (opts.render) container.innerHTML = loadingHTML(msg, { block: opts.block !== false });
    }
    controls.forEach(c => { c.disabled = true; });
    if (msg) announce(msg);
    let finished = false;
    return function done(finalMsg) {
      if (finished) return;
      finished = true;
      if (container) container.removeAttribute('aria-busy');
      // o controle pode ter sido recriado pelo render; só destrava se ainda existe
      controls.forEach((c, i) => { if (c.isConnected) c.disabled = was[i]; });
      if (finalMsg) announce(finalMsg);
    };
  }
  /* Botão que dispara a espera: trava, troca o rótulo por "Enviando…" com o
     giro e devolve a função que restaura tudo. */
  function busyButton(btn, label) {
    if (!btn) return () => {};
    const html = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('is-busy');
    btn.innerHTML = `<span class="loading__spinner" aria-hidden="true"></span>${label}`;
    return () => {
      if (!btn.isConnected) return;
      btn.disabled = false;
      btn.classList.remove('is-busy');
      btn.innerHTML = html;
    };
  }

  /* ---------- revelação por rolagem ----------
     Marca com [data-reveal] os blocos de conteúdo das páginas públicas (filhos
     diretos dos .wrap de cada seção, cards, planos, artigos) e liga a classe
     html.js-reveal — só então o CSS os esconde. Um IntersectionObserver adiciona
     .is-in quando 12% do bloco entra na tela; --i escalona irmãos. Dispensado
     sob prefers-reduced-motion e sem IntersectionObserver. Uma área marcada com
     [data-no-reveal] fica de fora (o styleguide precisa dos cards parados, para
     o estado forçado não brigar com o deslocamento da revelação). */
  const REVEAL_SEL = 'main section > .wrap > *, main section > .wrap > .g > *, .plan, .card, article.card, .faq details, .site-footer__cols > *';
  function reveal(root = document) {
    if (reducedMotion() || !('IntersectionObserver' in window)) return;
    const els = qsa(REVEAL_SEL, root).filter(el => !el.closest('.hero') && !el.closest('[data-no-reveal]') && !el.hasAttribute('data-reveal'));
    if (!els.length) return;
    document.documentElement.classList.add('js-reveal');
    const io = reveal._io || (reveal._io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }));
    els.forEach(el => {
      el.setAttribute('data-reveal', '');
      // irmãos que revelam juntos entram em cascata; quem já está na tela ganha atraso menor
      const sib = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
      el.style.setProperty('--i', String(Math.min(sib.indexOf(el), 6)));
    });
    // Leituras de layout num laço separado das escritas acima: intercaladas,
    // cada getBoundingClientRect forçava um recálculo de layout por elemento.
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
      else io.observe(el);
    });
  }

  /* ---------- números que contam ----------
     [data-countup] anima o texto do elemento de 0 até o número que ele já
     mostra, preservando pontos e sufixos ("18.420", "12k+", "92%"). Dispara
     quando o elemento entra na tela; 1,8 s para dar tempo de acompanhar. */
  function countup(root = document) {
    const els = qsa('[data-countup]', root);
    if (!els.length) return;
    const run = el => {
      const raw = el.textContent.trim();
      const m = raw.match(/^([^\d]*)([\d.]+)(.*)$/); if (!m) return;
      const [, pre, numTxt, post] = m;
      const target = parseInt(numTxt.replace(/\./g, ''), 10);
      if (!Number.isFinite(target) || reducedMotion()) return;
      const grouped = numTxt.includes('.');
      const t0 = performance.now(), dur = 1800;
      const ease = t => 1 - Math.pow(1 - t, 3);
      (function tick(now) {
        const t = Math.min(1, (now - t0) / dur);
        const v = Math.round(target * ease(t));
        el.textContent = pre + (grouped ? v.toLocaleString('pt-BR') : String(v)) + post;
        if (t < 1) requestAnimationFrame(tick);
      })(t0);
    };
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.5 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- luz do cursor ----------
     Em [data-spotlight] com um .spotlight dentro, escreve a posição do mouse
     em --mx/--my (o CSS desenha o halo). Uma escrita por quadro, via
     requestAnimationFrame; nada roda sob prefers-reduced-motion nem no toque. */
  function spotlight(root = document) {
    if (reducedMotion() || !matchMedia('(hover: hover)').matches) return;
    qsa('[data-spotlight]', root).forEach(host => {
      if (host.dataset.spotlightOn) return;
      host.dataset.spotlightOn = '1';
      let frame = null, x = 0, y = 0;
      host.addEventListener('pointermove', e => {
        const r = host.getBoundingClientRect();
        x = ((e.clientX - r.left) / r.width) * 100;
        y = ((e.clientY - r.top) / r.height) * 100;
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = null;
          host.style.setProperty('--mx', x.toFixed(1) + '%');
          host.style.setProperty('--my', y.toFixed(1) + '%');
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => { liveRegion(); reveal(); countup(); spotlight(); });
  return { qs, qsa, setPressed, debounce, reducedMotion, storage, announce, toast, loadingHTML, busy, busyButton, reveal, countup, spotlight };
})();

/* Atalhos globais — os módulos de tela chamam announce()/toast() direto. */
window.announce = UI.announce;
window.toast = UI.toast;
