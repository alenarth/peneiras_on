/* ============================================================
   PENEIRAS ON — envio.js
   Envia a inscrição do jogador para a planilha da equipe (Google Apps
   Script) — é a "porta de entrada" do MVP concierge. A equipe baixa a
   planilha e processa no CLI em Python (python/).
     · Envio.inscricao(form, evento) → Promise<'enviado' | 'na-fila'>
     · se a rede falhar, guarda no localStorage e reenvia sozinho depois
       (ao abrir o site de novo ou quando a internet voltar)
   Contrato das colunas: python/CONTRATO.md
   Depende de ui.js (UI.storage). Carregar ANTES de cadastro.js.
   ============================================================ */
const Envio = (() => {
  // URL do Web App publicado no Apps Script (Implantar → Nova implantação)
  const URL_PLANILHA = 'https://script.google.com/macros/s/AKfycbx-gWzN97Fc97H3gMoZ4j0JhDN07SbGB-XVfur0wAoQP9pAiqN6XNDTNivtxK1wzEuF/exec';
  const CHAVE_FILA = 'peneiras-on.fila-envio.v1';
  const TEMPO_LIMITE = 15000; // ms — rede de evento é lenta

  /* Objeto do cadastro (cadastro.js) → linha do contrato. */
  function montarLinha(form, evento) {
    const menor = !!form.responsible; // passo 5 só é preenchido por menor de 18
    return {
      codigo: crypto.randomUUID(),
      nome: form.name,
      nascimento: form.dob,
      cpf: form.cpf,
      uf: form.state,
      cidade: form.city,
      posicao: form.position,
      pe: form.foot,
      altura: form.height,
      peso: form.weight,
      clube: form.club,
      anos_pratica: form.years,
      video: form.videos,
      foto: form.photo ? 'S' : 'N',
      responsavel: menor ? form.responsible : '',
      tel_responsavel: menor ? form.responsiblePhone : '',
      aceite_termo: menor ? (form.consent ? 'S' : 'N') : '',
      evento: evento ? evento.id : '',
    };
  }

  /* Um POST. text/plain de propósito: com application/json o navegador
     faz uma requisição "preflight" (CORS) que o Apps Script não responde. */
  async function postar(linha) {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE);
    try {
      const resp = await fetch(URL_PLANILHA, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(linha),
        signal: controle.signal,
      });
      const corpo = await resp.json();
      if (!corpo.ok) throw new Error(corpo.erro || 'planilha recusou o envio');
    } finally {
      clearTimeout(relogio);
    }
  }

  const lerFila = () => UI.storage.get(CHAVE_FILA, []);
  const salvarFila = fila => UI.storage.set(CHAVE_FILA, fila);

  async function inscricao(form, evento) {
    const linha = montarLinha(form, evento);
    try {
      await postar(linha);
      return 'enviado';
    } catch (erro) {
      salvarFila(lerFila().concat([linha]));
      return 'na-fila';
    }
  }

  /* Tenta mandar o que ficou guardado. Quem falhar de novo continua na fila. */
  async function reenviarFila() {
    const pendentes = [];
    for (const linha of lerFila()) {
      try { await postar(linha); } catch (erro) { pendentes.push(linha); }
    }
    salvarFila(pendentes);
  }

  reenviarFila();
  window.addEventListener('online', reenviarFila);

  return { inscricao };
})();
