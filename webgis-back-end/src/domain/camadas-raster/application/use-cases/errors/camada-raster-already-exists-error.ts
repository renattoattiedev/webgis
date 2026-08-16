import { UseCaseError } from '@/core/errors/use-case-error';

export class CamadaRasterAlreadyExistsError
  extends Error
  implements UseCaseError
{
  public readonly camadaId: string;

  constructor(identifier: string) {
    super(`Camada Raster "${identifier}" already exists.`);
    this.camadaId = identifier;
  }
}
