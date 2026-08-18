# Handoff: Mapas do Gestor no mobile — v2 (mapa primeiro)

## Contexto
Substitui a proposta 2C de `design_handoff_manager_mobile`, **já implementada** em
`maps.component.scss` (bloco `@media (max-width: 768px)`, linhas ~513–827). O resultado ficou
sobrecarregado: o mapa continuou sendo um painel de editor, com 164px de cromo fixo acima
(nav 60 + tabs 52 + `.mp-bar` 52) e, sobre ele, 5 controles do OpenLayers de 44px, 4 pílulas de
ferramenta, busca de largura total e uma folha branca permanente de 64px.

Esta v2 inverte a hierarquia: **o mapa é a tela**; todo o resto é cromo flutuante mínimo,
colapsado por padrão.

Só mobile (`max-width: 768px`). Desktop e o bloco de 1100px não mudam.

## Sobre os arquivos deste pacote
`Manager Mobile.dc.html` é referência de design em HTML — protótipo de aparência e
comportamento, **não código de produção**. Implemente em **Angular 16 + Angular Material 16 + SCSS**
no componente existente. A seção do topo é o **TURNO 4 (4A)**, com 4 telas:
Repouso · Controles expandidos + busca · Folha do ⋯ · Camadas a 52%.
Ignore os turnos 3 e 2 e a seção "ATUAL" — já entregues.

## Fidelidade
**Alta fidelidade.** Medidas, cores e opacidades abaixo são finais.

## Arquivos que serão tocados
| Arquivo | O que muda |
|---|---|
| `manager/maps/maps.component.scss` | Reescrever o bloco `@media (max-width: 768px)` (linhas ~513–827) |
| `manager/maps/maps.component.html` | Cromo flutuante; remover as pílulas de ferramenta; folha do ⋯ |
| `manager/maps/maps.component.ts` | `overviewMapEnabled`, estado da folha, estado do cluster de controles |
| `manager/content/content.component.{html,scss}` | Ocultar a faixa de tabs quando a aba ativa é Mapas, em ≤768px |

---

## 1 · Recuperar os 104px

Duas faixas saem da tela de mapa em ≤768px:

- **Tabs (52px)** — `.ct-tabs` recebe `display:none` quando a aba ativa é Mapas. O acesso de volta
  é o **‹ voltar** flutuante (chevron), que reexibe as tabs / volta para a última aba de conteúdo.
  Aplicar via classe no host de `content.component` (ex.: `.ct-page.is-maps-mobile`), não com `:has()`.
- **`.mp-bar` (52px)** — `display:none` inteira. Nada dela sobrevive como barra: o que era título,
  Salvar, Camadas, busca e grupos de ferramenta reaparece como cromo flutuante ou dentro do ⋯.
  Remover também os elementos `.mp-mobile-*` criados na v1 (`-layers-pill`, `-save-btn`,
  `-more-btn`, `-title`, `-search-wrap`, `-tool-pills`) — esta v2 os substitui.

```scss
.mp-stage { height: calc(100dvh - 60px); min-height: 0; }
```

Em 412×824 isso dá **734px** de mapa (era 630). `100dvh` é obrigatório (barra de endereço do Safari).

## 2 · Cromo do topo (flutuante)

Uma linha em `position:absolute; top:12px; left:12px; right:12px; z-index:30`, `gap:8px`,
`align-items:center`. Superfície comum dos três elementos:
`background: rgba(255,255,255,0.94)`, `border: 1px solid #e7f0e7`,
`box-shadow: 0 2px 8px rgba(11,37,69,0.14)`, `backdrop-filter: blur(6px)`.

| Elemento | Medidas | Ação |
|---|---|---|
| **‹ voltar** | 36×36, circular | Sai do mapa (reexibe tabs / navega para a lista) |
| **Chip do título** | altura 36, `radius:100px`, `padding:0 13px`, `gap:7px` | Tocar = `enableEdit()` |
| **Busca** | 36×36, circular, ícone 16px `#4d6b52` | Expande o campo (ver §4) |
| **⋯** | 36×36, circular, ícone 17px | Abre a folha de ações |

