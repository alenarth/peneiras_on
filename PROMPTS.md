# Uso de IA generativa — Peneiras On

**Projeto:** Peneiras On · Challenge Pelé Academia
**Disciplinas:** Front-End Design (FED) e Web Development (WD)
**Sprint:** 3 — MVP Visual · 2º semestre de 2026
**Responsável pelo front-end:** Arthur Alen Amorelli Pereira — RM 571897

---

## Ferramentas utilizadas

| Ferramenta | Papel no processo |
|---|---|
| Claude (chat) | Auditoria do código, diagnóstico de bugs e redação dos prompts de execução |
| Claude Code | Execução das alterações no repositório, a partir dos prompts redigidos |

## Método adotado

O uso de IA neste projeto seguiu um ciclo fixo, deliberadamente dividido em duas etapas para não entregar decisões de produto à ferramenta:

1. **Auditoria.** O estado do projeto era analisado e os problemas levantados item a item, com o arquivo e a linha de cada ocorrência.
2. **Redação do prompt.** Cada rodada virava um prompt escrito, com escopo fechado, restrições explícitas e critérios de verificação.
3. **Execução.** O Claude Code aplicava as alterações no repositório local.
4. **Conferência manual.** O resultado era verificado no navegador antes de qualquer commit.

Três regras foram mantidas em todos os prompts:

- **Nenhum commit automático.** Todo commit foi feito manualmente, após revisão. Os prompts instruem explicitamente a não usar `git commit`, `git add`, `git push` ou comandos destrutivos.
- **Decisões de produto são do time.** Escolhas de arquitetura de informação, nomenclatura e escopo foram decididas antes do prompt, não durante a execução.
- **Verificação independente.** Alegações da ferramenta foram conferidas — razões de contraste foram recalculadas, classes CSS foram checadas no arquivo compilado, e links e âncoras foram validados por varredura.

---

## Rodadas da Sprint 3

### 1. Correção de erros, bugs e inconsistências

**Objetivo:** estabilizar a base herdada da Sprint 2 antes de qualquer evolução.

**Pedido:** varredura e correção de 31 itens levantados na auditoria, organizados em três blocos — bugs funcionais, inconsistências de dados e conteúdo, e estrutura/acessibilidade/limpeza.

**Principais itens:** interpolação de valores de usuário em template string sem escape; `?tela=` inválido renderizando tela em branco; presença de check-in sorteada por `Math.random()` a cada recarga; cursor saltando para o fim do campo de busca a cada tecla; data "hoje" fixa no código; duas taxonomias de posição convivendo em `data.js`; números contraditórios entre a landing e os dados de origem; 57 `grid-template-columns` inline que nenhuma media query alcançava; imagem de fundo de 2,1 MB sem otimização.

**Restrições dadas:** não alterar o design system da Sprint 1; não introduzir dependência externa; não alterar conteúdo de texto; verificar cada item antes de corrigir e reportar os que não se confirmassem.

### 2. Pós-verificação

**Objetivo:** fechar resíduos e validar no navegador.

**Pedido:** conferência de fim de linha do repositório com criação de `.gitattributes`; debounce no anúncio da região `aria-live` da busca; remoção de CSS órfão; e percurso completo das páginas em três larguras, por teclado e com movimento reduzido ativado.

### 3. Ajustes de interface

**Objetivo:** acabamento visual e correção de navegação.

**Pedido:** arredondamento leve dos controles via token; estados de `hover` por variante de botão; reestruturação da barra de navegação; rolagem animada com `scroll-margin-top` e movimentação de foco para a seção; scrollspy com `IntersectionObserver`.

**Decisões tomadas pela equipe antes do prompt:** ordem e composição dos itens de navegação, escopo do arredondamento, e remoção da abertura do menu "Entrar" por `hover` em favor de clique — esta última corrigindo um vão de 6px que fazia o menu fechar quando o cursor descia até ele.

