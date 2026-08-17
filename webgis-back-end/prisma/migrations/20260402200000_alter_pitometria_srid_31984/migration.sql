-- Altera a coluna GEOMETRY de geometry(Point,4674) para geometry(Point,31983)
-- Executado apenas se a tabela existir (idempotente).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'camadas' AND table_name = 'TP_PITOMETRIA'
  ) THEN
    ALTER TABLE "camadas"."TP_PITOMETRIA"
      ALTER COLUMN "GEOMETRY"
        TYPE "public".geometry(Point, 31983)
        USING ST_Transform(
          ST_SetSRID("GEOMETRY", 4674),
          31983
        );
  END IF;
END $$;
