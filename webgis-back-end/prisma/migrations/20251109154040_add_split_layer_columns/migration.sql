/*
  Warnings:

  - You are about to drop the column `SELECTED_MAPAS` on the `TP_USER_PREFERENCE` table. All the data in the column will be lost.
  - You are about to drop the column `SELECTED_RASTER_LAYERS` on the `TP_USER_PREFERENCE` table. All the data in the column will be lost.
  - You are about to drop the column `SELECTED_VECTOR_LAYERS` on the `TP_USER_PREFERENCE` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TP_USER_PREFERENCE" DROP COLUMN "SELECTED_MAPAS",
DROP COLUMN "SELECTED_RASTER_LAYERS",
DROP COLUMN "SELECTED_VECTOR_LAYERS",
ADD COLUMN     "SELECTED_LAYERS" JSONB;
