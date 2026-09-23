# Peneiras On — Entrega da autenticação MVP

**Branch:** `joao` · **Commit base:** `544b2cb` · **Stack preservada:** HTML
multipágina + JS vanilla + Tailwind v4 + Vercel + Supabase (Auth + PostgreSQL).

Recorte implementado: cadastro das três personas, confirmação de e-mail, **login
com senha → código por e-mail → sessão verificada**, RLS/barreira no banco,
recuperação de senha, guards nos painéis e Google apenas visual. Fora de escopo
(assinaturas, mapa de calor, alocação, score, eventos, chat, uploads) **não foi
integrado** — as telas de produto continuam como demonstração (`?demo=1`),
claramente rotuladas, sem “sucesso falso”.

---

## 1. Arquitetura do fluxo

```
Criar conta (cadastro.html)
  └─ supabase.auth.signUp  → e-mail de confirmação (Supabase Auth)
       └─ confirmado.html   → “E-mail confirmado, faça login”
Login (login.html)
  └─ POST /api/auth/iniciar   (valida senha, gera código, cifra sessão pendente,
  │                            envia e-mail, devolve só um desafio + cookie)
  └─ POST /api/auth/verificar (confere código, consome desafio atomicamente,
  │                            grava privado.sessoes_verificadas, devolve a sessão)
  └─ supabase.auth.setSession → sessão instalada no navegador
Conclusão (cadastro.html?fluxo=completar, guarded)
  └─ jogador:      POST /api/cadastro/jogador  (CPF hasheado no servidor)
  └─ profissional: rpc solicitar_acesso_profissional (fica pendente)
Painéis (atleta/olheiro/gestora)  → exigirAcesso() valida sessão VERIFICADA + papel
Recuperação (recuperar.html)      → link oficial → POST /api/auth/recuperacao
```

A **barreira** é no banco, não só na tela: policies `RESTRICTIVE` exigem
`public.sessao_email_verificada()` (sessão + `session_id` assinado presentes em
`privado.sessoes_verificadas`, não revogada e válida). Uma sessão Auth criada por
senha direta, magic link ou recovery **não** libera dados protegidos.

## 2. Arquivos

**Banco (você executa):** `supabase/01-migracao-auth-mvp.sql`,
`02-bootstrap-admin.sql`, `03-aprovar-profissional.sql`, `supabase/README.md`.

**API (funções Vercel, Node/ESM):** `api/auth/{iniciar,verificar,reenviar,logout,
recuperacao}.js`, `api/cadastro/jogador.js`, `api/_lib/{env,crypto,supabaseAdmin,
http,email}.js`.

**Frontend:** `assets/js/supabase.js` (módulo de auth), `login.js`, `cadastro.js`,
`recuperar.js`, `atleta.js`, `olheiro.js`, `gestora.js`, `validation.js`
(CPF com dígitos verificadores), `confirmado.js`, `aguardando.js`,
`config.example.js`; páginas `confirmado.html`, `aguardando.html` e as tags de
script nas páginas existentes.

**Build/config:** `package.json` (type module, dep `@supabase/supabase-js`, engine
node 20, `npm test`), `scripts/gerar-config.mjs` (config público por allowlist),
`scripts/build-dist.mjs` (não copia `api/` nem `config.example.js`), `.gitignore`
(`.env*`, `assets/js/config.js`), `.env.example`, `tests/auth.test.mjs`.

## 3. O que VOCÊ precisa fazer (nesta ordem)

### 3.1 Banco (SQL Editor) — ver `supabase/README.md`
1. Rodar inventário (`scripts/inspecionar.sql`).
2. Rodar `supabase/01-migracao-auth-mvp.sql`.
3. Criar a conta admin pelo site e confirmar o e-mail; depois rodar
   `supabase/02-bootstrap-admin.sql`.

### 3.2 Segredos e variáveis (nunca cole segredo no chat)

Frontend (build) e funções usam variáveis diferentes. Defina em
**Vercel → Project → Settings → Environment Variables**:

