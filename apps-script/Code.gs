/* ============================================================
   PENEIRAS ON — Apps Script (cópia versionada)
   O código que roda de verdade fica no editor do Google Apps Script,
   vinculado à planilha. Este arquivo é a cópia para o GitHub: mudou lá,
   cole aqui (e vice-versa). Contrato das colunas: python/CONTRATO.md
   ============================================================ */

const ABA = 'Inscricoes';

// Ordem das colunas = ordem do contrato. data_envio é preenchida aqui.
const COLUNAS = [
  'data_envio', 'codigo', 'nome', 'nascimento', 'cpf', 'uf', 'cidade',
  'posicao', 'pe', 'altura', 'peso', 'clube', 'anos_pratica', 'video',
  'foto', 'responsavel', 'tel_responsavel', 'aceite_termo', 'evento',
];

/* Rodar UMA vez pelo editor (botão Executar): cria a aba e o cabeçalho. */
function configurarPlanilha() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(ABA) || planilha.insertSheet(ABA);
  aba.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS]);
  aba.setFrozenRows(1);
  // texto puro: impede o Sheets de transformar CPF em número e cortar zeros à esquerda
  aba.getRange('A:S').setNumberFormat('@');
}

/* Recebe a inscrição enviada pelo site (envio.js) e grava uma linha. */
function doPost(e) {
  // trava: dois envios no mesmo instante não gravam na mesma linha
  const trava = LockService.getScriptLock();
  try {
    trava.waitLock(10000);
    const dados = JSON.parse(e.postData.contents);
    if (!dados.codigo || !dados.nome || !dados.cpf) {
      return resposta({ ok: false, erro: 'campos obrigatórios ausentes' });
    }
    const agora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd HH:mm:ss');
    const linha = COLUNAS.map(col => col === 'data_envio' ? agora : limpar(dados[col]));
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA).appendRow(linha);
    return resposta({ ok: true, codigo: dados.codigo });
  } catch (erro) {
    return resposta({ ok: false, erro: String(erro) });
  } finally {
    trava.releaseLock();
  }
}

/* Texto seguro para a planilha: corta em 200 caracteres e neutraliza
   fórmulas (=, +, -, @ no início viram texto com ' na frente). */
function limpar(valor) {
  const texto = String(valor == null ? '' : valor).trim().slice(0, 200);
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}

function resposta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
