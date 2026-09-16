/* ============================================================
   PENEIRAS ON — Componentes compartilhados (vanilla JS)
   Injeta nav e footer, helpers de UI.
   ============================================================ */

/* ---------- Helpers de formatação ---------- */
/* Escapa valores do usuário antes de interpolar em template string.
   Obrigatório para qualquer ${...} dentro de atributo ou de <textarea>. */
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fmtNum(n) { return n.toLocaleString('pt-BR'); }
function fmtDate(iso, opts) {
  return new Date(iso).toLocaleDateString('pt-BR', opts || { day:'2-digit', month:'short', year:'numeric' }).toUpperCase();
}
/* Data no formato de rótulo do projeto: 15·JUN·26 / 15·JUN·2026 / 15·JUN */
function fmtDotDate(iso, year) {
  const M = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const [y, m, d] = iso.split('-');
  const tail = year === 'full' ? '·' + y : year === 'short' ? '·' + y.slice(2) : '';
  return d + '·' + M[+m - 1] + tail;
}
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* ---------- Wordmark ---------- */
function wordmarkHTML(onDark) {
  return `<a href="index.html" class="wordmark ${onDark ? 'wordmark--on-dark' : ''}">
    <span class="wordmark__diamond"></span>
    <span class="wordmark__text">Peneiras<span class="dot">·</span>On</span>
  </a>`;
}

/* ---------- Site header (nav pública) ---------- */
function mountSiteHeader(active) {
  const host = document.querySelector('[data-site-header]');
  if (!host) return;
  /* Ordem segue a jornada de quem chega: o que é → quanto custa → onde tem
     peneira → em quem confio → dúvidas. Política de Privacidade fica só no
     rodapé (coluna Legal). */
  host.innerHTML = `
    <div class="header-sentinel" aria-hidden="true"></div>
    <header class="site-header">
      <div class="container site-header__inner">
        ${wordmarkHTML(false)}
        <button class="nav-toggle" type="button" data-nav-toggle aria-controls="site-nav" aria-expanded="false" aria-label="Abrir menu de navegação">☰</button>
        <nav class="site-nav" id="site-nav">
          <a href="index.html#como-funciona">Como funciona</a>
          <a href="index.html#planos">Planos</a>
          <a href="atleta.html?tela=peneiras">Peneiras</a>
          <a href="sobre.html">Sobre</a>
          <a href="index.html#faq">FAQ</a>
        </nav>
        <div class="site-header__actions">
          <div class="entrar">
            <button class="entrar__btn" type="button">Entrar <span class="entrar__chevron" aria-hidden="true">▼</span></button>
            <div class="entrar__menu">
              <div class="entrar__head">Entrar como…</div>
              <a class="entrar__item" href="login.html?tipo=jogador">
                <span class="entrar__item-icon">✦</span>
                <span><span class="entrar__item-label">Jogador</span><br><span class="entrar__item-sub">Já tenho inscrição</span></span>
                <span style="font-family:var(--font-display);font-weight:900">→</span>
              </a>
              <a class="entrar__item" href="login.html?tipo=olheiro">
                <span class="entrar__item-icon">◉</span>
                <span><span class="entrar__item-label">Olheiro</span><br><span class="entrar__item-sub">Acesso credenciado</span></span>
                <span style="font-family:var(--font-display);font-weight:900">→</span>
              </a>
              <a class="entrar__item" href="login.html?tipo=academia">
                <span class="entrar__item-icon">▦</span>
                <span><span class="entrar__item-label">Academia</span><br><span class="entrar__item-sub">Gestão estratégica</span></span>
                <span style="font-family:var(--font-display);font-weight:900">→</span>
              </a>
              <div class="entrar__foot">
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">Sem conta?</span>
                <a href="atleta.html?tela=cadastro" style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--ink);text-transform:uppercase;letter-spacing:.08em;text-decoration:none">Inscreva-se →</a>
              </div>
            </div>
          </div>
          <a href="atleta.html?tela=cadastro" class="btn btn--accent btn--sm">Quero me inscrever →</a>
        </div>
      </div>
    </header>`;

  bindSiteHeader(host, active || document.body.getAttribute('data-page'));
  bindHeaderShadow(host);
}

/* Sombra no header sticky depois dos primeiros pixels de rolagem: observa uma
   sentinela de 1px logo antes dele em vez de escutar scroll. */
function bindHeaderShadow(host) {
  const sentinel = host.querySelector('.header-sentinel');
  const header = host.querySelector('.site-header');
  if (!sentinel || !header || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-scrolled', !entry.isIntersecting);
  }).observe(sentinel);
}

/* Liga os comportamentos do header público: link ativo, menu mobile,
   âncoras da própria página (rolagem + foco + scrollspy) e dropdown "Entrar"
   por clique (toque não dispara :hover). */
