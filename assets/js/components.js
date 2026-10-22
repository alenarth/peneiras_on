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
  // data sem hora ('2026-06-15') seria lida como UTC e cairia um dia atrás em BRT
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + 'T00:00:00' : iso);
  return d.toLocaleDateString('pt-BR', opts || { day:'2-digit', month:'short', year:'numeric' }).toUpperCase();
}
/* Data no formato de rótulo do projeto: 15·JUN·26 / 15·JUN·2026 / 15·JUN */
function fmtDotDate(iso, year) {
  const M = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const [y, m, d] = iso.split('-');
  const tail = year === 'full' ? '·' + y : year === 'short' ? '·' + y.slice(2) : '';
  return d + '·' + M[+m - 1] + tail;
}

/* ---------- Wordmark ----------
   Logo horizontal (símbolo + PENEIRAS-ON) em SVG vetorizado da arte oficial —
   assets/brand/logo-horizontal.svg, ~6 KB, uma requisição cacheada para o site
   inteiro. O <img> leva alt com o nome da marca: é o texto do link para leitor
   de tela. A variante `sm` é o tamanho da barra lateral dos painéis. */
function wordmarkHTML(opts = {}) {
  const size = opts.size === 'sm' ? ' wordmark--sm' : '';
  return `<a href="index.html" class="wordmark${size}" aria-label="Peneiras On · página inicial">
    <img class="wordmark__logo" src="assets/brand/logo-horizontal.svg" alt="Peneiras-On" width="1459" height="180" decoding="async">
  </a>`;
}

/* ---------- Redes sociais ----------
   Ícones desenhados aqui (SVG inline, currentColor): sem perfis reais ainda,
   são marcas não interativas, fora da ordem de tabulação. Cada ícone é um
   item da lista de redes (role="listitem"): span genérico não aceita
   aria-label, então o nome vai em texto visualmente oculto (lido pelo leitor
   de tela) e no title (dica para o mouse). */
const SOCIAL_ICONS = [
  ['Instagram', '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none"/>'],
  ['YouTube', '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9.2 15.2 12 10 14.8Z" fill="currentColor" stroke="none"/>'],
  ['TikTok', '<path d="M14 3v11.2a3.4 3.4 0 1 1-3-3.38"/><path d="M14 3c.4 2.6 2 4.2 4.6 4.5"/>'],
  ['LinkedIn', '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7.6 10.4v6.2M7.6 7.6v.1M11.6 16.6v-6.2M11.6 12.9c0-1.4 1-2.5 2.4-2.5s2.4 1.1 2.4 2.5v3.7"/>'],
  ['WhatsApp', '<path d="M4.2 19.8 5.5 16a7.6 7.6 0 1 1 2.9 2.7Z"/><path d="M9.2 9.1c.5 2.2 2.1 3.8 4.3 4.4l1-1.2 1.7.9-.3 1.5c-2.9.5-6.4-2.6-6.6-6l1.4-.4Z" fill="currentColor" stroke="none"/>'],
].map(([name, body]) =>
  `<span role="listitem" title="${name} · em breve"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg><span class="sr-only">${name} (em breve)</span></span>`
).join('');

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
      <div class="wrap site-header__inner">
        ${wordmarkHTML()}
        <button class="nav-toggle" type="button" data-nav-toggle aria-controls="site-nav" aria-expanded="false" aria-label="Abrir menu de navegação">☰</button>
        <nav class="site-nav" id="site-nav">
          <a href="index.html#como-funciona">Como funciona</a>
          <a href="index.html#planos">Planos</a>
          <a href="peneiras.html">Peneiras</a>
          <a href="feed.html">Destaques</a>
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
                <span class="font-display font-black">→</span>
              </a>
              <a class="entrar__item" href="login.html?tipo=olheiro">
                <span class="entrar__item-icon">◉</span>
                <span><span class="entrar__item-label">Olheiro</span><br><span class="entrar__item-sub">Acesso credenciado</span></span>
                <span class="font-display font-black">→</span>
              </a>
              <a class="entrar__item" href="login.html?tipo=academia">
                <span class="entrar__item-icon">▦</span>
                <span><span class="entrar__item-label">Academia</span><br><span class="entrar__item-sub">Gestão estratégica</span></span>
                <span class="font-display font-black">→</span>
              </a>
              <div class="entrar__foot">
                <span class="font-mono text-11 text-ink-soft">Sem conta?</span>
                <a href="cadastro.html" class="font-mono text-11 font-bold text-ink uppercase tracking-label no-underline">Inscreva-se →</a>
              </div>
            </div>
          </div>
          <a href="cadastro.html" class="btn btn--accent btn--sm">Quero me inscrever →</a>
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
/* opts.cta === false suprime o "Quero me inscrever →" — na própria página de
   cadastro ele apontaria para onde a pessoa já está. */
