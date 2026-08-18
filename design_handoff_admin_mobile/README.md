# Handoff: Painel de Controle (Admin) no mobile

## Visão geral
As 7 telas do admin (`/manager` → Painel de Controle) só no **breakpoint mobile**.
Desktop não muda. Quatro problemas de raiz:

1. **A sidebar vira um obstáculo.** `.ad-page` é `grid-template-columns: 260px 1fr`; em
   `max-width:1024px` passa a `1fr` e `.ad-side` a `position:static` — ou seja, os 7 itens de menu
   ficam **empilhados acima** do conteúdo em toda tela. Cada visita ao admin começa rolando o menu.
   Os `.ad-nav-item` têm `padding:9px 12px` (~35px de alvo).
2. **Inputs maiores que os cards.** Aritmética em 412px:
   412 − 64 (`.ad-page{padding:20px 32px}`) − 48 (`.ad-main{padding:24px}`) − 40 (`.gr-group{padding:18px 20px}`)
   = **260px** de conteúdo, contra `.gr-items{grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}`.
   A coluna mínima de 280px vence e o `.gr-input{width:100%}` vaza para fora do card.
3. **Datagrids.** `.al-table-wrap{overflow-x:auto}` com 6–8 colunas (Temas, Grupos, Pacotes, Basemaps)
   e `.mb-table` (Membros) com 5. Em 412px aparecem 1,5 colunas. `.al-search` é fixo em **320px**
   e faz o `.al-top` quebrar em três linhas.
4. **Diálogos e configs inline.** `.mat-mdc-dialog-content{max-height:72vh}` com `.idedlg-grid` de
   2 colunas, e a config de componentes (`.cfg`) com `.cfg-code{min-height:280px}` dentro de um card
   de 260px.

## Sobre os arquivos deste pacote
`Manager Mobile.dc.html` é uma **referência de design em HTML** — protótipo de aparência e
comportamento, **não código de produção**. Recrie no ambiente existente: **Angular 16 + Angular
Material 16 + SCSS**, com os padrões já presentes (SVG inline feather-style, variáveis SCSS por
arquivo, `*ngIf`, `mat-menu`, `mat-table`, `mat-select`).

O arquivo tem, de cima para baixo: **turno 3 (este handoff — 3A a 3D)**, depois turno 2
(Gestor de Conteúdo, já entregue) e a seção "ATUAL". **Implemente apenas 3A, 3B, 3C e 3D.**

## Fidelidade
**Alta fidelidade.** Cores, tipografia e medidas abaixo são finais.
Fontes: `'Geist', system-ui, …` e `'Instrument Serif', Georgia, serif` (itálico só nos `em` de título).

## Breakpoint
**`@media (max-width: 768px)`** para tudo abaixo. O bloco atual de `1024px` em
`admin.component.scss` (que empilha a sidebar) deve ser substituído pelo padrão de índice + drill-in
— não basta ajustar o grid.

## Arquivos que serão tocados
| Arquivo | O que muda |
|---|---|
| `admin/admin.component.{html,scss,ts}` | Índice mobile, header com voltar/troca de seção, sidebar oculta em ≤768px |
| `styles/_admin-list-base.scss` | Barra sticky, tabela → cards, FAB, paginator → "Carregar mais" (vale p/ temas, grupos, pacotes, basemaps) |
| `admin/geral/geral.component.{html,scss,ts}` | Uma coluna, campo 48px, grupos colapsáveis, Salvar no header |
| `admin/basemaps/basemaps.component.{html,scss}` | Card com thumb 16/9, toggles em linha, ordem por stepper |
| `manager/members/members.component.{html,scss,ts}` | Filtros da `.mb-filters` → chips no header; tabela → cards |
| `admin/componentes/_cfg-base.scss` + `componentes.component.{html,scss}` | Cards 1 coluna; `.cfg` em tela cheia com rodapé fixo e abas |
| `styles/_dialog-base.scss` | Diálogos add/edit/del em tela cheia no mobile |

---

# 3A · Shell do admin — índice + drill-in

Em ≤768px `.ad-side` recebe `display:none` e `.ad-page` vira `grid-template-columns:1fr; padding:0; gap:0`;
`.ad-main` perde borda, raio e sombra (`padding:14px 12px`). O componente passa a ter **dois modos**,
controlados por um estado novo (`currentComponent === null` = índice):

### Índice
- Header do admin: 56px, `background:#fff`, `border-bottom:1px solid #e7f0e7`, `padding:0 16px`,
  `gap:12px`: tile 30×30 `radius:9px` `#eef5ec`/`#1b5e20` + "Painel de Controle" 15.5px/600
  `letter-spacing:-0.2px`.
