# Contrato de dados — Inscrição do jogador (Fase 1)

Formato combinado entre o **site** (`assets/js/envio.js`), a **planilha** (Apps Script,
aba `Inscricoes`) e o **CLI em Python** (`python/`). Mudou uma coluna aqui → muda nos três.

Fluxo: `cadastro.html` → `fetch` → Apps Script (`doPost`) → aba `Inscricoes` → equipe baixa
o CSV → `python/` processa e mostra no terminal. Nesta fase o resultado **não volta** para o site.

## Aba `Inscricoes` — uma linha por inscrição, colunas nesta ordem

| # | Coluna | Origem no site (`form`) | Formato | Obrigatório |
|---|---|---|---|---|
| 1 | `data_envio` | gerado pelo Apps Script | `AAAA-MM-DD HH:MM:SS` (horário de Brasília) | sim |
| 2 | `codigo` | gerado pelo site (`crypto.randomUUID`) | UUID — identifica a inscrição sem expor o CPF | sim |
| 3 | `nome` | `name` | texto | sim |
| 4 | `nascimento` | `dob` | `AAAA-MM-DD` | sim |
| 5 | `cpf` | `cpf` | 11 dígitos, só números | sim |
| 6 | `uf` | `state` | sigla (ex.: `RJ`) | sim |
| 7 | `cidade` | `city` | texto | sim |
| 8 | `posicao` | `position` | Goleiro, Zagueiro, Lateral, Volante, Meia, Ponta, Atacante | sim |
| 9 | `pe` | `foot` | Direito, Esquerdo, Ambidestro | sim |
| 10 | `altura` | `height` | cm, número | não |
| 11 | `peso` | `weight` | kg, número | não |
| 12 | `clube` | `club` | texto | não |
| 13 | `anos_pratica` | `years` | número inteiro | não |
| 14 | `video` | `videos` | link ou @ do Instagram | não |
| 15 | `foto` | `photo` | `S` / `N` | não |
| 16 | `responsavel` | `responsible` | texto (só menor de 18) | condicional |
| 17 | `tel_responsavel` | `responsiblePhone` | texto (só menor de 18) | condicional |
| 18 | `aceite_termo` | `consent` | `S` / `N` (só menor de 18) | condicional |
| 19 | `evento` | `?evento=` da URL | id da peneira (ex.: `e-06`) ou vazio | não |

Os nomes das colunas seguem as chaves do dicionário `atleta` da Sprint 3 (`nome`, `cpf`, `uf`,
`anos_pratica`, `aceite_termo`…), para o Python montar a lista de dicionários sem tradução.

## Regras

- O site valida antes de enviar (`validation.js`). O **Python valida de novo** — a planilha
  recebe dado de qualquer um que achar a URL, então nada que vem dela é confiável.
- Valor que começa com `=`, `+`, `-` ou `@` é gravado com `'` na frente (proteção contra
  injeção de fórmula na planilha). O Python remove esse `'` ao ler.
- Texto cortado em 200 caracteres.

## Fora desta fase

- **Atributos de habilidade (8):** não são coletados no cadastro — no site e na Sprint 3 eles
  vêm depois, da avaliação do olheiro. Entram quando o perfil olheiro for feito.
- Olheiro e academia.
- Devolver o resultado processado ao site (`doGet` por `codigo`).

## Pendências de decisão

- Escala dos atributos: site usa **0–20**, Sprint 3 usa **0–100**.
- Peso do vídeo no score de completude: site **18**, Sprint 3 **25**.
