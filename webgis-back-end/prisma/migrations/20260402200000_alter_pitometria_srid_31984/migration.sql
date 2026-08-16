-- Altera a coluna GEOMETRY de geometry(Point,4674) para geometry(Point,31984)
-- Executado apenas se a tabela existir (idempotente).

-- Garante que o tipo geometry (PostGIS, em public) fique visível no schema camadas
SET search_path = "camadas", public;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'camadas' AND table_name = 'TP_PITOMETRIA'
  ) THEN
    ALTER TABLE "camadas"."TP_PITOMETRIA"
      ALTER COLUMN "GEOMETRY"
        TYPE geometry(Point, 31984)
        USING ST_Transform(
          ST_SetSRID("GEOMETRY", 4674),
          31984
        );
  END IF;
END $$;
