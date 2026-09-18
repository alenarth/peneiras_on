/* ============================================================
   PENEIRAS ON — Olheiro (lista · perfil · check-in · avaliação)
   ============================================================ */
const screenEl = document.querySelector('[data-screen]');
const params = new URLSearchParams(location.search);
const SCREENS = { lista: renderLista, perfil: renderPerfil, checkin: renderCheckin, avaliacao: renderAvaliacao };
const telaParam = params.get('tela') || 'lista';
// ?tela= desconhecido cai na tela padrão em vez de deixar o <main> vazio
const tela = SCREENS[telaParam] ? telaParam : 'lista';
const selId = params.get('id');

document.querySelectorAll('.nav-item').forEach(n => {
  const k = n.getAttribute('data-nav');
  if (k === tela || (tela === 'perfil' && k === 'lista')) n.classList.add('is-active');
});

SCREENS[tela]();

/* ---------------- LISTA ---------------- */
function renderLista() {
  const filters = { position:'all', region:'all', q:'', favOnly:false, withVideo:false, sortBy:'score' };

  function rows() {
    let r = [...MOCK.ATHLETES];
    if (filters.position !== 'all') r = r.filter(a => a.position.toLowerCase().includes(filters.position));
    if (filters.region !== 'all') r = r.filter(a => a.region === filters.region);
    if (filters.q) r = r.filter(a => a.name.toLowerCase().includes(filters.q.toLowerCase()) || a.city.toLowerCase().includes(filters.q.toLowerCase()));
    if (filters.favOnly) r = r.filter(a => a.favorite);
    if (filters.withVideo) r = r.filter(a => a.videos > 0);
    if (filters.sortBy === 'score') r.sort((a,b)=>b.score-a.score);
    if (filters.sortBy === 'completeness') r.sort((a,b)=>b.completeness-a.completeness);
    if (filters.sortBy === 'age') r.sort((a,b)=>a.age-b.age);
    return r;
  }

  function rowsHTML(data) {
    return data.map((a,idx)=>`<tr class="${a.favorite?'is-fav':''}" data-go="${a.id}">
      <td class="font-mono text-11 text-ink-mute">${String(idx+1).padStart(3,'0')}</td>
      <td><div class="flex items-center gap-2.5">${avatarHTML(a.name,{size:32,gold:a.favorite})}<div><div class="font-semibold">${a.name} ${a.favorite?'<span class="gold">★</span>':''}</div><div class="font-mono text-10 text-ink-soft">${a.foot} · ${a.height||'—'}cm · ${a.weight||'—'}kg</div></div></div></td>
      <td>${tagHTML(MOCK.posLabel(a),'outline')}</td>
      <td class="font-mono">${a.age}</td>
      <td>${a.city}/${a.state}</td>
      <td><div class="flex items-center gap-2"><span class="display text-18">${a.score}</span><div class="w-15 h-1 bg-bg-alt"><div class="h-full ${a.score>=85?'bg-accent':'bg-ink'}" style="width:${a.score}%"></div></div></div></td>
      <td class="font-mono">${a.completeness}%</td>
      <td>${a.videos>0?tagHTML('▶ '+a.videos,'ink'):'<span class="text-ink-mute">—</span>'}</td>
      <td>${tagHTML(a.status, a.status==='convocado'?'accent':'outline')}</td>
      <td class="text-right text-ink-mute">→</td>
    </tr>`).join('');
  }

  /* Repinta só o corpo da tabela e o contador. O <input> de busca nunca é
     recriado, então o cursor fica onde está (antes ele pulava para o fim). */
  function paintRows(announceResult) {
    const data = rows();
    screenEl.querySelector('[data-rows]').innerHTML = rowsHTML(data);
    screenEl.querySelector('[data-count]').textContent = `${data.length} resultados`;
    screenEl.querySelectorAll('[data-go]').forEach(tr=>tr.onclick=()=>{ location.href='olheiro.html?tela=perfil&id='+tr.dataset.go; });
    if (announceResult) announce(`${data.length} atletas na lista`);
  }

  function render() {
    const regions = [...new Set(MOCK.ATHLETES.map(a=>a.region))];
    screenEl.innerHTML = `
      <div class="page-head">
        <div>
          <div class="kicker uppercase">Painel do olheiro</div>
          <h1 class="display h-panel my-1 mx-0">Lista de inscritos</h1>
        </div>
        <div class="page-head__actions flex gap-2">
          <button class="btn btn--ghost btn--sm">Exportar PDF</button>
          <button class="btn btn--ghost btn--sm">Exportar CSV</button>
          <button class="btn btn--primary btn--sm">+ Adicionar nota</button>
        </div>
      </div>

      <div class="kpi-strip kpi-strip--5">
        ${statHTML('Inscritos','487',{delta:'+34 hoje'})}
        ${statHTML('Elegíveis','441',{delta:'90,5%'})}
        ${statHTML('Convocados','120',{delta:'lotado'})}
        ${statHTML('Score médio','78',{delta:'+3 vs SP'})}
        ${statHTML('Com vídeo','62%',{delta:'+12 pp'})}
      </div>

      <div class="filter-bar">
        <label class="sr-only" for="q">Buscar nome ou cidade</label>
        <input class="input w-65 h-10" id="q" placeholder="Buscar nome ou cidade…" value="${esc(filters.q)}">
        <select class="sel" id="position" aria-label="Filtrar por posição">
          <option value="all">Todas posições</option>
          ${['goleiro','zagueiro','lateral','volante','meia','ponta','atacante'].map(p=>`<option value="${p}" ${filters.position===p?'selected':''}>${p[0].toUpperCase()+p.slice(1)}</option>`).join('')}
        </select>
        <select class="sel" id="region" aria-label="Filtrar por região"><option value="all">Todas regiões</option>${regions.map(r=>`<option ${filters.region===r?'selected':''}>${r}</option>`).join('')}</select>
        <select class="sel" id="sortBy" aria-label="Ordenar lista">
          <option value="score">Ordenar por score</option>
          <option value="completeness" ${filters.sortBy==='completeness'?'selected':''}>Ordenar por completude</option>
          <option value="age" ${filters.sortBy==='age'?'selected':''}>Ordenar por idade</option>
        </select>
        <button class="ftoggle ${filters.favOnly?'is-active':''}" id="favOnly" aria-pressed="${filters.favOnly}">Só favoritos</button>
        <button class="ftoggle ${filters.withVideo?'is-active':''}" id="withVideo" aria-pressed="${filters.withVideo}">Com vídeo</button>
        <span class="ml-auto font-mono text-11 text-ink-soft" data-count></span>
      </div>

      <div class="table-scroll">
        <table class="table">
          <thead><tr>${['#','Atleta','Posição','Idade','Origem','Score','Compl.','Vídeos','Status',''].map(h=>`<th>${h}</th>`).join('')}</tr></thead>
          <tbody data-rows></tbody>
        </table>
      </div>`;

    /* A tabela repinta a cada tecla, mas o anúncio ao leitor de tela espera
       o usuário parar de digitar — senão a região aria-live fala a cada caractere. */
    let announceTimer = null;
    screenEl.querySelector('#q').addEventListener('input', e=>{
      filters.q=e.target.value;
      paintRows(false);
      clearTimeout(announceTimer);
      announceTimer = setTimeout(()=>announce(`${rows().length} atletas na lista`), 500);
    });
    ['position','region','sortBy'].forEach(k=>{
      screenEl.querySelector('#'+k).onchange = e=>{ filters[k]=e.target.value; paintRows(true); };
    });
    [['favOnly','Só favoritos'],['withVideo','Com vídeo']].forEach(([k,label])=>{
      const btn = screenEl.querySelector('#'+k);
      btn.onclick = ()=>{
        filters[k]=!filters[k];
        btn.classList.toggle('is-active', filters[k]);
        btn.setAttribute('aria-pressed', String(filters[k]));
        announce(`${label}: ${filters[k]?'ativo':'inativo'}`);
        paintRows(true);
      };
    });
    paintRows(false);
  }
  render();
}