**Restrição relevante:** foi proibido o uso de `filter: brightness()` para os estados de hover, porque a variante primária é preto `#0E0E0F` e a alteração seria imperceptível; exigiu-se cor explícita por variante com razão de contraste declarada. Os quatro valores foram recalculados de forma independente antes do aceite.

### 4. Separação entre área pública e área logada

**Objetivo:** corrigir um problema de arquitetura de informação identificado na conferência manual.

**Contexto:** telas de fluxo público estavam hospedadas dentro do shell da área logada do atleta. Um visitante que clicasse em "Peneiras" ou em "Quero me inscrever" via o nome, a idade, a cidade e o plano de um atleta do mock no cabeçalho.

**Pedido:** criação de `peneiras.html` (calendário público) e `cadastro.html` (wizard de criação de perfil) como páginas públicas independentes, com extração do card de evento para função compartilhada, e propagação do parâmetro `?evento=` ao longo de todo o funil.

### 5. Varredura final

**Objetivo:** fechar a base antes da migração de stack.

**Pedido:** correção de campos de formulário sem rótulo associado, `<h1>` ausente em uma tela, links `href="#"` sem destino e remoção de código morto.

### 6. Migração para Tailwind CSS (Sprint 3 — FED)

**Objetivo:** atender ao requisito de reescrita da camada de estilo em Tailwind CSS com o design system declarado como tokens.

**Pedido:** adoção do Tailwind CSS v4 com configuração via bloco `@theme`; tradução dos 27 tokens do design system da Sprint 1 mantendo os valores idênticos; declaração dos breakpoints reais do projeto (560px, 900px, 1280px) em substituição aos padrões do framework; componentização dos padrões recorrentes com `@apply`; e configuração do build para o deploy.

**Restrições dadas:** proibição do CDN do Tailwind, por não atender à exigência de arquivo de entrada versionado e de instruções `npm install` / `npm run dev`; proibição de qualquer biblioteca de UI ou runtime JS adicional; manutenção da paleta e da tipografia sem alteração; e preservação obrigatória dos tokens semânticos de contraste, que existem por decisão de acessibilidade.

**Alerta técnico incluído no prompt:** o Tailwind detecta classes varrendo o código-fonte como texto, e este projeto monta a maior parte do markup em template string. Nomes de classe montados por concatenação não são detectados e desaparecem do CSS final. Foi exigida varredura por esse padrão.

**Resultado verificado:** `assets/css/styles.css` (690 linhas) foi substituído por `input.css` com o tema e os componentes, mais `residual.css` (86 linhas) contendo apenas o que não se expressa em utilitárias — desenho do radar de atributos, gradientes decorativos, animação do marquee, moldura do mapa de calor e o `image-set()` da imagem de fundo. Cada bloco residual está comentado com sua justificativa no próprio arquivo.

### 7. Camada de interatividade (Sprint 3 — WD)

**Objetivo:** atender aos requisitos de Web Development — feed com interações sociais, filtros dinâmicos e validação de formulários.

**Pedido:** feed público (`feed.html`) com confirmação de tags de atributo por atleta, voto único por pessoa (votar de novo desfaz) e ação de seguir, cada interação com seu próprio contador; filtros por posição e por estado, combináveis, aplicados em tempo real sobre os cards já montados, sem recarregar a página; validação de formulário nas telas de acesso e cadastro — incluindo `login.html`, que até então não validava nenhum campo — com a mensagem de erro associada ao campo (`aria-describedby` + `aria-invalid`), aparecendo só no blur ou na tentativa de envio, e foco no primeiro campo inválido quando o envio é bloqueado; sistema de toasts para os avisos de sucesso, erro e informação; reorganização do JavaScript em três módulos por responsabilidade — `ui.js` (camada de interface genérica), `feed.js` (feed e interações sociais) e `validation.js` (regras e renderização de erro); persistência das interações do feed em `localStorage`, sobrevivendo a F5.

