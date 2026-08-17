-- CreateSchema
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA "public";

CREATE SCHEMA IF NOT EXISTS "camadas";

-- CreateEnum
CREATE TYPE "camadas"."TipoPitometria" AS ENUM ('VAZAO', 'PRESSAO');

-- CreateTable
CREATE TABLE "camadas"."TP_PITOMETRIA" (
    "COD_PITOMETRIA_ID"       TEXT NOT NULL DEFAULT gen_random_uuid(),
    "COD_SIMP"                TEXT NOT NULL,
    "MATRICULA"               TEXT NOT NULL,
    "TIPO"                    "camadas"."TipoPitometria" NOT NULL,
    "GEOMETRY"                "public".geometry(Point, 31983),
    "COD_USUARIO_CRIACAO"     TEXT NOT NULL,
    "DHS_CRIACAO"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "COD_USUARIO_ATUALIZACAO" TEXT,
    "DHS_ATUALIZACAO"         TIMESTAMP(3),
    "DHS_EXCLUSAO"            TIMESTAMP(3),

    CONSTRAINT "TP_PITOMETRIA_pkey" PRIMARY KEY ("COD_PITOMETRIA_ID")
);

-- CreateIndex (spatial index for GeoServer/PostGIS performance)
CREATE INDEX "TP_PITOMETRIA_geometry_idx" ON "camadas"."TP_PITOMETRIA" USING GIST ("GEOMETRY");
