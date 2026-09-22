# Peneiras On — Front-end (HTML + Tailwind CSS + JS vanilla)

## Identificação

**Projeto:** Peneiras On — Challenge Pelé Academia · FIAP · Engenharia de Software · 1º ano ·
Semi-presencial Rio de Janeiro · Sprint 3 · 2º semestre de 2026

**Disciplinas desta entrega:** Front-End Design (FED) e Web Development (WD)

**Integrantes:**

- Arthur Alen Amorelli Pereira — RM 571897
- Caio Viana de Faria — RM 570634
- [NOME COMPLETO DO INTEGRANTE 3] — RM [RM]
- [NOME COMPLETO DO INTEGRANTE 4] — RM [RM]
- [NOME COMPLETO DO INTEGRANTE 5] — RM [RM]

**Deploy:** [https://peneirason.vercel.app](https://peneirason.vercel.app)

**Protótipo / Figma:** este projeto não tem Figma. O enunciado define o entregável-âncora da
Sprint 3 como "protótipo navegável (ex.: Figma interativo) **ou** interface implementada" — esta
equipe optou pela segunda forma. O MVP visual é a aplicação acima, implementada e publicada; não
há protótipo em Figma associado.

Plataforma de captação de talentos — protótipo de front-end multi-página.
**HTML5 + Tailwind CSS v4 + JavaScript (ES2017) vanilla**, sem framework de UI. A única
dependência é o Tailwind (e seu CLI), usado no passo de build do CSS.

## Como rodar

```bash
npm install          # instala o Tailwind CSS v4 e o @tailwindcss/cli (devDependencies)
npm run dev          # compila assets/css/input.css → assets/css/tailwind.css e fica observando
```

Com o `dev` rodando, sirva a pasta por um servidor estático e abra `http://localhost:8000`:

```bash
python3 -m http.server 8000
```

Build de produção (CSS minificado) e pasta de deploy:

```bash
npm run build        # assets/css/tailwind.css minificado
npm run build:site   # build + monta dist/ (páginas + assets) — é o que a Vercel roda
```

`assets/css/tailwind.css` e `dist/` são artefatos de build e ficam fora do git.

## Páginas

| Arquivo | Descrição | Parâmetros de URL |
|---|---|---|
| `index.html` | Landing pública (hero, planos, FAQ) | — |
| `sobre.html` | Institucional (parceria Pelé Academia + FIAP, equipe, contato) | — |
| `peneiras.html` | Calendário público da temporada: mapa interativo do Brasil (número de peneiras abertas por estado; clique filtra a lista), filtros por status e estado, CTA para login | `?uf=<UF>` (chega com o estado já escolhido no mapa e na lista) |
| `feed.html` | Feed de destaques: confirmação de tags de atributo, votos, seguir, filtros por posição e estado | — |
| `cadastro.html` | Criar perfil — wizard público de 5 passos | `?evento=<id>` (contexto vindo de `login.html`; id inválido cai no cadastro normal) |
| `privacidade.html` | Política de Privacidade (LGPD/ECA) | — |
| `login.html` | Login (3 perfis) | `?tipo=jogador\|olheiro\|academia` · `?evento=<id>` (contexto vindo de `peneiras.html`; id inválido cai no login normal) |
| `recuperar.html` | Recuperação de senha (4 passos) | — |
| `atleta.html` | Área do atleta | `?tela=status\|perfil\|peneiras` (`?tela=cadastro` redireciona para `cadastro.html`) |
| `olheiro.html` | Painel do olheiro | `?tela=lista\|checkin\|avaliacao` · `?tela=perfil&id=<id>` |
| `gestora.html` | Painel da gestão | `?tela=dashboard\|mapa\|pipeline\|eventos` |

O wizard de cadastro é público (`cadastro.html`), alcançado pelos CTAs "Quero me inscrever";
o link antigo `atleta.html?tela=cadastro` redireciona para lá preservando `?evento=`. O perfil
do olheiro é aberto pela lista de inscritos, que passa o `id` do atleta. Um `?tela=` desconhecido
cai na tela padrão da persona.

## Estrutura

```
index.html, sobre.html, …        → páginas (markup)
favicon.ico, site.webmanifest    → ícone legado (16/32/48) e manifesto PWA, copiados para dist/
assets/
  brand/                         → identidade visual, vetorizada da arte oficial (2 cores, 3–6 KB cada)
    logo.svg                     → símbolo + wordmark empilhados (og-image, materiais)
    logo-horizontal.svg          → lockup do header, rodapé e painéis (via wordmarkHTML())
    logo-mark.svg / logo-wordmark.svg → símbolo e wordmark isolados
    favicon.svg, icon-192/512.png, apple-touch-icon.png, og-image.png
  pele-hero.webp / .jpg,
  hero-gol.*, hero-app.*         → imagens de fundo do carrossel do hero (WebP + fallback JPEG)
  css/input.css                  → entrada do Tailwind: @theme (tokens) + base + componentes (@apply)
  css/residual.css               → CSS autoral residual, justificado bloco a bloco (ver abaixo)
  css/tailwind.css               → SAÍDA compilada (gerada pelo build, fora do git)
  js/
    data.js                      → dados mockados (atletas, eventos, regiões)
    ui.js                        → camada de interface genérica: toasts, announce() (aria-live),
                                   helpers de DOM, localStorage defensivo, revelação por rolagem
                                   ([data-reveal]) e números que contam ([data-countup]) — carregado antes dos demais
    components.js                → header, footer, dropdown, helpers de markup (tagHTML, statHTML…)
    hero.js                      → carrossel de fundo do hero da landing (crossfade, indicadores,
                                   pausa em hover/foco/aba oculta, respeita prefers-reduced-motion)
    brazil-map.js                → malha SVG dos 27 estados (@svg-maps/brazil, MIT)
    mapa.js                      → mapa interativo de peneiras.html: cor e selo por estado a partir de
                                   MOCK.EVENTS, tooltip, teclado, seleção sincronizada com o filtro
    feed.js                      → feed: cards, tags de atributo, votos, seguir, filtros, persistência
    validation.js                → regras de validação e renderização de erro dos formulários
    radar.js                     → radar tático (SVG) + classificador de posição
    privacidade.js               → conteúdo da política
    login.js, recuperar.js       → lógica das telas de acesso
    atleta.js, olheiro.js,
    gestora.js                   → lógica de cada persona
```

## Manual de Interatividade

Todo o comportamento é **JavaScript vanilla com manipulação direta do DOM** — sem framework,
sem runtime além do navegador. Os módulos são carregados por `<script>` na ordem
`data.js → ui.js → components.js → (módulo da tela)`. Quem controla o quê:

| Tela | Funcionalidade | Arquivo(s) |
|---|---|---|
| Todas | Header público (nav, hambúrguer, menu "Entrar", scrollspy, sombra ao rolar), rodapé, card de peneira, contagem regressiva | `components.js` |
| Todas | Toasts de sucesso/erro/informação, região `aria-live` (`announce()`), helpers de DOM, `localStorage` com try/catch | `ui.js` |
| `feed.html` | Mural de destaques a partir de `MOCK.ATHLETES`; **confirmação de tags de atributo** (`aria-pressed` + contador), **votos** (um por pessoa, votar de novo desfaz), **seguir** (contador de seguidores); **filtros em tempo real** por posição e estado, combináveis, com contador e estado vazio; persistência em `localStorage` (`peneiras-on.feed.v1`) e botão "Zerar interações" | `feed.js` (usa `ui.js` para toast/announce/storage) |
| `atleta.html?tela=perfil` | Bloco "Comunidade": as mesmas tags confirmáveis e o botão seguir do feed, reaproveitando `Feed.attrTagsHTML`, `Feed.followButtonHTML` e `Feed.bind` | `feed.js` + `atleta.js` |
| `atleta.html` | Status (contagem regressiva), perfil (radar tático), minhas peneiras (filtros, inscrição) | `atleta.js`, `radar.js` |
| `cadastro.html` | Wizard de 5 passos, score de completude ao vivo; **validação** por passo (nome, idade 07–19, CPF com 11 dígitos, cidade, posição/pé, responsável e termo para menores) com erro no blur ou na tentativa de avançar e foco no primeiro campo inválido; toast na conclusão | `cadastro.js` + `validation.js` |
| `login.html` | Perfis por `?tipo=`; **validação** (jogador: CPF ou e-mail; olheiro/academia: e-mail; senha obrigatória) bloqueando o envio até corrigir; com `?evento=` (quem veio do botão de uma peneira) explica que a inscrição exige conta e oferece o cadastro | `login.js` + `validation.js` |
| `recuperar.html` | 4 passos; **validação** de CPF/e-mail, código de 6 dígitos e confirmação de senha coincidente; toast ao enviar código e ao salvar | `recuperar.js` + `validation.js` |
| `peneiras.html` | Calendário com filtros por status/estado, destaque com contagem regressiva | `peneiras.js` |
| `olheiro.html` | Lista com busca/filtros (anúncio com debounce), favoritar (toast), check-in, avaliação (nota, decisão, toast) | `olheiro.js`, `radar.js` |
| `gestora.html` | Dashboard, mapa de calor (filtros, bolhas escaladas pelo container), pipeline, eventos | `gestora.js` |
| `privacidade.html` | Sumário com rolagem e foco, conteúdo da política | `privacidade.js` |

**Padrões de acessibilidade das interações:** estado de alternância em `aria-pressed`;
contadores com texto para leitor de tela (`sr-only`); toasts em região `aria-live="polite"`
(erros com `role="alert"`), sem roubar foco e com botão de fechar; mensagens de validação
ligadas ao campo por `aria-describedby` + `aria-invalid="true"` e `role="alert"`; filtros
anunciados por `announce()`; nada de animação sob `prefers-reduced-motion`.

## Tecnologia / decisões

- **Sem framework de UI.** Telas geradas por funções JS que retornam HTML (template strings) e injetam no DOM.
  Código modular por responsabilidade: `ui.js` (interface genérica), `feed.js` (feed e interações
  sociais), `validation.js` (formulários), `components.js` (markup compartilhado) e um arquivo por tela.
- **Tailwind CSS v4** com `@tailwindcss/cli`. O tema é configurado em CSS, no bloco `@theme` de
  `assets/css/input.css` (forma prevista para a v4, equivalente ao `tailwind.config.js` da v3).
- **Design system da Sprint 1 como tokens do Tailwind** — os 27 tokens do antigo `:root` viraram
  `--color-*` (23 cores, incluindo as 4 de hover), `--font-*` (Archivo, Inter, JetBrains Mono),
  `--radius` (4px) e `--breakpoint-*` (560px e 900px, os dois pontos de quebra do projeto). Além
  deles: escala tipográfica em px (`text-10` … `text-72` + tamanhos fluidos `text-fluid-*`),
  alturas de linha (`leading-display*`, `leading-copy*`), espaçamento entre letras
  (`tracking-label`, `tracking-kicker`, `tracking-display*`), larguras máximas (`max-w-narrow`,
  `max-w-copy`…) e sombras. Os valores são idênticos aos da Sprint 1.
- **Componentização com `@apply`.** Os padrões que se repetem em 10 páginas e 11 arquivos JS
  (`.btn` e variantes, `.card`, `.tag`, `.input`/`.select`/`.textarea`, `.field`, `.progress`,
  `.stat`, `.table`, `.site-header`, `.site-footer`, `.entrar`, `.nav-item`, `.kicker`,
  `.skip-link`, as grades `.g-*`…) são classes de componente em `@layer components`, escritas com
  `@apply` sobre os tokens. Os nomes foram preservados porque o JS os referencia
  (`classList`, `querySelector`). O que é pontual usa utilitárias direto no markup; estilos
  calculados em tempo de execução (largura de barra em %, geometria do mapa, cores de posição
  vindas de `data.js`) continuam como `style` inline — são 14 ocorrências, todas dinâmicas.
- **Detecção de classes.** O Tailwind só gera o que encontra literalmente no código-fonte, por
  isso toda classe aparece completa no HTML/JS; estados condicionais usam ternários com os dois
  nomes inteiros (`${on ? 'bg-accent' : 'bg-ink'}`), nunca concatenação de prefixo.
- **Contraste e foco preservados.** Os tokens semânticos `--color-accent-text` (#177038) e
  `--color-gold-deep` (#7E660E) existem porque verde e dourado não passam AA como texto sobre
  fundo claro; seguem usados nos mesmos lugares (`.accent`, `.gold`, `.plan__check`,
  `.rights__n`…). O anel de foco de 3px continua em `outline` (nunca removido sem substituto),
  com o raio do componente.

### CSS autoral residual (`assets/css/residual.css`)

Tudo o que não faz sentido como utilitária, com o motivo de cada bloco:

1. **Radar de atributos** (`.radar-*`) — SVG desenhado por `radar.js`; usa `fill`/`stroke` e
   tipografia própria dentro do `<svg>`, sem utilitária equivalente.
2. **Imagem de fundo do Pelé** (`.pele-bg`) — `image-set()` com WebP e fallback JPEG.
3. **Scrims e gradientes decorativos** (`.hero__scrim`, `.login-side__scrim`, `.manifesto__scrim`,
   `.parceria__scrim`, `.glow-*`, `.map-grid`, `.qr-pattern`, `.player-img`) — gradientes de
   várias paradas; como valor arbitrário virariam classes de 100+ caracteres, ilegíveis.
4. **Marquee da landing** — `@keyframes` próprio (o Tailwind só traz spin/ping/pulse/bounce).
5. **Funil do pipeline e mapa de calor** — clip-path e posição/raio de cada estado são calculados
   pelo JS a partir dos dados (estilo inline dinâmico); no CSS fica só a moldura estática.
6. **Cadastro** — `scroll-padding` e `min-height` do `<main>` dependem de custom properties
   medidas em JS (`--header-h`, `--cad-head-h`) e de `html:has()`.

Tamanho do CSS: antes `styles.css` 37,7 KB (9,6 KB gzip); depois `tailwind.css` compilado e
minificado 86 KB (13,4 KB gzip) — o Tailwind emite cada componente já expandido e registra as
`@property` das utilitárias; o `residual.css` tem 5,9 KB.
- **Navegação** por links reais (`<a href>`) e parâmetros de URL — recarrega como site tradicional.
- **Responsivo** com os breakpoints do tema, `md` = 900px e `sm` = 560px, usados como
  `max-md:`/`max-sm:` nas classes de componente e no markup; as grades `.g-*` colapsam nesses
  pontos (`.g-3` → 2 colunas ≤900px → 1 coluna ≤560px).
- Fontes: Archivo (display), Inter (corpo), JetBrains Mono (rótulos) via Google Fonts.

## Identidade visual e paleta

A marca (símbolo "P" com bola + wordmark PENEIRAS-ON) está em `assets/brand/`, vetorizada a
partir da arte oficial em duas cores — `--color-ink` e `--color-accent` — para não pesar: o
lockup do header tem 6 KB e é uma única requisição cacheada para o site inteiro. O `<head>` de
cada página declara favicon (SVG + `.ico`), `apple-touch-icon`, manifesto, `theme-color`,
`description` e Open Graph (`og-image.png`, 1200×630). Nos painéis internos
(`atleta`, `olheiro`, `gestora`) há `robots: noindex`.

Tema escuro único (`color-scheme: dark`), com laranja como cor de marca. Cantos: 8px no que
se clica e preenche (`--radius`), 12px em cards, vidro e menus, 6px em tags e avatares. Barras
fixas (header, cabeçalho e rodapé do cadastro), menu "Entrar", toasts e o painel do login são
translúcidos (`bg-*/85–92` + `backdrop-blur`). Movimento: entrada em cascata do hero e do login,
revelação por rolagem, hover com elevação/escala em botões, cards, planos e tags, sublinhado
animado na navegação e FAQ com "+" que gira — tudo desligado sob `prefers-reduced-motion`.

- Fundo `#111417` (`--bg`) · superfície `#151A1F` · cards `#20252D` · linhas `#374151`
- Texto `#F8FAFC` (`--ink`) · secundário `#CBD5E1` · auxiliar `#A3ADBA`
- Laranja `#F97316` (`--accent`, fundo com texto `#120E0B`) · `#FB923C` (`--accent-text`, texto)
- Dourado `#FB923C` / `#FBBF24` (`--gold` / `--gold-deep`, legado Pelé e plano Premium)
- Erro `#F87171` · Sucesso `#22C55E` · Foco `#FBBF24`

> **Uso e contraste (WCAG 2.1 AA).** Na paleta escura, `bg` é sempre a superfície e `ink` o
> texto: texto claro com transparência é `text-ink/NN`, borda clara é `border-ink/NN`, e o
> preenchimento neutro "cheio" (barra, ponto de linha do tempo, toggle selecionado, botão
> primário) é `bg-ink` com `text-bg`. Razões medidas: `--ink` 17:1 sobre `--bg`;
> `--ink-soft` 10,4:1 e `--ink-mute` 6,8:1 sobre `--card`; `--accent-text` 6,4:1;
> `--gold-deep` 9,6:1; `--danger` 5,6:1; `--success` 6,8:1. Erro é vermelho, não laranja —
> laranja é CTA e destaque e não pode significar "problema" ao mesmo tempo. Hierarquia dos
> botões: `--accent` (laranja) > `--primary` (claro) > `--ghost` (card com borda). Hover, todos
> AA com o texto que carregam: `--color-ink-hover` #E2E8F0 (14:1), `--color-accent-hover`
> #EA580C (6,5:1), `--color-gold-hover` #F59E0B (9,6:1), `--color-danger-hover` #EF4444 (5,9:1).
> As cores de posição do radar (`POS_COLORS`, em `data.js`) são sete matizes distintas — uma
> paleta categórica, não a paleta de interface.

## Deploy (Vercel)

`vercel.json` define `installCommand: npm install`, `buildCommand: npm run build:site` e
`outputDirectory: dist`. A cada push na `main` a Vercel instala o Tailwind, compila o CSS e
publica só `dist/` (páginas + assets, sem `node_modules` nem os fontes do CSS).

## Equipe e contribuições

| Integrante | RM | Branch(es) | Pull Request(s) | Telas/Componentes entregues |
|---|---|---|---|---|
| Arthur Alen Amorelli Pereira | 571897 | arthur | [PR] | Migração completa para Tailwind CSS v4 (tema em `@theme`, componentização com `@apply`, `residual.css` justificado bloco a bloco, build npm e configuração de deploy na Vercel); páginas públicas `peneiras.html`, `cadastro.html` e `feed.html`; módulos `ui.js` (toasts, `announce()`, storage defensivo), `feed.js` (tags de atributo, votos, seguir, filtros, persistência) e `validation.js` (validação de formulários, incluindo o login); auditoria de acessibilidade WCAG 2.1 AA |
| Caio Viana de Faria | 570634 | caio | [PR] | Mudança na paleta de cores do site (tema escuro + laranja). |
| [NOME COMPLETO DO INTEGRANTE 3] | [RM] | [branch] | [PR] | [a preencher] |
| [NOME COMPLETO DO INTEGRANTE 4] | [RM] | [branch] | [PR] | [a preencher] |
| [NOME COMPLETO DO INTEGRANTE 5] | [RM] | [branch] | [PR] | [a preencher] |

---
FIAP — Engenharia de Software — Semi-Presencial RJ · 2026
