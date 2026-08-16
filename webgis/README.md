<p align="center">
  <img src="logo-RunForrestGIS.png" alt="RunForrestGIS" />
</p>

<img src="angular.png" alt="ANGULAR" width="50" height="50"/>

# WEBGIS - FRONTEND

Este repositório contém o frontend do WebGIS da RunForrestGIS, desenvolvido com Angular e OpenLayers. Este projeto proporciona uma interface de usuário rica para interagir com serviços geoespaciais.

## Descrição do Projeto

Esta plataforma WebGIS tem como objetivo realizar consultas de dados geo-espaciais em uma interface amigável e terá como base os dados a serem disponibilizados pela RunForrestGIS.


## Requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas:

- Node.js v20.5.1
- npm v9.8.0

## Versões das Dependências

Este projeto utiliza as seguintes bibliotecas principais:

- `@angular/core`: 16.2.0
- `@angular/material`: 16.2.5
- `ol` (OpenLayers): 8.1.0

## Configuração Inicial

1. **Instalação de Dependências:**

   No diretório do projeto, execute o seguinte comando para instalar todas as dependências necessárias:

   ```bash
   npm install
   ```

## Executando o Projeto

1. **Iniciar o Servidor de Desenvolvimento:**

   Após a instalação das dependências, inicie o servidor de desenvolvimento com o comando:
   
   ```bash
   ng serve
   ```

   O aplicativo estará acessível em http://localhost:4200/ no seu navegador.

## 🚀 Otimizações de Performance

### Lazy Loading de Thumbnails WMS

O componente `organization-content` foi otimizado com um sistema avançado de lazy loading para thumbnails WMS, garantindo performance superior e melhor experiência do usuário.

#### ⚡ Características Principais

- **Intersection Observer API**: Carregamento automático baseado na visibilidade dos elementos
- **Controle de Concorrência**: Máximo de 4 requisições WMS simultâneas
- **Sistema de Queue**: Gerenciamento inteligente de fila de carregamento
- **Scroll-based Loading**: Thumbnails carregam progressivamente durante o scroll
- **Tratamento de Erros**: Sistema robusto de recuperação de falhas

#### 🎯 Funcionalidades Implementadas

##### 1. **Lazy Loading Inteligente**
```typescript
// Intersection Observer com margem de 100px
this.intersectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.loadThumbnailForItem(itemId);
      }
    });
  },
  { rootMargin: '100px 0px', threshold: 0.1 }
);
```

##### 2. **Controle de Performance**
- **MAX_CONCURRENT_REQUESTS**: Limitado a 4 requisições simultâneas
- **Queue System**: Fila inteligente para processar carregamentos
- **Throttled Scroll**: Listener de scroll otimizado (100ms)
- **Error Recovery**: Continua funcionando mesmo com falhas

##### 3. **Estados Visuais Claros**
- 🔄 **Loading**: Indicador animado durante carregamento
- ❌ **Error**: Mensagem clara + botão "Tentar novamente"
- ⏳ **Placeholder**: "Carregando em breve..." para thumbnails pendentes
- ✅ **Success**: Transição suave quando carregada

#### 📁 Arquivos Modificados

- `organization-content.component.ts`: Lógica principal de lazy loading
- `organization-content.component.html`: Estados visuais e estrutura
- `organization-content.component.scss`: Estilos para todos os estados

#### 🔧 Métodos Principais

| Método | Descrição |
|--------|-----------|
| `setupIntersectionObserver()` | Configura detecção automática de visibilidade |
| `queueThumbnailLoad()` | Gerencia fila com controle de concorrência |
| `startThumbnailLoad()` | Inicia carregamento individual com cache |
| `processQueue()` | Processa fila respeitando limites |
| `hasThumbnailError()` | Verifica estado de erro |
| `onImageError()` | Trata falhas com graceful degradation |

#### 📊 Benefícios Alcançados

- ✅ **Performance**: Redução significativa de requisições simultâneas
- ✅ **UX**: Carregamento progressivo e suave
- ✅ **Escalabilidade**: Funciona com datasets grandes
- ✅ **Resiliência**: Recuperação automática de falhas
- ✅ **Compatibilidade**: Fallback para navegadores antigos

#### 🎨 CSS Classes de Estados

```scss
.thumbnail-loading     // Estado de carregamento
.thumbnail-error       // Estado de erro com retry
.thumbnail-placeholder-auto  // Placeholder de espera
.thumbnail-container   // Container principal
```

## Autor

<p align="center">
  <img src="g4fbr_logo.jpg" alt="G4F" width="50" height="50"/>
</p>
<p align="center">
  Apoiamos empresas a se reinventarem em tecnologia, processos e estratégia.
</p>
