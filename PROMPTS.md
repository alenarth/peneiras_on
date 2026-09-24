# Uso de IA generativa — Peneiras On

**Projeto:** Peneiras On · Challenge Pelé Academia
**Disciplinas:** Front-End Design (FED) e Web Development (WD)
**Sprint:** 3 — MVP Visual · 2º semestre de 2026
**Responsável pelo front-end:** Arthur Alen Amorelli Pereira — RM 571897

---

## Ferramentas

| Ferramenta | Papel |
|---|---|
| Claude (chat) | Auditoria do código, diagnóstico de bugs e redação dos prompts |
| Claude Code | Execução das alterações no repositório, a partir desses prompts |

## Método

Cada rodada seguiu o mesmo ciclo: **auditoria** do estado do projeto, **prompt escrito** com
escopo fechado, restrições e critérios de verificação, **execução** pelo Claude Code no
repositório local e **conferência manual** no navegador antes de cada commit. Nenhum commit foi
feito pela ferramenta. As decisões de produto entraram no prompt já tomadas pela equipe, e as
alegações da ferramenta (contraste, classes geradas, links) foram conferidas de forma independente.

## Rodadas

| # | Rodada | Objetivo | O que foi entregue |
|---|---|---|---|
| 1 | Correção de erros | Estabilizar a base herdada da Sprint 2 | Correção dos 31 itens da auditoria: bugs funcionais, dados inconsistentes, estrutura e acessibilidade. |
| 2 | Pós-verificação | Fechar resíduos e validar no navegador | Ajustes finais e percurso completo das páginas em três larguras, por teclado e com movimento reduzido. |
| 3 | Ajustes de interface | Acabamento visual e navegação | Cantos por token, hover por variante de botão, nova barra de navegação, rolagem animada e scrollspy. |
| 4 | Área pública e área logada | Tirar os fluxos públicos de dentro da área do atleta | Calendário e cadastro viraram páginas públicas, com o contexto do evento mantido em todo o funil. |
| 5 | Varredura final | Limpar a base antes da migração de stack | Rótulos de formulário, título de página faltante, links sem destino e código morto corrigidos. |
| 6 | Migração para Tailwind (FED) | Reescrever o estilo em Tailwind CSS v4 com o design system como tokens | CSS antigo substituído por tema, componentes e um CSS residual justificado, com build via npm. |
| 7 | Interatividade (WD) | Feed com interações sociais, filtros dinâmicos e validação de formulários | Feed de destaques com tags, votos, seguir, filtros e persistência, validação nos formulários e toasts, em módulos separados. |
| 8 | Fechamento documental | Cobrir no repositório os itens de entrega do enunciado | Identificação e tabela de contribuições no README, correção deste documento e remoção de um arquivo órfão. |
| 9 | Identidade visual e paleta escura | Aplicar a marca oficial e revisar o que o tema escuro quebrou | Logo vetorizado, favicons e metadados de compartilhamento, e correção de elementos invisíveis e de contraste na paleta. |
| 10 | Carrossel do hero | Usar as duas novas artes na landing | Carrossel de fundo com três imagens e redução da escala dos títulos no site. |
| 11 | Ritmo, cantos, translucidez e animações | Sete ajustes de acabamento pedidos pelo time | Hero mais leve e rápido, correção de hover no cadastro, animações, painéis translúcidos e cantos mais arredondados. |
| 12 | Mapa interativo em Peneiras | Levar o protótipo de mapa do João para a página pública | Mapa do Brasil sincronizado com filtros e lista, com seis peneiras futuras acrescentadas aos dados de exemplo. |
| 13 | Acabamento geral | Treze ajustes levantados pelo time navegando o site | Hero reorganizado, movimento nas fotos, inscrição a partir da peneira, botões pareados, ícones sociais e página Sobre simplificada. |
| 14 | Responsividade e carrossel | Corrigir o hero quebrado no celular e o slideshow lento | Correção do hero, do header e das grades em larguras intermediárias, validada em cinco larguras. |
| 15 | Login, separadores e animações | Três ajustes finos de revisão | Formulário de login alinhado, novos rótulos de seção, travessões trocados nos textos e animações mais lentas. |
| 16 | Mapa de calor da gestora | Aproximar o mapa da gestão do mapa público | Mapa de calor sobre a malha real dos estados, com faixas de demanda, legenda, filtros e cobertura. |
| 17 | Fechamento da entrega | Resolver pendências da revisão final | Arquivo de configuração do Tailwind ligado ao build (CSS compilado conferido idêntico), manual de interatividade completo e este documento condensado. |

## Autoria

A IA foi usada em **auditoria e execução**. Arquitetura de informação, escopo de cada rodada e
critérios de aceite foram decididos pela equipe antes de cada prompt. O design system da Sprint 1
é a base do projeto; as mudanças posteriores (paleta escura, cantos, escala tipográfica) foram
pedidas pelo time e estão nas rodadas 9 a 11. Todo commit foi feito manualmente, após conferência
no navegador.
