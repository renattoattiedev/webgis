# Handoff: ilustração na home do WebGIS (hero da index)

Aplica a arte do RunForrestGIS ao hero da página inicial, **web e mobile**.
Referência visual: **TURNO 6 / seção 6B** de `Manager Mobile.dc.html` (hero 1440 + smartphone
+ os três cards de justificativa à direita). A seção **6A**, logo abaixo, é a versão de medalhão
circular — **descartada**, mantida só para comparação. Não implemente 6A.

## Sobre os arquivos deste pacote
- `assets/hero-gis.png` — a arte **já recortada do papel**, pronta para uso: 1536×1536, PNG com
  canal alfa, ~1,4 MB.
- `Manager Mobile.dc.html` — referência de design em HTML: protótipo de aparência,
  **não código de produção**. Recrie em **Angular 16 + SCSS** no componente existente
  (`src/app/paginas/index/index.component.{html,scss}`), com os padrões que já estão lá.

## Fidelidade
**Alta fidelidade.** Medidas, cores e tipografia abaixo são finais.
Fontes: as já usadas na index (`Geist` para a UI, `Instrument Serif` itálico apenas nos `<em>`
dos títulos — mesmo padrão de "Meu *conteúdo*" no gestor).

## Cores
Este handoff usa os tokens do **tema teal** (`design_handoff_tema_teal`).
Se a troca de tema ainda não entrou, substitua `#1D707C` → `#1b5e20`, `#268A97` → `#1b5e20`,
`#102C31` → `#1a2e1f`, `#3C5F65` → `#4d6b52`, `#6A8A90` → `#6b8f74`, `#DDEBED` → `#e7f0e7`,
`#E9F3F4` → `#edf4ea`, `#E8F4F6` → `#eef5ec`, `#CDE6EA` → `#e2eee0`.

---

## 1 · O asset

Copie `assets/hero-gis.png` para `src/assets/imagens/hero-gis.png`.

**Antes de commitar, otimize:**

```bash
pngquant --quality=70-88 --strip --force --output hero-gis.png hero-gis.png
```

Deve sair de ~1,4 MB para ~300 KB sem perda visível. 1,4 MB no hero é inaceitável — é o primeiro
byte que o usuário espera.

Gere também as variantes servidas por `srcset` (ou deixe o pipeline de build fazer):

| Arquivo | Largura | Uso |
|---|---|---|
| `hero-gis.png` | 1536 | fallback e telas 2× |
| `hero-gis-1024.png` | 1024 | desktop 1× |
| `hero-gis-668.png` | 668 | mobile 2× |
| `hero-gis.webp` + variantes | — | `<source type="image/webp">`, ~35% menor |

**Como o recorte foi feito** (só para referência, caso precise regerar a partir de outra arte):
preenchimento por conexão a partir das quatro bordas, cor-alvo amostrada nos quatro cantos
(245,242,239), tolerância 34 em distância Manhattan RGB. Remover **por conexão** e não por cor é
o que preserva os brancos internos — o disco central, as janelas dos prédios, o contorno branco
do corredor. Saiu 59% da área.

**Ponto frágil:** os pontinhos soltos da coroa (as reticências que orbitam a composição). Confira
a borda em zoom depois de otimizar — se o `pngquant` comer os pontos mais claros, suba a qualidade
mínima para 80.

---

## 2 · Hero web (≥1024px)

Duas colunas, **texto à esquerda, arte à direita**, sobre `background: #fff`.

- **Sem gradiente, sem halo, sem cartão atrás da arte.** A ilustração é densa; qualquer forma
  colorida ao fundo vira ruído. O espaço em branco é o que a faz respirar. Se houver hoje um
  `radial-gradient` ou blob decorativo no hero, **remova**.
- **Sem moldura na imagem**: nada de `border`, `border-radius` ou `box-shadow`. A arte tem
  contorno branco próprio e silhueta irregular — a silhueta É a forma.

### Coluna de texto (largura 400px, `gap: 22px`)
1. **Selo**: altura 30, `padding: 0 13px`, `radius: 100px`, `background: #E8F4F6`,
   `border: 1px solid #CDE6EA`, ponto de 6px `#268A97` + texto 11,5px/700
   `letter-spacing: .8px` uppercase `#1D707C` — "Infraestrutura de dados espaciais".
2. **Título**: 46px/600, `line-height: 1.1`, `letter-spacing: -1.4px`, `text-wrap: balance`,
   `#102C31`; segunda linha em `<em>` serif itálico **50px** `#268A97`.
3. **Subtítulo**: 15,5px, `line-height: 1.62`, `text-wrap: pretty`, `#3C5F65`.
4. **Ações**, `gap: 12px`, altura **52**: primária `padding: 0 26px`, `radius: 12px`,
   `background: #1D707C`, 15px/600 branco, com seta de 16px; secundária `padding: 0 24px`,
   `#fff`, `border: 1px solid #DDEBED`, `#3C5F65`, 15px/500.
5. **Números**, separados por `border-top: 1px solid #E9F3F4` (`padding-top: 16px`),
   `gap: 26px`, divisores de 1×30px `#E9F3F4`: valor 21px/600 `letter-spacing: -.5px` `#102C31`
   sobre rótulo 11,5px `#6A8A90`. Os três valores (`1.284 camadas`, `37 órgãos`, `2004 série
   desde`) são **ilustrativos** — ligue aos contadores reais ou remova o bloco. Não publique
   número inventado.

