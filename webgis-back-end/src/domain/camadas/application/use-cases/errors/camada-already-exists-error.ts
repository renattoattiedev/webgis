import { UseCaseError } from '@/core/errors/use-case-error';

export class CamadaAlreadyExistsError extends Error implements UseCaseError {
  public readonly camadaId: string;

  constructor(identifier: string) {
    super(`Camada "${identifier}" already exists.`);
    this.camadaId = identifier;
  }
}
