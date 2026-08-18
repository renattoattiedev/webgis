# Handoff: Gestor de Conteúdo no mobile (Minha Organização · Meu Conteúdo · Mapas)

## Visão geral
Três telas do Gestor de Conteúdo (`/manager`) só no **breakpoint mobile**. Desktop e tablet largo
não mudam em nada. Três problemas concretos a resolver:

1. **Minha Organização / Meu Conteúdo** — em `max-width: 1024px` a sidebar de filtros
   (`.oc-filters.opened` / `.mc-filters.opened`) passa a `position: static; display: flex` **dentro
   do grid**, portanto entra no fluxo ACIMA de `.oc-main`. Os 4–5 painéis empilhados empurram a
   action bar — que contém o único botão de colapsar (`.oc-icon-btn` com `toggleLeftSidenav()` /
   `toggleSidenav()`) — para ~900px abaixo do viewport. O usuário abre o filtro e não consegue voltar.
2. **Meu Conteúdo** — o `mat-table` de 10 colunas dentro de `.mc-table-wrap { overflow-x: auto }`
   em 412px mostra "Padrão" e metade de "Título".
3. **Mapas** — `.mp-sidebar.opened { width: 320px }` (280px em ≤1100px) contra um viewport de 412px,
   com `.mp-bar` quebrando em 3 linhas: sobram ~110px de largura de mapa.

## Sobre os arquivos deste pacote
`Manager Mobile.dc.html` é uma **referência de design em HTML** — protótipo de aparência e
comportamento, **não código de produção**. Recrie no ambiente existente: **Angular 16 + Angular
Material 16 + SCSS**, nos componentes citados abaixo, com os padrões que já estão lá (SVG inline
feather-style, variáveis SCSS por arquivo, `*ngIf`, `cdkDropList`, `mat-menu`).

O arquivo tem, de cima para baixo: **2A** (Minha Organização, 2 telas), **2B** (Meu Conteúdo,
2 telas), **2C** (Mapas, 2 telas) e, na seção inferior, o **estado atual recriado em 412px**
(referência do problema — não implementar).

## Fidelidade
**Alta fidelidade.** Cores, tipografia e medidas abaixo são finais.
Fontes: `'Geist', system-ui, …` e `'Instrument Serif', Georgia, serif` (itálico, usado só no
`em` dos títulos "Meu *conteúdo*" / "Minha *organização*") — já carregadas globalmente.

## Breakpoint
Usar **`@media (max-width: 768px)`** para tudo abaixo. O bloco existente de `1024px`
(que hoje transforma o filtro em coluna estática) precisa ser **corrigido para não deixar o filtro
no fluxo sem saída** — ou o padrão de folha passa a valer já em ≤1024px. Decida uma vez e aplique
igual em `my-content` e `organization-content`.

## Arquivos que serão tocados
| Arquivo | O que muda |
|---|---|
| `manager/organization-content/organization-content.component.{html,scss,ts}` | Filtros → folha overlay; chips de filtro ativo; grid 1 coluna; painéis colapsáveis |
| `manager/my-content/my-content.component.{html,scss,ts}` | Mesma folha de filtros; tabela → lista de cards em mobile; action sheet de linha |
| `manager/maps/maps.component.{html,scss,ts}` | Barra compacta de 52px; sidebar → bottom sheet de 3 alturas; controles OL à direita; ferramentas no overflow |
| `manager/content/content.component.scss` | Tabs já rolam horizontalmente; garantir `scroll-snap` e alvo de 48px |

---

# 2A · Minha Organização

### Estado A1 — lista, filtros fechados
Barra de ação (`.oc-main-top`) fica **sticky** logo abaixo das tabs (`top: 112px` = 60 nav + 52 tabs),
`background: #fff`, `border-bottom: 1px solid #e7f0e7`, `padding: 12px 14px`, `gap: 10px`,
em três linhas:

