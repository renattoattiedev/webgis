import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import { rename } from 'fs/promises';

export interface GdalCogOptions {
  basePath: string;
  timeoutMs: number;
  numThreads: string;
}

export type CogPerfil = 'rgb_jpeg' | 'singleband_deflate';

export interface GdalRunner {
  runJson(args: string[]): Promise<any>;
  runWithProgress(
    args: string[],
    timeoutMs: number,
    onProgress: (pct: number) => void,
  ): Promise<void>;
}

export class DefaultGdalRunner implements GdalRunner {
  async runJson(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = spawn('gdalinfo', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const chunks: Buffer[] = [];
      const errChunks: Buffer[] = [];
      child.stdout.on('data', (c) => chunks.push(c));
      child.stderr.on('data', (c) => errChunks.push(c));
      child.on('error', reject);
      child.on('close', (code) => {
        if (code !== 0) {
          return reject(
            new Error(
              `gdalinfo exited ${code}: ${Buffer.concat(errChunks).toString()}`,
            ),
          );
        }
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async runWithProgress(
    args: string[],
    timeoutMs: number,
    onProgress: (pct: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('gdal_translate', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`gdal_translate timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      const errChunks: Buffer[] = [];
      let buffer = '';
      const onChunk = (c: Buffer) => {
        buffer += c.toString();
        const matches = buffer.match(/(\d{1,3})/g);
        if (matches) {
          for (const m of matches) {
            const n = parseInt(m, 10);
            if (n >= 0 && n <= 100) onProgress(n);
          }
          buffer = '';
        }
      };
      child.stdout.on('data', onChunk);
      child.stderr.on('data', (c) => {
        errChunks.push(c);
        onChunk(c);
      });
      child.on('error', (e) => {
        clearTimeout(timer);
        reject(e);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) return resolve();
        reject(
          new Error(
            `gdal_translate exited ${code}: ${Buffer.concat(errChunks)
              .toString()
              .slice(0, 400)}`,
          ),
        );
      });
    });
  }
}

@Injectable()
export class GdalCogService {
  constructor(
    private readonly runner: GdalRunner,
    private readonly options: GdalCogOptions,
    private readonly renamer: (
      from: string,
      to: string,
    ) => Promise<void> = rename,
  ) {}

  async convertToCog(
    relativePath: string,
    onProgress: (pct: number) => void,
  ): Promise<CogPerfil> {
    const inputPath = path.posix.join(this.options.basePath, relativePath);
    const outputPath = `${inputPath}.cog.tif`;

    const info = await this.runner.runJson([inputPath, '-json']);
    const bands = Array.isArray(info?.bands) ? info.bands.length : 0;
    const perfil: CogPerfil = bands === 3 ? 'rgb_jpeg' : 'singleband_deflate';

    const args = this.buildArgs(perfil, inputPath, outputPath);
    await this.runner.runWithProgress(args, this.options.timeoutMs, onProgress);
    await this.renamer(outputPath, inputPath);
    return perfil;
  }

  private buildArgs(
    perfil: CogPerfil,
    input: string,
    output: string,
  ): string[] {
    const common = [
      input,
      output,
      '-of',
      'COG',
      '-co',
      'BLOCKSIZE=512',
      '-co',
      'OVERVIEW_RESAMPLING=AVERAGE',
      '-co',
      'BIGTIFF=YES',
      '-co',
      `NUM_THREADS=${this.options.numThreads}`,
    ];
    if (perfil === 'rgb_jpeg') {
      return [
        ...common,
        '-co',
        'COMPRESS=JPEG',
        '-co',
        'QUALITY=85',
        '-co',
        'PHOTOMETRIC=YCBCR',
      ];
    }
    return [...common, '-co', 'COMPRESS=DEFLATE', '-co', 'PREDICTOR=2'];
  }
}