**Resultado verificado:** `feed.js` guarda votos, tags confirmadas e follows num único objeto em `localStorage` (`peneiras-on.feed.v1`), com fallback para estado vazio se a chave estiver ausente ou corrompida; os contadores exibidos somam um valor-base determinístico, derivado dos dados do próprio atleta no mock, à interação da pessoa — nascem preenchidos, mas não dependem de `Math.random()`. `validation.js` expõe um contrato único (`Validation.bind`) reaproveitado por `login.js`, `cadastro.js` e `recuperar.js`, com regras como `email`, `cpf`, `emailOrCpf` (login e recuperação aceitam os dois no mesmo campo), `password`, `code6`, `match` e `ageRange`; `login.html` passou a bloquear o envio até CPF/e-mail e senha serem válidos. `ui.js` centraliza `toast()` (pilha fixa, `role="alert"` no erro e `role="status"` nos demais, pausa ao passar o mouse ou focar, sem animação sob `prefers-reduced-motion`) e `announce()` (região `aria-live` única, usada pelos filtros). Os módulos carregam na ordem `data.js → ui.js → components.js → módulo da tela`; o bloco de tags e o botão de seguir do feed são reaproveitados em `atleta.html?tela=perfil` a partir das funções exportadas por `Feed` (`attrTagsHTML`, `followButtonHTML`, `bind`).

### 8. Fechamento documental (Sprint 3)

**Objetivo:** completar, no repositório, os itens de entrega exigidos pelo enunciado que o código por si só não cobre, antes do prazo de 25/09.

**Pedido:** inclusão, no `README.md`, de um bloco de identificação (nome do projeto, disciplinas da entrega, integrantes com RM e link de deploy) logo abaixo do título; declaração explícita de que o MVP visual da equipe é a interface implementada e publicada, e não um protótipo em Figma; criação da tabela de contribuições exigida pelo enunciado, com a linha do responsável pelo front-end preenchida a partir do que consta no repositório e marcadores para os demais integrantes completarem branch e PR; reescrita da seção 7 deste documento, que descrevia o pedido antes daquela rodada ser executada, para refletir o que de fato foi implementado; e remoção de `about.html`, um stub de redirecionamento para `sobre.html` sem nenhuma referência em HTML, JS ou neste documento.

**Restrições dadas:** nenhum commit automático; `integrantes.txt` preservado intacto, porque cada integrante preenche o próprio dado; nenhuma alteração em código de aplicação, estilo ou build além da remoção do arquivo órfão.

### 9. Identidade visual e revisão da paleta escura

**Objetivo:** aplicar a marca oficial (símbolo + wordmark PENEIRAS-ON, entregue em três PNGs de 1440×720) sem pesar o site, e revisar o que ficou conflitante depois da troca para o tema escuro (rodadas `ajuste_paleta` e `fix_colorchange_issues`).

**Pedido:** transformar as artes em SVG e usá-las como logo do header, rodapé e painéis, favicon (que não existia) e imagem de compartilhamento; completar o `<head>` das páginas (título, description, theme-color, Open Graph, manifesto); e fazer uma revisão geral atrás de conflitos e bugs visuais causados pela inversão de cores.

**Resultado verificado:** os PNGs foram vetorizados por traçado de contorno (contourpy + simplificação Douglas-Peucker sobre o canal alfa, uma máscara por cor) em `assets/brand/` — 2,8 a 5,8 KB por arquivo, comparados lado a lado com o original. `wordmarkHTML()` passou a injetar `logo-horizontal.svg`; `favicon.svg` (símbolo sobre quadrado escuro, legível em aba clara e escura), `favicon.ico` (16/32/48), `apple-touch-icon.png`, `icon-192/512.png`, `og-image.png` e `site.webmanifest` foram gerados a partir dos vetores; `build-dist.mjs` copia os arquivos de raiz. Na revisão, o bloco de `!important` em `@layer utilities` (que remapeava `.text-bg`, `.border-bg`, `.bg-ink`, `.border-ink` e os botões) foi removido e cada uso corrigido na origem: `text-bg/NN` → `text-ink/NN` e `border-bg/NN` → `border-ink/NN` no markup e nos módulos; seções `bg-ink` → `bg-bg`; bordas de campos e menus em `--line`. Bugs que o remapeamento escondia: barras de progresso "encerrada", passos concluídos da recuperação de senha, pontos da linha do tempo, barras do funil e do gráfico da gestora e o check de consentimento eram escuros sobre fundo escuro (invisíveis); chevron dos `<select>` preto; `--danger` igual a `--accent` (erro de formulário e "demanda crítica" do mapa indistinguíveis do laranja de destaque); `POS_COLORS` com sete posições em quatro cores repetidas; `--ink-soft`/`--ink-mute` quase iguais a `--ink` (hierarquia tipográfica perdida); texto claro sobre o ponto laranja do mapa; menu "Entrar" saindo da tela no celular. Ajustes: erro em vermelho `#F87171`, secundário `#CBD5E1` e auxiliar `#A3ADBA` (contrastes recalculados e anotados no `input.css`), botão primário claro para restabelecer a hierarquia laranja > claro > fantasma, `color-scheme: dark` para os controles nativos. Cada página foi capturada em 1440 px e em 390 px (emulação móvel via DevTools Protocol) antes e depois, incluindo estados abertos (menu, dropdown, erro de validação).