1. Título `17px/600 #1a2e1f`, `letter-spacing: -0.3px`, com `<em>` serif em `#4d6b52` +
   badge de contagem (`background:#eef5ec; color:#1b5e20; 11.5px/700; padding:3px 9px; radius:100px`).
2. Busca (`flex:1`, altura **44px**, `background:#edf4ea`, `border:1px solid #e7f0e7`,
   `radius:12px`, ícone 15px `#6b8f74`, texto 14px) + botão de filtro **44×44**, `radius:12px`.
   Sem filtro ativo: `background:#fff; border:1px solid #e7f0e7; color:#4d6b52`.
   Com filtro ativo: `background:#1b5e20`, ícone branco, e **badge** no canto superior direito
   (`min-width:19px; height:19px; background:#eab308; color:#1a2e1f; 10.5px/800; border:2px solid #fff`)
   com a contagem de filtros ativos.
3. Linha de **chips de filtro ativo**, rolagem horizontal, sem barra visível. Chip ativo:
   `background:#1b5e20; color:#fff; 12px/600; padding:6px 8px 6px 11px; radius:100px` + × de 11px
   (remove só aquele filtro). No fim da linha, "Limpar" (`#fff`, `border:1px solid #e7f0e7`,
   `color:#4d6b52`) que chama `clearFilter()`.

Grid de cards: **1 coluna** (`.oc-grid { grid-template-columns: 1fr; gap: 12px }`), wrap com
`padding: 14px`. Card mantém o desenho atual (thumb 4/3, badge de tipo, body, footer) com dois ajustes:
- `.oc-thumb-refresh` passa a **32×32** e `opacity: 1` permanente (não existe hover no toque).
- Footer: `.oc-details-btn` com altura 44; `.oc-share` e `.oc-star` em caixas de toque **44×44**
  (`radius:11px`), mantendo o glifo em 15–18px. Avatar do criador continua 26px (não é alvo).

### Estado A2 — folha de filtros aberta
Substitui `.oc-filters` como coluna. Em mobile:
- Backdrop `rgba(11,37,69,0.18)` + `backdrop-filter: blur(2px)` (mesmo do `.oc-details-overlay`), `z-index: 999`.
- Folha: `position: fixed; left:0; right:0; bottom:0; top: 16px` (mostra o backdrop no topo),
  `background:#f0f6ed`, `border-radius: 20px 20px 0 0`, `z-index: 1000`,
  `box-shadow: 0 -10px 40px rgba(11,37,69,0.22)`, `display:flex; flex-direction:column`.
  Entrada: `translateY(100%) → 0`, 280ms `cubic-bezier(0.32,0.72,0,1)`.
- **Header fixo** (60px, `background:#fff`, `border-bottom:1px solid #e7f0e7`,
  `border-radius:20px 20px 0 0`, `padding: 0 8px 0 18px`): "Filtros" 16px/600 + badge "N ativos"
  à esquerda; à direita botão **44×44** `radius:12px` `background:#edf4ea` `border:1px solid #e7f0e7`
  com X de 18px. **Este é o consertos do bug: a saída é fixa, nunca rola.**
- **Corpo rolável** (`flex:1; overflow-y:auto; padding:14px; gap:12px`), painéis `.oc-panel` inalterados
  (`#fff`, `border:1px solid #e7f0e7`, `radius:14px`, `padding:16px`,
  `box-shadow:0 2px 8px rgba(11,37,69,0.04)`; título `11px/700`, `letter-spacing:1.8px`, uppercase, `#6b8f74`).
  Chips dentro da folha crescem para `font-size:13px; padding:9px 14px` (alvo ~40px de altura).
- **Painéis longos colapsam**: Temas e Grupos mostram no head um resumo "1 de 14" em `12px/600 #1b5e20`
  com chevron; fechados exibem no máximo 4 chips + "+11". Abrir expande in-place.