function mountSimpleHeader(crumb, backHref, backLabel, opts = {}) {
  const host = document.querySelector('[data-simple-header]');
  if (!host) return;
  host.innerHTML = `
    <div class="header-sentinel" aria-hidden="true"></div>
    <header class="site-header">
      <div class="wrap site-header__inner">
        ${wordmarkHTML()}
        <span class="site-header__crumb">/ ${crumb}</span>
        <div class="site-header__actions">
          <a href="${backHref || 'index.html'}" class="site-header__back">← ${backLabel || 'Voltar à home'}</a>
          ${opts.cta === false ? '' : '<a href="cadastro.html" class="btn btn--accent btn--sm">Quero me inscrever →</a>'}
        </div>
      </div>
    </header>`;
  bindHeaderShadow(host);
}

/* ---------- Site footer ----------
   mountSiteFooter()                        → rodapé completo (landing)
   mountSiteFooter({compact:true, lines:[]}) → variante reduzida (sobre, privacidade) */
/* O rodapé é a última coisa injetada: se a URL veio com #hash, o navegador já
   rolou antes de a página ter a altura final e pode ter parado curto. */
function scrollToHashAfterMount() {
  if (!location.hash || location.hash.length < 2) return;
  try {
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) t.scrollIntoView({ behavior: 'instant', block: 'start' });
  } catch (e) { /* hash sem elemento: nada a fazer */ }
}

function mountSiteFooter(opts = {}) {
  const host = document.querySelector('[data-site-footer]');
  if (!host) return;
  if (opts.compact) {
    // Links mínimos: a Política saiu da nav e o compacto não tem a coluna Legal.
    // A página atual não aparece na própria lista.
    const here = location.pathname.split('/').pop() || 'index.html';
    const links = [['index.html', 'Início'], ['sobre.html', 'Sobre'], ['peneiras.html', 'Peneiras'], ['privacidade.html', 'Política de Privacidade'], ['design-system.html', 'Design System']]
      .filter(([href]) => href !== here)
      .map(([href, label]) => `<a href="${href}">${label}</a>`).join(' · ');
    host.innerHTML = `
    <footer class="site-footer site-footer--compact">
      <div class="site-footer__bottom">
        <div class="wrap site-footer__bottom-inner">
          ${(opts.lines || []).map(l => `<span>${l}</span>`).join('')}
          <nav aria-label="Links do rodapé"><span>${links}</span></nav>
        </div>
      </div>
    </footer>`;
    scrollToHashAfterMount();
    return;
  }
  host.innerHTML = `
    <footer class="site-footer">
      <div class="site-footer__cta">
        <div class="wrap site-footer__cta-inner">
          <div>
            <div class="section-kicker accent">Pronto para entrar em campo?</div>
            <h3 class="display text-fluid-md mt-3">Inscreva-se em<br>menos de 4 minutos.</h3>
          </div>
          <div class="btn-row btn-row--even gap-3 justify-end max-w-form ml-auto">
            <a href="cadastro.html" class="btn btn--accent btn--lg">Quero me inscrever →</a>
            <a href="login.html?tipo=jogador" class="btn btn--ghost btn--lg btn--on-dark">Já sou inscrito</a>
          </div>
        </div>
      </div>

      <div class="wrap site-footer__cols">
        <div>
          ${wordmarkHTML()}
          <p class="site-footer__desc">Plataforma de captação de talentos. Onde o talento encontra o jogo, independentemente de onde estiver.</p>
          <!-- Sem perfis reais ainda: marcas não interativas, fora da ordem de tabulação.
               role="list" dá à div um papel que aceita nome acessível. -->
          <div class="social" role="list" aria-label="Redes sociais (em breve)">${SOCIAL_ICONS}</div>
        </div>
        <div>
          <div class="foot-col__title">Plataforma</div>
          <div class="foot-col__links">
            <a href="index.html#como-funciona">Como funciona</a>
            <a href="sobre.html">Sobre</a>
            <a href="index.html#faq">FAQ</a>
            <a href="index.html#planos">Planos</a>
            <a href="feed.html">Destaques</a>
            <a href="design-system.html">Design System</a>
          </div>
        </div>
        <div>
          <div class="foot-col__title">Conta</div>
          <div class="foot-col__links">
            <a href="cadastro.html">Quero me inscrever</a>
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
            <a href="index.html#faq">Perguntas frequentes</a>
            <a href="sobre.html#contato">Fale com a gente</a>
          </div>
        </div>
      </div>

      <div class="site-footer__bottom">
        <div class="wrap site-footer__bottom-inner">
          <span>© 2026 PENEIRAS ON · TODOS OS DIREITOS RESERVADOS</span>
          <span>FIAP / ENGENHARIA DE SOFTWARE · SEMI-PRESENCIAL RJ</span>
          <span>EM PARCERIA COM <span class="gold">PELÉ ACADEMIA</span></span>
        </div>
      </div>
    </footer>`;
  scrollToHashAfterMount();
}

