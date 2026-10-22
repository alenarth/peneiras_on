/* ============================================================
   PENEIRAS ON — feed.js
   Feed de destaques (feed.html) e as interações que ele compartilha com o
   perfil do atleta (atleta.html?tela=perfil):
     · confirmação de tags de atributo (aria-pressed + contador)
     · apoio (Sprint 4, teste com usuários): endosso só positivo — um por
       pessoa, apoiar de novo desfaz. Substitui o voto ↑/↓: os atletas são
       menores de idade e um placar de votos negativos no perfil é dano real
     · seguir / deixar de seguir (contador de seguidores)
     · filtros em tempo real por posição e por estado, sem reload
     · persistência em localStorage (sobrevive a F5) e reset para demonstração
   Tudo em JavaScript vanilla com manipulação direta do DOM: os cards são
   montados uma vez e cada interação atualiza só o nó que mudou.
   Depende de: data.js (MOCK), ui.js (UI.storage, toast, announce),
   components.js (esc, avatarHTML, tagHTML). Não usa framework.
   ============================================================ */
const Feed = (() => {
  const KEY = 'peneiras-on.feed.v2';
  const LEGACY_KEY = 'peneiras-on.feed.v1';   // até a Sprint 4: votos ↑/↓ em `votes`
  const EMPTY = () => ({ supports: {}, tags: {}, follows: {} });

  /* ---------- estado persistido ---------- */
  let state = load();
  function load() {
    const s = UI.storage.get(KEY, null);
    if (s && typeof s === 'object') return clean(s);
    // Quem usou o feed antes do apoio tem a v1 salva. O voto positivo vira
    // apoio; o negativo é descartado em silêncio (não existe mais). A v1 é
    // apagada depois de migrar, para a conversão não rodar de novo.
    const old = UI.storage.get(LEGACY_KEY, null);
    if (!old || typeof old !== 'object') return EMPTY();
    const supports = {};
    if (old.votes && typeof old.votes === 'object') {
      Object.keys(old.votes).forEach(id => { if (old.votes[id] === 1 || old.votes[id] === true) supports[id] = true; });
    }
    const migrated = clean({ ...old, supports });
    UI.storage.set(KEY, migrated);
    UI.storage.remove(LEGACY_KEY);
    return migrated;
  }
  // formato inesperado (corrompido / editado à mão) → cada parte cai no vazio;
  // em `supports` só vale true, então nenhum valor estranho vira número na tela
  function clean(s) {
    const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    const supports = {};
    Object.keys(obj(s.supports)).forEach(id => { if (s.supports[id] === true) supports[id] = true; });
    return { supports, tags: obj(s.tags), follows: obj(s.follows) };
  }
  function save() { UI.storage.set(KEY, state); }
  const supports = id => !!state.supports[id];
  const follows = id => !!state.follows[id];
  const tagOn = (id, attr) => Array.isArray(state.tags[id]) && state.tags[id].includes(attr);

  /* ---------- contadores-base (determinísticos, vindos do mock) ----------
     O mock não traz votos nem seguidores; os números de partida derivam do
     próprio atleta para o feed não nascer zerado. O que a pessoa faz soma
     em cima e é o que fica no localStorage. */
  const idx = a => MOCK.ATHLETES.indexOf(a);
  const baseSupports = a => Math.round(a.score * 2.4) + (idx(a) % 7);
  const baseFollowers = a => a.score * 11 + a.videos * 37 + (idx(a) % 5) * 3;
  const baseTag = (a, attr) => (a.attrs[attr] || 0) * 6 + ((attr.length + idx(a)) % 5);
  const supportsOf = a => baseSupports(a) + (supports(a.id) ? 1 : 0);
  const supportsText = n => `${n} ${n === 1 ? 'apoio' : 'apoios'}`;
  const followersOf = a => baseFollowers(a) + (follows(a.id) ? 1 : 0);
  const tagCountOf = (a, attr) => baseTag(a, attr) + (tagOn(a.id, attr) ? 1 : 0);

  /* ---------- markup (classes literais completas — o Tailwind varre o fonte) ---------- */
  function attrTagsHTML(a) {
    const icons = { Velocidade:'⚡', Finalização:'◎', Passe:'↗', Drible:'◌', Defesa:'⬟', Cabeceio:'⌃', Físico:'✚', Reflexo:'◒' };
    return Object.keys(a.attrs).map(attr => {
      const on = tagOn(a.id, attr);
      // nome acessível "Confirmar Velocidade 103 confirmações": diz o que o toque faz
      return `<button type="button" class="attr-tag" data-tag="${esc(attr)}" data-athlete="${esc(a.id)}" aria-pressed="${on}">` +
        `<span class="attr-tag__icon" aria-hidden="true">${icons[attr] || '•'}</span><span class="sr-only">Confirmar </span><span>${esc(attr)}</span><span class="attr-tag__count" data-count>${tagCountOf(a, attr)}</span>` +
        `<span class="sr-only"> confirmações</span></button>`;
    }).join('');
  }
  /* Apoio: botão de alternância. O rótulo fica fixo ("Apoiar") e o estado vem
     de aria-pressed + visual (cor e ✓); o leitor de tela ouve "Apoiar Fulano,
     219 apoios, botão de alternância, pressionado". */
  function supportButtonHTML(a) {
    const on = supports(a.id);
    return `<button type="button" class="btn btn--sm ${on ? 'btn--accent' : 'btn--ghost'}" data-support data-athlete="${esc(a.id)}" aria-pressed="${on}">` +
      `<span aria-hidden="true" data-support-icon>${on ? '✓' : '+'}</span> Apoiar<span class="sr-only"> ${esc(a.name)},</span><span aria-hidden="true"> · </span><span data-support-count>${supportsText(supportsOf(a))}</span></button>`;
  }
  function followButtonHTML(a) {
    const on = follows(a.id);
    return `<button type="button" class="btn btn--sm ${on ? 'btn--primary' : 'btn--ghost'}" data-follow data-athlete="${esc(a.id)}" aria-pressed="${on}">` +
      `<span data-follow-label>${on ? 'Seguindo' : '+ Seguir'}</span> · <span data-count>${followersOf(a)}</span><span class="sr-only">seguidores</span></button>`;
  }
  function cardHTML(a) {
    return `<article class="card card--flush flex flex-col" data-athlete-card="${esc(a.id)}" data-position="${esc(a.position)}" data-state="${esc(a.state)}" aria-labelledby="fd-${esc(a.id)}">
      <header class="flex items-center gap-3 p-5 border-b border-line">
        ${avatarHTML(a.name, { size: 44, gold: a.plan === 'premium' })}
        <div class="min-w-0">
          <h2 id="fd-${esc(a.id)}" class="display text-20 m-0 leading-none">${esc(a.name)}</h2>
          <div class="font-mono text-11 text-ink-soft mt-1">${esc(MOCK.posLabel(a))} · ${esc(a.city)}/${esc(a.state)}</div>
          <div class="font-mono text-10 text-ink-mute mt-0.5">${esc(a.club)} · ${a.age} anos</div>
        </div>
        <div class="ml-auto text-right shrink-0">
          <div class="display text-24 leading-none">${a.score}</div>
          <div class="font-mono text-9 text-ink-mute uppercase tracking-widest">score</div>
        </div>
      </header>
      <div class="p-5 flex-1">
        <div class="kicker uppercase mb-2">Viu jogar? Toque no que você confirma</div>
        <div class="flex flex-wrap gap-1.5" data-tags>${attrTagsHTML(a)}</div>
      </div>
      <footer class="flex items-center gap-x-3 gap-y-1.5 flex-wrap p-3 border-t border-line-soft">
        ${supportButtonHTML(a)}
        <span class="font-mono text-10 text-ink-mute">Toque de novo para desfazer.</span>
      </footer>
    </article>`;
  }

  /* ---------- interações (delegação: um listener por container) ---------- */
  function updateCounts(root, id) {
    // atualiza só os contadores/estados do atleta que mudou, onde quer que estejam
    const a = MOCK.ATHLETES.find(x => x.id === id);
    if (!a) return;
    UI.qsa(`[data-tag][data-athlete="${id}"]`, root).forEach(b => {
      const attr = b.dataset.tag;
      UI.setPressed(b, tagOn(id, attr));
      UI.qs('[data-count]', b).textContent = tagCountOf(a, attr);
    });
    UI.qsa(`[data-support][data-athlete="${id}"]`, root).forEach(b => {
      const on = supports(id);
      UI.setPressed(b, on);
      b.classList.toggle('btn--accent', on); b.classList.toggle('btn--ghost', !on);
      UI.qs('[data-support-icon]', b).textContent = on ? '✓' : '+';
      UI.qs('[data-support-count]', b).textContent = supportsText(supportsOf(a));
    });
    UI.qsa(`[data-follow][data-athlete="${id}"]`, root).forEach(b => {
      const on = follows(id);
      UI.setPressed(b, on);
      b.classList.toggle('btn--primary', on); b.classList.toggle('btn--ghost', !on);
      UI.qs('[data-follow-label]', b).textContent = on ? 'Seguindo' : '+ Seguir';
      UI.qs('[data-count]', b).textContent = followersOf(a);
    });
  }
  function bind(root) {
    if (!root || root.dataset.feedBound) return;
    root.dataset.feedBound = '1';
    root.addEventListener('click', e => {
      const btn = e.target.closest('[data-tag],[data-support],[data-follow]');
      if (!btn || !root.contains(btn)) return;
      const id = btn.dataset.athlete;
      const a = MOCK.ATHLETES.find(x => x.id === id);
      if (!a) return;
      const first = a.name.split(' ')[0];
      if (btn.hasAttribute('data-tag')) {
        const attr = btn.dataset.tag;
        const list = Array.isArray(state.tags[id]) ? state.tags[id] : [];
        const on = !list.includes(attr);
        state.tags[id] = on ? [...list, attr] : list.filter(x => x !== attr);
        save(); updateCounts(root, id);
        // o toast é lido pelo leitor de tela (região polite) — sem announce() duplicado
        toast(on ? `${attr} confirmada para ${first}: ${tagCountOf(a, attr)} confirmações.` : `Confirmação de ${attr} desfeita para ${first}.`, { type: on ? 'success' : 'info' });
      } else if (btn.hasAttribute('data-support')) {
        const on = !supports(id);
        if (on) state.supports[id] = true; else delete state.supports[id];
        save(); updateCounts(root, id);
        toast(on ? `Você apoiou ${first}. Agora são ${supportsText(supportsOf(a))}.` : `Você tirou seu apoio a ${first}.`, { type: on ? 'success' : 'info' });
      } else if (btn.hasAttribute('data-follow')) {
        const on = !follows(id);
        if (on) state.follows[id] = true; else delete state.follows[id];
        save(); updateCounts(root, id);
        toast(on ? `Você segue ${a.name}, que tem ${followersOf(a)} seguidores.` : `Você deixou de seguir ${a.name}.`, { type: on ? 'success' : 'info' });
      }
    });
  }

  /* ---------- reset (demonstração) ---------- */
  function reset(root = document) {
    state = EMPTY();
    UI.storage.remove(KEY); UI.storage.remove(LEGACY_KEY);
    MOCK.ATHLETES.forEach(a => updateCounts(root, a.id));
    toast('Interações zeradas: apoios, confirmações e seguidores voltaram ao início.', { type: 'info' });
  }

  /* ---------- página feed.html ---------- */
  function mount(root) {
    const grid = UI.qs('[data-feed-grid]', root);
    const posSel = UI.qs('[data-filter-pos]', root);
    const ufSel = UI.qs('[data-filter-uf]', root);
    const count = UI.qs('[data-feed-count]', root);
    const empty = UI.qs('[data-feed-empty]', root);
    const clear = UI.qs('[data-feed-clear]', root);
    const resetBtn = UI.qs('[data-feed-reset]', root);

    // filtros: posições canônicas de data.js; estados derivados dos atletas
    posSel.innerHTML = '<option value="all">Todas as posições</option>' +
      Object.keys(MOCK.POSITION_PROFILES).map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
    ufSel.innerHTML = '<option value="all">Todos os estados</option>' +
      [...new Set(MOCK.ATHLETES.map(a => a.state))].sort().map(uf => `<option value="${uf}">${uf}</option>`).join('');

    // cards montados uma vez, ordenados por score; filtrar só mostra/esconde
    const list = [...MOCK.ATHLETES].sort((x, y) => y.score - x.score);
    grid.innerHTML = list.map(cardHTML).join('');
    bind(grid);

    function applyFilters(announceResult) {
      const pos = posSel.value, uf = ufSel.value;
      let n = 0;
      UI.qsa('[data-athlete-card]', grid).forEach(card => {
        const show = (pos === 'all' || card.dataset.position === pos) && (uf === 'all' || card.dataset.state === uf);
        card.hidden = !show; if (show) n++;
      });
      count.textContent = `${n} de ${list.length} atletas`;
      empty.hidden = n > 0;
      if (announceResult) announce(`${n} ${n === 1 ? 'atleta' : 'atletas'} nos destaques`);
    }
    posSel.addEventListener('change', () => applyFilters(true));
    ufSel.addEventListener('change', () => applyFilters(true));
    if (clear) clear.addEventListener('click', () => { posSel.value = 'all'; ufSel.value = 'all'; applyFilters(true); posSel.focus(); });
    if (resetBtn) resetBtn.addEventListener('click', () => reset(grid));
    applyFilters(false);
  }

  return { attrTagsHTML, supportButtonHTML, followButtonHTML, cardHTML, bind, updateCounts, reset, mount, supports, follows, tagOn, followersOf, supportsOf };
})();
