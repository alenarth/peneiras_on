/* ============================================================
   PENEIRAS ON — chat.js (Sprint 4)
   Conversa intermediada entre olheiro e atleta, com a REGRA DE PROTEÇÃO AO
   MENOR: a plataforma existe para que o contato entre um olheiro e um atleta
   menor de idade aconteça dentro dos canais da Academia, onde a equipe e o
   responsável legal acompanham. Por isso a mensagem que leva um meio de
   contato direto é segurada antes de sair — nos DOIS lados da conversa.

     · Chat.verificar(texto) → { bloqueada, motivos: [{ tipo, rotulo, trecho }] }
       função pura (sem DOM), testável isoladamente
     · Chat.montar(host, opts) → desenha a conversa e liga o envio

   ------------------------------------------------------------
   A REGRA — o que barra e o que passa
   ------------------------------------------------------------
   O texto é normalizado antes da checagem: minúsculas, sem acento, números
   por extenso viram dígitos ("nove oito" → "9 8", "noventa e oito" → "98",
   "meia" → 6, como se dita telefone), "arroba" vira @, "ponto com" vira
   ".com" (só quando fecha um endereço — "ponto com certeza" passa).

   1. TELEFONE (e outros números pessoais longos: CPF, CEP)
      Uma sequência com 8 ou mais dígitos, mesmo separada por espaço, ponto,
      traço, parêntese, barra, asterisco, emoji ou uma letra solta entre
      dígitos, conta como telefone. 8 dígitos = fixo sem DDD; 9 = celular
      sem DDD; 10–13 = com DDD e/ou +55.
        barra: "(21) 98765-4321" · "21987654321" · "+55 21 9 8765 4321"
               "9 8 7 6 5 4 3 2 1" · "98765*4321" · "21.98765.4321"
               "9🔥8🔥7🔥6🔥5🔥4🔥3🔥2" · "9a8b7c6d5e4f3g2h1"
               "nove oito sete seis cinco quatro três dois um"
               "vinte e um, nove nove oito sete, seis cinco quatro três"
               "9876o-432l" (o, l e i grudados entre dígitos viram 0 e 1)
        passa: "joguei 3 anos no sub-15" · "tenho 1,72 de altura"
               "nasci em 12/03/2010" (data válida não conta)
               "a peneira é dia 15/11/2026 às 8h30" (data e hora não contam)
               "fiz gols em 2019, 2020 e 2021" (lista de anos não conta)
               "ganhamos de 3x1" · "peso 64kg e calço 41" · "camisa 10"
   2. @ SEGUIDO DE IDENTIFICADOR — "@lucas.oliveira", "me segue lá @lucas10",
      "lucas arroba dez"
   3. E-MAIL — "lucas@gmail.com", "lucas arroba gmail ponto com", e o nome do
      provedor sozinho ("me manda no gmail"): gmail, hotmail, outlook, yahoo,
      icloud
   4. LINK EXTERNO — "https://…", "www.…", "wa.me/…", "bit.ly/…",
      "meusite.com.br", "linktr.ee/…"
   5. REDE SOCIAL OU APP PELO NOME — instagram/insta/ig, whatsapp/whats/zap/
      wpp, facebook/face/fb, tiktok, telegram, snapchat/snap, twitter,
      discord, kwai, messenger, e os canais "dm", "direct", "inbox", "pv".
      Pega também escrita disfarçada: "1nst4gr4m", "w h a t s a p p",
      "z.a.p", "insta gram".
        passa: "eu discordo do técnico" (palavra inteira, não pedaço)
               "vi seu vídeo no youtube" (YouTube por nome passa; o link não)
   6. PEDIDO DE CONTATO — "passa seu telefone", "qual seu whats?",
      "me liga", "meu celular é…", "me manda seu endereço".
        passa: "qual o número da sua camisa?" · "meu número é o 10"

   Limites conhecidos (documentados, não escondidos): um número partido em
   várias mensagens, ou em imagem, não é pego aqui — o registro da conversa
   fica com a equipe. Na dúvida a regra segura, preferindo errar para o lado
   do menor: números de 8+ dígitos sem relação com contato ("10.000.000") e
   palavra colada em ".com" sem espaço depois do ponto ("treino.com o time")
   também são barrados; a mensagem explica e basta reescrever.
   ============================================================ */
