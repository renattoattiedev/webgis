# Handoff: Menu mobile do header (opção A — painel lateral com rótulos)

## Visão geral
Redesenho do menu sanduíche do header do WebGIS **apenas no breakpoint mobile** (`max-width: 768px`).
Hoje o `.header-tools.mobile-open` vira um card verde flutuante abaixo do header, com os
grupos do ribbon (ícones sem rótulo) quebrando em linhas. A proposta substitui isso por um
**drawer branco de altura total, entrando pela direita**, com conta no topo, busca de endereço
dentro do painel, ferramentas em linhas rotuladas e agrupadas, e rodapé fixo de ações.

Desktop (> 768px) **não muda em nada**.

## Sobre os arquivos deste pacote
`Menu Mobile.dc.html` é uma **referência de design feita em HTML** — um protótipo que mostra
aparência e comportamento pretendidos, **não código de produção para copiar**. A tarefa é
recriar esse desenho no ambiente já existente do projeto: **Angular 16 + Angular Material 16 +
SCSS**, dentro de `src/app/paginas/webgis/webgis.component.{html,scss,ts}`, usando os padrões
que já estão lá (`mat-icon` com ligaduras Material, variáveis SCSS do arquivo, `*ngIf`).

O arquivo tem 3 telas lado a lado: **1A** (a aprovada), **1B** (descartada) e o **atual recriado**.
Implemente somente **1A**.

## Fidelidade
**Alta fidelidade.** Cores, tipografia, espaçamentos e tamanhos abaixo são finais e devem ser
reproduzidos com precisão. Fonte: `system-ui, sans-serif` (a mesma já usada no header).

## Arquivos que serão tocados
| Arquivo | O que muda |
|---|---|
| `src/app/paginas/webgis/webgis.component.html` | Novo markup do drawer mobile; `app-search-address` passa a ser renderizado dentro dele |
| `src/app/paginas/webgis/webgis.component.scss` | Substituir o bloco `.header-tools.mobile-open` e `@media (max-width: 768px)`; overlay passa a ter fundo |
| `src/app/paginas/webgis/webgis.component.ts` | `mobileSearchOpen`/`openMobileSearch()` deixam de ser necessários; adicionar `mobileAccountOpen` |
| `src/app/paginas/webgis/componentes/menu-topo/menu-topo.component.{html,scss}` | Precisa expor os itens do ribbon como **lista rotulada** em mobile (ver "Ribbon em mobile") |

## Tela: drawer do menu mobile

### Geometria
- Overlay: `position: fixed; inset: 52px 0 0 0` (abaixo do header), `background: rgba(10,26,12,0.42)`, `z-index: 150`. Clique fecha.
- Drawer: `position: fixed; top: 52px; right: 0; bottom: 0; width: min(344px, 88vw)`,
  `background: #fff`, `box-shadow: -8px 0 32px rgba(0,0,0,0.28)`, `z-index: 200`,
  `display: flex; flex-direction: column`.
- Entrada: `transform: translateX(100%) → 0`, 220ms `cubic-bezier(.4,0,.2,1)`; overlay com fade de 180ms.
- O botão hamburguer no header cresce para **40×40px**, `border-radius: 10px` (hoje 36/6px);
  aberto: `background: rgba(255,255,255,0.26)`, ícone `close` 22px branco.

### 1. Bloco de conta (topo)
- `padding: 16px 18px`, `border-bottom: 1px solid #e9f0e8`, `display: flex; align-items: center; gap: 11px`.
- Avatar: 42×42, `border-radius: 50%`, `background: #1b5e20`, texto `{{ iniciais }}` branco 14px/800.
- Nome: 14.5px/700 `#1a2e1f`, `text-overflow: ellipsis`.
- Perfil: 11.5px/600 `#6b8f74`, `text-transform: uppercase`, `letter-spacing: .3px` (usar `perfilUser`).
- Botão à direita: 36×36, `border-radius: 9px`, `background: #f2f7f1`, ícone `chevron_right` 20px `#6b8f74`.
  Abre a submenu de conta (Meu Perfil / Painel Administrativo / Sair) — reaproveitar as ações do `.wg-dropdown`.
