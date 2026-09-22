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
  return `<a href="index.html" class="wordmark${size}" aria-label="Peneiras On — página inicial">
    <img class="wordmark__logo" src="assets/brand/logo-horizontal.svg" alt="Peneiras-On" width="1459" height="180" decoding="async">
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
      <div class="wrap site-header__inner">
        ${wordmarkHTML()}
        <button class="nav-toggle" type="button" data-nav-toggle aria-controls="site-nav" aria-expanded="false" aria-label="Abrir menu de navegação">☰</button>
        <nav class="site-nav" id="site-nav">
          <a href="index.html#como-funciona">Como funciona</a>
          <a href="index.html#planos">Planos</a>
          <a href="peneiras.html">Peneiras</a>
          <a href="feed.html">Feed</a>
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
          <a href="${backHref || 'index.html'}" class="bg-transparent border-0 cursor-pointer font-mono text-11 uppercase tracking-label text-ink-soft no-underline">← ${backLabel || 'Voltar à home'}</a>
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
    const links = [['index.html', 'Início'], ['sobre.html', 'Sobre'], ['peneiras.html', 'Peneiras'], ['privacidade.html', 'Política de Privacidade']]
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
            <div class="kicker accent">Pronto para entrar em campo?</div>
            <h3 class="display text-fluid-md mt-3">Inscreva-se em<br>menos de 4 minutos.</h3>
          </div>
          <div class="flex gap-3 flex-wrap justify-end">
            <a href="cadastro.html" class="btn btn--accent btn--lg">Quero me inscrever →</a>
            <a href="login.html?tipo=jogador" class="btn btn--ghost btn--lg btn--on-dark">Já sou inscrito · Entrar</a>
          </div>
        </div>
      </div>

      <div class="wrap site-footer__cols">
        <div>
          ${wordmarkHTML()}
          <p class="site-footer__desc">Plataforma de captação de talentos. Onde o talento encontra o jogo, independentemente de onde estiver.</p>
          <!-- Sem perfis reais ainda: marcas não interativas, fora da ordem de tabulação -->
          <div class="social" aria-label="Redes sociais (em breve)">
            <span title="Instagram · em breve">IG</span>
            <span title="YouTube · em breve">YT</span>
            <span title="TikTok · em breve">TT</span>
            <span title="LinkedIn · em breve">IN</span>
            <span title="WhatsApp · em breve">WA</span>
          </div>
        </div>
        <div>
          <div class="foot-col__title">Plataforma</div>
          <div class="foot-col__links">
            <a href="index.html#como-funciona">Como funciona</a>
            <a href="sobre.html">Sobre</a>
            <a href="index.html#faq">FAQ</a>
            <a href="index.html#planos">Planos</a>
            <a href="feed.html">Feed</a>
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
   que a atualização automática está desligada. */
function startCountdown(target, root) {
  const scope = root || document;
  const host = scope.querySelector('[data-countdown]');
  const state = scope.querySelector('[data-countdown-state]');
  if (!host) return;
  const paint = () => {
    const { over, cells } = countdownParts(target);
    host.innerHTML = cells.map(c => `<div class="text-center p-3 bg-bg-alt border border-line-soft"><div class="display text-36">${c[0]}</div><div class="font-mono text-10 text-ink-soft uppercase mt-1">${c[1]}</div></div>`).join('');
    if (state) state.innerHTML = over ? tagHTML('encerrada', 'outline') : '';
    return over;
  };
  if (paint()) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (state) {
      state.innerHTML = tagHTML('atualização automática desligada', 'outline');
      state.title = 'Contagem congelada porque o sistema pede movimento reduzido. Recarregue a página para atualizar.';
    }
    return;
  }
  const id = setInterval(() => { if (paint()) clearInterval(id); }, 1000);
}

/* Filtros de status: chave usada no estado da tela + rótulo do botão. */
const EVENT_STATUS_FILTERS = [
  ['all', 'Todas'],
  ['aberta', 'Abertas'],
  ['inscrições', 'Inscrições'],
  ['encerrada', 'Encerradas'],
];

function eventStatus(event) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(event.date + 'T00:00:00');
  return date <= today ? 'encerrada' : event.status;
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
   Encerrada em qualquer modo → botão desabilitado "Encerrada". */
function eventCardHTML(e, mode, opts = {}) {
  const status = eventStatus(e);
  const closed = status === 'encerrada';
  const registered = mode === 'atleta' && !!opts.registered;
  let cta;
  if (closed) cta = `<button class="btn btn--ghost btn--sm btn--full" disabled>Encerrada</button>`;
  else if (mode === 'atleta' && registered) cta = `<a href="atleta.html?tela=status" class="btn btn--ghost btn--sm btn--full">Ver comprovante</a>`;
  else if (mode === 'atleta') cta = `<button type="button" class="btn btn--primary btn--sm btn--full" data-register="${esc(e.id)}">Inscrever-se</button>`;
  else cta = `<a href="login.html?tipo=jogador&evento=${esc(e.id)}" class="btn btn--primary btn--sm btn--full">Quero participar</a>`;
  return `<article class="card card--flush card--hover" data-event="${esc(e.id)}" aria-labelledby="ev-${esc(e.id)}">
    <div class="py-3.5 px-5 border-b border-b-line flex justify-between items-center gap-2 flex-wrap">
      <span class="flex gap-1.5 flex-wrap">${tagHTML('● ' + status, EVENT_STATUS_TONE[status] || 'outline')}${registered ? tagHTML('Inscrito', 'ink') : ''}</span>
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
    </div>
    <div class="p-3 border-t border-t-line-soft">${cta}</div>
  </article>`;
}

/* "Peneira Rio — Caxias" → "Rio · Caxias" (rótulo curto, usado em kickers e cards) */
function eventShortName(e) {
  return e.name.replace(/^Peneira\s+/, '').replace(/\s+—\s+/g, ' · ');
}

/* Estado vazio da grade — ocupa a linha inteira em vez de deixar o grid em branco. */
function eventsEmptyHTML() {
  return `<div class="card col-span-full text-center py-10 px-6">
    <div class="display text-22">Nenhuma peneira com esses filtros.</div>
    <p class="text-14 text-ink-soft mt-2 mb-4 mx-0">Tente outro status ou outro estado.</p>
    <button type="button" class="btn btn--ghost btn--sm" data-clear-filters>Limpar filtros</button>
  </div>`;
}