**Restrições dadas:** nenhum commit automático; nome "Peneiras On" mantido nos textos (o hífen é tratamento visual da marca); design system da Sprint 1 preservado em tokens, tipografia e componentes — só a paleta mudou.

### 10. Carrossel de imagens no hero da landing

**Objetivo:** usar as duas novas artes (atleta comemorando sob o Pelé; atleta mostrando o app na comunidade) ao lado do banner existente, em slideshow.

**Pedido:** adicionar as imagens à página principal no mesmo padrão do banner atual, como carrossel.

**Resultado verificado:** as artes (PNG de ~2 MB cada) foram exportadas em WebP + JPEG progressivo no mesmo tamanho e peso do `pele-hero` (104–123 KB em WebP) e entram como `.hero-gol-bg` / `.hero-app-bg` no `residual.css`, junto do `.pele-bg`. O hero passou a ter três `.hero__slide` empilhados com crossfade de 1 s (nada desliza: o título por cima não pode se mover) e indicadores gerados por `assets/js/hero.js` — avanço a cada 7 s, pausa com o mouse sobre o hero, com foco nos indicadores ou com a aba oculta, setas ← → entre os pontos e, sob `prefers-reduced-motion`, sem avanço automático nem transição. Os slides são decorativos (`aria-hidden`); os indicadores são os únicos controles. Ajuste após revisão do time: intervalo de 7 s para 4,5 s; as duas artes novas levam `.hero__slide--dim` (brightness 0,5 + saturação 0,75) para não disputar com o título; e a escala de display foi reduzida em ~25% em todo o site (`--text-fluid-*`, `.h-hero`, `.h1`–`.h3`, `.h-panel`, preços, KPIs, marquee) com respiro vertical menor nas seções — o título em caixa alta estava engolindo a tela.

### 11. Ritmo, leveza, cantos, translucidez e animações

**Objetivo:** sete ajustes de acabamento pedidos pelo time após revisar no navegador.

**Pedido:** (1) troca de slides do hero ainda lenta; (2) o slideshow deixava o site pesado; (3) barra de completude do cadastro "dura"; (4) hovers do cadastro acendendo outro elemento junto; (5) animações em todas as páginas; (6) mais translucidez onde couber, como o bloco do login; (7) cantos menos quadrados.

