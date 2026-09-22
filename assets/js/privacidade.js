/* ============================================================
   PENEIRAS ON — Política de Privacidade (conteúdo + render)
   ============================================================ */
mountSimpleHeader('Política de Privacidade');
mountSiteFooter({ compact: true, lines: [
  '© 2026 PENEIRAS ON · FIAP / SEMI-PRESENCIAL RJ',
  'LGPD · ECA · WCAG 2.1 AA',
] });

document.querySelector('[data-meta]').innerHTML = [
  ['Última atualização','13 de maio de 2026'],
  ['Versão','3.2'],
  ['Vigência','A partir da publicação'],
  ['Idioma','pt-BR'],
  ['Encarregado (DPO)','dpo@exemplo.com'],
].map(([l,v]) => `<div><div class="kicker uppercase">${l}</div><div class="font-display font-extrabold text-16 mt-1">${v}</div></div>`).join('');

const TOC = [
  ['principios','01','Princípios'],['dados','02','Dados que coletamos'],['finalidades','03','Para que usamos'],
  ['base-legal','04','Base legal'],['menores','05','Menores de idade — ECA'],['compartilhamento','06','Compartilhamento'],
  ['retencao','07','Retenção e exclusão'],['direitos','08','Seus direitos (LGPD)'],['seguranca','09','Segurança'],
  ['cookies','10','Cookies'],['contato','11','Contato — Encarregado (DPO)'],
];
const tocNav = document.querySelector('[data-toc]');
tocNav.innerHTML = TOC.map(([id,n,t]) =>
  `<button class="toc-btn" type="button" data-target="${id}"><span class="mono text-mute">${n}</span><span class="text-13">${t}</span></button>`).join('');

/* Navegação do sumário: addEventListener (como o resto do projeto) e scroll
   suave só quando o usuário não pediu movimento reduzido. */
tocNav.addEventListener('click', e => {
  const btn = e.target.closest('.toc-btn');
  if (!btn) return;
  const target = document.getElementById(btn.dataset.target);
  if (!target) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  target.focus({ preventScroll: true });
});

function dataTable(rows) {
  return `<div class="dt"><div class="dt__head"><div>Categoria</div><div>Conteúdo</div><div>Justificativa</div></div>` +
    rows.map(r => `<div class="dt__row"><div>${r.cat}</div><div>${r.items}</div><div>${r.why}</div></div>`).join('') + `</div>`;
}
function block(id,num,title,inner) {
  return `<section id="${id}" class="priv-block" tabindex="-1">
    <div class="priv-block__head"><span class="mono text-mute">${num}</span><h2>${title}</h2></div>
    <div class="flex flex-col gap-4">${inner}</div>
  </section>`;
}
function bullets(items){ return `<ul class="priv-bullets">${items.map(i=>`<li><span class="b">▸</span><span>${i}</span></li>`).join('')}</ul>`; }

const rightsList = (()=>{
  const r = [
    ['I','Confirmação','Saber se tratamos seus dados.'],['II','Acesso','Receber uma cópia de tudo que temos.'],
    ['III','Correção','Pedir ajuste de dados incompletos ou desatualizados.'],['IV','Anonimização','Bloquear ou anonimizar dados desnecessários.'],
    ['V','Portabilidade','Levar seus dados em formato estruturado para outro serviço.'],['VI','Exclusão','Apagar tudo (exceto o que devemos guardar por lei).'],
    ['VII','Compartilhamento','Saber com quem compartilhamos.'],['VIII','Revogação','Cancelar o consentimento dado anteriormente.'],
    ['IX','Revisão humana','Pedir revisão de decisões automatizadas (ex.: score, ranking).'],
  ];
  return `<div class="rights">${r.map(([n,t,d])=>`<div class="rights__item"><span class="rights__n">${n}</span><div><div class="font-display font-extrabold text-13 uppercase">${t}</div><div class="text-13 leading-normal text-ink-soft mt-0.5">${d}</div></div></div>`).join('')}</div>`;
})();

const contact = `<div class="bg-bg-alt border border-line-soft p-6 mt-2"><div class="g g-2 gap-6">` +
  [['Nome','Nome do Encarregado'],['Cargo','DPO — Peneiras On'],['E-mail','dpo@exemplo.com'],['Telefone','(00) 0000-0000'],['Endereço','Rua Exemplo, 000 — Cidade/UF — 00000-000'],['Horário','Seg–Sex · 09h às 18h (BRT)']]
  .map(([l,v])=>`<div><div class="kicker uppercase">${l}</div><div class="text-14 mt-1 font-semibold">${v}</div></div>`).join('') + `</div></div>`;