- Subtítulo em `13px #4d6b52` e o card de lista: `#fff`, `border:1px solid #e7f0e7`, `radius:14px`,
  `box-shadow:0 1px 3px rgba(11,37,69,0.04)`.
- Uma linha por seção, **68px**, `padding:0 12px 0 14px`, `gap:12px`, separador `1px #edf4ea` com
  `margin-left:64px`:
  tile **38×38** `radius:10px` `#eef5ec` com o **SVG verbatim do `.ad-nav-item` correspondente** (18px),
  título 14.5px/600 `#1a2e1f`, subtítulo 11.5px `#6b8f74` com ellipsis, badge de contagem
  (`#eef5ec`/`#1b5e20`, 11.5px/700, `padding:3px 9px`, `radius:100px`) e chevron 14px `#6b8f74`.
- Ordem e rótulos: **Geral** (Parâmetros do sistema) · **Pacotes Conceituais** (Modelos de dados) ·
  **Temas** (Temas geoespaciais) · **Grupos** (Grupos de camadas) · **Componentes** (Módulos do WebGIS) ·
  **Basemaps** (Mapas de fundo) · **Membros** (Usuários e permissões).
- As contagens vêm de cada serviço; se ainda não carregaram, **omita o badge** (não mostre "0").

### Tela de seção
Mesmo header de 56px, agora: **‹ voltar** 44×44 (volta ao índice) · título da seção 15.5–16px/600
com `em` serif quando existir + **chevron 13px** (o título inteiro é o gatilho da folha de troca) ·
área livre à direita para a ação da seção (ex.: **Salvar** em Geral).

### Folha de troca de seção
Backdrop `rgba(11,37,69,0.24)`; folha `#fff`, `border-radius:20px 20px 0 0`,
`box-shadow:0 -10px 40px rgba(11,37,69,0.22)`, alça 44×4 `#e2eee0`.
Header: "PAINEL DE CONTROLE" 11px/700 `letter-spacing:1.8px` uppercase `#6b8f74` + link
"Ver índice" 12.5px/600 `#1b5e20`, `border-bottom:1px solid #edf4ea`.
Itens de **54px**, `gap:12px`, tile 32×32 `radius:9px`; ativo em `#eef5ec` com
`border:1px solid #e2eee0`, tile invertido (`#1b5e20`/`#fff`), label `#1b5e20`/600 e check 15px.
Respeitar `env(safe-area-inset-bottom)`.

Roteamento: se `AdminRoutesService` já reflete a seção na URL, o botão voltar deve navegar (history)
e não só trocar estado — o botão físico de voltar do Android precisa sair da seção para o índice.

---

# 3B · Geral

- `.gr-items { grid-template-columns: 1fr; gap: 16px }`.
- `.gr-group { padding: 14px 14px 16px; border-radius: 14px }`; título com `padding-bottom:11px` e
  `margin-bottom:14px`.
- **Grupos colapsáveis**: só o primeiro aberto. Fechado = linha única com ícone + nome + contagem de
  chaves (`11px/700` em `#edf4ea`/`#6b8f74`) + chevron; o card inteiro é o alvo (mín. 44px).
- Campo: label acima em duas partes — chave em `ui-monospace 12px/600 #1a2e1f` com
  `word-break: break-all` (chaves longas quebram em vez de vazar) e o `.gr-badge` à direita
  com `flex-shrink:0`. Input **48px**, `radius:11px`, `padding:0 13px`, `font-size:14px`
  (14px evita o zoom automático do iOS — não use 13px).
- Sensível editável: input + botão de editar **48×48** (`radius:11px`, `#eef5ec`, borda `#e2eee0`).
- Sensível bloqueado: **não** renderizar input. Bloco `min-height:48px`, `background:#edf4ea`,
  `border:1px solid #e7f0e7`, `radius:11px` com o valor mascarado em mono 12.5px `#6b8f74` e, embaixo,
  o motivo em 11px (`"Requer permissão de superadmin"`). O `matTooltip` não funciona no toque —
  o motivo precisa ser texto.
- **Salvar** no header (38px, `padding:0 14px`, `radius:10px`, `#1b5e20`, 13px/600), habilitado
  só com `configForm.dirty`. Hoje o formulário não tem submit visível em tela curta.

---

# 3C · Listas (Temas · Grupos · Pacotes Conceituais)

Um padrão em `_admin-list-base.scss` resolve as três (e serve de base para Basemaps).