- Não logado: no lugar do bloco, botão "Entrar" cheio: altura 48, `border-radius: 12px`, `background: #1b5e20`, texto branco 14px/700.

### 2. Busca de endereço
- Wrapper `padding: 14px 18px 4px`.
- Campo: altura **48px**, `padding: 0 12px`, `background: #f2f7f1`, `border: 1px solid #e0ebdf`,
  `border-radius: 12px`, `gap: 9px`; ícone `search` 20px `#6b8f74`; placeholder "Digite o endereço"
  14px `#8fa393`; input transparente, sem borda, 14px `#1a2e1f`.
- **Renderizar `<app-search-address>` aqui dentro** (com `::ng-deep` sobrescrevendo `.search-container` para
  `width: 100%`). Isso **remove** o fluxo em dois passos: `.mobile-search-trigger`,
  `.mobile-search-sidebar` e `mobileSearchOpen` podem ser deletados.
- Sugestões (`.suggestions`) abrem em fluxo, largura total, dentro do drawer.

### 3. Lista de ferramentas (área rolável)
`flex: 1; overflow-y: auto; padding: 12px 10px 0`.

Cabeçalho de seção: 10.5px/800, `letter-spacing: 1.4px`, `color: #6b8f74`, `padding: 10px 8px 6px`.
Separador entre seções: `height: 1px; background: #edf4ea; margin: 12px 8px`.

Item (linha): `height: 56px`, `padding: 0 8px`, `gap: 12px`, `border-radius: 12px`,
`:active/:hover → background: #f4f9f3`.
- Tile do ícone: 38×38, `border-radius: 10px`, `background: #e9f2e7`, `mat-icon` 20px `#1b5e20`.
- Título: 14.5px/600 `#1a2e1f`. Subtítulo: 11.5px `#7e8f80`.
- Desabilitado: `opacity: .42`, `pointer-events: none`, tile `#eef1ec` + ícone `#63705f`, e o subtítulo
  **explica o motivo** (ex.: "Selecione uma vistoria") em vez de só esmaecer.

Conteúdo exato (mesmos `mat-icon` e mesmos handlers do `menu-topo.component.html`):

**PESQUISAR**
| Ícone | Título | Subtítulo | Ação |
|---|---|---|---|
| `travel_explore` | Pesquisa espacial | Desenhar área no mapa | `onPesquisaEspacialClick()` |
| `layers` | Pesquisar por camadas | Filtrar por atributos | `onPesquisarPorCamadasClick()` |
| `my_location` | Por coordenadas | UTM, MGRS ou grau | `onCoordinateConverterClick()` |

**IMPRIMIR**
| `print` | Impressão de croquis | Selecione uma vistoria (quando `!impressaoCroquisHabilitada`) | `onImprimirDadosVistoriaClick()` |

**PITOMETRIA** (só se `pitometriaHabilitada && podeVerPitometria`)
| `water_drop` | Pitometria | Cadastro de campanhas | `onPitometriaClick()` |
| `analytics` | Consulta DW | Série histórica | `onConsultaPitometriaClick()` |
| `travel_explore` | Consulta espacial | Pitometria por área | `onConsultaEspacialPitometriaClick()` |

Seções inteiras somem quando o usuário não tem permissão (mesmas condições de `shouldShowMenu`
e `podeVerPitometria` já existentes) — nunca mostrar seção vazia.

### 4. Rodapé fixo
`border-top: 1px solid #e9f0e8`, `background: #fbfdfa`, `padding: 10px 14px 16px`,
`display: flex; flex-direction: column; gap: 8px` (respeitar `env(safe-area-inset-bottom)`).
- Linha 1 — dois botões `flex: 1`, altura 46, `border-radius: 11px`, `background: #f2f7f1`,
  `border: 1px solid #e0ebdf`, texto 13.5px/600 `#1b5e20`, ícone 19px:
  `home` **Início** (→ `goToPage('')`) e `bookmark` **Preferências**.
