-- AlterTable
ALTER TABLE "TP_CONFIG" ADD COLUMN     "FLG_SENSIVEL" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TP_USER_PREFERENCE" (
    "COD_USER_PREFERENCE_ID" TEXT NOT NULL,
    "COD_USER_ID" TEXT NOT NULL,
    "SELECTED_VECTOR_LAYERS" JSONB,
    "SELECTED_RASTER_LAYERS" JSONB,
    "SELECTED_MAPAS" JSONB,
    "ZOOM" INTEGER,
    "CENTER_X" DOUBLE PRECISION,
    "EXTENT" JSONB,
    "DHS_INCLUSAO" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DHS_ULTIMA_ALTERACAO" TIMESTAMP(3),

    CONSTRAINT "TP_USER_PREFERENCE_pkey" PRIMARY KEY ("COD_USER_PREFERENCE_ID")
);

-- CreateTable
CREATE TABLE "webgis_sicat_cidade" (
    "cd_cidade" BIGINT NOT NULL,
    "cd_municipio" BIGINT NOT NULL,
    "dc_cidade" TEXT,

    CONSTRAINT "webgis_sicat_cidade_pkey" PRIMARY KEY ("cd_cidade")
);

-- CreateTable
CREATE TABLE "webgis_sicat_bairro" (
    "cd_cidade" BIGINT NOT NULL,
    "cd_bairro" BIGINT NOT NULL,
    "dc_bairro" TEXT,
    "cd_mun_impressao" BIGINT,

    CONSTRAINT "webgis_sicat_bairro_pkey" PRIMARY KEY ("cd_cidade","cd_bairro")
);

-- CreateTable
CREATE TABLE "webgis_sicat_logradouro" (
    "cd_cidade" BIGINT NOT NULL,
    "cd_logradouro" BIGINT NOT NULL,
    "sigla_logradouro" TEXT,
    "dc_logradouro" TEXT,

    CONSTRAINT "webgis_sicat_logradouro_pkey" PRIMARY KEY ("cd_cidade","cd_logradouro")
);

-- CreateTable
CREATE TABLE "webgis_sicat_cliente" (
    "nome_cliente_interno" TEXT,
    "cpf_cnpj" TEXT,
    "cd_cliente" BIGINT NOT NULL,
    "tipo_cliente" TEXT,

    CONSTRAINT "webgis_sicat_cliente_pkey" PRIMARY KEY ("cd_cliente")
);

-- CreateTable
CREATE TABLE "webgis_sicat_imovel" (
    "matricula_imovel" BIGINT NOT NULL,
    "dv" BIGINT,
    "cliente_especial" TEXT,
    "data_ligacao_agua" TIMESTAMP(3),
    "data_ligacao_esgoto" TIMESTAMP(3),
    "numero_economias" BIGINT,
    "tratamento_esgoto" TEXT,
    "ciclo_leitura" BIGINT,
    "seq_rota" BIGINT,
    "cep" BIGINT,
    "cd_logradouro" BIGINT,
    "cd_cidade" BIGINT,
    "cd_bairro" BIGINT,
    "row_version" BIGINT,
    "numero_endereco" TEXT,
    "complemento_endereco" TEXT,
    "grupo_consumo" BIGINT,
    "cd_cliente" BIGINT,
    "categoria" BIGINT,
    "otr_fonte" BIGINT,
    "tp_ligacao_agua" BIGINT,
    "sit_ligacao_agua" BIGINT,
    "sit_ligacao_esgoto" BIGINT,

    CONSTRAINT "webgis_sicat_imovel_pkey" PRIMARY KEY ("matricula_imovel")
);

-- CreateTable
CREATE TABLE "webgis_sicat_hidrometro_imovel" (
    "matricula_imovel" BIGINT NOT NULL,
    "codigo_hidrometro" TEXT NOT NULL,

    CONSTRAINT "webgis_sicat_hidrometro_imovel_pkey" PRIMARY KEY ("matricula_imovel","codigo_hidrometro")
);

-- CreateTable
CREATE TABLE "webgis_outros_solicitacao_servico" (
    "id" INTEGER NOT NULL,
    "cd_atendimento" INTEGER,
    "ref_atendimento" INTEGER,
    "seq_ss" INTEGER,
    "cd_cidade" INTEGER,
    "cd_bairro" INTEGER,
    "cd_logradouro" INTEGER,
    "dc_informacoes" VARCHAR(400),
    "dt_registro" INTEGER,
    "dt_baixa" INTEGER,
    "dt_georref" DATE,
    "matricula_imovel" INTEGER,
    "matricula_vizinho" INTEGER,
    "matricula_ref" INTEGER,
    "tipo_posicionamento" VARCHAR(50),
    "row_version" BIGINT,

    CONSTRAINT "webgis_outros_solicitacao_servico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "webgis_sicat_bairro" ADD CONSTRAINT "webgis_sicat_bairro_cd_cidade_fkey" FOREIGN KEY ("cd_cidade") REFERENCES "webgis_sicat_cidade"("cd_cidade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webgis_sicat_logradouro" ADD CONSTRAINT "webgis_sicat_logradouro_cd_cidade_fkey" FOREIGN KEY ("cd_cidade") REFERENCES "webgis_sicat_cidade"("cd_cidade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webgis_sicat_imovel" ADD CONSTRAINT "webgis_sicat_imovel_cd_cliente_fkey" FOREIGN KEY ("cd_cliente") REFERENCES "webgis_sicat_cliente"("cd_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webgis_sicat_imovel" ADD CONSTRAINT "webgis_sicat_imovel_cd_cidade_fkey" FOREIGN KEY ("cd_cidade") REFERENCES "webgis_sicat_cidade"("cd_cidade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webgis_sicat_imovel" ADD CONSTRAINT "webgis_sicat_imovel_cd_cidade_cd_bairro_fkey" FOREIGN KEY ("cd_cidade", "cd_bairro") REFERENCES "webgis_sicat_bairro"("cd_cidade", "cd_bairro") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webgis_sicat_imovel" ADD CONSTRAINT "webgis_sicat_imovel_cd_cidade_cd_logradouro_fkey" FOREIGN KEY ("cd_cidade", "cd_logradouro") REFERENCES "webgis_sicat_logradouro"("cd_cidade", "cd_logradouro") ON DELETE SET NULL ON UPDATE CASCADE;