/* ---------------- PERFIL ---------------- */
function renderPerfil() {
  const a = MOCK.ATHLETES.find(x=>x.id===selId) || MOCK.ATHLETES[0];
  const ranked = MOCK.classifyPosition(a.attrs);
  const top = ranked[0];
  screenEl.innerHTML = `<div class="pad">
    <a href="olheiro.html?tela=lista" class="bg-transparent border-0 cursor-pointer font-mono text-11 uppercase text-ink-soft no-underline inline-block mb-4">← VOLTAR PARA LISTA</a>
    <div class="g g-aside-md gap-6">
      <div class="flex flex-col gap-4">
        <div class="card p-5">
          <div class="flex gap-3.5 mb-3.5">
            <div class="player-img w-25 h-32.5">3x4</div>
            <div class="flex-1">
              ${tagHTML(MOCK.posLabel(a).toUpperCase(),'accent')}
              <h1 class="display text-24 mt-2 mb-0 mx-0 tracking-display">${a.name}</h1>
              <div class="font-mono text-11 text-ink-soft mt-1">${a.age} anos · ${a.city}/${a.state}</div>
              <div class="flex gap-1.5 mt-2.5"><button class="btn ${a.favorite?'btn--gold':'btn--ghost'} btn--sm" id="fav">★ ${a.favorite?'Favorito':'Favoritar'}</button></div>
            </div>
          </div>
          <div class="g g-4 border-t border-t-line">
            ${[['Altura',a.height+'cm'],['Peso',a.weight+'kg'],['Pé',a.foot[0]],['Tempo',a.yearsPlaying+'a']].map((s,i)=>`<div class="py-2.5 px-1.5 text-center ${i<3?'border-r border-line-soft':''}"><div class="display text-18">${s[1]}</div><div class="font-mono text-9 text-ink-mute uppercase mt-0.5">${s[0]}</div></div>`).join('')}
          </div>
        </div>
        <div class="card p-5">
          <div class="section-label"><span class="section-label__title">Perfil tático</span><span class="section-label__action">${tagHTML('IA','gold')}</span></div>
          ${buildPositionRadar(a.attrs,{size:320})}
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="card p-5">
          <div class="section-label"><span class="section-label__title">Scores</span></div>
          <div class="g g-4 gap-6">
            ${statHTML('Score do olheiro', a.score, {big:true, delta:'+5 esta semana'})}
            ${statHTML('Completude', a.completeness+'%', {big:true, sub:'perfil'})}
            ${statHTML('Ranking', '#7', {big:true, sub:'entre 487'})}
            ${statHTML('Match top-3', (top.score*100).toFixed(0)+'%', {big:true, sub:'vs base'})}
          </div>
        </div>

        <div class="card p-5">
          <div class="section-label"><span class="section-label__title">Mídias (${a.videos})</span></div>
          <div class="g g-4 gap-2.5">
            ${a.videos>0 ? Array.from({length:a.videos},(_,i)=>`<div class="player-img relative aspect-[4/3]"><div class="absolute top-2 left-2 font-mono text-10 text-accent-ink bg-accent py-0.5 px-1.5">${i===0?'INSTA':'YT'}</div><div class="absolute inset-0 flex items-center justify-center text-ink font-display font-black text-24">▶</div></div>`).join('') : '<div class="p-6 text-center text-ink-mute font-mono text-12 col-span-4">Sem mídias enviadas</div>'}
          </div>
        </div>

        <div class="g g-2 gap-4">
          <div class="card p-5">
            <div class="section-label"><span class="section-label__title">Histórico</span></div>
            ${[['02·MAI','Inscrição realizada','sistema'],['04·MAI','Score consolidado em 92%','sistema'],['10·MAI','Convocação enviada (SMS)','sistema'],['11·MAI','Confirmou presença','atleta']].map((e,i)=>`<div class="g g-row-hist py-2.5 px-0 items-center ${i?'border-t border-line-soft':''}"><span class="font-mono text-11 text-ink-soft">${e[0]}</span><span class="text-13">${e[1]}</span>${tagHTML(e[2],'outline')}</div>`).join('')}
          </div>
          <div class="card p-5">
            <div class="section-label"><span class="section-label__title">Suas notas</span><span class="section-label__action">${tagHTML('Privado','outline')}</span></div>
            <label class="sr-only" for="notes">Suas notas sobre ${esc(a.name)}</label>
            <textarea class="textarea min-h-30" id="notes" placeholder="Notas internas do olheiro…">${esc(a.notes||'')}</textarea>
            <div class="flex justify-between mt-2"><span class="mono text-mute normal-case">privado</span><button class="btn btn--primary btn--sm" data-save-note>Salvar</button></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const favBtn = screenEl.querySelector('#fav');
  let fav = a.favorite;
  favBtn.onclick = () => {
    fav=!fav;
    favBtn.className='btn '+(fav?'btn--gold':'btn--ghost')+' btn--sm';
    favBtn.textContent='★ '+(fav?'Favorito':'Favoritar');
    favBtn.setAttribute('aria-pressed', String(fav));
    // toast (região polite) no lugar do announce — sem anúncio duplicado
    toast(`${a.name} ${fav?'marcado como favorito.':'removido dos favoritos.'}`, { type: fav ? 'success' : 'info' });
  };
  favBtn.setAttribute('aria-pressed', String(fav));

  const saveNote = screenEl.querySelector('[data-save-note]');
  if (saveNote) saveNote.onclick = () => toast(`Nota sobre ${a.name} salva (privada).`, { type: 'success' });
}

/* ---------------- CHECK-IN ---------------- */
function renderCheckin() {
  // presença inicial vem do mock (determinística) — antes era Math.random(),
  // o que mudava a taxa de comparecimento a cada reload
  let list = MOCK.ATHLETES.filter(a=>a.status==='convocado').map(a=>({...a, present: !!a.present}));

  function render() {
    const present = list.filter(a=>a.present).length;
    screenEl.innerHTML = `
      <div class="page-head items-start">
        <div><div class="kicker uppercase">Dia da peneira · 15·JUN·2026</div><h1 class="display h-panel my-1 mx-0">Check-in</h1></div>
      </div>
      <div class="g g-panel-sm pad gap-6 items-start">
        <div class="card card--flush">
          <div class="py-4 px-5 border-b border-b-line flex items-center justify-between">
            <label class="sr-only" for="ci-q">Buscar atleta por nome</label>
            <input class="input h-10 w-70" id="ci-q" placeholder="Buscar nome…">
            <span class="font-mono text-11 text-ink-soft">${present} de ${list.length} presentes</span>
          </div>
          ${list.map((a,i)=>`<div class="ci-row ${i?'border-t border-line-soft':''} ${a.present?'bg-accent-soft':'bg-transparent'}" data-id="${a.id}">
            <div class="w-7 h-7 border-2 border-ink flex items-center justify-center text-accent-ink font-display font-black text-16 ${a.present?'bg-accent':'bg-transparent'}">${a.present?'✓':''}</div>
            ${avatarHTML(a.name,{size:32})}
            <div><div class="font-semibold text-14">${a.name}</div><div class="font-mono text-10 text-ink-soft">${MOCK.posLabel(a)} · ${a.city}/${a.state}</div></div>
            <div class="display text-18">${a.score}</div>
            ${tagHTML(a.present?'PRES':'AGUARD', a.present?'accent':'outline')}
            <span class="font-mono text-10 text-ink-mute">#${String(i+1).padStart(3,'0')}</span>
          </div>`).join('')}
        </div>
        <div class="sticky top-6 flex flex-col gap-4">
          <div class="card--dark p-5">
            <div class="kicker text-bg/55">Comparecimento</div>
            <div class="display text-72 leading-display-xtight mt-2">${Math.round(present/list.length*100)}<span class="text-32">%</span></div>
            <div class="mt-3.5"><div class="progress progress--sm"><div class="progress__fill" style="width:${present/list.length*100}%"></div></div></div>
            <div class="flex justify-between mt-2 font-mono text-11 opacity-70"><span>${present} presentes</span><span>${list.length-present} aguardando</span></div>
          </div>
          <div class="card p-4">
            <div class="kicker uppercase">QR Code presença</div>
            <div class="qr-pattern mt-2.5 border border-ink"></div>
            <div class="font-mono text-10 text-ink-soft mt-2 text-center">Inscritos podem fazer check-in com o celular.</div>
          </div>
          <button class="btn btn--primary btn--full">Encerrar check-in</button>
        </div>
      </div>`;
    screenEl.querySelectorAll('.ci-row').forEach(row=>row.onclick=()=>{
      const a=list.find(x=>x.id===row.dataset.id);
      a.present=!a.present;
      render();
      announce(`${a.name}: ${a.present?'presente':'aguardando'}. ${list.filter(x=>x.present).length} de ${list.length} presentes.`);
    });
  }
  render();
}

/* ---------------- AVALIAÇÃO ---------------- */
function renderAvaliacao() {
  const list = MOCK.ATHLETES.filter(a=>a.status==='convocado').slice(0,8);
  const evalState = {};
  let active = list[0].id;

  function render() {
    const a = list.find(x=>x.id===active);
    const ev = evalState[active] || { tecnica:0, fisico:0, tatico:0, atitude:0, decision:null, comments:'' };
    // sem nenhum critério avaliado, a média segue o mesmo "—" dos critérios
    const rated = ev.tecnica||ev.fisico||ev.tatico||ev.atitude;
    const avg = rated ? ((ev.tecnica+ev.fisico+ev.tatico+ev.atitude)/4).toFixed(1) : '—';

    screenEl.innerHTML = `
      <div class="page-head items-start"><div><div class="kicker uppercase">Pós-peneira · Caxias · 15·JUN</div><h1 class="display h-panel my-1 mx-0">Avaliação no campo</h1></div></div>
      <div class="g g-aside-sm min-h-[calc(100vh-116px)]">
        <div class="border-r border-r-line bg-card overflow-auto">
          ${list.map((p,i)=>{ const done=evalState[p.id]&&evalState[p.id].decision; return `<button class="av-item w-full flex items-center gap-2.5 py-3.5 px-4 cursor-pointer border-0 text-ink text-left ${active===p.id?'bg-accent':'bg-transparent'} ${i?'border-t border-line-soft':''}" data-id="${p.id}">${avatarHTML(p.name,{size:32})}<div class="flex-1"><div class="font-semibold text-13">${p.name}</div><div class="font-mono text-10 text-ink-soft">${MOCK.posLabel(p)}</div></div>${done?tagHTML(done==='aprovado'?'✓':'✗', done==='aprovado'?'success':'outline'):''}</button>`; }).join('')}
        </div>
        <div class="pad overflow-auto">
          <div class="flex gap-4 items-end mb-6">
            ${avatarHTML(a.name,{size:72})}
            <div class="flex-1">${tagHTML(MOCK.posLabel(a),'outline')}<div class="display text-36 mt-1.5">${a.name}</div><div class="font-mono text-11 text-ink-soft mt-1">${a.age} anos · ${a.city}/${a.state}</div></div>
            <div class="text-right"><div class="kicker uppercase">Média</div><div class="display text-64 leading-display-xtight">${avg}</div></div>
          </div>

          <div class="card p-6">
            <div class="section-label"><span class="section-label__title">Critérios (0–10)</span></div>
            ${[['tecnica','Técnica','Domínio, passe, finalização'],['fisico','Físico','Velocidade, força, condicionamento'],['tatico','Tático','Posicionamento, tomada de decisão'],['atitude','Atitude','Postura, liderança, foco']].map((c,i)=>`
              <div class="crit-row ${i?'border-t border-line-soft':''}">
                <div><div class="font-display font-extrabold text-14 uppercase">${c[1]}</div><div class="font-mono text-10 text-ink-soft">${c[2]}</div></div>
                <div class="flex gap-1">${Array.from({length:10},(_,n)=>`<button class="crit flex-1 h-8.5 cursor-pointer border border-ink font-display font-extrabold text-12 ${(n+1)<=ev[c[0]]?(n>=7?'bg-accent text-accent-ink':'bg-ink text-bg'):'bg-card text-ink'}" data-k="${c[0]}" data-v="${n+1}">${n+1}</button>`).join('')}</div>
                <div class="text-right font-display font-black text-32">${ev[c[0]]||'—'}</div>
              </div>`).join('')}
          </div>

          <div class="card mt-4" data-pad><div class="p-5">
            <div class="section-label"><span class="section-label__title">Observações</span></div>
            <label class="sr-only" for="comments">Observações da avaliação</label>
            <textarea class="textarea" id="comments" placeholder="Pontos fortes, áreas de melhoria, intangíveis…">${esc(ev.comments)}</textarea>
          </div></div>

          <div class="btn-row mt-4 flex gap-3 items-center">
            <button class="btn ${ev.decision==='aprovado'?'btn--accent':'btn--ghost'} btn--lg" data-dec="aprovado">✓ Aprovar</button>
            <button class="btn ${ev.decision==='observar'?'btn--primary':'btn--ghost'} btn--lg" data-dec="observar">◐ Observar</button>
            <button class="btn ${ev.decision==='descartar'?'btn--danger':'btn--ghost'} btn--lg" data-dec="descartar">✗ Descartar</button>
            <span class="ml-auto font-mono text-11 text-ink-soft">${ev.decision?'Decisão registrada':'Aguardando decisão'}</span>
          </div>
        </div>
      </div>`;

    screenEl.querySelectorAll('.av-item').forEach(b=>b.onclick=()=>{ active=b.dataset.id; render(); });
    screenEl.querySelectorAll('.crit').forEach(b=>b.onclick=()=>{ evalState[active]={...ev,[b.dataset.k]:+b.dataset.v}; render(); });
    screenEl.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>{
      evalState[active]={...ev,decision:b.dataset.dec};
      render();
      toast(`${a.name}: avaliação registrada como "${b.dataset.dec}".`, { type: b.dataset.dec === 'descartar' ? 'info' : 'success' });
    });
    const cm = screenEl.querySelector('#comments'); if(cm) cm.oninput=()=>{ evalState[active]={...ev,comments:cm.value}; };
  }
  render();
}
