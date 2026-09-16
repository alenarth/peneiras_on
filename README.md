# Peneiras On — Front-end (HTML/CSS/JS puro)

Plataforma de captação de talentos — protótipo de front-end multi-página, sem frameworks.
Feito apenas com **HTML5 + CSS3 + JavaScript (ES2017)**. Não requer build, Node, nem dependências.

## Como rodar

Abra `index.html` no navegador. Por usar `fetch` de assets locais via `file://` em alguns navegadores
pode haver bloqueio de CORS para fontes — o ideal é servir por um servidor estático simples:

```bash
# Python
python3 -m http.server 8000
# depois abra http://localhost:8000
```

Ou qualquer servidor estático (Live Server do VS Code, `npx serve`, etc.).

## Páginas

| Arquivo | Descrição | Parâmetros de URL |
|---|---|---|
| `index.html` | Landing pública (hero, planos, FAQ) | — |
| `sobre.html` | Institucional (missão, equipe, parceria) | — |
| `privacidade.html` | Política de Privacidade (LGPD/ECA) | — |
| `login.html` | Login (3 perfis) | `?tipo=jogador\|olheiro\|academia` |
| `recuperar.html` | Recuperação de senha (4 passos) | — |
| `atleta.html` | Área do atleta | `?tela=status\|perfil\|peneiras\|cadastro` |
| `olheiro.html` | Painel do olheiro | `?tela=lista\|checkin\|avaliacao` · `?tela=perfil&id=<id>` |
| `gestora.html` | Painel da gestão | `?tela=dashboard\|mapa\|pipeline\|eventos` |

`atleta.html?tela=cadastro` não tem aba na navegação: o wizard é um fluxo isolado,
alcançado pelos CTAs "Quero me inscrever". O perfil do olheiro é aberto pela lista de
inscritos, que passa o `id` do atleta. Um `?tela=` desconhecido cai na tela padrão da persona.

## Estrutura

```
index.html, sobre.html, …        → páginas (markup)
assets/
  pele-hero.webp / .jpg          → imagem de fundo (WebP + fallback JPEG)
  css/styles.css                 → tokens + todas as classes de componente
  js/
    data.js                      → dados mockados (atletas, eventos, regiões)
    components.js                → header, footer, dropdown, helpers de UI
    radar.js                     → radar tático (SVG) + classificador de posição
    privacidade.js               → conteúdo da política
    login.js, recuperar.js       → lógica das telas de acesso
    atleta.js, olheiro.js,
    gestora.js                   → lógica de cada persona
```

## Tecnologia / decisões

- **Sem framework.** Telas geradas por funções JS que retornam HTML (template strings) e injetam no DOM.
- **CSS por classes** (`.btn`, `.card`, `.plan`, `.table`, `.nav-item`…), com tokens em `:root` (variáveis CSS).
- **Navegação** por links reais (`<a href>`) e parâmetros de URL — recarrega como site tradicional.
- **Responsivo** com um breakpoint em 900px (mais um ajuste em 560px): as grades
  são classes utilitárias no CSS (`.g`, `.g-2`…`.g-5`, `.g-main`, `.g-aside-*`),
  justamente porque `style` inline não pode ser sobrescrito por media query.
- Fontes: Archivo (display), Inter (corpo), JetBrains Mono (rótulos) via Google Fonts.

## Paleta

- Verde `#54F542` (destaque) · Dourado `#C8A415` (legado Pelé)
- Preto `#0E0E0F` · Off-white `#F5F4EE`
- Erro `#C62828` · Sucesso `#1B7A3D`

> **Uso e contraste (WCAG 2.1 AA).** O verde neon e o dourado são usados como **fundo**
> (com texto preto) ou sobre **superfícies escuras** — nunca como texto sobre fundo claro,
> onde reprovam contraste. Para texto/ícone verde ou dourado sobre fundo claro use os tokens
> `--accent-text` (`#177038`) e `--gold-deep` (`#7E660E`), que passam AA. Texto auxiliar usa
> `--ink-mute` (`#67675C`, 5.2:1+). Anel de foco: `--focus` (tinta, 16:1+) sobre claro,
> verde neon sobre superfícies escuras.

---
FIAP — Engenharia de Software — Semi-Presencial RJ · 2026
