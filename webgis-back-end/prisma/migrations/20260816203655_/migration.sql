/*
  Warnings:

  - You are about to drop the column `TIP_BASEMAP` on the `TP_BASEMAPS` table. All the data in the column will be lost.
  - You are about to drop the `webgis_outros_solicitacao_servico` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "camadas"."TP_PITOMETRIA_geometry_idx";

-- AlterTable
ALTER TABLE "camadas"."TP_PITOMETRIA" ALTER COLUMN "COD_PITOMETRIA_ID" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."TP_ATRIBUTOS" ADD COLUMN     "NUM_ORDEM_RENDERIZACAO" INTEGER;

-- AlterTable
ALTER TABLE "public"."TP_BASEMAPS" DROP COLUMN "TIP_BASEMAP";

-- AlterTable
ALTER TABLE "public"."TP_CAMADAS" ADD COLUMN     "BOL_CARREGAMENTO_DEFAULT" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "public"."TP_CAMADAS_RASTER" ADD COLUMN     "BOL_CARREGAMENTO_DEFAULT" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "public"."TP_MAPAS" ADD COLUMN     "BOL_CARREGAMENTO_DEFAULT" BOOLEAN DEFAULT false;

-- DropTable
DROP TABLE "public"."webgis_outros_solicitacao_servico";

-- CreateTable
CREATE TABLE "public"."webgis_integracao_solicitacao_servico" (
    "num_ss" TEXT NOT NULL,
    "servico" TEXT,
    "operacional" TEXT,
    "unidade" TEXT,
    "cliente" TEXT,
    "cpf_cnpj" TEXT,
    "matricula" TEXT,
    "dv" BIGINT,
    "hidrometro" TEXT,
    "logradouro" TEXT,
    "num_imovel" TEXT,
    "telefone" TEXT,
    "bairro" TEXT,
    "referencia" TEXT,
    "obs" TEXT,
    "cd_atendimento" BIGINT,
    "ref_atendimento" BIGINT,
    "seq_ss" BIGINT NOT NULL,

    CONSTRAINT "webgis_integracao_solicitacao_servico_pkey" PRIMARY KEY ("num_ss","seq_ss")
);