- "Preferências" abre/expande as duas ações do `app-preferencias` (Salvar/Atualizar e Remover) +
  a linha "Última atualização" — só quando `isLoggedIn()`. Não usar `mat-mini-fab` aqui.
- Linha 2 — **Sair**: altura 46, sem fundo, texto e ícone `logout` 19px em `#dc2626`, centralizado.
  Chama `logout()`.

## Ribbon em mobile
`app-menu-topo` hoje só sabe renderizar o ribbon horizontal de ícones. Duas saídas — escolher uma:
1. **Preferida**: extrair a lista de ferramentas do `menu-topo.component.ts` para um array
   (`{ icon, titulo, descricao, secao, disabled, action }`) e renderizar dois templates a partir dele:
   `.ribbon-container` (desktop, inalterado) e a lista do drawer (mobile).
2. Alternativa rápida: um `@Input() variant: 'ribbon' | 'list'` no componente.

Em nenhum caso reaproveitar `.ribbon-group` com `flex-wrap` — o card de ícones sem rótulo é
exatamente o que está sendo removido.

## Comportamento
- Abrir/fechar: hamburguer alterna; clique no overlay, `Escape` e a seleção de qualquer ferramenta fecham o drawer.
- Ao abrir, travar o scroll do body; ao fechar, devolver o foco ao hamburguer. Focus trap dentro do drawer.
- `aria-expanded` no hamburguer; `role="dialog" aria-modal="true" aria-label="Menu"` no drawer.
- Substituir o `@HostListener('document:click')` que fecha por `.closest('.header-tools')` pelo clique no overlay.
- Estados de toque em vez de `:hover` (sem hover em mobile): usar `:active` para o `#f4f9f3`.

## Estado
```ts
mobileMenuOpen = false;      // drawer
mobileAccountOpen = false;   // submenu de conta dentro do drawer
mobilePrefsOpen = false;     // bloco de preferências no rodapé
// remover: mobileSearchOpen, openMobileSearch(), closeMobileSearch()
```

## Tokens de design
| Token | Valor |
|---|---|
| Verde da marca | `#1b5e20` (`$RunForrestGIS-blue`, já existe) |
| Superfície do drawer | `#fff` |
| Superfície do rodapé | `#fbfdfa` |
| Superfície de campo / botão suave | `#f2f7f1` |
| Tile de ícone | `#e9f2e7` |
| Item pressionado | `#f4f9f3` |
| Bordas | `#e9f0e8`, `#e0ebdf`, `#edf4ea` |
| Texto primário | `#1a2e1f` |
| Texto secundário / rótulo | `#6b8f74` |
| Texto de apoio | `#7e8f80`, `#8fa393` |
| Perigo | `#dc2626` |
| Overlay | `rgba(10,26,12,0.42)` |
| Raios | 9 / 10 / 11 / 12 px |
| Sombra do drawer | `-8px 0 32px rgba(0,0,0,0.28)` |
| Alvos de toque | 44px mínimo (linhas 56, botões 46/48, ícone-botão 40) |

Escala tipográfica: 10.5 (rótulo de seção) · 11.5 (subtítulo/perfil) · 13.5 (botões do rodapé) ·
14 (campo de busca) · 14.5 (título de item, nome do usuário). Pesos: 600 / 700 / 800.

## Assets
Nenhum novo. Todos os ícones são ligaduras do **Material Icons** já carregado no projeto, via
`<mat-icon>`: `travel_explore, layers, my_location, print, water_drop, analytics, search,
chevron_right, home, bookmark, logout, close, save, delete`.
O logo/pill do header (`.launcher-pill`) não muda.

## Critérios de aceite
1. Em ≤768px, o hamburguer abre o drawer da direita; nenhum card verde flutuante abaixo do header.
2. Todo item de ferramenta mostra rótulo em texto; nenhum ícone solto sem nome.
3. Buscar endereço funciona sem abrir uma segunda sidebar.
4. Nenhum alvo de toque abaixo de 44px.
5. Layout desktop (>768px) pixel-idêntico ao atual.
6. Itens sem permissão continuam ocultos; croquis desabilitado mostra o motivo.