### Coluna da arte
`width: 492px; height: 492px`, alinhada ao topo do bloco de texto com leve avanço
(`top: 24px` relativo ao hero, `right: 34px`).
Regra de escala: a arte ocupa ~34% da largura do viewport em 1440px. Use
`width: clamp(360px, 34vw, 560px)` e mantenha `aspect-ratio: 1`.

### Abaixo de 1024px (tablet)
Vira uma coluna, arte em cima centralizada em `clamp(300px, 46vw, 420px)`, texto centralizado.
É o mesmo layout do mobile, só com medidas maiores.

---

## 3 · Hero mobile (≤768px)

Uma coluna, tudo centralizado, `padding: 0 22px`, sobre `#fff`.

| Ordem | Elemento | Medidas |
|---|---|---|
| 1 | Arte | 334×334, centralizada, `margin-top: 6px` |
| 2 | Selo | altura 28, `padding: 0 12px`, texto 10,5px/700 |
| 3 | Título | 31px/600, `line-height: 1.14`, `letter-spacing: -.9px`; `<em>` serif 34px |
| 4 | Subtítulo | 14,5px, `line-height: 1.6`, `max-width: 330px` |
| 5 | Ações | duas, largura total, altura **54**, `radius: 13px`, 15,5px, `gap: 11px` |
| 6 | Números | `border-top: 1px solid #E9F3F4`, `padding-top: 18px`, três colunas iguais com divisores de 1×30px; valor 19px/600, rótulo 11px |

`gap: 15px` entre selo, título e subtítulo; `gap: 26px` entre esse bloco e as ações.

A arte em 334px é o maior tamanho que ainda deixa título e as duas ações acima da dobra num
iPhone SE (667px de altura útil). **Não aumente** — empurrar o "Abrir o mapa" para fora da
primeira tela custa mais do que a ilustração maior entrega.

Em telas muito baixas (`@media (max-height: 640px)`), reduza a arte para 260px.

---

## 4 · Implementação da imagem

```html
<picture class="idx-hero-art">
  <source type="image/webp"
          srcset="assets/imagens/hero-gis-668.webp 668w,
                  assets/imagens/hero-gis-1024.webp 1024w,
                  assets/imagens/hero-gis.webp 1536w"
          sizes="(max-width: 768px) 334px, clamp(360px, 34vw, 560px)">
  <img src="assets/imagens/hero-gis.png"
       srcset="assets/imagens/hero-gis-668.png 668w,
               assets/imagens/hero-gis-1024.png 1024w,
               assets/imagens/hero-gis.png 1536w"
       sizes="(max-width: 768px) 334px, clamp(360px, 34vw, 560px)"
       width="1536" height="1536"
       alt="" role="presentation"
       fetchpriority="high" decoding="async">
</picture>
```

- **`alt=""` + `role="presentation"`.** A ilustração é decorativa: tudo que ela comunica já está
  no título e no subtítulo ao lado. Um `alt` descritivo aqui faria o leitor de tela recitar uma
  lista de ícones antes do conteúdo real.
- **`width`/`height` explícitos** reservam a caixa e evitam salto de layout (CLS).
- **`fetchpriority="high"`** — é o LCP provável da página.
- **Sem `loading="lazy"`** no hero. Lazy só faria atrasar o elemento mais visível.

---

## 5 · O vídeo — **fora deste escopo**

O `gere_para_mim.mp4` (H.264, 1280×720, 10,01s, 2,6 MB, com faixa de áudio) **não entra agora**.
Três razões, registradas para quando o assunto voltar:

1. Sem máscara circular, o vídeo é um retângulo 16:9 **opaco** — apareceria como uma caixa sobre o
   branco, destruindo a silhueta recortada que é o ponto desta proposta.
2. Manter a coroa **e** ter movimento exigiria vídeo com **canal alfa** (WebM VP9 + alpha, sem
   suporte no Safari até recentemente) ou animar elementos em CSS/SVG sobre a arte parada.
3. 2,6 MB de animação decorativa antes do primeiro gesto, em 4G, não se paga.

Se um dia entrar: só desktop, só com `prefers-reduced-motion: reduce` respeitado, com botão de
pausa visível, sem a faixa de áudio (autoplay exige mudo — a trilha é peso puro) e com o loop
conferido quadro a quadro.

---

## 6 · Acessibilidade e desempenho

- Contraste conferido: `#102C31` em branco 15,7:1; `#3C5F65` 6,96:1; `#6A8A90` 3,72:1 (só em
  rótulos ≥11px não essenciais); branco sobre `#1D707C` 5,74:1. Todos passam.
- `prefers-reduced-motion`: se houver qualquer transição de entrada no hero, encurte para 0.
- A imagem não deve ter `title` nem ser focável.
- Meta `theme-color` da página: `#1D707C`.

## Critérios de aceite
1. A ilustração aparece **inteira** — skyline, as três bússolas, o globo, o avião de papel e o
   "GIS" visíveis; nada cortado por máscara, borda ou `overflow`.
2. Nenhuma moldura, sombra, cartão ou gradiente atrás da arte; fundo do hero em `#fff` puro.
3. Nenhuma borda visível do PNG (halo bege) contra o branco — inspecione em zoom 400%.
4. Em ≤768px, título e as **duas** ações ficam acima da dobra num viewport de 375×667.
5. `hero-gis.png` servido em ≤350 KB (ou WebP equivalente).
6. Sem salto de layout no carregamento (CLS ≈ 0) — `width`/`height` presentes.
7. A imagem não é anunciada por leitor de tela.
8. Nenhum `<video>` na home.