- **Refinamentos** deixa de ser um bloco denso e vira lista de linhas de **56px** separadas por
  `1px #edf4ea`: "Somente favoritos" com switch 52×32; "Visualizações" mostrando "0 – ∞";
  "Última modificação" mostrando "Qualquer data" — cada uma abre seu controle (os inputs
  `minVisualizacoes`/`maxVisualizacoes` e o `mat-date-range-picker` continuam os mesmos, só
  aparecem expandidos sob a linha).
- **Rodapé fixo** (`background:#fff`, `border-top:1px solid #e7f0e7`, `padding:12px 14px 22px`,
  respeitar `env(safe-area-inset-bottom)`): "Limpar" (120px, altura 50, `#fff`, `border:1px solid #e7f0e7`,
  `color:#4d6b52`) + "Aplicar filtros · N" (`flex:1`, altura 50, `background:#1b5e20`, `#fff`, 14px/600,
  `radius:12px`) → `applyFilter()` e fecha a folha. N = contagem que o filtro vai retornar.
- Escape, backdrop e "Aplicar" fecham. Travar scroll do body enquanto aberta.

---

# 2B · Meu Conteúdo

Barra de ação idêntica à 2A, com uma terceira ação: **44×44 `#1b5e20`** com "+" 20px
(`[matMenuTriggerFor]="addMenu"` — Camadas vetoriais / Camadas raster / Mapas). O botão "Cache"
(`rebuildAllThumbnailCaches()`) sai da barra e vai para o overflow do topo (⋯) ou para o rodapé
da folha de filtros — não é ação de mobile.

Linha de chips: atalhos de tipo com contagem ("Todos · 37", "Vetoriais · 21", "Raster · 9", "Mapas"),
mesmos handlers de `toggleFilterByContentType()`.

**A tabela vira lista** (`@media (max-width:768px)`: esconder `.mc-table`, renderizar
`<div class="mc-list">` com `*ngFor` sobre `dataSourceContent.filteredData`). Card:
- `background:#fff; border:1px solid #e7f0e7; radius:14px; padding:14px 8px 10px 14px; gap:10px;`
  `box-shadow:0 1px 3px rgba(11,37,69,0.04)`.
- Linha 1: título `14.5px/600 #1a2e1f` + subtítulo `11.5px #6b8f74` ("Camada vetorial · Saneamento"
  = tipo + `temaCamadaNome`); à direita botão **⋯ 44×44** (`mat-menu`) — ver action sheet abaixo.
- Linha 2: chips reaproveitando as classes existentes, agora todos com `padding:4px 10px`:
  `.mc-type-chip` (vec `#eef5ec/#1b5e20/#e2eee0`, ras `#fff7e6/#b35a00/#ffe0b3`,
  mapa `#ecfdf5/#047857/#a7f3d0`), `.mc-status-pub`/`.mc-status-warn`/`.mc-status-error`, e o
  nível de compartilhamento como chip **com texto** ("Institucional"/"Público"/"Privado") em vez do
  ícone-só de `.mc-share`.
- Raster em publicação: chip de progresso `#edf4ea/#4d6b52` com barra de 52×5px
  (`#e2eee0` de trilha, `#1b5e20` de preenchimento) + "COG 62%" — mesma leitura de
  `getRasterStatus()` / `getRasterProgress()`; "Retomar"/"Reiniciar" continuam clicáveis (altura 32+).
- Linha 3: meta `12px #6b8f74` ("12/08 14:20 · 342 acessos", separador `1px×11px #e7f0e7`) e,
  à direita, "Padrão" `11.5px/600` + `mat-slide-toggle` (não encolher; desabilitado para mapas,
  como hoje).

**Action sheet de linha** (substitui `.mc-row-actions`): folha inferior `#fff`,
`border-radius: 20px 20px 0 0`, alça 44×4 `#e2eee0`, header com título do item + subtítulo
(`15px/600` e `12px #6b8f74`) e `border-bottom:1px solid #edf4ea`; itens de **56px**,
`gap:14px`, tile de ícone 36×36 `radius:10px` `background:#eef5ec` `color:#1b5e20`,
label `14.5px/500`. Itens = exatamente as ações da linha hoje (Editar, Atributos, Mover para pasta,
Trocar proprietário, Ativar/Desativar, Favoritar…), com **Excluir** ao fim, separado por
`1px #edf4ea`, tile `#fef2f2` e texto `#dc2626`.