document.querySelector('[data-body]').innerHTML = [
  block('principios','01','Princípios que guiam esta política',
    `<p class="priv-p">O Peneiras On nasceu para <strong>democratizar o acesso ao futebol</strong>. Por isso, tratamos dados com três compromissos:</p>` +
    bullets(['<strong>Mínimo necessário.</strong> Não pedimos nada além do que precisamos para inscrever, alocar e avaliar o atleta.','<strong>Transparência radical.</strong> Você sabe o que coletamos, por quê, e pode ver tudo na sua conta.','<strong>Proteção redobrada para menores.</strong> Como atendemos jovens de 07 a 19 anos, seguimos o ECA além da LGPD.'])),

  block('dados','02','Quais dados coletamos',
    `<p class="priv-p">Coletamos somente o que é necessário para os fluxos da plataforma. Os dados são classificados em três categorias:</p>` +
    dataTable([
      {cat:'Obrigatórios',items:'Nome completo, data de nascimento, CPF, cidade/estado, posição, contato do responsável legal (para menores).',why:'Validar elegibilidade, prevenir fraude e duplicidade, comunicar convocação.'},
      {cat:'Opcionais',items:'Altura, peso, pé dominante, clube atual, tempo de prática, links de vídeo, foto.',why:'Aumentar o score de completude e dar mais informação ao olheiro.'},
      {cat:'Gerados',items:'Score, ranking, perfil tático sugerido (radar), histórico de peneiras, avaliações, check-in.',why:'Permitir o trabalho do olheiro e a inteligência operacional da gestão.'},
    ]) +
    `<p class="priv-p"><strong>Não coletamos</strong> dados sensíveis (raça, religião, opinião política, biometria, saúde), pois eles não são necessários para o serviço.</p>`),

  block('finalidades','03','Para que usamos seus dados',
    bullets([
      '<strong>Inscrição e elegibilidade:</strong> validar idade (07–19), CPF único, residência.',
      '<strong>Alocação geográfica:</strong> calcular a peneira mais próxima com vaga (PostGIS).',
      '<strong>Comunicação:</strong> SMS/e-mail de confirmação, convocação, lembrete e resultado.',
      '<strong>Avaliação no campo:</strong> registrar notas e parecer do olheiro pós-peneira.',
      '<strong>Pipeline de talentos:</strong> manter histórico de aprovados para sustentar o revenue share (mecanismo de solidariedade FIFA).',
      '<strong>Inteligência estratégica:</strong> agregados anônimos por região (mapa de calor, funil), sem identificar pessoas.',
    ]) +
    `<div class="priv-callout">Nunca usamos os dados para perfilamento comercial, publicidade direcionada ou venda a terceiros.</div>`),

  block('base-legal','04','Base legal (Art. 7º da LGPD)',
    `<p class="priv-p">Cada tratamento tem uma base legal específica:</p>` +
    dataTable([
      {cat:'Consentimento',items:'Termo aceito pelo responsável (menores) ou pelo próprio inscrito (≥18).',why:'Art. 7º, I'},
      {cat:'Execução de contrato',items:'Tratamentos indispensáveis para inscrever, convocar e avaliar.',why:'Art. 7º, V'},
      {cat:'Legítimo interesse',items:'Prevenção de fraude (CPF duplicado) e segurança da plataforma.',why:'Art. 7º, IX'},
      {cat:'Obrigação legal',items:'Atender ECA, Marco Civil da Internet e ordens judiciais.',why:'Art. 7º, II'},
    ])),

  block('menores','05','Menores de idade — proteção reforçada (ECA + LGPD Art. 14)',
    `<p class="priv-p">Atendemos atletas de <strong>07 a 19 anos</strong>. Para qualquer pessoa menor de 18, aplicamos camada extra de proteção:</p>` +
    bullets([
      '<strong>Termo do responsável legal</strong> obrigatório na inscrição, guardado com data/hora e IP.',
      '<strong>Notificações em duplicidade:</strong> SMS de confirmação vai para o celular do responsável.',
      '<strong>Acesso parental:</strong> o responsável pode excluir a conta do menor a qualquer momento.',
      '<strong>Sem dados sensíveis:</strong> não coletamos imagens íntimas, saúde ou geolocalização em tempo real.',
      '<strong>Sem comunicação direta</strong> entre olheiro e menor fora dos canais oficiais.',
    ]) +
    `<div class="priv-callout priv-callout--danger">Suspeita de violação de direitos da criança/adolescente é encaminhada ao Conselho Tutelar e ao Ministério Público, conforme Art. 13 do ECA.</div>`),

  block('compartilhamento','06','Com quem compartilhamos',
    dataTable([
      {cat:'Olheiros',items:'Perfil completo do inscrito convocado para a peneira em que atuam.',why:'Execução do contrato.'},
      {cat:'Pelé Academia',items:'Dados agregados e anonimizados; perfis individuais só para gestão.',why:'Co-controlador (parceria).'},
      {cat:'Operadores',items:'Hospedagem (cloud), SMS, e-mail e analytics, sob contrato de proteção de dados.',why:'Funcionamento técnico.'},
      {cat:'Autoridades',items:'Quando obrigado por lei, ordem judicial ou requisição do MP / Conselho Tutelar.',why:'Obrigação legal.'},
    ]) +
    `<p class="priv-p"><strong>Nunca</strong> compartilhamos com fins comerciais, parceiros publicitários ou venda de leads.</p>`),

  block('retencao','07','Por quanto tempo guardamos',
    dataTable([
      {cat:'Cadastro ativo',items:'Enquanto a conta estiver em uso.',why:'Manter histórico de peneiras.'},
      {cat:'Cadastro inativo',items:'24 meses após o último login.',why:'Depois, conta é anonimizada.'},
      {cat:'Pipeline aprovados',items:'Até a maioridade + 10 anos, ou prazo do revenue share.',why:'Documentar formação (FIFA).'},
      {cat:'Logs de segurança',items:'6 meses.',why:'Marco Civil (Art. 15).'},
    ]) +
    `<p class="priv-p">Você pode pedir a exclusão antecipada a qualquer momento. Atendemos em até 15 dias.</p>`),

  block('direitos','08','Seus direitos como titular (Art. 18 da LGPD)',
    `<p class="priv-p">Você (ou o responsável legal, se for menor) pode exercer estes direitos a qualquer momento:</p>` +
    rightsList +
    `<p class="priv-p">Como exercer? Em qualquer um destes canais:</p>` +
    bullets(['Pelo painel <em>Configurações → Privacidade</em> dentro da plataforma.','Por e-mail ao Encarregado: <strong>dpo@exemplo.com</strong>.','Pelo formulário público em <strong>exemplo.com/direitos</strong>.']) +
    `<p class="priv-p">Prazo de resposta: <strong>até 15 dias</strong>, conforme Art. 19 da LGPD.</p>`),

  block('seguranca','09','Como protegemos os dados',
    dataTable([
      {cat:'Em repouso',items:'Banco de dados criptografado com AES-256.',why:'Dados ilegíveis mesmo se vazarem.'},
      {cat:'Em trânsito',items:'TLS 1.3 em todas as conexões.',why:'Impede interceptação na rede.'},
      {cat:'Senhas',items:'Hash bcrypt com fator de custo ≥ 12.',why:'Impossível reverter à senha original.'},
      {cat:'Acesso interno',items:'RBAC + auditoria de acesso por usuário/IP.',why:'Quem viu o quê fica registrado.'},
      {cat:'Backup',items:'Snapshot a cada 6h, retenção 30 dias.',why:'RPO 6h, RTO 2h.'},
    ]) +
    `<div class="priv-callout">Em caso de incidente com risco aos titulares, comunicamos a <strong>ANPD</strong> e os afetados em até <strong>72 horas</strong> (Art. 48 da LGPD).</div>`),

  block('cookies','10','Cookies e tecnologias similares',
    `<p class="priv-p">Usamos três tipos de cookies. Você pode gerenciar tudo em <em>Configurações → Cookies</em>.</p>` +
    dataTable([
      {cat:'Essenciais',items:'Sessão de login, prevenção de CSRF, preferência de idioma.',why:'Indispensáveis.'},
      {cat:'Funcionais',items:'Lembrar filtros do olheiro, último estado do dashboard.',why:'Opcionais.'},
      {cat:'Analytics',items:'Métricas agregadas anônimas (volume, tempo na página).',why:'Opcionais. Sem identificação.'},
    ]) +
    `<p class="priv-p">Não usamos cookies de publicidade ou de redes sociais.</p>`),

  block('contato','11','Encarregado de Proteção de Dados (DPO)',
    `<p class="priv-p">O Encarregado recebe suas solicitações, reclamações e comunica a ANPD em caso de incidente.</p>` +
    contact +
    `<p class="priv-p mt-8">Você também pode reclamar diretamente à <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>:</p>` +
    bullets(['Site: <strong>gov.br/anpd</strong>','Endereço: SCN, Quadra 06, Conjunto A, Bloco B — Brasília/DF'])),

  `<div class="border-t border-t-line pt-6 mt-4 flex gap-6 items-baseline justify-between flex-wrap">
    <span class="mono text-mute normal-case">Documento em conformidade com LGPD (Lei 13.709/2018) e ECA (Lei 8.069/1990).</span>
    <a href="index.html" class="btn btn--primary btn--sm">← Voltar à home</a>
  </div>`,
].join('');
