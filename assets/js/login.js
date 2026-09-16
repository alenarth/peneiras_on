/* ============================================================
   PENEIRAS ON — Login (lê ?tipo= e configura a página)
   ============================================================ */
mountSimpleHeader('Entrar', 'index.html', 'Voltar à home');

const ROLES = {
  jogador: {
    label:'Jogador', tag:'Atleta', title:'Mostre seu futebol.',
    sub:'Acompanhe sua inscrição, score e convocação.',
    idLabel:'CPF ou e-mail', idPlaceholder:'000.000.000-00',
    dest:'atleta.html?tela=status',
    tips:['Use o CPF que cadastrou na inscrição.','Para menores, o responsável também recebe acesso.','Esqueceu a senha? Enviamos um link por SMS.'],
  },
  olheiro: {
    label:'Olheiro', tag:'Acesso credenciado', title:'Veja talento. Não planilha.',
    sub:'Lista otimizada, perfil completo, avaliação no campo.',
    idLabel:'E-mail corporativo', idPlaceholder:'olheiro@exemplo.com',
    dest:'olheiro.html?tela=lista',
    tips:['Acesso liberado mediante credenciamento da gestão.','2FA opcional via app autenticador.','Histórico de acesso fica registrado em log auditável.'],
  },
  academia: {
    label:'Academia', tag:'Gestão estratégica', title:'Operação vira estratégia.',
    sub:'Dashboard, mapa de calor, funil de conversão, pipeline.',
    idLabel:'E-mail corporativo', idPlaceholder:'gestor@exemplo.com',
    dest:'gestora.html?tela=dashboard',
    tips:['Acesso restrito a administradores e gestores credenciados.','2FA obrigatório por padrão.','Permissões granulares por função (RBAC).'],
  },
};

const params = new URLSearchParams(location.search);
const role = ROLES[params.get('tipo')] ? params.get('tipo') : 'jogador';
const cfg = ROLES[role];

// ?evento=<id> vindo de peneiras.html: só contexto no formulário (o protótipo
// não tem sessão). Id inválido ou ausente cai no login normal.
const evento = MOCK.EVENTS.find(e => e.id === params.get('evento'));
if (evento && role === 'jogador') {
  const ctx = document.querySelector('[data-event-context]');
  ctx.textContent = `Entre para se inscrever em ${evento.name} · ${fmtDotDate(evento.date, 'full')}`;
  ctx.hidden = false;
}

// preencher lado
document.querySelector('[data-side-tag]').textContent = cfg.tag;
document.querySelector('[data-side-title]').textContent = cfg.title;
document.querySelector('[data-side-sub]').textContent = cfg.sub;
document.querySelector('[data-side-tips]').innerHTML =
  `<div class="kicker" style="color:rgba(245,244,238,.55)">Lembretes</div>` +
  cfg.tips.map((t,i)=>`<div class="g g-row-tip" style="gap:12px;font-size:14px;line-height:1.5;padding-top:10px;border-top:1px solid rgba(245,244,238,.15)"><span class="accent" style="font-family:var(--font-display);font-weight:900">0${i+1}</span><span>${t}</span></div>`).join('');

// abas ativas
document.querySelectorAll('.role-tab').forEach(t => {
  if (t.getAttribute('data-role') === role) t.classList.add('is-active');
});

// formulário
document.querySelector('[data-form-kicker]').textContent = 'Entrar como ' + cfg.label.toLowerCase();
document.querySelector('[data-id-label]').textContent = cfg.idLabel;
const idInput = document.querySelector('[data-id-input]');
idInput.placeholder = cfg.idPlaceholder;
// botão (não link): a ação depende de JS, então não deve fingir ser <a href>
document.querySelector('[data-google]').addEventListener('click', () => {
  location.href = cfg.dest;
});

document.querySelector('[data-login-form]').addEventListener('submit', e => {
  e.preventDefault();
  location.href = cfg.dest;
});

// mostrar/ocultar senha
const pwd = document.querySelector('[data-pwd]');
document.querySelector('[data-toggle-pwd]').addEventListener('click', function() {
  const show = pwd.type === 'password';
  pwd.type = show ? 'text' : 'password';
  this.textContent = show ? 'Ocultar' : 'Mostrar';
});

// linha inferior
const bottom = document.querySelector('[data-bottom-row]');
if (role === 'jogador') {
  bottom.innerHTML = `<span style="font-size:13px;color:var(--ink-soft)">Ainda não se inscreveu?</span>
    <a href="atleta.html?tela=cadastro" style="font-family:var(--font-mono);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink);text-decoration:none">Inscreva-se grátis →</a>`;
} else {
  const alts = Object.keys(ROLES).filter(r => r !== role);
  bottom.innerHTML = `<span style="font-size:13px;color:var(--ink-soft)">É outro perfil?</span>
    <div style="display:flex;gap:8px">` +
    alts.map(r => `<a href="login.html?tipo=${r}" style="background:transparent;border:1px solid var(--ink);padding:6px 10px;font-family:var(--font-mono);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--ink);text-decoration:none">Sou ${ROLES[r].label.toLowerCase()} →</a>`).join('') + `</div>`;
}