Pastas (painel "Pastas" da sidebar) continuam dentro da folha de filtros, com as linhas em 48px e
os dois `.mc-icon-btn` (nova pasta / excluir) em 44×44.

---

# 2C · Mapas

### Barra (`.mp-bar`) — uma linha de 52px
`padding: 0 8px 0 10px; gap: 6px; flex-wrap: nowrap`. Da esquerda para a direita:
- **Camadas**: pílula de 40px de altura, `padding: 0 12px`, `radius:10px`, mostrando o ícone de
  camadas (15px) + **a contagem** de `addedCamadas.length`. Ativa: `background:#eef5ec;`
  `border:1px solid #e2eee0; color:#1b5e20`. Inativa: sem fundo, `color:#4d6b52`.
- **Título** (`flex:1; min-width:0`): tile 22×22 `radius:6px` `#eef5ec`/`#1b5e20` + nome
  `13.5px/600` com ellipsis. Duplo-clique continua editando (`enableEdit()`); em mobile,
  toque longo ou o item "Renomear" do ⋯ também deve abrir a edição.
- **Salvar**: 40px de altura, `padding: 0 14px`, `background:#1b5e20`, `#fff`, 12.5px/600.
- **⋯ 40×40** `radius:10px`: Dados, Novo mapa, Renomear, Compartilhar, Medir, Desenho, Imprimir.
  (Medir/Desenho/Imprimir também aparecem como pílulas flutuantes no mapa — ver abaixo.)
- Nada de `flex-wrap` em mobile: o que não cabe vai para o ⋯.

### Palco (`.mp-stage`)
`height: calc(100dvh - 60px - 52px - 52px)` (nav + tabs + barra) — usar `dvh` para o Safari.
`.mp-sidebar` **não** ocupa largura em mobile: `width: 0` sempre; o painel de camadas passa a ser
bottom sheet.

- **Busca de endereço** flutua sobre o mapa: `top:12px; left:12px; right:12px`, altura 44,
  `background:#fff`, `border:1px solid #e7f0e7`, `radius:100px`, `padding: 0 6px 0 14px`,
  `box-shadow: 0 4px 14px rgba(11,37,69,0.12)`, botão circular 34px `#1b5e20`. Sugestões
  (`.mp-suggestions`) abrem abaixo, com `left/right: 12px`.
- **Controles do OpenLayers vão para a direita** (`right: 12px`, começando em `top: 70px`,
  `gap: 8px`), **44×44**, circulares, `#fff`, `border:1px solid #e7f0e7`,
  `box-shadow:0 2px 8px rgba(11,37,69,0.18)` — sobrescrever os `::ng-deep` de `app-home`,
  `app-zoom-envolope`, `app-current-location` e `.ol-zoom`, que hoje estão fixos à esquerda
  em 40px. Zoom, Home, Envelope, Localização nessa ordem.
- **Basemap** (`app-basemap`): 64×64, `radius:12px`, `border:2px solid #fff`, canto inferior
  esquerdo, **acima da folha** (`bottom: calc(<altura da folha> + 12px)`).
- **Formulários flutuantes** (`.mp-floating-form`, hoje `width:280px; top:130px; right:24px`)
  em mobile viram folha inferior: `left:0; right:0; bottom:0; width:auto; radius:20px 20px 0 0`,
  `max-height: 70%`, com header e X de 44px.
- **Pílulas de ferramenta** no canto inferior direito (Medir, Desenho, Imprimir, Compartilhar):
  altura 40, `radius:100px`, `#fff`, `border:1px solid #e7f0e7`,
  `box-shadow:0 4px 14px rgba(11,37,69,0.16)`, ícone 15px `#1b5e20` + label 12.5px/600.
  São opcionais — se preferir manter só o ⋯, remova-as; não duplicar em desktop.
