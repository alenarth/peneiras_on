/* PENEIRAS ON — tela de aguardo do profissional (olheiro/academia pendente). */
mountSimpleHeader('Acesso pendente', 'index.html', 'Voltar à home', { cta: false });
const screenEl = document.querySelector('[data-screen]');

(async function () {
  if (window.PeneirasAuth && PeneirasAuth.indisponivel) {
    screenEl.innerHTML = `<h1 class="display h3">Indisponível</h1><p class="text-ink-soft">${esc(PeneirasAuth.indisponivel)}</p>`;
    return;
  }
  const conta = await PeneirasAuth.exigirAcesso({}); // exige login + código
  if (!conta) return;

  // Já aprovado? Vai direto para a área.
  const destino = PeneirasAuth.destinoPorPapel(conta);
  if (conta.profissional && conta.profissional.situacao === 'aprovado') { location.replace(destino); return; }
  if (conta.papel === 'gestora') { location.replace('gestora.html?tela=dashboard'); return; }
  if (conta.atleta_id) { location.replace('atleta.html?tela=status'); return; }

  const prof = conta.profissional;
  const situacao = prof ? prof.situacao : 'sem_solicitacao';
  const textos = {
    pendente: 'Sua solicitação foi recebida e está em análise pela gestão. Você receberá o acesso assim que for aprovada.',
    recusado: 'Sua solicitação de acesso foi recusada. Fale com a gestão para mais informações.',
    sem_solicitacao: 'Você ainda não enviou os dados da sua solicitação de acesso.',
  };
  screenEl.innerHTML = `
    <span class="kicker uppercase">Acesso profissional</span>
    <h1 class="display h3 text-44 mt-2 mb-4 mx-0">${situacao === 'recusado' ? 'Solicitação recusada.' : 'Acesso em análise.'}</h1>
    <p class="text-15 leading-copy text-ink-soft mb-8 max-w-copy-sm">Olá, ${esc(conta.nome || '')}. ${esc(textos[situacao] || textos.pendente)}</p>
    ${prof ? `<div class="card max-w-copy mb-6"><div class="kicker uppercase mb-1">Solicitação</div>
       <div class="display text-18">${esc(prof.empresa || '')}</div>
       <div class="font-mono text-12 text-ink-soft mt-1">${esc(prof.cargo || '')} · ${esc(prof.tipo)} · ${esc(prof.situacao)}</div></div>` : ''}
    <div class="flex gap-2 flex-wrap">
      ${situacao === 'sem_solicitacao' ? `<a href="cadastro.html?fluxo=completar" class="btn btn--primary btn--lg">Enviar solicitação</a>` : `<button id="recarregar" class="btn btn--primary btn--lg">Verificar novamente</button>`}
      <button id="sair" class="btn btn--ghost btn--lg">Sair</button>
    </div>`;
  const rec = screenEl.querySelector('#recarregar');
  if (rec) rec.addEventListener('click', () => location.reload());
  screenEl.querySelector('#sair').addEventListener('click', async () => { await PeneirasAuth.sair(); location.replace('login.html?tipo=olheiro'); });
})();