const Chat = (() => {
  /* ---------- normalização ---------- */
  const UNIDADES = { zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, meia: 6, sete: 7, oito: 8, nove: 9 };
  const DEZ_A_19 = { dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19 };
  const DEZENAS = { vinte: 2, trinta: 3, quarenta: 4, cinquenta: 5, sessenta: 6, setenta: 7, oitenta: 8, noventa: 9 };
  const UNI_RE = Object.keys(UNIDADES).join('|');

  function semAcento(t) {
    return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  function normalizar(texto) {
    let t = semAcento(texto);
    t = t.replace(/\barroba\b/g, '@');
    // "ponto com" só vira ".com" quando fecha um endereço (fim, pontuação ou outro "ponto")
    t = t.replace(/\s*\b(?:ponto|dot)\s+(com|br|net|org|me|io|ly)\b(?=\s*(?:$|[.,;:!?)\/]|(?:ponto|dot)\s))/g, '.$1');
    // por extenso → dígitos (dezenas compostas primeiro: "noventa e oito" → 98)
    t = t.replace(new RegExp(`\\b(${Object.keys(DEZENAS).join('|')})(?:\\s+e\\s+(${UNI_RE}))?\\b`, 'g'),
      (m, dz, un) => String(DEZENAS[dz]) + (un ? UNIDADES[un] : 0));
    t = t.replace(new RegExp(`\\b(${Object.keys(DEZ_A_19).join('|')})\\b`, 'g'), m => String(DEZ_A_19[m]));
    t = t.replace(new RegExp(`\\b(${UNI_RE})\\b`, 'g'), m => String(UNIDADES[m]));
    // "o"/"l"/"i" soltos e grudados num dígito são zero/um disfarçados:
    // 9o8 → 908, 9876o- → 98760-, 432l → 4321 (dentro de palavra, não: "10 lances")
    t = t.replace(/(?<![a-z])o(?=\d)|(?<=\d)o(?![a-z])/g, '0').replace(/(?<![a-z])[li](?=\d)|(?<=\d)[li](?![a-z])/g, '1');
    return t;
  }

  /* ---------- 1. telefone ---------- */
  // datas válidas (dd/mm, dd/mm/aaaa) e horários saem antes da contagem
  const DATA = /\b(?:0?[1-9]|[12]\d|3[01])\s*[\/.]\s*(?:0?[1-9]|1[0-2])(?:\s*[\/.]\s*(?:(?:19|20)\d{2}|\d{2}))?\b/g;
  const HORA = /\b(?:[01]?\d|2[0-3])\s*(?:h|:)\s*(?:[0-5]\d)?\s*(?:min)?\b/g;
  function sequencias(t) {
    // percorre o texto juntando dígitos; o que não é letra nem dígito (espaço,
    // pontuação, emoji) não quebra a sequência; uma letra só quebra se não
    // estiver grudada em dígito dos dois lados (9a8 continua; "3 anos" quebra)
    const runs = [];
    let atual = null;
    const chars = [...t];
    const isD = c => c >= '0' && c <= '9';
    const isL = c => /\p{L}/u.test(c);
    chars.forEach((c, i) => {
      if (isD(c)) {
        // "(" ou "+" logo antes do 1º dígito entram no trecho mostrado: "(21) …", "+55 …"
        if (!atual) atual = { digitos: '', grupos: [''], ini: /[(+]/.test(chars[i - 1] || '') ? i - 1 : i, fim: i };
        atual.digitos += c;
        atual.grupos[atual.grupos.length - 1] += c;
        atual.fim = i;
      } else if (atual && isL(c) && !(isD(chars[i - 1] || '') && isD(chars[i + 1] || ''))) {
        runs.push(atual); atual = null;
      } else if (atual && atual.grupos[atual.grupos.length - 1] !== '') {
        atual.grupos.push('');
      }
    });
    if (atual) runs.push(atual);
    return runs.map(r => ({ ...r, grupos: r.grupos.filter(Boolean), trecho: chars.slice(r.ini, r.fim + 1).join('') }));
  }
  function telefone(t) {
    const limpo = t.replace(DATA, ' ').replace(HORA, ' ');
    for (const r of sequencias(limpo)) {
      if (r.digitos.length < 8) continue;
      // lista de anos ("2019, 2020 e 2021") não é telefone
      if (r.grupos.length > 1 && r.grupos.every(g => /^(19[5-9]\d|20[0-3]\d)$/.test(g))) continue;
      return r.trecho.trim();
    }
    return null;
  }

  /* ---------- 2–6 ---------- */
  const EMAIL = /[a-z0-9._%+-]+\s*@\s*[a-z0-9-]+(?:\s*\.\s*[a-z0-9-]+)*\s*\.\s*[a-z]{2,}/;
  const PROVEDOR = /\b(gmail|hotmail|outlook|yahoo|icloud)\b/;
  const ARROBA = /(?:^|[^a-z0-9._%+-])(@\s*[a-z0-9_][a-z0-9_.]{1,})/;
  const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]{2,}(?:\.[a-z0-9-]+)*\.(?:com|net|org|br|me|ly|io|gg|app|link|site|co|tv|info|ee)\b(?:\/\S*)?/;
  // nomes longos: procurados no texto "espremido" (sem espaço, pontuação nem leet)
  const REDES_LONGAS = ['instagram', 'whatsapp', 'whatsap', 'watsapp', 'watsap', 'zapzap', 'facebook', 'tiktok', 'snapchat', 'twitter'];
  // nomes curtos: só como palavra inteira ("ig" não pode pegar "figura")
  const REDES_CURTAS = /\b(insta|ig|whats|wpp|zap|zapp|face|fb|snap|telegram|discord|kwai|messenger|dm|direct|inbox|pv)\b/;
  const PEDIDO = /\b(?:passa|passe|manda|mande|envia|envie|me\s+da|me\s+de|qual\s+(?:e\s+)?(?:o\s+|a\s+)?(?:seu|sua)|meu|minha)\s+(?:(?:seu|sua|o|a)\s+)?(telefone|celular|cel|contato|endereco|whats\w*|zap|insta\w*|e-?mail|numero\s+de\s+(?:telefone|celular))\b|\b(?:me\s+liga|liga\s+pra\s+mim|te\s+ligo|me\s+chama\s+(?:no|na|la))\b/;

  const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };
  const espremer = t => t.replace(/[013457@$]/g, c => LEET[c]).replace(/[^a-z]/g, '');
  // "w h a t s a p p", "z.a.p" → letras soltas viram palavra antes da busca curta
  const juntarSoltas = t => t.replace(/\b(?:[a-z][\s.\-_*]+){2,}[a-z]\b/g, m => m.replace(/[\s.\-_*]+/g, ''));

  const ROTULO = {
    telefone: 'um número de telefone (ou outro número pessoal, como CPF ou CEP)',
    email: 'um endereço de e-mail',
    arroba: 'um perfil de rede social (@)',
    link: 'um link para fora da Peneiras On',
    rede: 'o nome de uma rede social ou app de mensagens',
    pedido: 'um pedido de contato fora da plataforma',
  };

  function verificar(texto) {
    const t = normalizar(texto);
    const motivos = [];
    const add = (tipo, trecho) => motivos.push({ tipo, rotulo: ROTULO[tipo], trecho: String(trecho || '').replace(/^[^\p{L}\p{N}@(+]+|[^\p{L}\p{N}]+$/gu, '') });

    const tel = telefone(t);
    if (tel) add('telefone', tel);

    const em = t.match(EMAIL);
    if (em) add('email', em[0]);
    else { const pv = t.match(PROVEDOR); if (pv) add('email', pv[1]); }
    const semEmail = em ? t.replace(EMAIL, ' ') : t;

    const ar = semEmail.match(ARROBA);
    if (ar) add('arroba', ar[1]);

    const ln = semEmail.match(LINK);
    if (ln) add('link', ln[0]);

    const esp = espremer(t);
    const longa = REDES_LONGAS.find(n => esp.includes(n));
    const curta = juntarSoltas(t.replace(/[013457]/g, c => LEET[c])).match(REDES_CURTAS);
    if (longa || curta) add('rede', longa || curta[1]);

    const pd = t.match(PEDIDO);
    if (pd) add('pedido', pd[0]);

    return { bloqueada: motivos.length > 0, motivos };
  }

  /* ============================================================
     INTERFACE DA CONVERSA
     ============================================================ */
  const CHAVE = 'peneiras-on.chat.v1';      // mensagens novas, por conversa
  const lerNovas = () => UI.storage.get(CHAVE, {});
  const salvarNova = (id, msg) => {
    const todas = lerNovas();
    todas[id] = (Array.isArray(todas[id]) ? todas[id] : []).concat([msg]);
    UI.storage.set(CHAVE, todas);
  };
  /* seed do mock.json + o que foi enviado neste navegador (os dois lados leem
     a mesma chave: o que o olheiro manda aparece na tela do atleta) */
  function mensagens(conversa) {
    const novas = lerNovas()[conversa.id];
    return conversa.mensagens.concat(Array.isArray(novas) ? novas : []);
  }

  const hora = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  function mensagemHTML(m, opts) {
    if (m.de === 'sistema') {
      return `<li class="chat__sys"><span class="sr-only">Aviso da plataforma: </span>${esc(m.texto)}</li>`;
    }
    const minha = m.de === opts.persona;
    const quem = minha ? 'Você' : opts.outro.nome;
    return `<li class="chat__msg ${minha ? 'chat__msg--minha' : 'chat__msg--outro'}">
      <span class="sr-only">${esc(quem)} disse: </span>
      <p class="chat__texto">${esc(m.texto)}</p>
      <span class="chat__meta" aria-hidden="true">${esc(quem)} · ${hora(m.em)}</span>
    </li>`;
  }

  /* opts: persona ('olheiro' | 'atleta'), conversa (do MOCK), outro { nome, sub } */
  function montar(host, opts) {
    const c = opts.conversa;
    const ehMenor = opts.menor !== false;
    const idCampo = 'chat-msg-' + c.id;
    host.innerHTML = `
      <section class="card card--flush chat" aria-labelledby="chat-titulo-${c.id}">
        <header class="chat__head">
          ${avatarHTML(opts.outro.nome, { size: 40, gold: opts.persona === 'atleta' })}
          <div class="min-w-0">
            <h2 class="font-display font-extrabold text-16 uppercase tracking-display-sm m-0" id="chat-titulo-${c.id}">${esc(opts.outro.nome)}</h2>
            <div class="font-mono text-10 text-ink-mute mt-0.5">${esc(opts.outro.sub)}</div>
          </div>
          <span class="tag tag--success ml-auto shrink-0">◆ Conversa protegida</span>
        </header>
        <p class="chat__regra">Para proteger atletas menores de idade, telefone, redes sociais, e-mail e links não passam por aqui. Precisa combinar algo fora da plataforma? A equipe da Academia faz a ponte com o responsável.</p>
        <ol class="chat__lista" data-chat-lista aria-live="polite" aria-relevant="additions" aria-label="Mensagens com ${esc(opts.outro.nome)}" tabindex="0">
          ${mensagens(c).map(m => mensagemHTML(m, opts)).join('')}
        </ol>
        <form class="chat__form" data-chat-form novalidate>
          <div class="field">
            <div class="field__label"><label for="${idCampo}"><span>Mensagem para ${esc(opts.outro.nome.split(' ')[0])}</span></label></div>
            <textarea class="textarea min-h-[64px]" id="${idCampo}" rows="2" maxlength="600" aria-describedby="${idCampo}-dica" placeholder="Escreva sua mensagem…"></textarea>
            <span class="field__hint" id="${idCampo}-dica">Enter envia · Shift+Enter quebra a linha</span>
          </div>
          <div data-chat-alerta></div>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="submit" class="btn btn--accent btn--sm">Enviar →</button>
            <button type="button" class="btn btn--ghost btn--sm" data-chat-ponte>Pedir contato pela Academia</button>
          </div>
        </form>
      </section>`;

    const lista = host.querySelector('[data-chat-lista]');
    const form = host.querySelector('[data-chat-form]');
    const campo = form.querySelector('textarea');
    const alerta = form.querySelector('[data-chat-alerta]');
    const rolarFim = () => { lista.scrollTop = lista.scrollHeight; };
    let avisoAtual = null;   // toast do último bloqueio: um novo substitui o anterior, sem empilhar
    rolarFim();

    function limparAlerta() {
      if (avisoAtual) { avisoAtual.close(); avisoAtual = null; }
      alerta.innerHTML = '';
      campo.removeAttribute('aria-invalid');
      campo.setAttribute('aria-describedby', `${idCampo}-dica`);
    }
    function mostrarBloqueio(motivos) {
      const lado = opts.persona === 'olheiro'
        ? 'A regra vale também para olheiros credenciados: é o que protege o atleta e o seu credenciamento.'
        : 'Você não fez nada de errado: a regra vale para todo mundo, inclusive para o olheiro, e existe para proteger você.';
      alerta.innerHTML = `<div class="chat__alerta" role="alert" id="${idCampo}-alerta">
        <p class="font-display font-extrabold text-14 uppercase m-0">Esta mensagem não foi enviada</p>
        <p class="m-0 mt-1.5">Ela tem ${motivos.map(m => `${m.rotulo}${m.trecho ? `: <span class="font-mono">«${esc(m.trecho)}»</span>` : ''}`).join('; ')}.</p>
        <p class="m-0 mt-1.5">${ehMenor ? 'Para proteger atletas menores de idade, ' : ''}toda conversa entre olheiro e atleta acontece aqui dentro, onde a Academia e o responsável acompanham. ${lado}</p>
        <p class="m-0 mt-1.5"><strong>O que fazer:</strong> apague o contato e envie o resto da mensagem. Se vocês precisarem se falar por telefone ou pessoalmente, use "Pedir contato pela Academia": a equipe combina com o responsável e avisa os dois por aqui.</p>
      </div>`;
      campo.setAttribute('aria-invalid', 'true');
      campo.setAttribute('aria-describedby', `${idCampo}-dica ${idCampo}-alerta`);
      // o aviso completo é o role="alert" acima; o toast só confirma que nada saiu
      if (avisoAtual) avisoAtual.close();
      avisoAtual = toast('Mensagem não enviada: veja o aviso abaixo do campo.', { type: 'error' });
    }
    function publicar(msg) {
      salvarNova(c.id, msg);
      lista.insertAdjacentHTML('beforeend', mensagemHTML(msg, opts));
      rolarFim();
    }

    function enviar() {
      const texto = campo.value.trim();
      if (!texto) { campo.focus(); return; }
      const r = verificar(texto);
      if (r.bloqueada) { mostrarBloqueio(r.motivos); campo.focus(); return; }
      limparAlerta();
      publicar({ de: opts.persona, texto, em: new Date().toISOString() });
      campo.value = '';
      campo.focus();
    }
    form.addEventListener('submit', e => { e.preventDefault(); enviar(); });
    campo.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(); }
    });
    // depois do bloqueio, o aviso some assim que o texto deixa de ter contato
    campo.addEventListener('input', () => {
      if (campo.getAttribute('aria-invalid') === 'true' && !verificar(campo.value).bloqueada) limparAlerta();
    });
    form.querySelector('[data-chat-ponte]').addEventListener('click', () => {
      limparAlerta();
      publicar({ de: 'sistema', texto: `Pedido de contato registrado. A equipe da Academia fala com o responsável e responde aqui em até ${typeof Envio !== 'undefined' ? Envio.PRAZO_DIAS_UTEIS : 2} dias úteis.`, em: new Date().toISOString() });
      toast('Pedido enviado à equipe da Academia.', { type: 'success' });
    });
  }

  return { verificar, normalizar, montar, mensagens };
})();