- **OverviewMap** (`.ol-overviewmap`): esconder em ≤768px.

### Bottom sheet de camadas — 3 alturas
`position:absolute; left:0; right:0; bottom:0`, `background:#fff`,
`border-radius:20px 20px 0 0`, `box-shadow:0 -10px 34px rgba(11,37,69,0.20)`,
alça 44×4 `#e2eee0` centralizada. Snaps: **64px** (recolhida) · **55%** · **90%**.
Arrastar a alça alterna; tocar em "Camadas" na barra abre em 55%; tocar na alça recolhida expande.
- Recolhida (64px): alça + linha "Camadas" `13.5px/600` com ícone e badge da contagem.
- Aberta: tabs `Conteúdo` / `Legenda` (mesmo `mat-tab-group`, 13px/600, indicador 2.5px `#1b5e20`)
  e, à direita das tabs, botão **Dados** (altura 36, `radius:9px`, `#1b5e20`, `#fff`, 12.5px/600)
  chamando `showDataWindow()`.
- Corpo: `padding:12px 14px`, hint `11.5px #6b8f74` em `#edf4ea` com `border:1px dashed #e7f0e7`.
- Linha de camada (`.mp-layer`) em mobile: `grid-template-columns: 28px 44px 1fr 44px`,
  `padding: 8px 6px 8px 2px`, alça e ⋯ com **44px** de alvo, thumb **44×44**,
  título 13px/600 com ellipsis, chip de tipo 9.5px/700 uppercase (vec `#eef5ec/#1b5e20/#e2eee0`,
  ras `#fff7e6/#b35a00/#ffe0b3`). `cdkDrag` continua, com `cdkDragHandle` na alça (a folha
  não deve capturar o gesto quando o toque começa na alça da camada — só na alça da folha).
- Legenda: itens `.mp-legend-item` inalterados, largura total.

---

## Tokens de design (idênticos aos SCSS atuais)
| Token | Valor |
|---|---|
| brand | `#1b5e20` · brand-mid `#14532d` |
| tint / tint-2 | `#eef5ec` / `#e2eee0` |
| ink / ink-soft / muted | `#1a2e1f` / `#4d6b52` / `#6b8f74` |
| line / line-soft / bg | `#e7f0e7` / `#edf4ea` / `#f0f6ed` |
| gold / danger / success | `#eab308` / `#dc2626` / `#047857` |
| raster | `#fff7e6` texto `#b35a00` borda `#ffe0b3` |
| thumb placeholder | `linear-gradient(135deg,#c8d8ed 0%,#e6eef8 100%)` |
| backdrop | `rgba(11,37,69,0.18)` + `blur(2px)` |
| sombra de folha | `0 -10px 40px rgba(11,37,69,0.22)` |
| raios | 9 / 10 / 11 / 12 / 14 px · folha 20px topo |
| alvos de toque | 44px mínimo |

Escala: 9.5 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 14.5 / 15 / 16 / 17 px.
Pesos 500 / 600 / 700 / 800.

## Assets
Nenhum novo. Todos os ícones são os SVG inline já presentes nos templates (feather-style,
`stroke-width` 2–2.4, `fill:none`). Copie os `path` dos arquivos atuais; não redesenhe.

## Critérios de aceite
1. Em ≤768px, abrir filtros em Minha Organização e Meu Conteúdo **sempre** oferece X visível
   e botão Aplicar/Limpar fixos; nenhuma rolagem é necessária para voltar.
2. Filtros ativos são visíveis na lista (chips) e contados no botão de filtro.
3. Meu Conteúdo não tem rolagem horizontal em 412px.
4. Em Mapas, com o painel de camadas aberto em 55%, o mapa continua ocupando **100% da largura**.
5. `.mp-bar` em uma única linha de 52px em 412px.
6. Nenhum alvo de toque abaixo de 44px nas três telas.
7. Desktop (>768px) pixel-idêntico ao atual nas três telas.
