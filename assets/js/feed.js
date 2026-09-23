/* ============================================================
   PENEIRAS ON — feed.js
   Feed de destaques (feed.html) e as interações que ele compartilha com o
   perfil do atleta (atleta.html?tela=perfil):
     · confirmação de tags de atributo (aria-pressed + contador)
     · votos (um voto por pessoa; votar de novo desfaz)
     · seguir / deixar de seguir (contador de seguidores)
     · filtros em tempo real por posição e por estado, sem reload
     · persistência em localStorage (sobrevive a F5) e reset para demonstração
   Tudo em JavaScript vanilla com manipulação direta do DOM: os cards são
   montados uma vez e cada interação atualiza só o nó que mudou.
   Depende de: data.js (MOCK), ui.js (UI.storage, toast, announce),
   components.js (esc, avatarHTML, tagHTML). Não usa framework.
   ============================================================ */
const Feed = (() => {
  const KEY = 'peneiras-on.feed.v1';
  const EMPTY = () => ({ votes: {}, tags: {}, follows: {} });

  /* ---------- estado persistido ---------- */
  let state = load();
  function load() {
    const s = UI.storage.get(KEY, null);
    if (!s || typeof s !== 'object') return EMPTY();
    // formato inesperado (corrompido / versão antiga) → cada parte cai no vazio
    return {
      votes: s.votes && typeof s.votes === 'object' ? s.votes : {},
      tags: s.tags && typeof s.tags === 'object' ? s.tags : {},
      follows: s.follows && typeof s.follows === 'object' ? s.follows : {},
    };
  }
  function save() { UI.storage.set(KEY, state); }
  const voteValue = id => state.votes[id] === -1 ? -1 : (state.votes[id] ? 1 : 0);
  const hasVote = id => voteValue(id) !== 0;
  const follows = id => !!state.follows[id];
  const tagOn = (id, attr) => Array.isArray(state.tags[id]) && state.tags[id].includes(attr);

  /* ---------- contadores-base (determinísticos, vindos do mock) ----------
     O mock não traz votos nem seguidores; os números de partida derivam do
     próprio atleta para o feed não nascer zerado. O que a pessoa faz soma
     em cima e é o que fica no localStorage. */
  const idx = a => MOCK.ATHLETES.indexOf(a);
  const baseVotes = a => Math.round(a.score * 2.4) + (idx(a) % 7);
  const baseFollowers = a => a.score * 11 + a.videos * 37 + (idx(a) % 5) * 3;
  const baseTag = (a, attr) => (a.attrs[attr] || 0) * 6 + ((attr.length + idx(a)) % 5);
  const votesOf = a => baseVotes(a) + voteValue(a.id);
  const followersOf = a => baseFollowers(a) + (follows(a.id) ? 1 : 0);
  const tagCountOf = (a, attr) => baseTag(a, attr) + (tagOn(a.id, attr) ? 1 : 0);

  /* ---------- markup (classes literais completas — o Tailwind varre o fonte) ---------- */
  function attrTagsHTML(a) {
    const icons = { Velocidade:'⚡', Finalização:'◎', Passe:'↗', Drible:'◌', Defesa:'⬟', Cabeceio:'⌃', Físico:'✚', Reflexo:'◒' };
    return Object.keys(a.attrs).map(attr => {
      const on = tagOn(a.id, attr);
      return `<button type="button" class="attr-tag" data-tag="${esc(attr)}" data-athlete="${esc(a.id)}" aria-pressed="${on}">` +
        `<span class="attr-tag__icon" aria-hidden="true">${icons[attr] || '•'}</span><span>${esc(attr)}</span><span class="attr-tag__count" data-count>${tagCountOf(a, attr)}</span>` +
        `<span class="sr-only">confirmações</span></button>`;
    }).join('');
  }
  function voteButtonHTML(a) {
    const value = voteValue(a.id);
    return `<div class="vote-control" role="group" aria-label="Votar em ${esc(a.name)}">` +
      `<button type="button" class="btn btn--sm ${value === 1 ? 'btn--accent' : 'btn--ghost'}" data-vote data-direction="1" data-athlete="${esc(a.id)}" aria-pressed="${value === 1}" aria-label="Voto positivo">` +
      `<span aria-hidden="true">↑</span></button>` +
      `<span class="vote-control__count" data-vote-count>${votesOf(a)}</span>` +
      `<button type="button" class="btn btn--sm ${value === -1 ? 'btn--danger' : 'btn--ghost'}" data-vote data-direction="-1" data-athlete="${esc(a.id)}" aria-pressed="${value === -1}" aria-label="Voto negativo">` +
      `<span aria-hidden="true">↓</span></button><span class="sr-only">votos</span></div>`;
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
        <div class="kicker uppercase mb-2">Confirme os atributos</div>
        <div class="flex flex-wrap gap-1.5" data-tags>${attrTagsHTML(a)}</div>
      </div>
      <footer class="flex items-center gap-2 p-3 border-t border-line-soft">
        ${voteButtonHTML(a)}
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
    UI.qsa(`[data-vote][data-athlete="${id}"]`, root).forEach(b => {
      const on = voteValue(id) === Number(b.dataset.direction);
      UI.setPressed(b, on);
      b.classList.toggle('btn--accent', on && b.dataset.direction === '1');
      b.classList.toggle('btn--danger', on && b.dataset.direction === '-1');
      b.classList.toggle('btn--ghost', !on);
    });
    UI.qsa('[data-vote-count]', root).forEach(count => { count.textContent = votesOf(a); });
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
      const btn = e.target.closest('[data-tag],[data-vote],[data-follow]');
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
      } else if (btn.hasAttribute('data-vote')) {
        const direction = Number(btn.dataset.direction);
        const on = voteValue(id) === direction;
        if (on) delete state.votes[id]; else state.votes[id] = direction;
        save(); updateCounts(root, id);
        toast(on ? `Voto em ${first} desfeito.` : `Voto registrado para ${first}: ${votesOf(a)} votos.`, { type: on ? 'info' : 'success' });
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
    UI.storage.remove(KEY);
    MOCK.ATHLETES.forEach(a => updateCounts(root, a.id));
    toast('Interações zeradas: votos, confirmações e seguidores voltaram ao início.', { type: 'info' });
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

  return { attrTagsHTML, voteButtonHTML, followButtonHTML, cardHTML, bind, updateCounts, reset, mount, hasVote, follows, tagOn, followersOf, votesOf };
})();