No chip: ícone de mapa 13px `#1b5e20` + nome 13px/600 `#1a2e1f` com ellipsis
(`min-width:0` no chip, `flex:1` no espaçador **depois** dele — o chip encolhe, os botões nunca).
Estado sujo = **ponto de 7px `#eab308`** ao fim do chip; o botão Salvar não fica na tela.
Em edição, o chip vira `input` com `border-color:#1b5e20` e
`box-shadow: 0 0 0 3px rgba(27,94,32,0.10)`, `font-size:14px` (evita zoom do iOS).

## 3 · Controles do OpenLayers — discretos e colapsados

Ancorados à **direita**, `right:14px`, verticalmente próximos ao meio
(`top:50%; transform:translateY(-58px)`), `flex-direction:column`, `gap:10px`, `z-index:25`.

**Superfície discreta** (vale para todos):
```scss
background: rgba(255,255,255,0.90);
border: 1px solid rgba(11,37,69,0.08);
box-shadow: 0 1px 4px rgba(11,37,69,0.10);
border-radius: 9px;
backdrop-filter: blur(4px);
```

- **Cápsula de zoom**: largura **32px**, dois botões de **32px** empilhados, separados por hairline
  `1px rgba(11,37,69,0.08)` com `margin: 0 7px`. Glifos 14px `#4d6b52`, `stroke-width:2.2`.
  Sem sombra pesada, sem 44px, sem borda verde.
- **Botão de expandir**: 32×32, mesma superfície, chevron duplo 14px `#6b8f74`. Fechado por padrão.
  Aberto: revela **uma** cápsula de 32px de largura com Home · Localização · Envelope
  (três botões de 32px, hairlines entre eles, glifos `#1b5e20`), e o próprio botão vira
  `background:#1b5e20` com chevron branco invertido. Recolhe ao tocar no mapa, ao abrir a folha
  de camadas ou o ⋯, e após 6s sem interação.
- Toque no mapa (`singleclick` sem ferramenta ativa) reduz **todo** o cromo a
  `opacity:0.55` por 2s e volta — o mapa nunca fica coberto durante a leitura.

### Implementação do posicionamento
`app-home`, `app-zoom-envolope` e `app-current-location` são compartilhados com o webgis
principal e cada um tem `.btn { position:absolute; top: 130/180/230px }` fixo por dentro.
Não empilhe os hosts com flex — **neutralize o offset interno** dentro de `.mp-stage` e
posicione os hosts como filhos do cluster:

```scss
.mp-stage .mp-map-view {
  ::ng-deep app-home,
  ::ng-deep app-zoom-envolope,
  ::ng-deep app-current-location {
    position: static !important;
    width: 32px !important; height: 32px !important;
    .btn { position: static !important; top: auto !important; left: auto !important;
           width: 32px !important; height: 32px !important; }
  }
}
```

Se `position:static` quebrar algum desses componentes, o fallback é manter os três hosts
absolutos com a **mesma** âncora (`top`/`right` iguais) e zerar o `top` do `.btn` interno —
nunca somar os offsets, que foi o defeito da v1.

`.ol-zoom`/`.custom-ol-zoom` continuam precisando de **altura explícita**
(`height: 68px !important` para dois botões de 32 + hairline) porque, com `overflow:hidden`,
não resolvem altura pelo conteúdo — mesma causa do bug da folha de filtros.

### OverviewMap
Não basta `display:none`: o controle continua sendo instanciado e redesenhado a cada
`moveend`, custando frames num aparelho fraco. **Não criar** o `OverviewMap` quando
`window.matchMedia('(max-width: 768px)').matches` (ou um input `overviewMapEnabled`), e
manter o `display:none !important` apenas como rede de segurança.

## 4 · Busca de endereço

