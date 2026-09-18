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

**Objetivo:** atender aos requisitos de Web Development — feed com interações, filtros dinâmicos e validação de formulários.

**Pedido:** implementação de feed com confirmação de tags de atributos, contadores de votos e ação de seguir; filtros por posição e região em tempo real, sem recarregamento; validação de formulários com mensagens de erro associadas aos campos; sistema de notificações (toasts); e reorganização do JavaScript em módulos funcionais (`ui.js`, `feed.js`, `validation.js`).

---

## Observações sobre a autoria

O uso de IA neste projeto concentrou-se em **execução e auditoria**, não em concepção.

As decisões de produto — arquitetura de informação, separação entre área pública e logada, composição da navegação, escopo de cada entrega e critérios de aceite — foram tomadas pela equipe e entraram nos prompts já resolvidas. Em várias rodadas, instruções explícitas foram incluídas para impedir que a ferramenta decidisse sozinha em pontos sensíveis.

O design system (paleta, tipografia, grid e componentes) é da Sprint 1 e foi tratado como imutável em todos os prompts.

Todo commit no repositório foi feito manualmente após revisão. Nenhuma alteração entrou no histórico sem conferência no navegador.
