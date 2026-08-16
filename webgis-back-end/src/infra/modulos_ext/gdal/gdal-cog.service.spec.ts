import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GdalCogService, GdalRunner } from './gdal-cog.service';

describe('GdalCogService', () => {
  let runner: GdalRunner;
  let renamer: (from: string, to: string) => Promise<void>;
  let sut: GdalCogService;

  beforeEach(() => {
    runner = {
      runJson: vi.fn(),
      runWithProgress: vi.fn().mockResolvedValue(undefined),
    } as unknown as GdalRunner;
    renamer = vi.fn().mockResolvedValue(undefined);
    sut = new GdalCogService(
      runner,
      {
        basePath: '/opt/geoserver_data/raster',
        timeoutMs: 10_000,
        numThreads: 'ALL_CPUS',
      },
      renamer,
    );
  });

  it('chooses rgb_jpeg profile for 3-band rasters', async () => {
    (runner.runJson as any).mockResolvedValue({ bands: [{}, {}, {}] });
    const perfil = await sut.convertToCog('foo/orto.tif', () => {});
    expect(perfil).toBe('rgb_jpeg');

    const args = (runner.runWithProgress as any).mock.calls[0][0];
    expect(args).toContain('-of');
    expect(args).toContain('COG');
    expect(args).toContain('COMPRESS=JPEG');
    expect(args).toContain('PHOTOMETRIC=YCBCR');
    expect(args).toContain('BLOCKSIZE=512');
    expect(args).toContain('BIGTIFF=YES');
  });

  it('chooses singleband_deflate profile for 1-band rasters', async () => {
    (runner.runJson as any).mockResolvedValue({ bands: [{}] });
    const perfil = await sut.convertToCog('dem/elev.tif', () => {});
    expect(perfil).toBe('singleband_deflate');

    const args = (runner.runWithProgress as any).mock.calls[0][0];
    expect(args).toContain('COMPRESS=DEFLATE');
    expect(args).toContain('PREDICTOR=2');
    expect(args).not.toContain('COMPRESS=JPEG');
  });

  it('writes to <input>.cog.tif then renames over original', async () => {
    (runner.runJson as any).mockResolvedValue({ bands: [{}, {}, {}] });
    await sut.convertToCog('foo/orto.tif', () => {});
    expect(renamer).toHaveBeenCalledWith(
      '/opt/geoserver_data/raster/foo/orto.tif.cog.tif',
      '/opt/geoserver_data/raster/foo/orto.tif',
    );
  });

  it('falls back to singleband_deflate for 4-band rasters (RGBA — JPEG cannot handle alpha)', async () => {
    (runner.runJson as any).mockResolvedValue({ bands: [{}, {}, {}, {}] });
    const perfil = await sut.convertToCog('foo/rgba.tif', () => {});
    expect(perfil).toBe('singleband_deflate');
    const args = (runner.runWithProgress as any).mock.calls[0][0];
    expect(args).not.toContain('COMPRESS=JPEG');
    expect(args).toContain('COMPRESS=DEFLATE');
  });

  it('forwards progress callback', async () => {
    (runner.runJson as any).mockResolvedValue({ bands: [{}, {}, {}] });
    const cb = vi.fn();
    (runner.runWithProgress as any).mockImplementation(
      (_args: string[], _timeout: number, onProgress: (p: number) => void) => {
        onProgress(25);
        onProgress(75);
        return Promise.resolve();
      },
    );
    await sut.convertToCog('foo/orto.tif', cb);
    expect(cb).toHaveBeenCalledWith(25);
    expect(cb).toHaveBeenCalledWith(75);
  });
});