Fechada = o botão de 36px no cromo do topo. Aberta, substitui a linha inteira:
campo de **44px**, `radius:100px`, `background:#fff`, `border:1px solid #1b5e20`,
`box-shadow: 0 4px 16px rgba(11,37,69,0.16), 0 0 0 3px rgba(27,94,32,0.10)`,
`padding:0 6px 0 14px`, input 13.5px (`font-size` mínimo 14px se houver zoom no iOS),
botão de limpar 34px circular `#edf4ea`.
Sugestões: card `#fff`, `border:1px solid #e7f0e7`, `radius:14px`,
`box-shadow: 0 8px 24px rgba(11,37,69,0.16)`, itens de **52px** com pino 15px `#6b8f74`,
título 13.5px com ellipsis e "Endereço" 11px `#6b8f74`, separador `1px #edf4ea` com
`margin-left:40px`. Ao escolher, fecha e volta ao botão.

## 5 · Folha de ações (⋯)

Backdrop `rgba(11,37,69,0.26)`; folha `#fff`, `border-radius:20px 20px 0 0`,
`box-shadow:0 -10px 40px rgba(11,37,69,0.22)`, alça 44×4 `#e2eee0`,
`padding-bottom: calc(20px + env(safe-area-inset-bottom))`.

1. **Cabeçalho** (`padding:4px 16px 12px`, `border-bottom:1px solid #edf4ea`): tile 32×32
   `#eef5ec`/`#1b5e20`, nome do mapa 14.5px/600, e embaixo **"Alterações não salvas"** 11.5px
   `#b45309` (ou "Salvo há 2 min" `#6b8f74`); à direita **Salvar** — altura 40,
   `padding:0 15px`, `radius:11px`, `#1b5e20`, 13px/600 — desabilitado quando não há alterações.
2. **Grade de atalhos** `grid-template-columns:repeat(4,1fr)`, `gap:8px`, `padding:10px 12px 4px`:
   4 tiles de **78px**, `radius:12px`, `background:#f0f6ed`, `border:1px solid #e7f0e7`,
   ícone 19px `#1b5e20` + label 11.5px/600: **Dados** (`showDataWindow()`), **Medir**,
   **Desenho**, **Imprimir**. Ferramenta ativa: tile `#eef5ec` com `border-color:#e2eee0`
   e label `#1b5e20`.
3. **Lista** de 54px, `gap:13px`, tile 32×32 `radius:9px`: Compartilhar mapa (com chevron),
   Renomear, Mapa de fundo (valor atual à direita em 12.5px `#6b8f74` — abre a folha de basemaps),
   separador, Novo mapa.

Ativar uma ferramenta fecha a folha. O formulário flutuante correspondente
(`.mp-floating-form`) continua vindo como folha inferior, como na v1
(`left:0; right:0; bottom:0; max-height:70%; radius:20px 20px 0 0`), agora com header de 44px
e X de 44px.

## 6 · Camadas — pílula + folha

**Sem barra permanente.** No repouso existe só uma pílula centralizada:
`position:absolute; left:0; right:0; bottom:14px`, `justify-content:center`;
altura **38**, `padding:0 15px`, `radius:100px`, `background:rgba(255,255,255,0.96)`,
`border:1px solid #e7f0e7`, `box-shadow:0 4px 16px rgba(11,37,69,0.18)`:
ícone 14px `#1b5e20` + "Camadas" 12.5px/600 + badge da contagem + chevron 12px.
Ela é o gatilho **e** a alça de arraste.

A folha (`.mp-sidebar` em mobile) tem **duas** alturas — `52%` e `88%` — mais o estado
fechado (folha ausente, só a pílula). Arrastar a alça ou a pílula alterna; arrastar para baixo
na altura mínima fecha. `transition: height .24s cubic-bezier(.32,.72,0,1)`.

