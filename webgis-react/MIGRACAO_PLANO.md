# Plano de Migração — Angular → React (webgis-react)

## Escopo real (levantado do Angular)
O app Angular (`webgis/`) tem **~180 arquivos de componente**. O esqueleto React atual só tem os containers/telas. Este plano cobre a migração **por fases**, componente a componente.

## Arquitetura alvo no React
- **Store de mapa**: React Context + `zustand` (substitui `MapaService` + `@angular/core` + `rxjs`)
- **OpenLayers** mantido (mesma lib já usada)
- **Serviços** → hooks (`useCamadas`, `useMapa`, `useBasemap`, etc.)
- **Auth**: token JWT via `localStorage` (já implementado em `src/lib/api.ts`)

## FASE 0 — Fundação (pré-requisito de todas as outras)
Criar no React a infraestrutura que todo componente de mapa precisa:
- [x] `MapaContext` (Map OpenLayers singleton + estado: scale, swipe, identify, basemap, zoom manual)
- [x] `api.ts` (auth + fetch com token)
- [ ] `GeoServerLayerFactory` / GetCapabilities (srcs WMS/WMTS)
- [ ] `camadas` store (listagem, e load do conteúdo do webgis)

## FASE 1 — WebGIS (módulo de mapa) — 76 componentes
Portar, em ordem de dependência:
1. **Mapa (`mapa.component`)** — o canvas principal + inicialização do Map e interações
2. **Menu-topo** — barra superior (ferramentas do mapa)
3. **Basemap** — troca de camada base
4. **Escala** — indicador
5. **Customzoom** (+, −)
6. **Current-location** — localização do usuário
7. **Drawing** — desenhar poligonos/pontos/linhas
8. **Measure** — medir distância/área
9. **Identify** — identificar feições no clique
10. **Spatial-search** / **Filter-data** — filtrar por atributo/região
11. **Consulta-pitometria** — painel de consulta a pontos
12. **Thematic** — mapa temático/estilo
13. **Printing** — impressão
14. **Croqui de vistoria** (imprimir-croqui) — dialogs
15. **Pesquisar-camadas-dialog** — busca de camadas
16. **Preferencias** — persistencia do usuário (basemap, zoom)
17. **Home / Conteudos / Perfil-conteudo** — painel lateral

## FASE 2 — Manager — Entidades/Admin (~24 comp)
- `admin/` (basemaps, componentes, config, grupos/temas/pacotes) com dialogs CRUD

## FASE 3 — Manager — Conteúdo/Conteúdo operacional (~60 comp)
- `my-content` (camadas/raster/folders/mapas CRUD, dialogs)
- `grupos` (grupo-detalhe, grupos-page)
- `maps` (salvar mapa)
- `organization-content` (organization-wide)

## FASE 4 — Manager — Relatórios (4 comp)
- `relatorio` (inventario, uso, usuários) + service

## FASE 5 — QA, testes e commit por fase

## Como executar
- **Claude Code** (`claude -p ...`) por fase, com `--allowedTools` e `--max-turns`
- **Commit após cada fase** (evita mega-diff)
- **QA** por fase: `npm run build && npm run test` no webgis-react

---
**Priorização sugerida para esta sessão:** Fase 0 (fundação) + início da Fase 1 (Mapa + Basemap + Escala). É o núcleo que destrava o resto.