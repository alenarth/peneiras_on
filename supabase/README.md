# Banco — ordem de aplicação (você executa no SQL Editor)

> Regra combinada: **cada alteração é um SQL revisável que VOCÊ roda** no
> Supabase → SQL Editor. Nada é aplicado automaticamente pelo assistente.

## Estado esperado antes de começar

O projeto **Peneiras ON** (`kajdfncwgqenhdkrfzyo`) já tem as 8 tabelas, enums,
policies e os 4 helpers do schema-base (arquivo de referência:
`../assets/base-anterior/schema.sql`). Confirme rodando o inventário
somente-leitura antes de qualquer mudança:

1. Abra `inspecionar.sql` (nesta pasta) no SQL Editor e rode. Ele **não altera
   nada** — só lista tabelas, policies, grants e contagens.

Se o schema-base **não** estiver aplicado (projeto vazio de teste), rode primeiro
`../assets/base-anterior/schema.sql` e, se quiser dados de demonstração,
`../assets/base-anterior/seed.sql` (o seed **não cria usuários de login**).

## Ordem

| # | Arquivo | Quando | Resultado esperado |
|---|---------|--------|--------------------|
| 1 | `01-migracao-auth-mvp.sql` | Uma vez (idempotente; pode reexecutar) | “Success. No rows returned”. Cria schema `privado`, `cadastros_profissionais`, tabelas privadas, a barreira `sessao_email_verificada()`, as policies RESTRICTIVE e as RPCs. |
| 2 | `02-bootstrap-admin.sql` | **Depois** que `joaotheescs@gmail.com` criar a conta pelo site **e confirmar o e-mail** | `NOTICE: OK: ... promovido a gestora`. Falha clara se a conta não existe/não confirmou. |
| 3 | `03-aprovar-profissional.sql` | Sempre que precisar aprovar um olheiro/academia | `NOTICE: OK: <email> aprovado como <tipo>`. |

## Importante

- **Não** rode o `schema.sql` de novo como passo automático num projeto já
  povoado: ele repõe grants. Se algum dia reaplicar o schema-base, rode o
  `01-migracao-auth-mvp.sql` **depois** para refechar os INSERT diretos.
- A migração 01 **não apaga dados** e aborta com mensagem se encontrar
  incompatibilidade.
- Configurações do painel (Auth, SMTP, redirects, CAPTCHA) e as variáveis de
  ambiente da Vercel estão descritas em `../RELATORIO-AUTH-MVP.md`.