function bindSiteHeader(host, activePage) {
  const nav = host.querySelector('.site-nav');
  const toggle = host.querySelector('[data-nav-toggle]');
  const entrar = host.querySelector('.entrar');
  const entrarBtn = host.querySelector('.entrar__btn');
  const here = location.pathname.split('/').pop() || 'index.html';
  const links = [...nav.querySelectorAll('a')];

  // Âncora da mesma página vs. link que sai dela — o CSS marca a segunda.
  links.forEach(a => {
    const [file, hash] = a.getAttribute('href').split('#');
    const isAnchor = file === here && hash && document.getElementById(hash);
    a.dataset.kind = isAnchor ? 'anchor' : 'page';
  });

  if (activePage) {
    links.forEach(a => {
      if (a.getAttribute('href') === activePage) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  const setNav = open => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', (open ? 'Fechar' : 'Abrir') + ' menu de navegação');
  };
  const setEntrar = open => {
    entrar.classList.toggle('is-open', open);
    entrarBtn.setAttribute('aria-expanded', String(open));
  };

  entrarBtn.setAttribute('aria-expanded', 'false');
  entrarBtn.setAttribute('aria-haspopup', 'true');

  toggle.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
  entrarBtn.addEventListener('click', () => setEntrar(!entrar.classList.contains('is-open')));

  // Âncora da própria página: rola (suave via CSS, respeitando scroll-margin-top),
  // fecha o menu mobile e leva o foco junto — rolar sozinho não move o foco.
  const anchors = links.filter(a => a.dataset.kind === 'anchor');
  anchors.forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').split('#')[1];
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      setNav(false);
      history.pushState(null, '', '#' + id);
      target.setAttribute('tabindex', '-1');
      target.scrollIntoView();
      target.focus({ preventScroll: true });
    });
  });

  // Scrollspy: marca na nav a seção que ocupa a faixa entre 25% e 35% da
  // viewport. Sem âncora nessa faixa (ex.: hero), nada fica marcado.
  const targets = anchors.map(a => document.getElementById(a.getAttribute('href').split('#')[1]));
  if (targets.length && 'IntersectionObserver' in window) {
    const inView = new Map();
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => inView.set(en.target.id, en.isIntersecting));
      const current = targets.find(t => inView.get(t.id));
      anchors.forEach(a => {
        const on = !!current && a.getAttribute('href').endsWith('#' + current.id);
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location');
        else if (a.getAttribute('aria-current') === 'location') a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    targets.forEach(t => spy.observe(t));
  }

  // fecha ao clicar fora
  document.addEventListener('click', e => {
    if (!entrar.contains(e.target)) setEntrar(false);
    if (!nav.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) setNav(false);
  });
  // fecha no Esc, devolvendo o foco ao gatilho
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (entrar.classList.contains('is-open')) { setEntrar(false); entrarBtn.focus(); }
    if (nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
  });
}

/* ---------- Header simples (páginas internas: login, sobre, etc.) ---------- */
function mountSimpleHeader(crumb, backHref, backLabel) {
  const host = document.querySelector('[data-simple-header]');
  if (!host) return;
  host.innerHTML = `
    <div class="header-sentinel" aria-hidden="true"></div>
    <header class="site-header">
      <div class="container site-header__inner">
        ${wordmarkHTML(false)}
        <span class="site-header__crumb">/ ${crumb}</span>
        <div class="site-header__actions">
          <a href="${backHref || 'index.html'}" style="background:transparent;border:none;cursor:pointer;font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-soft);text-decoration:none">← ${backLabel || 'Voltar à home'}</a>
          <a href="atleta.html?tela=cadastro" class="btn btn--accent btn--sm">Quero me inscrever →</a>
        </div>
      </div>
    </header>`;
  bindHeaderShadow(host);
}

/* ---------- Site footer ----------
   mountSiteFooter()                        → rodapé completo (landing)
   mountSiteFooter({compact:true, lines:[]}) → variante reduzida (sobre, privacidade) */