**Resultado verificado:** (1) intervalo de 4,5 s para 3,2 s e crossfade de 1 s para 0,6 s. (2) O escurecimento das duas artes novas saiu do `filter` CSS (brightness + saturate sobre 1440×800 px por cima de `backdrop-blur` derrubava o frame rate) e foi assado nas próprias imagens no export, que também caíram para 1440 px de largura — 58 e 50 KB em WebP, metade do anterior; slide inativo sai do compositor via `visibility` depois do fade. (3) O bloco do score deixou de ser recriado a cada tecla: `paintScore()` muda só a largura da barra (transição de 600 ms com curva suave, partindo de onde estava mesmo ao trocar de passo) e o número conta do valor anterior até o novo. (4) Causa: `field()` embrulhava grupos de botões (posição, pé, foto, termo) em `<label>`, e o navegador associa o rótulo ao primeiro botão — passar o mouse em "Esquerdo" acendia o `:hover` de "Direito", e clicar na área vazia do rótulo disparava o primeiro botão; grupos agora são `<div role="group" aria-labelledby>`; varredura nos outros módulos não achou outro grupo dentro de `<label>`. (5) Em `ui.js`: revelação por rolagem (`[data-reveal]` marcado automaticamente nos blocos das seções públicas, escondido só quando `html.js-reveal` existe — sem JS nada some) e `[data-countup]` nos números do hero e do sobre; em CSS: entrada em cascata do hero e do login, fade do `<main>`, barras de progresso crescendo de zero, botões com elevação + escala, cards/planos/eventos que levantam, tags de atributo com "pop", sublinhado que cresce na navegação, FAQ com "+" girando e resposta que sobe, menu "Entrar" e nav mobile com pop-in, links do rodapé deslizando, marquee pausando no hover — tudo sob `motion-safe:` e zerado em `prefers-reduced-motion`. (6) Login: a foto e o scrim passaram a cobrir a grade inteira e o formulário virou painel de vidro (`bg-bg/78` + `backdrop-blur-xl`); header, cabeçalho/rodapé do cadastro, header do atleta, menu "Entrar" e toasts ficaram translúcidos com desfoque. (7) `--radius` 4 → 8 px; cards, vidro, planos (agora com respiro entre eles e a faixa "mais escolhido" arredondada), menus, tabelas da política, callouts, badges e fotos em 12 px; tags, avatares, abas e tags de atributo em 6 px; barras de progresso em pílula. De quebra, o ponto final em Archivo (um quadrado) não cai mais sozinho na linha seguinte nos títulos de feed e privacidade. Verificado página a página em 1440 px, com estados abertos e o cadastro preenchido até o passo 3; nas capturas as animações foram desligadas porque o headless não avança animações do compositor.

### 12. Mapa interativo do Brasil na página Peneiras

**Objetivo:** aproveitar o protótipo de mapa interativo feito pelo João (pasta `melhoriapeneirason`, branch `joao_mapa`: malha SVG dos 27 estados de `@svg-maps/brazil` + módulo `mapa-oportunidades.js` para a gestora) e levá-lo para a página pública de peneiras; acelerar mais o slideshow.

**Pedido:** na página Peneiras, além das informações, um mapa do Brasil interativo: ao clicar num estado aparecem as peneiras dele, com um número em cima de cada estado mostrando quantas estão abertas, sincronizado com o resto do sistema e com animações; apagar a pasta ao final.

**Resultado verificado:** `brazil-map.js` foi trazido como está (crédito no cabeçalho) e o módulo virou `mapa.js`, reescrito para a página pública: um `<path>` por estado; cor laranja com intensidade proporcional onde há inscrição aberta, cinza onde só há encerradas, apagado onde não há nada; selo com o número de abertas (claro com número escuro, legível sobre qualquer cor) e sigla; tooltip com nome, abertas e total (mouse e teclado); Tab/Enter/Espaço nos estados com peneira; `aria-pressed` no selecionado. A sincronização é por um único ponto (`setState` em `peneiras.js`): clicar no mapa, mudar o `<select>` de estado, "Limpar filtros" ou chegar por `?uf=RJ` movem juntos o mapa (estado aceso, demais esmaecidos), o painel lateral (lista das peneiras do estado com status, "Ver na lista" rola até o calendário) e a grade — e as contagens saem de `MOCK.EVENTS` pelas mesmas funções do calendário (`eventStatus`), então mapa e lista nunca divergem. Animações: estados entram em cascata quando o mapa aparece, selos dão "pop" e pulsam, hover levanta o estado com sombra, seleção acende com brilho, cards da lista entram em cascata a cada filtro. Dado: as cinco peneiras do mock já tinham passado no calendário real (todas "encerradas", contagem de abertas seria zero em todo o mapa), então foram semeadas seis peneiras futuras (out–dez/2026: Niterói, Salvador, BH, Fortaleza, Brasília, Porto Alegre); por derivarem de `EVENTS`, a landing passou a mostrar "11 em 10 estados", a próxima peneira e a contagem regressiva voltaram a rodar, e a tela do atleta deixou de ter "Rio · Caxias" chumbado (segue `SEASON.nextEvent`). Slideshow: 3,2 s → 2,4 s. A pasta `melhoriapeneirason` foi apagada. Ajuste após revisão: o mapa passou a ser o próprio hero da página (título, texto, KPIs e painel à esquerda; mapa à direita, primeiro no celular), e os títulos-hero das páginas internas (`--text-fluid-hero`) desceram para `clamp(34px, 5vw, 72px)`, um degrau abaixo do hero da landing.

