import { UseCaseError } from '@/core/errors/use-case-error';

export class MapaAlreadyExistsError extends Error implements UseCaseError {
  public readonly mapaId: string;

  constructor(identifier: string) {
    super(`Mapa "${identifier}" already exists.`);
    this.mapaId = identifier;
  }
}