### Barra sticky (`.al-top`)
Em mobile deixa de ser uma linha com `flex-wrap` e passa a bloco `position:sticky; top:<header>`,
`background:#fff`, `border-bottom:1px solid #e7f0e7`, `z-index:5`, em duas faixas:
1. 56px: ‹ voltar 44×44 · título 16px/600 (com `em` serif) + chevron 13px · `.al-count` à direita.
2. `padding:0 12px 12px`: `.al-search` com `width:auto; flex:1`, altura **44px**, `radius:12px`
   (`#edf4ea`, borda `#e7f0e7`), `font-size:14px`; ao lado, botão 44×44 de ordenação
   (`#fff`, borda `#e7f0e7`) — abre folha com as colunas ordenáveis (Título, Inclusão, Alteração).

### Card de item (substitui `mat-table` em ≤768px)
`#fff`, `border:1px solid #e7f0e7`, `radius:14px`, `padding:13px 6px 6px 14px`,
`box-shadow:0 1px 3px rgba(11,37,69,0.04)`, `flex-shrink:0`.
- Título 14.5px/600 `#1a2e1f`; em Grupos, subtítulo = `temaNome` em 11.5px `#6b8f74`.
- Linha de autoria: `.al-user-pill` (avatar 22px `#1b5e20`, nome 11.5px/500) + "criou dd/MM" 12px `#6b8f74`.
- ⋯ **44×44** no canto superior direito, com o mesmo `mat-menu` (Editar / Excluir com `.al-menu-danger`).
- **Detalhes** colapsáveis: gatilho de 40px em 12.5px/600 `#1b5e20` + chevron. Aberto, painel
  `background:#edf4ea`, `radius:10px`, `padding:11px 12px`, `gap:7px`, com pares label/valor
  (Inclusão, Alteração, Alterado por) — label 11.5px `#6b8f74`, valor 12px `#1a2e1f`.
  Fechado, mostrar só "alterado dd/MM HH:mm" à direita do gatilho.
- `row.deletedAt !== null`: `opacity:.6`, título com `line-through` `#6b8f74` e chip
  "Excluído" (`#fef2f2`/`#dc2626`/borda `#fecaca`) — substitui o `.is-deleted` de tabela.

### Paginação e criação
- `mat-paginator` **oculto** em ≤768px. No lugar, botão de 46px `radius:12px` `#fff`
  borda `#e7f0e7`: "Carregar mais N" 13px/600 `#1b5e20` + "X de Y" 11.5px `#6b8f74`
  (avançar `paginator.pageIndex` e concatenar, ou aumentar `pageSize`).
- `.al-add` sai da barra e vira **FAB estendido**: `position:fixed; right:16px; bottom:22px`,
  altura 52, `padding:0 20px`, `radius:100px`, `#1b5e20`,
  `box-shadow:0 8px 22px rgba(20,60,26,0.34)`, ícone 17px + rótulo 14px/600
  ("Novo tema" / "Novo grupo" / "Novo pacote"). Reservar `padding-bottom:88px` na lista.

### Diálogos (add / edit / del / info) em tela cheia
Em ≤768px, para `.mat-mdc-dialog-container:has(.idedlg)`: `width:100vw; max-width:100vw;`
`height:100dvh; max-height:100dvh`, `.mdc-dialog__surface{border-radius:0}`, e
`.mat-mdc-dialog-content{max-height:none; flex:1; overflow-y:auto}`.
- Header 60px fixo, mantendo a barra lateral `::before` de 3px `#1b5e20`: tile 32×32, título 15px/600,
  subtítulo 11.5px `#6b8f74`, e `.idedlg-close` promovido para **44×44** `radius:11px` `#edf4ea`
  borda `#e7f0e7` (hoje 28px, alvo insuficiente).
- Corpo `padding:18px 16px`, `gap:18px`; `.idedlg-grid` em 1 coluna. Campos com label acima
  (12px/600 `#4d6b52`), controle de **52px** `radius:11px`, texto 15px, hint 11.5px `#6b8f74`.
  Textarea 110px mínimo.
- Rodapé fixo: `border-top:1px solid #e7f0e7`, `padding:12px 16px 24px` (+ safe-area):
  Cancelar 110px/50 (`#fff`, borda `#e7f0e7`, `#4d6b52`) + ação primária `flex:1`/50
  (`#1b5e20`, 14px/600, `radius:12px`).
- Diálogos de exclusão mantêm `.idedlg--danger` (barra e tile vermelhos) e a ação primária em `#dc2626`.

---

# 3D · Basemaps · Membros · Componentes

