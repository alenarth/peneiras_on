# Peneiras On — Back-office em Python (CTWP · Sprint 4)

**Projeto:** Peneiras On — Challenge Pelé Academia · FIAP · Engenharia de Software · 1º ano ·
Semi-presencial Rio de Janeiro · 2º semestre de 2026

**Disciplina:** Computational Thinking With Python (CTWP) — Sprint 4: MVP Concierge

**Integrantes:**

- Arthur Alen Amorelli Pereira — RM 571897
- Caio Viana de Faria — RM 570634
- Clara Diel Gama Secco — RM 571679
- Anna Júlia Elias Andrade — RM 573453
- João Thees Castro Santiago — RM 572829

**MVP (site):** [https://peneirason.vercel.app](https://peneirason.vercel.app)

---

## O que é

O Peneiras On organiza a inscrição de jovens em peneiras de futebol sem depender de contato
dentro do clube. Na Sprint 4, o script `backoffice.py` é o **back-office** do modelo concierge:
o jogador usa o site, a equipe leva os dados ao script, o script processa as regras de negócio
e a equipe devolve o resultado ao jogador.

```
jogador preenche cadastro.html
        │  envio.js (POST)
        ▼
Apps Script grava uma linha na planilha (aba Inscricoes)
        │  equipe: Arquivo → Fazer download → .csv
        ▼
backoffice.py  →  valida · calcula score · classifica · ranqueia · métricas
        │
        ▼
equipe devolve ao jogador: status, score e ranking (consulta pelo código)
```

O formato das colunas do CSV está definido em [`CONTRATO.md`](CONTRATO.md). Ele é o mesmo para o
site, a planilha e o Python.

---

## Como rodar

Requisito: **Python 3.10 ou mais novo** (só biblioteca padrão: `csv` e `datetime`).

1. Na planilha, abra a aba **Inscricoes** → **Arquivo → Fazer download → Valores separados por
   vírgula (.csv)**.
2. No terminal, dentro desta pasta:

   ```bash
   python backoffice.py
   ```

3. No menu:

| Opção | O que faz |
|---|---|
| `1` | Carrega o CSV (nome do arquivo ou caminho completo; aceita o caminho entre aspas) |
| `2` | Ranking dos aprovados, do maior para o menor score |
| `3` | Métricas da rodada |
| `4` | Inscrições recusadas e o motivo de cada uma |
| `5` | Consulta por código — a resposta que a equipe devolve ao jogador |
| `6` | Exporta `resultados.csv` (sem CPF) |
| `0` | Sai |

As opções 2 a 6 avisam se nenhum CSV foi carregado. Arquivo inexistente, coluna faltando, CSV
fora de UTF-8 e `resultados.csv` aberto em outro programa geram mensagem, sem derrubar o programa.

---

## Regras de negócio

As regras são as mesmas do MVP visual, para o terminal e o site darem o mesmo resultado.

### 1. Validação (`validar_inscricao`)

O site já valida antes de enviar, mas qualquer pessoa com a URL do Apps Script consegue gravar
na planilha. Por isso **o Python valida tudo de novo**. Uma inscrição é recusada se:

| Regra | Motivo exibido |
|---|---|
| Nome vazio | `nome vazio` |
| Data fora do formato `AAAA-MM-DD` | `data de nascimento invalida` |
| Idade fora de **7 a 19 anos** | `idade fora da faixa permitida (07-19)` |
| Menor de 18 sem nome do responsável | `menor sem responsavel` |
| Menor de 18 sem telefone do responsável | `menor sem telefone do responsavel` |
| Menor de 18 sem aceite do termo LGPD/ECA (`aceite_termo` diferente de `S`) | `menor sem aceite do termo` |
| CPF sem exatamente 11 dígitos numéricos | `CPF invalido` |
| UF fora das 27 siglas | `UF invalida` |
| Cidade vazia | `cidade vazia` |
| Posição fora de Goleiro, Zagueiro, Lateral, Volante, Meia, Ponta, Atacante | `posicao invalida` |
| Pé fora de Direito, Esquerdo, Ambidestro | `pe dominante invalido` |

Cada regra quebrada vira um motivo, então o jogador recebe a lista completa do que corrigir.

### 2. Score de completude (`calcular_score`) — 0 a 100

Mede o quanto o perfil está preenchido (não a qualidade técnica do atleta).

| Campo | Pontos |
|---|---|
| Nome | 8 |
| Nascimento | 8 |
| CPF | 10 |
| UF **e** cidade (só valem juntas) | 8 |
| Posição | 10 |
| Pé dominante | 4 |
| Altura | 4 |
| Peso | 4 |
| Clube | 6 |
| Anos de prática | 4 |
| Vídeo | 25 |
| Foto (só com `S`) | 8 |
| Aceite do termo (só com `S`) | 8 |

A soma tem **teto de 100**. Os pesos são os do site, exceto o vídeo: **25 no Python, por decisão
da equipe** (o site usa 18). Como o aceite do termo só existe para menores, o score máximo de um
atleta maior de idade é 99.

### 3. Classificação (`classificar`)

| Score | Status |
|---|---|
| 85 ou mais | `CONVOCADO` |
| 60 a 84 | `ELEGIVEL` |
| abaixo de 60 | `NAO ELEGIVEL` |

### 4. Ranking (`gerar_ranking`)

Os aprovados são ordenados por score, do maior para o menor, e numerados a partir de 1.

### 5. Métricas da rodada (`calcular_metricas`)

Total de inscrições, recusadas, elegíveis (score ≥ 60, incluindo os convocados, como no funil do
site), convocados, score médio dos aprovados e % de aprovados com vídeo.

---

## Estruturas de dados

| Estrutura | Tipo | Uso |
|---|---|---|
| Inscrições / aprovados | lista de dicionários | uma inscrição por item; as chaves são as colunas do contrato |
| Recusados | lista de dicionários | só `codigo`, `nome` e `motivos` (lista de strings) |
| `PESOS` | dicionário | campo → pontos do score |
| `ESTADOS`, `POSICOES`, `PE_DOMINANTE` | conjuntos (`set`) | valores aceitos na validação |
| `COLUNAS_RESULTADO` | lista | colunas do `resultados.csv`, na ordem |
| `PREFIXOS_FORMULA` | tupla | inícios de célula que a planilha lê como fórmula |
| Métricas | dicionário | resultado de `calcular_metricas` |

## Funções

| Função | Responsabilidade |
|---|---|
| `carregar_inscricoes` | lê o CSV e limpa espaços e o `'` que o Apps Script coloca contra fórmulas |
| `calcular_idade` | idade em anos completos a partir de `AAAA-MM-DD` |
| `validar_inscricao` | aplica as regras de validação e devolve os motivos de recusa |
| `calcular_score` | score de completude, 0 a 100 |
| `classificar` | status pelo score |
| `processar` | separa aprovados e recusados; padroniza UF, posição e pé em maiúsculo |
| `gerar_ranking` | ordena e numera |
| `calcular_metricas` | números da rodada, sem divisão por zero |
| `mostrar_ranking`, `mostrar_metricas`, `mostrar_recusados` | saída no terminal |
| `buscar_por_codigo` | busca linear pelo código da inscrição |
| `mostrar_consulta` | resposta ao jogador: score, status e ranking, ou os motivos da recusa |
| `proteger_formula` | neutraliza valores que a planilha executaria como fórmula (CSV injection) |
| `exportar_resultados` | grava o `resultados.csv` sem CPF, com cada valor protegido |
| `main` | menu |

---

## Evidência de validação (teste com usuário real)

> **A FAZER pela equipe antes da entrega:** rodar o script com o CSV da rodada de testes e
> colocar aqui os prints do terminal (opções 1, 2, 3 e 5). Salvar as imagens em
> `python/evidencias/` e trocar os itens abaixo pelas imagens.
> Antes de publicar, borrar o nome se o usuário do teste for menor de idade.

- **Data do teste:** _preencher_
- **Quem testou:** _perfil do usuário (ex.: jogador de 16 anos, Duque de Caxias)_
- **Print 1 — carga do CSV (opção 1):** `![Carga](evidencias/1-carga.png)`
- **Print 2 — ranking (opção 2):** `![Ranking](evidencias/2-ranking.png)`
- **Print 3 — métricas (opção 3):** `![Métricas](evidencias/3-metricas.png)`
- **Print 4 — resposta ao jogador (opção 5):** `![Consulta](evidencias/4-consulta.png)`
- **O que aprendemos com o teste:** _preencher_

---

## Segurança

O sistema guarda dados pessoais de menores de idade (nome, CPF, data de nascimento, telefone do
responsável). Por isso, cada parte tem cuidados próprios.

### Apps Script (porta de entrada)

**O que já está protegido:**

- **Injeção de fórmula na planilha:** valores que começam com `=`, `+`, `-` ou `@` são gravados
  com `'` na frente, então o Sheets os trata como texto e não executa fórmulas.
- **Tamanho:** cada campo é cortado em 200 caracteres.
- **Gravação concorrente:** o `LockService` impede que dois envios simultâneos gravem na mesma
  linha.
- **Campos mínimos:** sem `codigo`, `nome` ou `cpf`, o envio é recusado.
- **CPF como texto:** a aba é formatada como texto, então o zero à esquerda do CPF não se perde.

**Riscos conhecidos:**

- **URL pública:** a URL do Web App aparece no `envio.js`, porque um site estático precisa dela
  para enviar. Qualquer pessoa pode fazer um POST direto, sem passar pelo site. Não há
  autenticação, limite de envios ou captcha, então a planilha pode receber inscrições falsas ou
  em massa. **Mitigação atual:** o Python revalida tudo e recusa o que estiver fora das regras.
- **Mensagem de erro:** em caso de falha, o `doPost` devolve o texto do erro ao navegador, o que
  pode expor detalhes internos. O ideal é devolver uma mensagem genérica.
- **Execução:** o Web App roda com a conta de quem o implantou. Essa conta deve ser usada só para
  o projeto.

### Planilha

- **Compartilhamento restrito:** só os integrantes da equipe, nunca "qualquer pessoa com o link".
  A planilha tem CPF de menores (LGPD e ECA).
- **CSV baixado:** o arquivo vai para a pasta Downloads com os dados completos. Apague-o depois do
  processamento. **CSV com dados reais nunca vai para o GitHub:** o `.gitignore` da raiz bloqueia
  `*.csv` em todo o repositório, e o `python/.gitignore` bloqueia também `*.xlsx`.

### Site (`envio.js`)

- **Código da inscrição:** é um UUID aleatório (`crypto.randomUUID`). O jogador consulta o
  resultado por ele, sem precisar expor o CPF, e o código não dá para adivinhar.
- **Fila offline:** se a internet falhar, a inscrição fica guardada no `localStorage` do navegador
  até ser reenviada. Num computador compartilhado, como o de um projeto social ou lan house,
  outra pessoa conseguiria ler esses dados enquanto estiverem na fila.

### Script Python

- **Sem rede:** o script só lê o arquivo local que a equipe baixou; não acessa a planilha nem a
  internet.
- **Dado de entrada não é confiável:** toda inscrição passa pela validação antes de entrar no
  ranking.
- **CPF não sai do script:** não aparece no terminal (nem nos prints do README) e não vai para o
  `resultados.csv`. A exportação usa só `COLUNAS_RESULTADO`.
- **Inscrição duplicada:** o script não detecta o mesmo CPF inscrito duas vezes; as duas entram no
  ranking. A equipe deve conferir na planilha antes de processar.
- **CSV Injection / Formula Injection (CWE-1236) no `resultados.csv`:** ao ler o CSV, o script
  remove o `'` de proteção que o Apps Script colocou, para validar e mostrar o valor real. Sem
  cuidado na saída, um nome como `=HYPERLINK(...)` voltaria cru no `resultados.csv` e seria
  executado como fórmula ao abrir o arquivo no Excel ou no Sheets. **Correção:** antes de
  exportar, `proteger_formula` coloca o `'` de volta em todo valor que começa com `=`, `+`, `-`,
  `@`, tabulação ou quebra de linha (lista da OWASP).

---

## Uso de IA generativa

Todos os prompts usados nesta sprint, e o que foi feito com cada um, estão em
[`prompts.txt`](prompts.txt).
