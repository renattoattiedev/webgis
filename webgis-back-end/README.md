<p align="center">
  <img src="logo-cesan.png" alt="CESAN" />
</p>

<p align="justify">
  <img src="nestjs-icon-512x510-9nvpcyc3.png" alt="NestJS" width="50" height="50"/>
  <img src="geoserver_icon.png" alt="Geoserver" width="50" height="50"/>
  <img src="postgresql-icon.png" alt="Postgres" width="50" height="50"/>
</p>


# WEBGIS - FRONTEND

Este repositório contém o backend do WebGIS da CESAN, desenvolvido com NestJS e Prisma. Utiliza Node.js, PostgreSQL e GeoServer para fornecer serviços geoespaciais eficientes.

## Descrição do Projeto

Esta plataforma WebGIS tem como objetivo realizar consultas de dados geo-espaciais em uma interface amigável e terá como base os dados a serem disponibilizados pela CESAN.


## Requisitos

Antes de iniciar, certifique-se de ter as seguintes ferramentas instaladas:

- Node.js v20.5.1
- npm v9.8.0
- Docker e Docker Compose
- PostgreSQL 16.1
- [Prisma CLI](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-cli)
- Geoserver 2.24

## Configuração Inicial

1. **Baixe e instale os seguintes softwares:**

- Docker: https://www.docker.com/products/docker-desktop/
- Node: https://nodejs.org/en

2. **Criação de Volumes Docker:**

   Para o GeoServer e PostgreSQL, crie volumes Docker para persistência de dados:

   ```bash
   docker volume create data_geoserver
   docker volume create data_postgres
   ```

3. **Instalação de Dependências:**

   Dentro da pasta do projeto, instale as dependências do projeto com npm:

   ```bash
   npm install
   ```

## Executando o Projeto

1. **Iniciando Serviços com Docker Compose:**

   Utilize o Docker Compose para iniciar os serviços necessários:
    
   ```bash
   docker-compose up
   ```

2. **Executando Migrações do Prisma:**

   Após iniciar os serviços, execute as migrações do Prisma:
   
   ```bash
   npx prisma migrate dev   
   ```
> **Somente necessário, quando for a primeira vez que executa o projeto. Se for a segunda vez, pule para o passo 4.**

3. **Carregando Dados no PostgreSQL:**

   Em seguida execute os Seeds para criar os metadados

   ```bash
   npx prisma db seed
   ```
> **Somente necessário, quando for a primeira vez que executa o projeto. Se for a segunda vez, pule para o passo 4.**

4. **Iniciando o Servidor de Desenvolvimento:**

   Finalmente, inicie o servidor de desenvolvimento:
   
   ```bash
   npm run start dev
   ```

   O Backend estará rodando no seguinte endereço: http://localhost:3333

## Configurando o Geoserver

Acesse o Geoserver no seguinte endereço: http://localhost:8080/geoserver

1. **Crie dois espaços de Trabalho no Geoserver:**

- fiscalizacao
- infraestrutura

(Utilize as credencias default do geoserver para se autenticar. user: admin, password: geoserver)

2. **Crie uma conexao entre o Geoserver e Banco de Dados da CESAN chamado banco_cesan**

Faça isso para os dois espaços de trabalhos existentes:

**fiscalizacao**
- workspace: fiscalizacao
- Nome da Fonte de Dados: banco_cesan
- host: postgres
- port: 5432
- database: cesan
- schema: camadas
- user: postgres
- password: cesan123

**infraestrutura**
- workspace: infraestrutura
- Nome da Fonte de Dados: banco_cesan
- host: postgres
- port: 5432
- database: cesan
- schema: camadas
- user: postgres
- password: cesan123

## Autor

<p align="center">
  <img src="g4fbr_logo.jpg" alt="G4F" width="50" height="50"/>
</p>
<p align="center">
  Apoiamos empresas a se reinventarem em tecnologia, processos e estratégia.
</p>

## Setup local — Repositório Raster (NFS)

O backend espera que a pasta `gis_raster` esteja acessível localmente. Você tem duas opções:

### Opção A — Montar o NFS de develop (recomendado)

```bash
sudo apt-get install -y nfs-common
sudo mkdir -p /mnt/cesan_dev_gis_raster
sudo mount -t nfs4 -o ro nfs-storage.cesan.com.br:/develop_gis_raster /mnt/cesan_dev_gis_raster
```

Em `.env`:
```
RASTER_BASE_PATH=/mnt/cesan_dev_gis_raster
GEOSERVER_RASTER_PATH=/opt/geoserver_data/raster
```

Como o GeoServer deployado em `develop` monta o mesmo `develop_gis_raster`, publicações funcionam end-to-end localmente.

### Opção B — Pasta local (fallback, listagem-only)

```bash
mkdir -p /tmp/raster_dev
```

Em `.env`:
```
RASTER_BASE_PATH=/tmp/raster_dev
```

A listagem funciona, mas publicação falha porque o GeoServer não verá os arquivos.

### Troubleshooting

- `mount.nfs4: access denied`: verificar VPN/conectividade com `nfs-storage.cesan.com.br`.
- `EACCES` ao listar: a montagem precisa permitir read para o seu usuário.
- Listagem retorna vazio: confirmar que existe conteúdo em `${ENV}_gis_raster` no NFS (alguém precisa ter populado).
