import { UseCaseError } from '@/core/errors/use-case-error';

export class TemaAlreadyExistsError extends Error implements UseCaseError {
  public readonly temaId: string;

  constructor(identifier: string) {
    super(`Tema "${identifier}" already exists.`);
    this.temaId = identifier;
  }
}
