import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { NfsRasterFilesRepository } from './nfs-raster-files-repository';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

describe('NfsRasterFilesRepository', () => {
  let base: string;
  let repo: NfsRasterFilesRepository;

  beforeEach(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), 'raster-base-'));
    fs.mkdirSync(path.join(base, 'upload_raster'));
    fs.mkdirSync(path.join(base, 'upload_raster', '2024'));
    fs.writeFileSync(
      path.join(base, 'upload_raster', 'vrp_zona_a.tif'),
      Buffer.alloc(1024),
    );
    fs.writeFileSync(
      path.join(base, 'upload_raster', '2024', 'ortofoto_norte.tif'),
      Buffer.alloc(2048),
    );
    fs.writeFileSync(
      path.join(base, 'upload_raster', '2024', 'README.txt'),
      'doc',
    );
    fs.mkdirSync(path.join(base, 'empty_dir'));
    repo = new NfsRasterFilesRepository(base);
  });

  afterEach(() => {
    fs.rmSync(base, { recursive: true, force: true });
  });

  it('lista raiz: pastas + arquivos .tif (esconde pastas vazias)', async () => {
    const result = await repo.listChildren('');
    const names = result.map((r) => r.name).sort();
    expect(names).toEqual(['upload_raster']);
    expect(result[0].type).toBe('dir');
    expect(result[0].relativePath).toBe('upload_raster');
  });

  it('lista subpasta com mix de .tif e pasta', async () => {
    const result = await repo.listChildren('upload_raster');
    expect(result).toHaveLength(2);
    const dir = result.find((r) => r.type === 'dir');
    const file = result.find((r) => r.type === 'file');
    expect(dir?.name).toBe('2024');
    expect(dir?.relativePath).toBe('upload_raster/2024');
    expect(file?.name).toBe('vrp_zona_a.tif');
    expect(file?.relativePath).toBe('upload_raster/vrp_zona_a.tif');
    expect(file?.size).toBe(1024);
    expect(file?.extension).toBe('.tif');
  });

  it('filtra arquivos não-.tif', async () => {
    const result = await repo.listChildren('upload_raster/2024');
    const names = result.map((r) => r.name);
    expect(names).toContain('ortofoto_norte.tif');
    expect(names).not.toContain('README.txt');
  });

  it('rejeita path com .. (path-traversal)', async () => {
    await expect(repo.listChildren('../etc')).rejects.toThrow(
      BadRequestException,
    );
    await expect(repo.listChildren('upload_raster/../../etc')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejeita path absoluto', async () => {
    await expect(repo.listChildren('/etc/passwd')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejeita path com null byte', async () => {
    await expect(repo.listChildren('upload_raster\x00')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('retorna lista vazia em pasta inexistente (sem lançar)', async () => {
    const result = await repo.listChildren('nao_existe/sub');
    expect(result).toEqual([]);
  });

  it('exists retorna true para arquivo presente', async () => {
    expect(await repo.exists('upload_raster/vrp_zona_a.tif')).toBe(true);
  });

  it('exists retorna false para arquivo ausente', async () => {
    expect(await repo.exists('upload_raster/nao_existe.tif')).toBe(false);
  });

  it('lança ServiceUnavailableException se base path não existe (NFS desmontado)', async () => {
    const brokenRepo = new NfsRasterFilesRepository('/caminho/que/nao/existe');
    await expect(brokenRepo.listChildren('')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
