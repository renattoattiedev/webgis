import { z } from 'zod';

export const envSchema = z.object({
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.string(),
  DB_NAME: z.string(),
  DB_SCHEMA: z.string(),
  PORT: z.coerce.number().optional().default(3333),
  DW_DB_HOST: z.string(),
  DW_DB_USER: z.string(),
  DW_DB_PASSWORD: z.string(),
  DW_DB_DATABASE: z.string(),
  DW_DB_INSTANCE: z.string(),
  RASTER_BASE_PATH: z.string(),
  GEOSERVER_RASTER_PATH: z.string().default('/opt/geoserver_data/raster'),
  GDAL_COG_TIMEOUT_MS: z.coerce.number().default(7200000),
  GDAL_COG_NUM_THREADS: z.string().default('ALL_CPUS'),
  GWC_SEED_THREAD_COUNT: z.coerce.number().default(2),
  GWC_SEED_MAX_ZOOM: z.coerce.number().default(16),
  GWC_SEED_POLL_INTERVAL_MS: z.coerce.number().default(15000),
  ENTRA_TENANT_ID: z.string(),
  ENTRA_CLIENT_ID: z.string(),
  ENTRA_CLIENT_SECRET: z.string(),
  ENTRA_REDIRECT_URI: z.string(),
});

export type Env = z.infer<typeof envSchema>;
