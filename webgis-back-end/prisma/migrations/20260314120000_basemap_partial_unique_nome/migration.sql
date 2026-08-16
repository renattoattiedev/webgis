-- Drop the plain unique constraint on NOM_NOME_BASEMAP
DROP INDEX IF EXISTS "TP_BASEMAPS_NOM_NOME_BASEMAP_key";

-- Create a partial unique index so the same name can be reused after soft-deletion
CREATE UNIQUE INDEX "TP_BASEMAPS_NOM_NOME_BASEMAP_active_key"
  ON "TP_BASEMAPS"("NOM_NOME_BASEMAP")
  WHERE "DHS_EXCLUSAO" IS NULL;

-- Create a regular (non-unique) index to keep lookups fast for all rows
CREATE INDEX "TP_BASEMAPS_NOM_NOME_BASEMAP_idx"
  ON "TP_BASEMAPS"("NOM_NOME_BASEMAP");
