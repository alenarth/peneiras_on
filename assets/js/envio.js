/* ============================================================
   PENEIRAS ON — envio.js
   Envia a inscrição do jogador para a planilha da equipe (Google Apps
   Script) — é a "porta de entrada" do MVP concierge. A equipe baixa a
   planilha e processa no CLI em Python (python/).
     · Envio.inscricao(form, evento) → Promise<'enviado' | 'na-fila'>
     · Envio.enviar(form, evento) → Promise<{ situacao, codigo }> (Sprint 4:
       o mesmo envio, devolvendo também o código que a pessoa deve guardar)
     · se a rede falhar, guarda no localStorage e reenvia sozinho depois
       (ao abrir o site de novo ou quando a internet voltar)
     · Envio.reenviarAgora() → Promise<{ enviados, pendentes }> e o evento
       'peneiras:fila' na window a cada tentativa, para a tela de confirmação
       saber quando o que estava guardado finalmente chegou à planilha
     · Envio.PRAZO_DIAS_UTEIS: prazo de resposta comunicado ao usuário — a
       triagem é humana (MVP concierge), então o prazo vem em dias úteis
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

  /* Prazo de resposta da equipe. Fonte única: o formulário e a tela de
     confirmação leem daqui, então o que se promete é o mesmo nos dois. */
  const PRAZO_DIAS_UTEIS = 2;

  async function enviar(form, evento) {
    const linha = montarLinha(form, evento);
    try {
      await postar(linha);
      return { situacao: 'enviado', codigo: linha.codigo };
    } catch (erro) {
      salvarFila(lerFila().concat([linha]));
      return { situacao: 'na-fila', codigo: linha.codigo };
    }
  }

  // Forma original (Sprint 3), mantida para quem só precisa da situação.
  async function inscricao(form, evento) {
    return (await enviar(form, evento)).situacao;
  }

  /* Tenta mandar o que ficou guardado. Quem falhar de novo continua na fila.
     Avisa a página pelo evento 'peneiras:fila' com os códigos que chegaram. */
  let reenviando = null;
  function reenviarFila() {
    // duas chamadas ao mesmo tempo (abrir o site + evento online) mandariam a
    // mesma linha duas vezes: a segunda espera a primeira terminar
    if (reenviando) return reenviando;
    reenviando = (async () => {
      const fila = lerFila();
      const pendentes = [], enviados = [];
      for (const linha of fila) {
        try { await postar(linha); enviados.push(linha.codigo); } catch (erro) { pendentes.push(linha); }
      }
      // o que entrou na fila DURANTE o reenvio (outra inscrição sem rede) não
      // estava na leitura inicial: regravar só `pendentes` apagaria essa linha
      const lidos = new Set(fila.map(l => l.codigo));
      salvarFila(pendentes.concat(lerFila().filter(l => !lidos.has(l.codigo))));
      const resultado = { enviados, pendentes: pendentes.map(l => l.codigo) };
      window.dispatchEvent(new CustomEvent('peneiras:fila', { detail: resultado }));
      return resultado;
    })().finally(() => { reenviando = null; });
    return reenviando;
  }

  reenviarFila();
  window.addEventListener('online', reenviarFila);

  return { inscricao, enviar, reenviarAgora: reenviarFila, PRAZO_DIAS_UTEIS };
})();