| Variável | Onde/uso | Segredo? |
|---|---|---|
| `SUPABASE_URL` | build + funções | não (pública) |
| `SUPABASE_ANON_KEY` | build + funções | não (pública) |
| `SITE_URL` | build + funções (`https://peneirason.vercel.app`) | não |
| `SUPABASE_SERVICE_ROLE_KEY` | **só funções** (Supabase → API → service_role) | **sim** |
| `CPF_HMAC_KEY` | funções; **estável** (trocar quebra login por CPF) | **sim** |
| `OTP_HMAC_KEY` | funções (hash do código) | **sim** |
| `AUTH_SESSION_ENCRYPTION_KEY` | funções (AES-256-GCM; 32 bytes base64) | **sim** |
| `RESEND_API_KEY` + `AUTH_MAIL_FROM` | funções (envio do código) | **sim** |
| `CAPTCHA_SECRET` (opcional) | funções | **sim** |

Gerar chaves fortes: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
Modelo completo em `.env.example`. Para dev local, copie
`assets/js/config.example.js` → `assets/js/config.js` e preencha a chave anon.

### 3.3 Painel do Supabase (Authentication)
- **Confirm email: ON** (produção).
- **Providers:** deixar apenas e-mail/senha; **Google e demais desativados**.
- **URL Configuration → Site URL:** `https://peneirason.vercel.app`.
  **Redirect URLs:** adicionar `https://peneirason.vercel.app/confirmado.html` e
  `https://peneirason.vercel.app/recuperar.html` (e as de dev, sem wildcard aberto).
- **Password:** força mínima alinhada (≥8, letra maiúscula, número); leaked
  password protection se o plano permitir (não marcar como feito no Free).
- **SMTP do Auth:** configure um remetente verificado para os e-mails do Auth
  (confirmação/recovery). **Atenção:** esse SMTP é do Auth; o **código de login**
  é enviado pelas funções via `RESEND_API_KEY`/SMTP próprio — são coisas separadas.
- **Data API:** ON; **Expose new tables: OFF**; o schema `privado` **não** deve
  ser exposto (por padrão só `public` é).

### 3.4 Provedor de e-mail do código (Resend recomendado)
Crie a conta, verifique o domínio/remetente e defina `RESEND_API_KEY` +
`AUTH_MAIL_FROM`. **Sem isso, o login para no envio do código** (a função invalida
o desafio e não anuncia sucesso — comportamento correto, mas bloqueia o fluxo).

## 4. Teste obrigatório de bypass (faça antes de confiar na UI)

Com a chave anon, chame direto o Auth e prove que a RLS nega dados protegidos:

```bash
# 1) pega um JWT direto (sem passar pelo nosso endpoint)
curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"jogador@exemplo.com","password":"SenhaCerta1"}'   # → access_token

# 2) tenta ler perfil/contatos com esse token, SEM código verificado
curl -s "$SUPABASE_URL/rest/v1/profiles?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer <access_token>"
# Esperado: [] (nenhuma linha) — a policy RESTRICTIVE exige sessão verificada.

curl -s "$SUPABASE_URL/rest/v1/rpc/minha_conta" -X POST \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" -d '{}'
# Esperado: {"status":"sem_sessao"}
```

Também teste como **anon** (sem token) tentar `athlete_contacts`,
`rpc/buscar_usuario_por_cpf_hash` → negado; e que `athletes`/`events` (scouting)
continuam legíveis. Não teste como `postgres`/`service_role` (esses ignoram RLS).

## 5. Matriz de aceite (status honesto)

Legenda: ✅ passou · 🟡 pronto, **aguardando** você aplicar SQL/SMTP/deploy ·
⛔ bloqueio externo.