Aberta: alça 44×4, abas **Camadas** (com badge) / **Legenda** (13px/600, indicador 2.5px `#1b5e20`)
e, à direita, botão **+** de 36×36 `radius:9px` `#eef5ec` borda `#e2eee0` (adicionar camada) —
o botão "Dados" sai daqui (mora no ⋯).

Linha de camada em mobile: `grid-template-columns: 26px 40px 1fr 40px 40px`, `gap:6px`,
`padding:6px 4px 6px 0`, `flex-shrink:0`:
alça 14px `#a9bcab` · thumb **40×40** `radius:8px` · título 13px/600 com ellipsis + chip de tipo
9.5px/700 uppercase (vetorial `#eef5ec/#1b5e20/#e2eee0`, raster `#fff7e6/#b35a00/#ffe0b3`) ·
**toggle de visibilidade** 40×40 (olho `#1b5e20` visível / olho cortado `#a9bcab` oculto — hoje
isso só existe no menu) · ⋯ 40×40.
`cdkDrag` com `cdkDragHandle` na alça da camada; a folha não captura o gesto quando ele começa ali.

## 7 · Basemap e escala

- `app-basemap`: **40×40**, `radius:11px`, `border:2px solid rgba(255,255,255,0.94)`,
  `box-shadow:0 2px 8px rgba(11,37,69,0.16)`, `left:12px`. `bottom` acompanha a folha:
  `14px` (fechada) · `calc(52% + 12px)` · `calc(88% + 12px)`.
- Escala do OpenLayers: `right:14px; bottom:16px`, 9.5px/600 `#8a998a`, sem caixa branca.

## Tokens
| Token | Valor |
|---|---|
| brand / brand-mid | `#1b5e20` / `#14532d` |
| tint / tint-2 | `#eef5ec` / `#e2eee0` |
| ink / ink-soft / muted / muted-2 | `#1a2e1f` / `#4d6b52` / `#6b8f74` / `#a9bcab` |
| line / line-soft / bg | `#e7f0e7` / `#edf4ea` / `#f0f6ed` |
| sujo / raster | `#eab308`, texto `#b45309` / `#fff7e6`,`#b35a00`,`#ffe0b3` |
| superfície de cromo | `rgba(255,255,255,0.94)` + `blur(6px)` |
| superfície de controle | `rgba(255,255,255,0.90)`, borda `rgba(11,37,69,0.08)`, sombra `0 1px 4px rgba(11,37,69,0.10)` |
| backdrop | `rgba(11,37,69,0.26)` |
| raios | 8 / 9 / 11 / 12 / 14 px · folha 20px topo · pílulas 100px |

Alvos: **44px** em voltar, ⋯, busca aberta, itens de folha, ações de camada e Salvar.
**32px** é intencional só no cluster de zoom/navegação (gesto secundário — pinça é o primário)
e 36px no cromo do topo.

## Assets
Nenhum novo. Todos os ícones são os SVG inline já presentes em `maps.component.html`
(feather-style, `stroke-width` 2–2.4, `fill:none`). O olho aberto/cortado da visibilidade e o
chevron duplo do cluster reaproveitam glifos já usados em outras telas do projeto — copie os `path`.

## Critérios de aceite
1. Em 412×824 o mapa tem **≥730px** de altura; nenhuma faixa branca fixa acima dele além do nav de 60px.
2. Nada flutua no canto inferior direito. Zero pílulas de ferramenta na tela.
3. Zoom em cápsula única de 32px; Home/Localização/Envelope invisíveis até o toque no botão de expandir.
4. Os 3 controles compartilhados aparecem **encostados** no cluster (offsets internos neutralizados),
   não espalhados por 200px de tela — foi o defeito da v1.
5. OverviewMap **não é instanciado** em ≤768px (verificar em `map.getControls()`).
6. No repouso, o único elemento na base é a pílula "Camadas · N".
7. Salvar continua alcançável em ≤2 toques e o estado sujo é visível sem abrir nada.
8. Desktop (>768px) e o bloco de 1100px pixel-idênticos ao atual.
