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
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--ink-mute)">${String(idx+1).padStart(3,'0')}</td>
      <td><div style="display:flex;align-items:center;gap:10px">${avatarHTML(a.name,{size:32,gold:a.favorite})}<div><div style="font-weight:600">${a.name} ${a.favorite?'<span class="gold">★</span>':''}</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-soft)">${a.foot} · ${a.height||'—'}cm · ${a.weight||'—'}kg</div></div></div></td>
      <td>${tagHTML(MOCK.posLabel(a),'outline')}</td>
      <td style="font-family:var(--font-mono)">${a.age}</td>
      <td>${a.city}/${a.state}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><span class="display" style="font-size:18px">${a.score}</span><div style="width:60px;height:4px;background:var(--bg-alt)"><div style="width:${a.score}%;height:100%;background:${a.score>=85?'var(--accent)':'var(--ink)'}"></div></div></div></td>
      <td style="font-family:var(--font-mono)">${a.completeness}%</td>
      <td>${a.videos>0?tagHTML('▶ '+a.videos,'ink'):'<span style="color:var(--ink-mute)">—</span>'}</td>
      <td>${tagHTML(a.status, a.status==='convocado'?'accent':'outline')}</td>
      <td style="text-align:right;color:var(--ink-mute)">→</td>
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
          <div class="kicker" style="text-transform:uppercase">Painel do olheiro</div>
          <h1 class="display h-panel" style="margin:4px 0">Lista de inscritos</h1>
        </div>
        <div class="page-head__actions" style="display:flex;gap:8px">
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
        <input class="input" id="q" placeholder="Buscar nome ou cidade…" style="width:260px;height:40px" value="${esc(filters.q)}">
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
        <span style="margin-left:auto;font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)" data-count></span>
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
    <a href="olheiro.html?tela=lista" style="background:transparent;border:none;cursor:pointer;font-family:var(--font-mono);font-size:11px;text-transform:uppercase;color:var(--ink-soft);text-decoration:none;display:inline-block;margin-bottom:16px">← VOLTAR PARA LISTA</a>
    <div class="g g-aside-md" style="gap:24px">
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card" style="padding:20px">
          <div style="display:flex;gap:14px;margin-bottom:14px">
            <div class="player-img" style="width:100px;height:130px">3x4</div>
            <div style="flex:1">
              ${tagHTML(MOCK.posLabel(a).toUpperCase(),'accent')}
              <h1 class="display" style="font-size:24px;margin:8px 0 0;letter-spacing:-.02em">${a.name}</h1>
              <div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);margin-top:4px">${a.age} anos · ${a.city}/${a.state}</div>
              <div style="display:flex;gap:6px;margin-top:10px"><button class="btn ${a.favorite?'btn--gold':'btn--ghost'} btn--sm" id="fav">★ ${a.favorite?'Favorito':'Favoritar'}</button></div>
            </div>
          </div>
          <div class="g g-4" style="border-top:1px solid var(--line)">
            ${[['Altura',a.height+'cm'],['Peso',a.weight+'kg'],['Pé',a.foot[0]],['Tempo',a.yearsPlaying+'a']].map((s,i)=>`<div style="padding:10px 6px;text-align:center;border-right:${i<3?'1px solid var(--line-soft)':'none'}"><div class="display" style="font-size:18px">${s[1]}</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--ink-mute);text-transform:uppercase;margin-top:2px">${s[0]}</div></div>`).join('')}
          </div>
        </div>
        <div class="card" style="padding:20px">
          <div class="section-label"><span class="section-label__title">Perfil tático</span><span class="section-label__action">${tagHTML('IA','gold')}</span></div>
          ${buildPositionRadar(a.attrs,{size:320})}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card" style="padding:20px">
          <div class="section-label"><span class="section-label__title">Scores</span></div>
          <div class="g g-4" style="gap:24px">
            ${statHTML('Score do olheiro', a.score, {big:true, delta:'+5 esta semana'})}
            ${statHTML('Completude', a.completeness+'%', {big:true, sub:'perfil'})}
            ${statHTML('Ranking', '#7', {big:true, sub:'entre 487'})}
            ${statHTML('Match top-3', (top.score*100).toFixed(0)+'%', {big:true, sub:'vs base'})}
          </div>
        </div>

        <div class="card" style="padding:20px">
          <div class="section-label"><span class="section-label__title">Mídias (${a.videos})</span></div>
          <div class="g g-4" style="gap:10px">
            ${a.videos>0 ? Array.from({length:a.videos},(_,i)=>`<div class="player-img" style="aspect-ratio:4/3;position:relative"><div style="position:absolute;top:8px;left:8px;font-family:var(--font-mono);font-size:10px;color:var(--accent-ink);background:var(--accent);padding:2px 6px">${i===0?'INSTA':'YT'}</div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--ink);font-family:var(--font-display);font-weight:900;font-size:24px">▶</div></div>`).join('') : '<div style="grid-column:span 4;padding:24px;text-align:center;color:var(--ink-mute);font-family:var(--font-mono);font-size:12px">Sem mídias enviadas</div>'}
          </div>
        </div>

        <div class="g g-2" style="gap:16px">
          <div class="card" style="padding:20px">
            <div class="section-label"><span class="section-label__title">Histórico</span></div>
            ${[['02·MAI','Inscrição realizada','sistema'],['04·MAI','Score consolidado em 92%','sistema'],['10·MAI','Convocação enviada (SMS)','sistema'],['11·MAI','Confirmou presença','atleta']].map((e,i)=>`<div class="g g-row-hist" style="padding:10px 0;border-top:${i?'1px solid var(--line-soft)':'none'};align-items:center"><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">${e[0]}</span><span style="font-size:13px">${e[1]}</span>${tagHTML(e[2],'outline')}</div>`).join('')}
          </div>
          <div class="card" style="padding:20px">
            <div class="section-label"><span class="section-label__title">Suas notas</span><span class="section-label__action">${tagHTML('Privado','outline')}</span></div>
            <label class="sr-only" for="notes">Suas notas sobre ${esc(a.name)}</label>
            <textarea class="textarea" id="notes" style="min-height:120px" placeholder="Notas internas do olheiro…">${esc(a.notes||'')}</textarea>
            <div style="display:flex;justify-content:space-between;margin-top:8px"><span class="mono text-mute" style="text-transform:none">privado</span><button class="btn btn--primary btn--sm" data-save-note>Salvar</button></div>
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
    announce(`${a.name} ${fav?'marcado como favorito':'removido dos favoritos'}`);
  };
  favBtn.setAttribute('aria-pressed', String(fav));

  const saveNote = screenEl.querySelector('[data-save-note]');
  if (saveNote) saveNote.onclick = () => announce('Nota salva.');
}