| Teste | Status | Observação |
|---|---|---|
| Primitivas CPF (máscara/verificadores/hash estável) | ✅ | `npm test` (7/7) |
| Código 6 dígitos ligado ao desafio; entropia do id | ✅ | `npm test` |
| Sessão pendente AES-GCM round-trip + adulteração falha | ✅ | `npm test` |
| Cadastro jogador cria Auth+profile; mensagem honesta; sem senha no banco | 🟡 | requer deploy + SMTP do Auth |
| E-mail não confirmado não acessa painel/conclusão | 🟡 | policy pronta; validar no deploy |
| Senha correta → código real, aguardando, sem dados protegidos | 🟡 | requer `RESEND_API_KEY` |
| Senha errada / CPF inexistente → resposta genérica, sem vazar e-mail | 🟡 | lógica pronta (`GENERICO`) |
| OTP errado/expirado/usado/de outro desafio bloqueado; tentativas persistem | 🟡 | `verificar_desafio_login` (sem RAISE no contador) |
| Reenviar invalida o anterior; limites atômicos | 🟡 | `reemitir_desafio` + `rate_limit_touch` |
| OTP correto em 2 requisições → 1 confirmação só | 🟡 | `for update` + `on conflict` |
| **Bypass:** senha via anon key sem OTP não abre dados | 🟡 | policies RESTRICTIVE — rodar seção 4 |
| Sessão de confirmação/recovery/passwordless não libera painel | 🟡 | barreira exige `sessoes_verificadas` |
| `session_id` diferente exige novo código | 🟡 | gate compara `session_id` do JWT |
| Refresh da mesma sessão continua na validade | 🟡 | mesmo `session_id` preservado |
| Logout revoga registro; token antigo não acessa | 🟡 | `/api/auth/logout` + `revogar_sessao` |
| Recuperação por link válido troca senha e exige novo login | 🟡 | `/api/auth/recuperacao` revoga verificadas |
| CPF inválido/repetido rejeitado no cliente e servidor | ✅/🟡 | cliente ✅ (`validation.js`), servidor pronto |
| Mesmo CPF com/sem máscara → mesma conta | ✅ | hash idêntico (`npm test`) |
| CPF duplicado em concorrência → 1 vínculo, sem transferir perfil | 🟡 | `concluir_cadastro_jogador` (unique + checagem) |
| Idade 6/7/17/18/19/20 e data inválida | 🟡 | 7–19 no cadastro; login não some aos 20 |
| Jogador sem evento/mídia conclui perfil | 🟡 | não cria inscrição/alocação |
| Auth criado, perfil incompleto, volta e conclui (sem seed) | 🟡 | `fluxo=completar` retomável |
| 2º jogador não vê contatos do 1º | 🟡 | RLS de `athlete_contacts` |
| Olheiro pendente→aguardo; aprovado→painel | 🟡 | `aguardando.html` + `exigirAprovado` |
| Academia pública não promove; admin por SQL entra | 🟡 | `handle_new_user` clamp + bootstrap |
| Papel gestora/suporte injetado no signup/metadata | 🟡 | trigger só aceita atleta/olheiro |
| Aba Academia com conta jogador não dá acesso | 🟡 | papel real do banco prevalece |
| GET dos HTML protegidos sem dado secreto; JS redireciona | 🟡 | guards + APIs protegidas |
| Alterar localStorage/challenge id não concede papel | 🟡 | autorização é server-side |
| Google por clique/Enter → indisponível, sem sessão | ✅ | `login.js` botão inerte |
| XSS em nome/empresa/cidade → texto, não script | 🟡 | `esc()` na renderização nova |
| Build/deploy preview: config pública, callback, guards, sem segredo no dist | 🟡 | `gerar-config` + `build-dist` |

## 6. Bloqueios remanescentes (reais)

1. **Aplicar os SQLs** (só você pode, pela regra combinada).
2. **`RESEND_API_KEY`/SMTP + remetente verificado** — sem isso o código não sai.
3. **Segredos na Vercel** (`SERVICE_ROLE`, HMAC, encryption).
4. **Deploy preview** para exercitar as rotas Node (não dá para testar `/api` só
   servindo HTML estático).

**Pronto para MVP** quando, após 1–4, as três personas conseguirem: criar conta,
confirmar, entrar com senha + código, concluir cadastro, sair e reentrar — com o
teste de bypass da seção 4 negando acesso sem código. Até lá, o estado é
“código pronto, aguardando aplicação/segredos”, não produção funcional.

## 7. Recuperar acesso / admin / exclusão

- **Admin:** `02-bootstrap-admin.sql` (só promove conta existente e confirmada).
- **Aprovar profissional:** `03-aprovar-profissional.sql`.
- **Excluir conta:** `on delete cascade` em `profiles`/`athletes`/privadas cuida da
  cadeia; para apagar um usuário use o painel Auth (Supabase) — os dados
  relacionados caem por cascade. Não criei endpoint destrutivo (fora do escopo).

## 8. Fora de escopo (mantido intacto, sem ativar)

Assinaturas/premium, mapa de calor/PostGIS, alocação geográfica, score/ranking,
gestão completa de eventos, chat, uploads, SMS, pagamento. As telas ricas seguem
como **demonstração** (`?demo=1`), rotuladas, sem se passar pelos dados da conta.
O mapa novo da `main` não foi conectado a tabelas.
