/* ============================================================
   PENEIRAS ON — foto.js (Sprint 4)
   Foto do atleta com pré-visualização imediata pela API FileReader, sem
   enviar nada a servidor. Usado no passo 4 do cadastro e no perfil.
     · Foto.campoHTML(opts)  → markup do campo (input nativo + prévia)
     · Foto.ligar(root, opts) → liga o comportamento; opts.aoMudar(dataURL|null)

   Por que a foto NÃO segue com a inscrição: envio.js manda texto para uma
   planilha (python/CONTRATO.md); a coluna `foto` é só S/N. Uma imagem em
   base64 quebraria o contrato de colunas (e o limite de 200 caracteres por
   célula). A prévia vive só na memória desta página.

   Fluxo, na ordem:
     1. valida tipo e tamanho ANTES de ler — arquivo errado nem é aberto;
     2. carregando: prévia com aria-busy, frase na região aria-live, campo
        travado (UI.busy) — foto grande de celular leva um instante;
     3. FileReader.readAsDataURL → a imagem é decodificada num <img> de
        teste; se não abrir (arquivo corrompido), vira erro, não prévia;
     4. erro: mensagem no campo (role="alert", aria-invalid, aria-describedby).

   Acessibilidade: o <input type="file"> é o nativo, só estilizado pelo
   pseudo-elemento ::file-selector-button (classe .file-input). Esconder o
   input e desenhar um botão por cima costuma tirar o campo do Tab ou o
   rótulo do leitor de tela; aqui ele continua sendo o controle de verdade.
   Depende de ui.js (UI.busy, announce) e components.js (esc).
   ============================================================ */
const Foto = (() => {
  const TIPOS = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP' };
  const LIMITE = 5 * 1024 * 1024; // 5 MB — o mesmo que o campo sempre prometeu

  const mb = bytes => (bytes / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB';

  /* opts: id, rotulo, alt (texto da prévia), previa (dataURL ou null),
     grande (prévia ocupa a largura — perfil), opcional */
  function campoHTML(opts) {
    const id = opts.id;
    return `<div class="field foto${opts.grande ? ' foto--grande' : ''}" data-foto="${id}">
      <div class="field__label"><label for="${id}"><span>${opts.rotulo}</span></label>${opts.opcional ? '<span class="field__optional">opcional</span>' : ''}</div>
      <div class="foto__area">
        <div class="foto__preview" data-foto-preview>${previewHTML(opts.previa, opts.alt)}</div>
        <div class="flex flex-col gap-2 min-w-0">
          <input type="file" id="${id}" class="file-input" accept="image/jpeg,image/png,image/webp" aria-describedby="${id}-hint">
          <span class="field__hint" id="${id}-hint">JPG, PNG ou WebP, até 5 MB. A prévia fica só neste aparelho: a foto não é enviada com a inscrição.</span>
          <button type="button" class="btn btn--ghost btn--sm self-start" data-foto-remover ${opts.previa ? '' : 'hidden'}>Remover foto</button>
        </div>
      </div>
    </div>`;
  }
  function previewHTML(dataURL, alt) {
    return dataURL
      ? `<img class="foto__img" src="${dataURL}" alt="${esc(alt)}">`
      : `<span class="foto__vazia" aria-hidden="true">Sem foto</span>`;
  }

  function ligar(root, opts) {
    const wrap = root.querySelector(`[data-foto="${opts.id}"]`);
    if (!wrap) return;
    const input = wrap.querySelector('input[type="file"]');
    const preview = wrap.querySelector('[data-foto-preview]');
    const remover = wrap.querySelector('[data-foto-remover]');
    const errId = opts.id + '-erro';

    function erro(msg) {
      let el = document.getElementById(errId);
      if (!el) {
        el = document.createElement('span');
        el.className = 'field__error';
        el.id = errId;
        el.setAttribute('role', 'alert');
        wrap.appendChild(el);
      }
      el.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', `${opts.id}-hint ${errId}`);
      input.value = '';     // o mesmo arquivo pode ser escolhido de novo depois de corrigir
    }
    function limparErro() {
      const el = document.getElementById(errId);
      if (el) el.remove();
      input.removeAttribute('aria-invalid');
      input.setAttribute('aria-describedby', `${opts.id}-hint`);
    }

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      limparErro();
      // 1. validação antes de ler
      if (!TIPOS[file.type]) {
        const ext = (file.name.split('.').pop() || '').toUpperCase();
        erro(`"${file.name}" ${ext && ext !== file.name.toUpperCase() ? `é ${ext}` : 'não é uma imagem aceita'}. Escolha uma foto JPG, PNG ou WebP.`);
        return;
      }
      if (file.size > LIMITE) {
        erro(`Essa foto tem ${mb(file.size)} e o limite é 5 MB. Escolha outra ou reduza a foto (um print da tela resolve) e tente de novo.`);
        return;
      }
      if (file.size === 0) { erro('O arquivo está vazio. Escolha outra foto.'); return; }

      // 2. carregando
      const anterior = preview.innerHTML;
      const done = UI.busy(preview, 'Lendo a foto…', { render: true, block: false, controls: [input, remover] });

      // 3. leitura
      const reader = new FileReader();
      const falhou = msg => { preview.innerHTML = anterior; done(); erro(msg); };
      reader.onerror = () => falhou('Não deu para ler o arquivo. Tente de novo ou escolha outra foto.');
      reader.onabort = () => falhou('A leitura da foto foi interrompida. Tente de novo.');
      reader.onload = () => {
        const teste = new Image();
        teste.onload = () => {
          preview.innerHTML = previewHTML(reader.result, opts.alt);
          remover.hidden = false;
          done('Foto carregada. A pré-visualização está pronta.');
          if (opts.aoMudar) opts.aoMudar(reader.result, file);
        };
        teste.onerror = () => falhou(`Não conseguimos abrir "${file.name}". O arquivo pode estar corrompido; escolha outra foto.`);
        teste.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

    remover.addEventListener('click', () => {
      preview.innerHTML = previewHTML(null);
      remover.hidden = true;
      input.value = '';
      limparErro();
      input.focus();
      announce('Foto removida.');
      if (opts.aoMudar) opts.aoMudar(null, null);
    });
  }

  return { campoHTML, ligar, LIMITE };
})();