### Basemaps
Card por basemap: `#fff`, borda, `radius:14px`, `overflow:hidden`, `flex-shrink:0`.
- Thumb: `aspect-ratio:16/9`, largura total (substitui `.al-thumb` de 80×48), `object-fit:cover`;
  fallback `assets/imagens/logo.png` como hoje.
- `isDefault`: chip sobre a thumb, `top/left:10px`, `#1b5e20`/`#fff`, 10.5px/700 uppercase com
  ícone de estrela.
- Linha do nome: 15px/600 + **stepper de ordem** à direita, no lugar do `.al-order-input`:
  caixa `#edf4ea` borda `#e7f0e7` `radius:11px` `padding:2px` com − / valor (14px/700, min 26px) / +
  em botões de 38px. Cada toque chama o mesmo `onOrderEdit(basemap, …)`; desabilite − em `order = 0`.
- Dois toggles em linhas de **52px** separadas por `1px #edf4ea`, rótulo 13.5px à esquerda e
  `mat-slide-toggle` à direita: "Basemap padrão" (`onToggleDefault`) e "Ativo" (`onToggleActive`).
  Os tooltips atuais viram os próprios rótulos.
- Rodapé `background:#f0f6ed`, `border-top:1px solid #edf4ea`: "criado dd/MM · alterado dd/MM"
  11.5px `#6b8f74` + excluir 44×44 `#dc2626`.
- FAB "Novo basemap".

### Membros (`manager/members`)
A `.mb-filters` (hoje sidebar) sobe para o header sticky, em duas faixas de chips com rolagem
horizontal — o botão `.mb-icon-btn` de abrir sidebar deixa de existir em mobile:
1. **Perfis** — "Todos · {{ contarUsuariosPorPerfil() }}" + um chip por `dataSourcePerfis`
   (`{{ perfil.perfil }} · {{ contarUsuariosPorPerfil(perfil.id) }}`), chamando `filtrarPorPerfil()`.
   Os nomes no protótipo (Administrador/Editor/Consulta) são **ilustrativos** — use os do backend.
2. **Último acesso** — rótulo "ÚLTIMO ACESSO" 10.5px/700 uppercase + chips Todos · Hoje · Ontem ·
   7 dias · 30 dias · Nunca · Período, com os mesmos valores de `filtrarPorPeriodo()`
   (`''|hoje|ontem|ultimos7dias|ultimos30dias|nunca|custom`). "Período" abre uma folha com o
   `mat-date-range-picker` (`dataInicio`/`dataFim`) e botão Aplicar de 50px.
   Chip ativo: `#1b5e20`/`#fff`/600; inativo: `#fff`, borda `#e7f0e7`, `#4d6b52`; ambos `padding:7px 12px`.
- Busca 44px com o placeholder atual: "Buscar por nome ou e-mail…".
- Card por usuário (substitui as 5 colunas), `padding:12px 6px 12px 14px`, `flex-shrink:0`:
  - Avatar **40px** circular com `(nome||'?').charAt(0)` (`#1b5e20` para o próprio usuário,
    `#4d6b52` para os demais, `#edf4ea`/`#6b8f74` para excluídos), nome 14.5px/600 e
    `email` 11.5px `#6b8f74` com ellipsis — a coluna `email` separada desaparece.
  - Ação da linha, 44×44: excluir em `#dc2626` (`excluirUsuario`), ou restaurar em `#047857`
    (`recuperarUsuario`) quando `dataExclusao`, ou a pílula **"Você"** quando
    `element.id === userIdAutenticado`.
  - Segunda linha: `mat-select` de perfil ocupando `flex:1` em **44px** (`radius:10px`, borda
    `#e7f0e7`, 13.5px) — desabilitado (`#edf4ea`, texto `#6b8f74`, chevron `#a9bcab`) quando é o
    próprio usuário ou o registro está excluído, exatamente como o `[disabled]` atual; à direita,
    última autenticação em duas linhas (data 12px `#4d6b52` / hora 11px `#6b8f74`) ou a pílula
    **"Nunca acessou"** (`#edf4ea`, borda `#e7f0e7`, 11px/600) no lugar de `.mb-pill-never`.
  - Excluído: `opacity:.62`, nome com `line-through` e, no lugar do e-mail,
    "Excluído em dd/MM/yyyy HH:mm" — o texto que hoje só existe no `matTooltip`.
- `mat-paginator` oculto; "Carregar mais" igual ao 3C. **Não existe fluxo de convite** — não
  adicionar FAB nesta tela.

### Componentes
- `.al-cards-grid { grid-template-columns: 1fr; gap: 12px; padding-top: 14px }`; `.al-card` sem
  `transform` no hover; `.al-card-action` com altura 44.
