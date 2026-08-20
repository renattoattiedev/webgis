# Favicon — RunForrestGIS

Gerado a partir de `Gemini_Generated_Image_4hj1o74hj1o74hj1.jpg`.

A arte original tem ~40 elementos (skyline, bússolas, malhas, satélites, texto "GIS") e some por
completo abaixo de 64px. Por isso o ícone usa **dois recortes**, ambos mascarados em círculo com
anel `#1D707C` (o brand-deep do tema teal):

- **16 · 32 · 48px** — recorte fechado no corredor, que é o único elemento legível nesse tamanho.
- **64px ou mais** — o disco completo (corredor + malha), que já aguenta o detalhe.

## Arquivos
| Arquivo | Uso |
|---|---|
| `favicon.ico` | 16+32+48 num só arquivo, para `/favicon.ico` na raiz |
| `favicon-16x16.png`, `-32x32`, `-48x48` | abas e favoritos |
| `favicon-64x64.png`, `-96x96` | atalhos de desktop, Windows |
| `apple-touch-icon.png` (180) | iOS — quadrado opaco, iOS arredonda sozinho |
| `icon-192.png`, `icon-512.png` | PWA / manifest |
| `icon-512-maskable.png` | Android adaptive — conteúdo na zona segura de 72%, fundo `#1D707C` |

Os `_*.png` são folhas de conferência, não entram no build.

## Instalação (Angular)
Copie os arquivos para `src/assets/favicon/` e o `favicon.ico` para `src/` (a raiz servida).
Confirme que `angular.json` já lista `src/favicon.ico` e `src/assets` em `assets`.

Em `src/index.html`, dentro do `<head>`:

```html
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="assets/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="assets/favicon/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/favicon/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#1D707C">
```

`manifest.webmanifest`:

```json
{
  "name": "RunForrestGIS",
  "short_name": "RunForrestGIS",
  "theme_color": "#1D707C",
  "background_color": "#EFF6F7",
  "display": "standalone",
  "icons": [
    { "src": "assets/favicon/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/favicon/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "assets/favicon/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

O `theme-color` `#1D707C` é o mesmo da barra superior no tema teal — se o tema ainda não foi
trocado, use `#1b5e20` até a troca entrar.

## Observação
O ícone foi recortado de uma imagem raster de 2048px. Para material impresso, telas de login em
alta densidade ou o logo do header, peça ao time de marca um **SVG vetorial** do corredor — o
recorte aqui é suficiente para favicon e ícone de app, não para ampliação.
