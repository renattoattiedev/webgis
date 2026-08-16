import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RasterSeedPollerCron } from './raster-seed-poller.cron';

describe('RasterSeedPollerCron', () => {
  let prisma: any;
  let gwc: any;
  let sut: RasterSeedPollerCron;

  beforeEach(() => {
    prisma = {
      camadasRaster: {
        findMany: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
      },
    };
    gwc = { getSeedProgress: vi.fn() };
    sut = new RasterSeedPollerCron(prisma, gwc);
  });

  it('queries only rasters that are currently seeding', async () => {
    prisma.camadasRaster.findMany.mockResolvedValue([]);
    await sut.poll();
    expect(prisma.camadasRaster.findMany).toHaveBeenCalledWith({
      where: { DSC_SEED_STATUS: 'seeding' },
      select: { COD_CAMADA_RASTER_ID: true, NOM_NOME: true },
    });
  });

  it('updates progress for a still-seeding layer', async () => {
    prisma.camadasRaster.findMany.mockResolvedValue([
      { COD_CAMADA_RASTER_ID: 'id-1', NOM_NOME: 'foo' },
    ]);
    gwc.getSeedProgress.mockResolvedValue({ percent: 42, status: 'seeding' });
    await sut.poll();
    expect(prisma.camadasRaster.update).toHaveBeenCalledWith({
      where: { COD_CAMADA_RASTER_ID: 'id-1' },
      data: { NUM_SEED_PROGRESS: 42, DSC_SEED_STATUS: 'seeding' },
    });
  });

  it('marks layer as cached when status becomes cached', async () => {
    prisma.camadasRaster.findMany.mockResolvedValue([
      { COD_CAMADA_RASTER_ID: 'id-2', NOM_NOME: 'bar' },
    ]);
    gwc.getSeedProgress.mockResolvedValue({ percent: 100, status: 'cached' });
    await sut.poll();
    expect(prisma.camadasRaster.update).toHaveBeenCalledWith({
      where: { COD_CAMADA_RASTER_ID: 'id-2' },
      data: { NUM_SEED_PROGRESS: 100, DSC_SEED_STATUS: 'cached' },
    });
  });

  it('keeps polling other layers even if one fails', async () => {
    prisma.camadasRaster.findMany.mockResolvedValue([
      { COD_CAMADA_RASTER_ID: 'a', NOM_NOME: 'a' },
      { COD_CAMADA_RASTER_ID: 'b', NOM_NOME: 'b' },
    ]);
    gwc.getSeedProgress
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ percent: 80, status: 'seeding' });

    await sut.poll();

    expect(prisma.camadasRaster.update).toHaveBeenCalledWith({
      where: { COD_CAMADA_RASTER_ID: 'b' },
      data: { NUM_SEED_PROGRESS: 80, DSC_SEED_STATUS: 'seeding' },
    });
  });
});