- A config inline (`.cfg`, para Imprimir Croqui e Pitometria) deixa de ser um card dentro da lista e
  abre em **tela cheia** (`position:fixed; inset:0; z-index:1050; background:#fff`), em coluna:
  - Header 60px fixo com a barra `::before` de 3px, tile 32×32, título 15px/600 + subtítulo 11.5px,
    e `.cfg-close` promovido a **44×44** (hoje 28px).
  - Abas em pílulas roláveis de 38px logo abaixo (`Camadas · Template · Preview`) — em mobile o
    `.cfg-body` não deve empilhar tudo numa rolagem só. Ativa `#1b5e20`/`#fff`;
    inativa `#edf4ea`, borda `#e7f0e7`.
  - Corpo rolável com `background:#f0f6ed`, `padding:14px`, `gap:12px`. `.cfg-grid-2` → 1 coluna.
    Linha "Componente habilitado" com `min-height:56px` e o `mat-slide-toggle`.
    `.cfg-card`: `radius:12px`, `padding:13px 14px`; `.cfg-card-remove` para **38px**.
    Selects/inputs em **48px** com `font-size:14px`. `.cfg-chips` mantidos (mono `#eef5ec`).
    `.cfg-empty` vira o alvo "Adicionar outra camada" (dashed, 44px+).
  - `.cfg-code`: `min-height: 40dvh` em vez de 280px fixos, `font-size:12px`, e a aba Preview
    usa a tela inteira (o `.cfg-overlay` com `iframe` de 95vw não cabe aqui).
  - Rodapé fixo: Fechar 110px/50 + "Salvar configuração" `flex:1`/50 `#1b5e20` (+ safe-area).

---

## Tokens de design (idênticos aos SCSS atuais)
| Token | Valor |
|---|---|
| brand / brand-mid | `#1b5e20` / `#14532d` |
| tint / tint-2 | `#eef5ec` / `#e2eee0` |
| ink / ink-soft / muted | `#1a2e1f` / `#4d6b52` / `#6b8f74` |
| line / line-soft / bg | `#e7f0e7` / `#edf4ea` / `#f0f6ed` |
| sensível (warn) | `#fffbeb` texto `#b45309` borda `#fde68a` |
| bloqueado / perigo | `#fef2f2` texto `#dc2626` borda `#fecaca` |
| sucesso | `#ecfdf5` texto `#047857` borda `#a7f3d0` |
| backdrop | `rgba(11,37,69,0.24)` |
| sombra de folha / FAB | `0 -10px 40px rgba(11,37,69,0.22)` / `0 8px 22px rgba(20,60,26,0.34)` |
| raios | 9 / 10 / 11 / 12 / 14 px · folha 20px topo |
| alvos de toque | 44px mínimo |
| foco de campo | `border-color:#1b5e20` + `box-shadow:0 0 0 3px rgba(27,94,32,0.10)` |

Escala: 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 14.5 / 15 / 15.5 / 16 px.
Pesos 500 / 600 / 700 / 800. **Campos de texto nunca abaixo de 14px** (zoom do iOS).

## Assets
Nenhum novo. Os ícones de seção são os **SVG verbatim** de `admin.component.html`; os demais são os
SVG já presentes nos templates de cada tela (feather-style, `stroke-width` 2–2.4, `fill:none`).
Copie os `path`; não redesenhe. Manter o cap defensivo `.ad-list svg{max-width:24px;max-height:24px}`.

## Critérios de aceite
1. Em ≤768px o admin abre no **índice**; nenhuma tela começa com os 7 itens de menu empilhados.
2. Da tela de uma seção dá para ir a outra sem voltar ao índice (folha de troca), e o voltar do
   sistema sai da seção.
3. Nenhum input, select ou card excede a largura do viewport em 412px — zero rolagem horizontal
   em **todas** as 7 telas.
4. Nenhum `mat-table` visível em ≤768px; nenhuma `.al-table-wrap`/`.mb-table-wrap` com scroll lateral.
5. Todo alvo de toque ≥44px (hoje: `.ad-nav-item` ~35, `.al-row-icon` 30, `.cfg-close` 28,
   `.cfg-card-remove` 26, `.idedlg-close` 28, `.al-order-input` 64×30).
6. Toda informação que hoje só existe em `matTooltip` (motivo do bloqueio, "excluído em",
   default/ativo de basemap) está visível como texto.
7. Diálogos e a config de componentes ocupam a tela cheia, com a ação primária sempre visível
   sem rolagem.
8. Desktop (>768px) pixel-idêntico ao atual nas 7 telas.