/* ---------- Componentes HTML reutilizáveis ---------- */
function statHTML(label, value, opts = {}) {
  const big = opts.big ? ' stat__value--big' : '';
  const delta = opts.delta ? `<span class="stat__delta">${opts.delta}</span>` : '';
  const sub = opts.sub ? `<span class="stat__sub">${opts.sub}</span>` : '';
  return `<div class="stat">
    <span class="stat__label">${label}</span>
    <div class="flex items-baseline gap-1.5"><span class="stat__value${big}">${value}</span></div>
    <div class="flex items-center gap-2">${delta}${sub}</div>
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
      ${opts.sublabel ? `<span class="font-display font-extrabold text-14">${opts.sublabel}</span>` : ''}
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

/* A região aria-live global e o announce() moraram aqui até a Sprint 3;
   agora estão em ui.js (carregado antes deste arquivo), junto dos toasts. */

/* ============================================================
   EVENTOS (peneiras) — compartilhado entre peneiras.html (público)
   e atleta.html?tela=peneiras (pessoal). Um card, um filtro, uma
   contagem regressiva: as duas telas não podem divergir.
   ============================================================ */

/* Quebra o tempo restante até uma data em dias/horas/minutos/segundos.
   Retorna tudo zerado quando a data já passou. */
function countdownParts(target) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const pad = n => String(n).padStart(2, '0');
  return {
    over: ms === 0,
    cells: [
      [pad(Math.floor(ms / 86400000)), 'dias'],
      [pad(Math.floor(ms / 3600000) % 24), 'h'],
      [pad(Math.floor(ms / 60000) % 60), 'min'],
      [pad(Math.floor(ms / 1000) % 60), 's'],
    ],
  };
}

/* Atualiza a contagem a cada segundo dentro de `root` ([data-countdown] e
   [data-countdown-state]). Respeita prefers-reduced-motion: com movimento
   reduzido, renderiza uma vez, não fica piscando números e avisa no rótulo
   que a atualização automática está desligada. Devolve a função que para o
   intervalo (Sprint 4: quem redesenha a contagem desliga a anterior). */
function startCountdown(target, root) {
  const scope = root || document;
  const host = scope.querySelector('[data-countdown]');
  const state = scope.querySelector('[data-countdown-state]');
  if (!host) return () => {};
  const paint = () => {
    const { over, cells } = countdownParts(target);
    host.innerHTML = cells.map(c => `<div class="text-center p-3 bg-bg-alt border border-line-soft"><div class="display text-36">${c[0]}</div><div class="font-mono text-10 text-ink-soft uppercase mt-1">${c[1]}</div></div>`).join('');
    if (state) state.innerHTML = over ? tagHTML('encerrada', 'outline') : '';
    return over;
  };
  if (paint()) return () => {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (state) {
      state.innerHTML = tagHTML('atualização automática desligada', 'outline');
      state.title = 'Contagem congelada porque o sistema pede movimento reduzido. Recarregue a página para atualizar.';
    }
    return () => {};
  }
  const id = setInterval(() => { if (paint()) clearInterval(id); }, 1000);
  return () => clearInterval(id);
}

/* Filtros de status: chave usada no estado da tela + rótulo do botão. */
const EVENT_STATUS_FILTERS = [
  ['all', 'Todas'],
  ['aberta', 'Abertas'],
  ['inscrições', 'Inscrições'],
  ['encerrada', 'Encerradas'],
];

/* Encerrada = a peneira já aconteceu OU o prazo de inscrição (encerraEm,
   montado em data.js) passou. É recalculado a cada chamada, então o
   cronômetro ao vivo pode virar o card sem recarregar a página. */
function eventStatus(event) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(event.date + 'T00:00:00');
  if (date <= today) return 'encerrada';
  if (event.encerraEm && event.encerraEm.getTime() <= Date.now()) return 'encerrada';
  return event.status;
}

/* Filtra por status ('all' ou um e.status) e, opcionalmente, por estado (UF). */
function filterEvents(events, { status = 'all', state = 'all' } = {}) {
  return events.filter(e =>
    (status === 'all' || eventStatus(e) === status) &&
    (state === 'all' || e.state === state));
}

/* UFs presentes em EVENTS, em ordem alfabética — nunca uma lista chumbada. */
function eventStates(events) {
  return [...new Set(events.map(e => e.state))].sort();
}

const EVENT_STATUS_TONE = { aberta: 'success', 'inscrições': 'accent', encerrada: 'outline' };

/* Card de peneira.
   mode 'publico'  → CTA "Quero participar" (login com ?evento=), sem dado pessoal.
   mode 'atleta'   → opts.registered decide entre "Ver comprovante" e "Inscrever-se".
   Encerrada em qualquer modo → botão desabilitado "Encerrada".
   Aberta em qualquer modo → botão "Compartilhar" ao lado (Compartilhar, abaixo). */
function eventCardHTML(e, mode, opts = {}) {
  const status = eventStatus(e);
  const closed = status === 'encerrada';
  const registered = mode === 'atleta' && !!opts.registered;
  let cta;
  if (closed) cta = `<button class="btn btn--ghost btn--sm btn--full" disabled>Encerrada</button>`;
  else if (mode === 'atleta' && registered) cta = `<a href="atleta.html?tela=status" class="btn btn--ghost btn--sm btn--full">Ver comprovante</a>`;
  else if (mode === 'atleta') cta = `<button type="button" class="btn btn--primary btn--sm btn--full" data-register="${esc(e.id)}">Inscrever-se</button>`;
  else cta = `<a href="login.html?tipo=jogador&evento=${esc(e.id)}" class="btn btn--primary btn--sm btn--full">Quero participar</a>`;
  // Cronômetro de encerramento (Sprint 4): só em peneira com inscrição aberta e
  // prazo conhecido. O texto já sai calculado no HTML; EventTimers o mantém vivo.
  const timer = !closed && e.encerraEm ? eventTimerHTML(e) : '';
  const urgent = timer && isUrgent(e);
  return `<article class="card card--flush card--hover${urgent ? ' card--urgent' : ''}" data-event="${esc(e.id)}" aria-labelledby="ev-${esc(e.id)}">
    <div class="py-3.5 px-5 border-b border-b-line flex justify-between items-center gap-2 flex-wrap">
      <span class="flex gap-1.5 flex-wrap" data-status-tags>${tagHTML('● ' + status, EVENT_STATUS_TONE[status] || 'outline')}${urgent ? tagHTML('⏱ últimas horas', 'accent') : ''}${registered ? tagHTML('Inscrito', 'ink') : ''}</span>
      <span class="font-mono text-10 text-ink-mute">${e.age.replace('-', ' – ')} anos</span>
    </div>
    <div class="p-6">
      <div class="display text-28 tracking-display" id="ev-${esc(e.id)}">${e.city}</div>
      <div class="font-mono text-11 text-ink-soft mt-1">${e.state} · ${fmtDate(e.date)}</div>
      <div class="g g-2 gap-3 mt-5 pt-4 border-t border-t-line-soft">
        ${statHTML('Inscritos', fmtNum(e.registered))}
        ${statHTML('Vagas', e.capacity)}
      </div>
      <div class="mt-4">${progressHTML(Math.min(e.registered, e.capacity * 5), e.capacity * 5, { sm: true, tone: closed ? 'ink' : 'accent' })}</div>
      ${timer}
    </div>
    <div class="p-3 border-t border-t-line-soft${closed ? '' : ' flex flex-wrap gap-2'}" data-event-cta>${closed ? cta : `<div class="grow-[2] basis-40">${cta}</div>${shareButtonHTML(e)}`}</div>
  </article>`;
}

/* ---------- Cronômetro de encerramento nos cards (Sprint 4) ----------
   Reaproveita countdownParts() — a mesma conta da contagem regressiva grande.
   · nas últimas 24 h o card ganha destaque de urgência (borda e texto em
     laranja + tag "últimas horas"); nada pisca
   · role="timer" (aria-live off): o leitor de tela não ouve cada segundo; só
     o encerramento é anunciado, por announce()
   · sob prefers-reduced-motion o número fica parado e o card avisa que a
     atualização está pausada — mas o encerramento ainda acontece na hora. */
const URGENT_MS = 24 * 3600000;
function isUrgent(e) {
  const ms = e.encerraEm.getTime() - Date.now();
  return ms > 0 && ms <= URGENT_MS;
}
function fmtRemaining(target, withSeconds) {
  const [[d], [h], [m], [s]] = countdownParts(target).cells;
  const head = +d ? `${+d}d ${h}h ${m}min` : +h ? `${h}h ${m}min` : `${m}min`;
  return withSeconds ? `${head} ${s}s` : head;
}
function eventTimerHTML(e) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return `<div class="event-timer" data-timer="${esc(e.id)}">
    <span class="event-timer__label">Inscrições encerram em</span>
    <span class="event-timer__value" role="timer" aria-label="Tempo até encerrar as inscrições" data-timer-value>${fmtRemaining(e.encerraEm, !reduced)}</span>
    ${reduced ? '<span class="event-timer__note">Contagem pausada: seu sistema pede movimento reduzido. Recarregue para atualizar.</span>' : ''}
  </div>`;
}

/* Liga os cronômetros dos cards de uma lista. Um intervalo por card, e só
   enquanto o card está na tela (IntersectionObserver): saiu da tela, o
   intervalo é limpo; voltou, recomeça. Quem repinta a lista chama
   EventTimers.stop(lista) ANTES de trocar o innerHTML — senão os intervalos
   dos cards antigos ficariam órfãos, rodando sobre nós que já não existem.
   onClose(evento) avisa a tela quando uma peneira encerra. */
const EventTimers = (() => {
  const lists = new Map();   // lista → { io, intervals: Map(card → id), timeouts: [] }

  function closeCard(card, e, onClose, state) {
    // uma vez só: um card já encerrado que volte à tela não anuncia de novo
    if (card.dataset.encerrado) return;
    card.dataset.encerrado = '1';
    if (state && state.io) state.io.unobserve(card);
    // vira "encerrada" no lugar: sem recriar o card, o foco e a rolagem ficam
    const hadFocus = card.contains(document.activeElement);
    card.classList.remove('card--urgent');
    card.querySelector('[data-status-tags]').innerHTML = tagHTML('● encerrada', 'outline') +
      (card.querySelector('.tag--ink') ? tagHTML('Inscrito', 'ink') : '');
    const timer = card.querySelector('[data-timer]');
    if (timer) timer.outerHTML = `<div class="event-timer event-timer--closed"><span class="event-timer__label">Inscrições encerradas</span></div>`;
    const fill = card.querySelector('.progress__fill');
    if (fill) fill.classList.add('progress__fill--ink');
    const ctaBox = card.querySelector('[data-event-cta]');
    ctaBox.classList.remove('flex', 'flex-wrap', 'gap-2');   // sai o "Compartilhar": peneira encerrada não se divulga
    ctaBox.innerHTML = `<button class="btn btn--ghost btn--sm btn--full" disabled>Encerrada</button>`;
    if (hadFocus) { card.setAttribute('tabindex', '-1'); card.focus({ preventScroll: true }); }
    announce(`Inscrições encerradas para ${e.name}.`);
    if (onClose) onClose(e);
  }

  function paint(card, e, state, onClose) {
    if (eventStatus(e) === 'encerrada') { stopCard(card, state); closeCard(card, e, onClose, state); return; }
    const value = card.querySelector('[data-timer-value]');
    if (value) value.textContent = fmtRemaining(e.encerraEm, true);
    // entrou nas últimas 24 h com a página aberta: destaque aparece sem recarregar
    if (isUrgent(e) && !card.classList.contains('card--urgent')) {
      card.classList.add('card--urgent');
      card.querySelector('[data-status-tags] .tag').insertAdjacentHTML('afterend', tagHTML('⏱ últimas horas', 'accent'));
    }
  }
  function stopCard(card, state) {
    clearInterval(state.intervals.get(card));
    state.intervals.delete(card);
  }

  function watch(list, events, onClose) {
    stop(list);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { io: null, intervals: new Map(), timeouts: [] };
    lists.set(list, state);
    const cards = [...list.querySelectorAll('[data-event]')]
      .map(card => ({ card, e: events.find(x => x.id === card.dataset.event) }))
      .filter(x => x.e && x.card.querySelector('[data-timer]'));

    if (reduced) {
      // sem atualização por segundo; um único timeout vira o card na hora certa
      cards.forEach(({ card, e }) => {
        const ms = e.encerraEm.getTime() - Date.now();
        if (ms < 2147483647) state.timeouts.push(setTimeout(() => closeCard(card, e, onClose, state), Math.max(0, ms)));
      });
      return;
    }
    const byCard = new Map(cards.map(x => [x.card, x.e]));
    state.io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const e = byCard.get(en.target);
        if (en.isIntersecting && !state.intervals.has(en.target)) {
          paint(en.target, e, state, onClose);
          if (eventStatus(e) !== 'encerrada') state.intervals.set(en.target, setInterval(() => paint(en.target, e, state, onClose), 1000));
        } else if (!en.isIntersecting && state.intervals.has(en.target)) {
          stopCard(en.target, state);
        }
      });
    });
    cards.forEach(({ card }) => state.io.observe(card));
  }

  function stop(list) {
    const state = lists.get(list);
    if (!state) return;
    if (state.io) state.io.disconnect();
    state.intervals.forEach(id => clearInterval(id));
    state.timeouts.forEach(id => clearTimeout(id));
    lists.delete(list);
  }

  // para a verificação (console/teste): quantos intervalos estão vivos agora
  const active = () => [...lists.values()].reduce((n, s) => n + s.intervals.size, 0);
  return { watch, stop, active };
})();

/* "Peneira Rio · Caxias" → "Rio · Caxias" (rótulo curto, usado em kickers e cards).
   Aceita tanto o separador atual (·) quanto o travessão dos dados antigos. */
function eventShortName(e) {
  return e.name.replace(/^Peneira\s+/, '').replace(/\s+[—·]\s+/g, ' · ');
}

/* Estado vazio da grade — ocupa a linha inteira em vez de deixar o grid em branco. */
function eventsEmptyHTML() {
  return `<div class="card col-span-full text-center py-10 px-6">
    <div class="display text-22">Nenhuma peneira com esses filtros.</div>
    <p class="text-14 text-ink-soft mt-2 mb-4 mx-0">Tente outro status ou outro estado.</p>
    <button type="button" class="btn btn--ghost btn--sm" data-clear-filters>Limpar filtros</button>
  </div>`;
}

/* ---------- Compartilhar peneira (Sprint 4, teste com usuários) ----------
   A plataforma existe para a informação chegar longe: cada peneira aberta tem
   um botão que divulga nome, cidade, data e o link direto para ela.
     1. Web Share API (navigator.share, conferido com canShare) — abre a folha
        de compartilhar do sistema (WhatsApp, Instagram…) no celular;
     2. sem suporte, ou se o sistema recusar → Clipboard API (writeText);
     3. sem Clipboard API → document.execCommand('copy') numa <textarea> fora da tela;
     4. nada funcionou → toast com o link num campo, já selecionado, para copiar à mão.
   Cancelar a folha de compartilhar (AbortError) não é erro: nada aparece.
   O link é montado com URL + URLSearchParams e abre o calendário público já
   no estado e no card da peneira (peneiras.js lê ?evento=).
   Um listener só, no document, para todos os botões [data-share] — servem os
   cards montados agora e os que forem repintados pelos filtros. */
function shareButtonHTML(e, opts = {}) {
  // no card, os dois botões dividem a linha e quebram para baixo quando não
  // cabem (celular); o nome acessível começa pelo texto visível (WCAG 2.5.3) e diz qual peneira:
  // numa lista, vários "Compartilhar" idênticos não diriam nada
  return `<button type="button" class="btn btn--ghost ${opts.lg ? 'btn--lg' : 'btn--sm grow'}" data-share="${esc(e.id)}" aria-label="Compartilhar a peneira de ${esc(e.city)}">` +
    `<span aria-hidden="true">↗</span> Compartilhar</button>`;
}

const Compartilhar = (() => {
  function link(e) {
    const url = new URL('peneiras.html', location.href);
    url.search = new URLSearchParams({ evento: e.id, uf: e.state }).toString();
    url.hash = '';
    return url.toString();
  }
  function texto(e) {
    const data = fmtDate(e.date, { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
    return `${e.name}: ${e.city}/${e.state}, ${data}. Para quem tem de ${e.age.replace('-', ' a ')} anos. A inscrição é de graça.`;
  }

  // execCommand está obsoleto, mas é o único caminho em navegador antigo ou
  // em página sem HTTPS (onde a Clipboard API não existe)
  function copiaAntiga(valor) {
    const ta = document.createElement('textarea');
    ta.value = valor;
    ta.setAttribute('readonly', '');
    ta.className = 'fixed -left-[9999px] top-0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }
  async function copiar(valor) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(valor); return true; } catch (err) { /* permissão negada → tenta o antigo */ }
    }
    return copiaAntiga(valor);
  }

  function linkManual(url, btn) {
    const t = toast(`Não deu para copiar sozinho. Copie o link abaixo:<input type="text" readonly class="input block mt-2 h-9 text-12 font-mono" value="${esc(url)}" aria-label="Link da peneira">`, { type: 'info', duration: 0 });
    const campo = t.el.querySelector('input');
    campo.focus();
    campo.select();
    // fechar o aviso devolve o foco ao botão que abriu
    t.el.querySelector('.toast__close').addEventListener('click', () => { if (btn.isConnected) btn.focus(); });
  }

  async function compartilhar(e, btn) {
    const url = link(e);
    const text = texto(e);
    const dados = { title: e.name, text, url };
    if (navigator.share && (!navigator.canShare || navigator.canShare(dados))) {
      try {
        await navigator.share(dados);
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;   // a pessoa fechou a folha: não é erro
        // NotAllowedError e afins: segue para a cópia
      }
    }
    if (await copiar(`${text}\n${url}`)) {
      toast(`Link da peneira de ${esc(e.city)} copiado. É só colar no WhatsApp ou onde quiser.`, { type: 'success' });
      if (btn.isConnected) btn.focus();
    } else {
      linkManual(url, btn);
    }
  }

  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-share]');
    if (!btn || typeof MOCK === 'undefined' || !MOCK.EVENTS) return;
    const e = MOCK.EVENTS.find(x => x.id === btn.dataset.share);
    if (e) compartilhar(e, btn);
  });

  return { link, texto, compartilhar };
})();