### 13. Acabamento: hero, movimento, inscrição pela peneira e limpeza do institucional

**Objetivo:** treze ajustes levantados pelo time navegando o site.

**Resultado verificado:** (1) O hero virou `1fr / 420px` com os cards encostados à direita e mais respiro interno, deixando uma faixa de foto visível entre o título e eles. (2) Cada slide ganhou panorâmica lenta de 14 s (`hero-pan`, espelhada no slide do Pelé) e o crossfade subiu para 1,1 s, com a troca a cada 5,5 s — o movimento agora é contínuo em vez de um corte. (3) `[data-spotlight]` + `.spotlight`: um halo quente segue o cursor sobre as fotos do hero, do manifesto, da parceria e do login (uma escrita de `--mx/--my` por quadro; nada no toque nem sob `prefers-reduced-motion`). (4) O card da próxima peneira (landing) e o painel do mapa ganharam "Quero me inscrever", que leva a `login.html?tipo=jogador&evento=<id>`; **só** quem chega por esse caminho vê no login o aviso de que a inscrição exige conta, com link direto para o cadastro já com o evento. (5) "Bem-vindo de volta." voltou a uma linha só. (6) O manifesto ficou em blocos por ideia, com linha mais alta e letras/palavras mais soltas (`.manifesto__text`). (7) `.btn-row--even` virou um grid de colunas iguais (`auto-cols-fr`) — pares de botões agora têm a mesma largura no rodapé, no hero, no calendário, no cadastro, na área do atleta e no contato; conferido: 384/384, 181/181, 251/251 px. (8) As iniciais das redes viraram ícones SVG desenhados no próprio `components.js` (`SOCIAL_ICONS`), ainda não interativos porque não há perfis. (9) O "Pular para o conteúdo" continua — é exigência de acessibilidade (WCAG 2.4.1) e some da tela até receber Tab — mas agora aparece centralizado, com a cara de um botão laranja do site. (10) `sobre.html` perdeu missão/visão/valores e a linha do tempo; ficou o texto da parceria Pelé Academia + FIAP, a equipe sem função por pessoa (todos contribuíram) em cards de altura igual, a parceria e o contato. (11) Mais respiro entre "Voltar à home" e o CTA no cabeçalho simples. (12) Mais entrelinha e espaçamento no painel do mapa, nos kickers, nos rótulos de stat, nos planos e no FAQ. (13) `.section-label__title` (onde fica "Contagem regressiva") foi de 13 px para 18 px.

---

## Observações sobre a autoria

O uso de IA neste projeto concentrou-se em **execução e auditoria**, não em concepção.

As decisões de produto — arquitetura de informação, separação entre área pública e logada, composição da navegação, escopo de cada entrega e critérios de aceite — foram tomadas pela equipe e entraram nos prompts já resolvidas. Em várias rodadas, instruções explícitas foram incluídas para impedir que a ferramenta decidisse sozinha em pontos sensíveis.

O design system (paleta, tipografia, grid e componentes) é da Sprint 1 e foi tratado como imutável em todos os prompts.

Todo commit no repositório foi feito manualmente após revisão. Nenhuma alteração entrou no histórico sem conferência no navegador.
