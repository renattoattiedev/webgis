# ROTEIROS — Vídeo de Demonstração WebGIS RunForrestGIS

> Objetivo: demonstrar a publicação de um shapefile de quadras de Brasília no GeoServer e o consumo no WebGIS, com narração 100% em PT-BR.
> Formato de cada roteiro: **Cenas (com tempo)** + **Narração contínua** (pronta para TTS/voz de IA).

---

## 1️⃣ ROTEIRO CURTO (30–45s) — "Visão Geral Rápida"

**Público:** redes sociais, e-mail, quick demo.

### Cenas
- **Cena A (0:00-0:05):** Abertura — logo RunForrestGIS
- **Cena B (0:05-0:20):** Tela do WebGIS com mapa de Brasília + camada de quadras verde
- **Cena C (0:20-0:35):** Cartão final com chamada para ação

### Narração
> Com o RunForrestGIS, publicar dados geoespaciais ficou simples. Importamos as quadras de Brasília, definimos a visualização com um estilo e a camada já aparece no mapa, pronta para consulta. Publique seus dados e tenha uma base integrada, direto no seu WebGIS. Conheça o RunForrestGIS.

---

## 2️⃣ ROTEIRO COMPLETO (2–3 min) — "Passo a Passo"

**Público:** usuários finais, demonstração de produto.

### Cenas
- **Cena 1 (0:00-0:12):** Abertura — logo + contexto
- **Cena 2 (0:12-0:30):** O dado: shapefile de quadras + sistema de coordenadas
- **Cena 3 (0:30-1:10):** Publicação no GeoServer (datastore → camada → estilo SLD)
- **Cena 4 (1:10-1:50):** Consumo no WebGIS (login → mapa → camada visível)
- **Cena 5 (1:50-2:10):** Resultado + destaque do rodapé "Brasília, DF"
- **Cena 6 (2:10-2:25):** Fechamento + CTA

### Narração
> Apresentamos o RunForrestGIS, a plataforma geoespacial para publicação e gestão de dados cadastrais. Nesta demonstração, vamos publicar um arquivo de quadras e visualizá-lo diretamente no mapa.
>
> Aqui está o dado de entrada: um conjunto de quadras da região de Brasília, no sistema de coordenadas Sirgas 2000 UTM, zona vinte e três sul. São mais de cinco mil polígonos que representam os quarteirões cadastrais.
>
> No servidor geoespacial, criamos uma conexão com o banco de dados RunForrest. Registramos a camada de quadras e associamos a ela um estilo, que define como os polígonos são desenhados: preenchimento verde com contorno escuro. A camada fica publicada e pronta para consumo.
>
> Agora, acessamos o RunForrestGIS. O mapa abre centrado em Brasília. A camada de quadras já está disponível: navegamos e visualizamos os polígonos renderizados sobre o mapa, todos integrados à plataforma.
>
> O resultado é uma base geoespacial completa, reforçada pela nossa identidade, Brasília, Distrito Federal. Com o RunForrestGIS, publicar e consumir dados é rápido, integrado e escalável.
>
> Obrigado por assistir. Conheça o RunForrestGIS e modernize seus dados espaciais.

---

## 3️⃣ ROTEIRO TÉCNICO (3–4 min) — "Como Funciona por Dentro"

**Público:** desenvolvedores, administradores de dados, equipe técnica.

### Cenas
- **Cena 1:** Arquitetura: QGIS/importação → PostGIS (banco runforrest) → GeoServer → WebGIS
- **Cena 2:** Importação do shape via banco PostGIS (schema camadas, SRID 31983)
- **Cena 3:** Publicação da camada no GeoServer + datastore + SLD
- **Cena 4:** Consumo WMS/WFS no WebGIS
- **Cena 5:** Resultado + parâmetros técnicos

### Narração
> Nesta demonstração técnica, mostramos o fluxo completo de publicação de dados espaciais no RunForrestGIS. O dado parte de um arquivo de quarteirões de Brasília, no sistema de coordenadas Sirgas 2000 UTM zona vinte e três sul, equivalentes ao EPSG três um nove oito três.
>
> A importação é feita no banco espacial RunForrest, no esquema camadas. O PostGIS armazena a geometria como multipolígonos, com índice espacial para consultas rápidas. São mais de cinco mil registros.
>
> No GeoServer, configuramos um repositório de dados que aponta para esse banco. A camada de quadras é publicada e vinculada a um estilo SLD, que controla o preenchimento verde e o contorno escuro. O serviço é disponibilizado nos padrões WMS e WFS, abertos e interoperáveis.
>
> No WebGIS, o consumidor acessa a camada pelo catálogo, adiciona ao mapa e navega sobre os polígonos. A escala, a projeção e o desenho vêm prontos do servidor.
>
> Esse fluxo garante um pipeline de dados robusto: do arquivo ao mapa, com qualidade e padronização. Com o RunForrestGIS, sua infraestrutura de dados está pronta para escalar.

---

## 4️⃣ ROTEIRO DE GESTÃO (1–1,5 min) — "Para Tomadores de Decisão"

**Público:** stakeholders, gestores, órgãos públicos.

### Cenas
- **Cena 1:** Abertura — problema / valor
- **Cena 2:** O dado de quadras de Brasília publicado
- **Cena 3:** Visualização integrada no mapa
- **Cena 4:** Fechamento — benefícios (integração, agilidade, Governo/empresa)

### Narração
> Para quem decide, o que importa é o resultado. O RunForrestGIS transforma dados espaciais em decisão. Com um arquivo de quadras de Brasília, publicamos a camada e ela aparece integrada no mapa, em minutos, sem depender de equipes externas.
>
> A plataforma centraliza a gestão da base geoespacial, garante a padronização dos dados e acelera a tomada de decisão, do planejamento urbano à operação diária.
>
> É a infraestrutura de dados que o seu órgão precisa: integrada, escalável e com identidade própria, Brasília, Distrito Federal.
>
> Conheça o RunForrestGIS e leve sua gestão geográfica para o próximo nível.

---

## 📋 Resumo dos 4 roteiros

| # | Roteiro | Duração | Público | Uso |
|---|---|---|---|---|
| 1 | **Curto** | 30–45s | Geral / redes | Divulgação rápida |
| 2 | **Completo** | 2–3 min | Usuários / produto | Demonstração padrão |
| 3 | **Técnico** | 3–4 min | Dev / dados | Pipeline e arquitetura |
| 4 | **Gestão** | 1–1,5 min | Gestores / órgão | Apresentação executiva |

---

## 🎙️ Observações para gravação
- Todos os textos estão **100% em PT-BR** (sem termos que a TTS leia em inglês).
- Termos técnicos foram aportuguesados para a narração (ex.: "servidor geoespacial" em vez de "GeoServer" lido em inglês) — mas na tela, os nomes originais aparecem.
- Tempos são estimativas; a narração final pode variar ±10s.