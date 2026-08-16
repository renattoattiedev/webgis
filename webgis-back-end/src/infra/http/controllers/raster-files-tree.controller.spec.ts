import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { RasterFilesTreeController } from './raster-files-tree.controller';
import { ListRasterFilesUseCase } from '@/domain/raster-files/application/use-cases/list-raster-files';
import { CheckRasterAlreadyPublishedUseCase } from '@/domain/raster-files/application/use-cases/check-raster-already-published';
import { left, right } from '@/core/either';

/**
 * Integration-style tests for the RasterFilesTreeController.
 *
 * NOTE (Pattern B): The project has no AppModule-bootstrapped E2E setup
 * (no test/setup-e2e.ts, no existing *.e2e-spec.ts, env validation via Zod
 * makes booting AppModule in a test very intrusive). Instead of writing a
 * true HTTP-level E2E, we exercise the controller's route handler methods
 * directly with mocked use cases. This still validates the controller's
 * contract: success/error mapping, query param handling, and propagation
 * of BadRequestException from the underlying repository (path-traversal).
 *
 * Auth (401) is enforced globally by the AuthGuard wired in AppModule and
 * is covered by Nest's framework behavior; we omit it here since it is
 * outside the controller's responsibility.
 */
describe('RasterFilesTreeController', () => {
  let listUseCase: { execute: ReturnType<typeof vi.fn> };
  let checkUseCase: { execute: ReturnType<typeof vi.fn> };
  let controller: RasterFilesTreeController;

  beforeEach(() => {
    listUseCase = { execute: vi.fn() };
    checkUseCase = { execute: vi.fn() };
    controller = new RasterFilesTreeController(
      listUseCase as unknown as ListRasterFilesUseCase,
      checkUseCase as unknown as CheckRasterAlreadyPublishedUseCase,
    );
  });

  describe('GET /raster-files/tree', () => {
    it('returns the use-case right value when execution succeeds', async () => {
      const items = [
        {
          name: 'upload_raster',
          relativePath: 'upload_raster',
          type: 'dir' as const,
        },
      ];
      listUseCase.execute.mockResolvedValue(right({ items }));

      const result = await controller.tree('');

      expect(listUseCase.execute).toHaveBeenCalledWith({ relativePath: '' });
      expect(result).toEqual({ items });
    });

    it('trims the path query param before passing to the use-case', async () => {
      listUseCase.execute.mockResolvedValue(right({ items: [] }));

      await controller.tree('   upload_raster   ');

      expect(listUseCase.execute).toHaveBeenCalledWith({
        relativePath: 'upload_raster',
      });
    });

    it('defaults to empty string when path query param is missing', async () => {
      listUseCase.execute.mockResolvedValue(right({ items: [] }));

      await controller.tree(undefined);

      expect(listUseCase.execute).toHaveBeenCalledWith({ relativePath: '' });
    });

    it('throws BadRequestException when use-case returns left', async () => {
      listUseCase.execute.mockResolvedValue(left('falha qualquer'));

      await expect(controller.tree('foo')).rejects.toThrow(BadRequestException);
    });

    it('propagates BadRequestException from underlying repo (path traversal)', async () => {
      // The NfsRasterFilesRepository throws BadRequestException synchronously
      // for traversal attempts like "../../etc". The use case awaits the
      // repo call, so the rejection bubbles up through .execute().
      listUseCase.execute.mockRejectedValue(
        new BadRequestException('Caminho inválido'),
      );

      await expect(controller.tree('../../etc')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.tree('../../etc')).rejects.toThrow(
        'Caminho inválido',
      );
    });
  });

  describe('GET /raster-files/check', () => {
    it('throws BadRequestException when path query param is missing', async () => {
      await expect(controller.check(undefined)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.check('')).rejects.toThrow(BadRequestException);
      await expect(controller.check('   ')).rejects.toThrow(
        BadRequestException,
      );
      expect(checkUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns the expected shape when not yet published', async () => {
      checkUseCase.execute.mockResolvedValue(
        right({ alreadyPublished: false }),
      );

      const result = await controller.check('upload_raster/nova.tif');

      expect(checkUseCase.execute).toHaveBeenCalledWith({
        relativePath: 'upload_raster/nova.tif',
      });
      expect(result).toEqual({ alreadyPublished: false });
    });

    it('returns alreadyPublished=true with camadaId when published', async () => {
      checkUseCase.execute.mockResolvedValue(
        right({ alreadyPublished: true, camadaId: 'cam-1' }),
      );

      const result = await controller.check('upload_raster/a.tif');

      expect(result).toEqual({ alreadyPublished: true, camadaId: 'cam-1' });
    });

    it('throws BadRequestException when check use-case returns left', async () => {
      checkUseCase.execute.mockResolvedValue(left('algo errado'));

      await expect(controller.check('upload_raster/a.tif')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('trims the path query param before passing to the use-case', async () => {
      checkUseCase.execute.mockResolvedValue(
        right({ alreadyPublished: false }),
      );

      await controller.check('  upload_raster/a.tif  ');

      expect(checkUseCase.execute).toHaveBeenCalledWith({
        relativePath: 'upload_raster/a.tif',
      });
    });
  });
});