/* ---------------- CHECK-IN ---------------- */
function renderCheckin() {
  // presença inicial vem do mock (determinística) — antes era Math.random(),
  // o que mudava a taxa de comparecimento a cada reload
  let list = MOCK.ATHLETES.filter(a=>a.status==='convocado').map(a=>({...a, present: !!a.present}));

  function render() {
    const present = list.filter(a=>a.present).length;
    screenEl.innerHTML = `
      <div class="page-head" style="align-items:flex-start">
        <div><div class="kicker" style="text-transform:uppercase">Dia da peneira · 15·JUN·2026</div><h1 class="display h-panel" style="margin:4px 0">Check-in</h1></div>
      </div>
      <div class="g g-panel-sm pad" style="gap:24px;align-items:start">
        <div class="card card--flush">
          <div style="padding:16px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between">
            <label class="sr-only" for="ci-q">Buscar atleta por nome</label>
            <input class="input" id="ci-q" placeholder="Buscar nome…" style="height:40px;width:280px">
            <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">${present} de ${list.length} presentes</span>
          </div>
          ${list.map((a,i)=>`<div class="ci-row" data-id="${a.id}" style="border-top:${i?'1px solid var(--line-soft)':'none'};background:${a.present?'var(--accent-soft)':'transparent'}">
            <div style="width:28px;height:28px;border:2px solid var(--ink);background:${a.present?'var(--accent)':'transparent'};display:flex;align-items:center;justify-content:center;color:var(--accent-ink);font-family:var(--font-display);font-weight:900;font-size:16px">${a.present?'✓':''}</div>
            ${avatarHTML(a.name,{size:32})}
            <div><div style="font-weight:600;font-size:14px">${a.name}</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-soft)">${MOCK.posLabel(a)} · ${a.city}/${a.state}</div></div>
            <div class="display" style="font-size:18px">${a.score}</div>
            ${tagHTML(a.present?'PRES':'AGUARD', a.present?'accent':'outline')}
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--ink-mute)">#${String(i+1).padStart(3,'0')}</span>
          </div>`).join('')}
        </div>
        <div style="position:sticky;top:24px;display:flex;flex-direction:column;gap:16px">
          <div class="card--dark" style="padding:20px">
            <div class="kicker" style="color:rgba(245,244,238,.55)">Comparecimento</div>
            <div class="display" style="font-size:72px;line-height:.85;margin-top:8px">${Math.round(present/list.length*100)}<span style="font-size:32px">%</span></div>
            <div style="margin-top:14px"><div class="progress progress--sm"><div class="progress__fill" style="width:${present/list.length*100}%"></div></div></div>
            <div style="display:flex;justify-content:space-between;margin-top:8px;font-family:var(--font-mono);font-size:11px;opacity:.7"><span>${present} presentes</span><span>${list.length-present} aguardando</span></div>
          </div>
          <div class="card" style="padding:16px">
            <div class="kicker" style="text-transform:uppercase">QR Code presença</div>
            <div style="aspect-ratio:1;background:repeating-conic-gradient(var(--ink) 0% 4%, var(--bg) 4% 8%);margin-top:10px;border:1px solid var(--ink)"></div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-soft);margin-top:8px;text-align:center">Inscritos podem fazer check-in com o celular.</div>
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
      <div class="page-head" style="align-items:flex-start"><div><div class="kicker" style="text-transform:uppercase">Pós-peneira · Caxias · 15·JUN</div><h1 class="display h-panel" style="margin:4px 0">Avaliação no campo</h1></div></div>
      <div class="g g-aside-sm" style="min-height:calc(100vh - 116px)">
        <div style="border-right:1px solid var(--line);background:var(--card);overflow:auto">
          ${list.map((p,i)=>{ const done=evalState[p.id]&&evalState[p.id].decision; return `<button class="av-item" data-id="${p.id}" style="width:100%;display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;background:${active===p.id?'var(--accent)':'transparent'};border:none;border-top:${i?'1px solid var(--line-soft)':'none'};color:var(--ink);text-align:left">${avatarHTML(p.name,{size:32})}<div style="flex:1"><div style="font-weight:600;font-size:13px">${p.name}</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-soft)">${MOCK.posLabel(p)}</div></div>${done?tagHTML(done==='aprovado'?'✓':'✗', done==='aprovado'?'success':'outline'):''}</button>`; }).join('')}
        </div>
        <div class="pad" style="overflow:auto">
          <div style="display:flex;gap:16px;align-items:flex-end;margin-bottom:24px">
            ${avatarHTML(a.name,{size:72})}
            <div style="flex:1">${tagHTML(MOCK.posLabel(a),'outline')}<div class="display" style="font-size:36px;margin-top:6px">${a.name}</div><div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);margin-top:4px">${a.age} anos · ${a.city}/${a.state}</div></div>
            <div style="text-align:right"><div class="kicker" style="text-transform:uppercase">Média</div><div class="display" style="font-size:64px;line-height:.85">${avg}</div></div>
          </div>

          <div class="card" style="padding:24px">
            <div class="section-label"><span class="section-label__title">Critérios (0–10)</span></div>
            ${[['tecnica','Técnica','Domínio, passe, finalização'],['fisico','Físico','Velocidade, força, condicionamento'],['tatico','Tático','Posicionamento, tomada de decisão'],['atitude','Atitude','Postura, liderança, foco']].map((c,i)=>`
              <div class="crit-row" style="border-top:${i?'1px solid var(--line-soft)':'none'}">
                <div><div style="font-family:var(--font-display);font-weight:800;font-size:14px;text-transform:uppercase">${c[1]}</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-soft)">${c[2]}</div></div>
                <div style="display:flex;gap:4px">${Array.from({length:10},(_,n)=>`<button class="crit" data-k="${c[0]}" data-v="${n+1}" style="flex:1;height:34px;cursor:pointer;background:${(n+1)<=ev[c[0]]?(n>=7?'var(--accent)':'var(--ink)'):'var(--card)'};color:${(n+1)<=ev[c[0]]?(n>=7?'var(--accent-ink)':'var(--bg)'):'var(--ink)'};border:1px solid var(--ink);font-family:var(--font-display);font-weight:800;font-size:12px">${n+1}</button>`).join('')}</div>
                <div style="text-align:right;font-family:var(--font-display);font-weight:900;font-size:32px">${ev[c[0]]||'—'}</div>
              </div>`).join('')}
          </div>

          <div style="margin-top:16px" class="card" data-pad><div style="padding:20px">
            <div class="section-label"><span class="section-label__title">Observações</span></div>
            <label class="sr-only" for="comments">Observações da avaliação</label>
            <textarea class="textarea" id="comments" placeholder="Pontos fortes, áreas de melhoria, intangíveis…">${esc(ev.comments)}</textarea>
          </div></div>

          <div class="btn-row" style="margin-top:16px;display:flex;gap:12px;align-items:center">
            <button class="btn ${ev.decision==='aprovado'?'btn--accent':'btn--ghost'} btn--lg" data-dec="aprovado">✓ Aprovar</button>
            <button class="btn ${ev.decision==='observar'?'btn--primary':'btn--ghost'} btn--lg" data-dec="observar">◐ Observar</button>
            <button class="btn ${ev.decision==='descartar'?'btn--danger':'btn--ghost'} btn--lg" data-dec="descartar">✗ Descartar</button>
            <span style="margin-left:auto;font-family:var(--font-mono);font-size:11px;color:var(--ink-soft)">${ev.decision?'Decisão registrada':'Aguardando decisão'}</span>
          </div>
        </div>
      </div>`;

    screenEl.querySelectorAll('.av-item').forEach(b=>b.onclick=()=>{ active=b.dataset.id; render(); });
    screenEl.querySelectorAll('.crit').forEach(b=>b.onclick=()=>{ evalState[active]={...ev,[b.dataset.k]:+b.dataset.v}; render(); });
    screenEl.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>{
      evalState[active]={...ev,decision:b.dataset.dec};
      render();
      announce(`${a.name}: ${b.dataset.dec}.`);
    });
    const cm = screenEl.querySelector('#comments'); if(cm) cm.oninput=()=>{ evalState[active]={...ev,comments:cm.value}; };
  }
  render();
}
