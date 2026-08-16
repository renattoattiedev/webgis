# WebGIS — Frontend React

Novo frontend do sistema WebGIS, migrado de **Angular** para **React** (para um cliente genérico, sem referências à marca anterior).

## Stack

- **Vite** + **React 18** + **TypeScript**
- **React Router v6**
- **OpenLayers (ol)** para o mapa interativo
- **Vitest** + **Testing Library** para testes
- Tipografia **Geist** + **Instrument Serif**
- Tema via **CSS custom properties** (`src/styles/theme.css`)

## Estrutura

```
webgis-react/
├── src/
│   ├── App.tsx              # Rotas
│   ├── main.tsx             # Bootstrap
│   ├── styles/theme.css     # Tema (paleta via CSS vars)
│   ├── pages/               # Telas (Index, Login, Webgis, Dados, Manager, ...)
│   ├── test/setup.ts        # Setup de testes
│   └── App.test.tsx         # Testes de smoke
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

## Comandos

```bash
npm install        # instala dependências
npm run dev        # servidor de dev (porta 4201)
npm run build      # build de produção (tsc --noEmit + vite build)
npm run test       # roda testes (vitest run)
npm run preview    # serve o build
```

## Design & marca

- Nome da plataforma: **GEO PORTAL** (genérico)
- Paleta nova (teal/esmeralda profundo + neutros frios) — definida em CSS variables, fácil de trocar por cliente.
- Mantém o layout moderno do projeto original (navbar, hero, módulos, temas).

## Integração com o backend

O backend NestJS fica em `../webgis-back-end/`. O Vite proxy envia `/api` para o backend (config abaixo). Ajuste `VITE_API_URL` se necessário.

```js
// vite.config.ts
server: {
  proxy: { '/api': { target: process.env.VITE_API_URL || 'http://localhost:3333' } }
}
```

## Status

- Telas portadas: Index (home), Login, Register, Recovery, Webgis (mapa), Dados, Manager.
- Mapa interativo usa OpenLayers (camada base OSM).
- Autenticação real e integração com API do backend: **em breve** (instruções de backend pendentes).