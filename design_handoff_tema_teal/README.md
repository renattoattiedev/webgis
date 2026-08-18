# Handoff: troca de tema — verde #1B5E20 → teal da empresa #268A97

Vale para **web e mobile ao mesmo tempo**: é uma troca de paleta, não de layout. Nenhuma medida,
espaçamento, raio, tipografia ou estrutura muda. Referência visual: **TURNO 5 / seção 5A** de
`Manager Mobile.dc.html` (card de tokens, card de contraste e três telas re-skinadas).

## A decisão que define a proposta: contraste

| Fundo | Texto branco | Veredito |
|---|---|---|
| `#1b5e20` (verde atual) | **7,87:1** | ✓ |
| `#268A97` (teal puro) | **4,07:1** | ✕ falha em texto &lt;14px (mín. 4,5) |
| `#1D707C` (brand-deep) | **5,74:1** | ✓ |

Por isso o teal entra em **dois níveis**:

- **`#268A97` — área de cor.** FAB, chips ativos, tiles de ícone, indicador de aba, toggles ligados,
  barra de foco de campo, preenchimentos de gráfico, traços no mapa.
- **`#1D707C` — brand-deep.** Barra de navegação, botões cheios cujo rótulo tem &lt;14px, e
  **qualquer texto ou ícone de marca sobre branco em tamanho pequeno** (badges de contagem 11,5px,
  links de 12–13px, rótulos "Detalhes", "1 de 14", valores em `.al-user-pill`).
  `#268A97` sobre branco dá 4,07:1 — aceitável só para texto ≥18px ou ≥14px bold.
- **`#1A626D` — brand-mid**, para `:hover`/`:active` (substitui `#14532d`).

Regra prática: **fundo de cor → `#268A97`; texto de cor e barra superior → `#1D707C`.**

## Mapa de substituição

| Papel | De | Para |
|---|---|---|
| brand | `#1b5e20` | `#268A97` |
| brand-deep (novo) | — | `#1D707C` |
| brand-mid | `#14532d` | `#1A626D` |
| brand-tint | `#eef5ec` | `#E8F4F6` |
| brand-tint-2 | `#e2eee0` | `#CDE6EA` |
| ink | `#1a2e1f` | `#102C31` |
| ink-soft | `#4d6b52` | `#3C5F65` |
| muted | `#6b8f74` | `#6A8A90` |
| muted-2 (novo) | `#a9bcab` | `#A3BEC3` |
| line | `#e7f0e7` | `#DDEBED` |
| line-soft | `#edf4ea` | `#E9F3F4` |
| bg | `#f0f6ed` | `#EFF6F7` |
| resíduo azul antigo | `rgba(1,73,155,α)` | `rgba(38,138,151,α)` |
| gradiente de skeleton | `#f0f4fa … #e7f0e7` | `#F3F8F9 … #DDEBED` |

**Não mudam:** `#dc2626` perigo · `#b45309`/`#fffbeb`/`#fde68a` atenção ·
`#047857`/`#ecfdf5`/`#a7f3d0` publicado · `#b35a00`/`#fff7e6`/`#ffe0b3` raster ·
`#eab308` ouro/favorito/não-salvo · `#fef2f2`/`#fecaca` · placeholders de thumb.
Contraste conferido: os neutros novos são **iguais ou melhores** que os atuais
(`#6A8A90` 3,72:1 vs `#6b8f74` 3,62:1; `#3C5F65` 6,96:1 vs `#4d6b52` 5,93:1).

## O problema estrutural: a paleta está duplicada ~40 vezes

Não existe arquivo de tokens. Cada componente redeclara os mesmos hexes no topo do próprio SCSS,
com **nomes diferentes por geração de código**:

| Convenção | Onde | Exemplos |
|---|---|---|
| `$brand / $brand-mid / $brand-tint / $brand-tint-2 / $ink / $ink-soft / $muted / $line / $line-soft / $bg` | manager, admin, index, dados | `maps`, `my-content`, `organization-content`, `members`, `content`, `admin`, `geral`, `_cfg-base`, `_admin-list-base`, `add-dados`, `details`, `add-raster-dialog`, `edit-atributos-camada-dialog` |
| `$blue / $text` | componentes antigos do webgis | `identify`, `measure`, `printing`, `drawing`, `spatial-search`, `filter-data`, `conteudos`, `coordinate-converter`, `perfil-conteudo`, `pesquisar-camadas-dialog`, `pitometria-card`, `consulta-pitometria`, `consulta-espacial-pitometria`, `attribute-table`, `attribute-table-select-columns`, `imprimir-croqui-vistoria`, `adicionar-dados`, `thematic-card` |
| `$RunForrestGIS-blue` | `webgis.component`, `basemap.component` | — |
| `$idedlg-*` com `!default` | `styles/_dialog-base.scss` | `$idedlg-brand`, `$idedlg-ink`… |
| `$brand / $text` | telas de segurança | `login`, `register-user`, `reset-password`, `recovery-password`, `perfil-usuario`, `email-verificado` e diálogos de sucesso |
| `$brand-tint2` (sem hífen) | `adicionar-item-grupo-dialog` | — |
| hexes crus, sem variável | `styles.scss`, `relatorio-*`, `cortina-camadas`, `mapa`, `menu-topo`, `webgis.component`, `escala`, `grupo-avatar-badge`, `thematic-legend`, `relatorio-page` | — |

**Faça a centralização junto com a troca** — é o que impede a próxima mudança de cor de custar o
mesmo esforço. Criar `src/styles/_tokens.scss`:

```scss
// src/styles/_tokens.scss — fonte única de verdade da paleta
$brand:        #268A97;
$brand-deep:   #1D707C;   // nav, texto de marca < 14px  (5,74:1 no branco)
$brand-mid:    #1A626D;   // hover / pressed
$brand-tint:   #E8F4F6;
$brand-tint-2: #CDE6EA;
$ink:          #102C31;
$ink-soft:     #3C5F65;
$muted:        #6A8A90;
$muted-2:      #A3BEC3;
$line:         #DDEBED;
$line-soft:    #E9F3F4;
$bg:           #EFF6F7;
$danger:       #dc2626;
$warn:         #b45309;
$success:      #047857;
$gold:         #eab308;
```

Em cada componente, apagar o bloco local e trocar por `@use '../../../styles/tokens' as t;`
(ajustar a profundidade), usando `t.$brand` etc. Onde o nome antigo era `$blue`/`$text`/
`$RunForrestGIS-blue`, mapear no ponto de uso:

- `$blue` → `t.$brand` (fundos) ou `t.$brand-deep` (texto pequeno)
- `$text` → `t.$ink` quando é texto de conteúdo; `t.$brand-deep` quando é texto **de marca**
  (títulos coloridos, valores destacados). Nas telas de segurança e nos relatórios, `#14532d`
  aparece nos dois papéis — decida caso a caso e não deixe `t.$brand-mid` como cor de texto:
  brand-mid é estado de interação.
- `$RunForrestGIS-blue` → `t.$brand`; renomear o símbolo (o nome não descreve mais nada).
- `_dialog-base.scss`: manter o padrão `!default` e alimentar os `$idedlg-*` a partir dos tokens.
- `$brand-tint2` → `t.$brand-tint-2`.

`styles.scss` precisa de atenção especial:
- `$background-color-header-bar: #1b5e20` → **`#1D707C`** (é a barra superior, texto pequeno em cima).
- linhas ~19 e ~348: `background-color: #1b5e20 !important` → `#1D707C` se houver texto pequeno
  sobre elas; `#268A97` se for faixa/realce puro. Verifique cada uma.
- linha ~701: `rgba(1, 73, 155, 0.08)` — resíduo de um tema azul anterior. Trocar por
  `rgba(38,138,151,0.08)`.
- `color: #14532d !important` (linhas ~381, ~512, ~658, ~732) → `t.$brand-deep`.

## Fora do CSS

| Onde | O que |
|---|---|
| `identify.component.ts` (3×), `consulta-espacial-pitometria.component.ts` (~5×) | `new Stroke({ color: '#1b5e20' })` → `#268A97`. Traço sobre imagem de satélite: o teal tem **mais** contraste que o verde, mas confira a camada de ortofoto. |
| `consulta-espacial-pitometria.component.ts` | `{ value: 'azul', label: 'Azul', hex: '#1b5e20' }` — a opção já estava rotulada errado (verde chamado de "Azul"). Com o teal, renomeie para **"Teal"** e alinhe o hex. |
| `relatorio-inventario/uso/usuarios.component.ts` | `colors: ['#1b5e20']` → `['#268A97']`. Em `relatorio-usuarios` a série é `['#1b5e20','#2e7d32','#b45309','#7c3aed']`: use `['#268A97','#1D707C','#b45309','#7c3aed']` — as duas primeiras precisam ser distinguíveis entre si. |
| SVG inline em HTML | `cortina-camadas`, `drawing`, `measure`, `printing`, `dados` têm `stroke="#1b5e20"` / `fill="rgba(1,73,155,0.15)"` fixos → `#268A97` / `rgba(38,138,151,0.15)`. Onde possível, troque por `stroke="currentColor"` e deixe a cor vir do CSS. |
| `pitometria-card.component.scss` | `darken(#1b5e20, 8%)` → `darken(t.$brand, 8%)`, não um hex fixo. |
| Ícone/manifest/tema do navegador | Se `index.html` tiver `<meta name="theme-color">` ou o manifest usar o verde, atualizar para `#1D707C`. |
| Favicon / logo | Se o logo tem verde chapado, pedir a versão teal ao time de marca — não recolorir por CSS filter. |

## Ordem de execução sugerida
1. Criar `_tokens.scss` e importar em `styles.scss`.
2. Converter `_dialog-base.scss` e `_admin-list-base.scss` (cobrem admin, diálogos e as 4 listas de uma vez).
3. Converter `styles.scss` (barra superior, overrides globais do Material, resíduos `rgba(1,73,155,…)`).
4. Converter os componentes do `manager` (já usam a convenção `$brand`) — troca mecânica.
5. Converter os componentes do `webgis` (`$blue`/`$text`) — exige decidir fundo vs. texto em cada uso.
6. Telas de segurança e relatórios.
7. Hexes em `.ts` e SVG inline.

Passos 1–4 já entregam a maior parte da percepção de mudança; 5–7 eliminam as ilhas verdes.

## Critérios de aceite
1. `grep -ri "1b5e20\|14532d\|eef5ec\|e2eee0\|1a2e1f\|4d6b52\|6b8f74\|e7f0e7\|edf4ea\|f0f6ed" src/`
   não retorna nada.
2. `grep -r "rgba(1, *73, *155" src/` não retorna nada.
3. Nenhum arquivo além de `_tokens.scss` declara a paleta; nenhum `$blue`/`$RunForrestGIS-blue` sobra.
4. Texto branco sobre fundo de marca: **nada abaixo de 14px sobre `#268A97`** — nesses casos, `#1D707C`.
5. Texto de marca sobre branco abaixo de 14px usa `#1D707C`.
6. Barra superior, mobile e web, em `#1D707C`.
7. Estados (perigo, atenção, publicado, raster, favorito) inalterados e ainda distinguíveis do teal.
8. Traços de seleção no mapa e séries dos relatórios visíveis e mutuamente distinguíveis.
9. Layout, espaçamentos, raios e tipografia **idênticos** — o diff é só de cor.