function mountSiteFooter(opts = {}) {
  const host = document.querySelector('[data-site-footer]');
  if (!host) return;
  if (opts.compact) {
    host.innerHTML = `
    <footer class="site-footer site-footer--compact">
      <div class="site-footer__bottom">
        <div class="container site-footer__bottom-inner">
          ${(opts.lines || []).map(l => `<span>${l}</span>`).join('')}
        </div>
      </div>
    </footer>`;
    return;
  }
  host.innerHTML = `
    <footer class="site-footer">
      <div class="site-footer__cta">
        <div class="container site-footer__cta-inner">
          <div>
            <div class="kicker accent">Pronto para entrar em campo?</div>
            <h3 class="display" style="font-size:clamp(36px,5vw,72px);margin-top:12px">Inscreva-se em<br>menos de 4 minutos.</h3>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:flex-end">
            <a href="atleta.html?tela=cadastro" class="btn btn--accent btn--lg">Quero me inscrever →</a>
            <a href="login.html?tipo=jogador" class="btn btn--ghost btn--lg btn--on-dark">Já sou inscrito · Entrar</a>
          </div>
        </div>
      </div>

      <div class="container site-footer__cols">
        <div>
          ${wordmarkHTML(true)}
          <p class="site-footer__desc">Plataforma de captação de talentos. Onde o talento encontra o jogo — independentemente de onde estiver.</p>
          <div class="social">
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="YouTube">YT</a>
            <a href="#" aria-label="TikTok">TT</a>
            <a href="#" aria-label="LinkedIn">IN</a>
            <a href="#" aria-label="WhatsApp">WA</a>
          </div>
        </div>
        <div>
          <div class="foot-col__title">Plataforma</div>
          <div class="foot-col__links">
            <a href="index.html#como-funciona">Como funciona</a>
            <a href="sobre.html">Sobre</a>
            <a href="index.html#faq">FAQ</a>
            <a href="index.html#planos">Planos</a>
          </div>
        </div>
        <div>
          <div class="foot-col__title">Conta</div>
          <div class="foot-col__links">
            <a href="atleta.html?tela=cadastro">Quero me inscrever</a>
            <a href="login.html?tipo=jogador">Entrar</a>
            <a href="recuperar.html">Recuperar senha</a>
            <a href="login.html?tipo=olheiro">Acesso do olheiro</a>
            <a href="login.html?tipo=academia">Acesso da academia</a>
          </div>
        </div>
        <div>
          <div class="foot-col__title">Legal</div>
          <div class="foot-col__links">
            <a href="privacidade.html">Política de Privacidade</a>
          </div>
        </div>
        <div>
          <div class="foot-col__title">Ajuda</div>
          <div class="foot-col__links">
            <a href="#">Central de ajuda</a>
            <a href="#">Documentação</a>
          </div>
        </div>
      </div>

      <div class="site-footer__bottom">
        <div class="container site-footer__bottom-inner">
          <span>© 2026 PENEIRAS ON · TODOS OS DIREITOS RESERVADOS</span>
          <span>FIAP / ENGENHARIA DE SOFTWARE · SEMI-PRESENCIAL RJ</span>
          <span>EM PARCERIA COM <span class="gold">PELÉ ACADEMIA</span></span>
        </div>
      </div>
    </footer>`;
}

/* ---------- Componentes HTML reutilizáveis ---------- */
function statHTML(label, value, opts = {}) {
  const big = opts.big ? ' stat__value--big' : '';
  const delta = opts.delta ? `<span class="stat__delta">${opts.delta}</span>` : '';
  const sub = opts.sub ? `<span class="stat__sub">${opts.sub}</span>` : '';
  return `<div class="stat">
    <span class="stat__label">${label}</span>
    <div style="display:flex;align-items:baseline;gap:6px"><span class="stat__value${big}">${value}</span></div>
    <div style="display:flex;align-items:center;gap:8px">${delta}${sub}</div>
  </div>`;
}

function progressHTML(value, max, opts = {}) {
  const pct = Math.max(0, Math.min(100, (value/(max||100))*100));
  const fillCls = opts.tone === 'ink' ? 'progress__fill progress__fill--ink' : 'progress__fill';
  const h = opts.sm ? 'progress--sm' : (opts.xs ? 'progress--xs' : '');
  let head = '';
  if (opts.label || opts.sublabel) {
    head = `<div class="progress-head">
      ${opts.label ? `<span class="mono text-soft">${opts.label}</span>` : ''}
      ${opts.sublabel ? `<span style="font-family:var(--font-display);font-weight:800;font-size:14px">${opts.sublabel}</span>` : ''}
    </div>`;
  }
  return `${head}<div class="progress ${h}"><div class="${fillCls}" style="width:${pct}%"></div></div>`;
}

function avatarHTML(name, opts = {}) {
  const initials = (name||'?').split(' ').map(s=>s[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
  const size = opts.size || 40;
  const cls = opts.gold ? 'avatar avatar--gold' : 'avatar';
  return `<span class="${cls}" style="width:${size}px;height:${size}px;font-size:${(size*0.36).toFixed(0)}px">${initials}</span>`;
}

function tagHTML(text, tone) {
  return `<span class="tag ${tone ? 'tag--'+tone : ''}">${text}</span>`;
}

/* ---------- Região aria-live global (acessibilidade dinâmica) ----------
   Região polite invisível + window.announce(msg). Usada para anunciar
   mudanças que acontecem sem recarregar a página: filtros e busca da lista
   de inscritos, favoritar, check-in, salvar nota e decisão de avaliação. */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('[data-live-region]')) {
    const lr = document.createElement('div');
    lr.setAttribute('data-live-region', '');
    lr.setAttribute('aria-live', 'polite');
    lr.setAttribute('aria-atomic', 'true');
    lr.className = 'sr-only';
    document.body.appendChild(lr);
  }
});
window.announce = function (msg) {
  const lr = document.querySelector('[data-live-region]');
  if (lr) { lr.textContent = ''; setTimeout(() => { lr.textContent = msg; }, 50); }
};
