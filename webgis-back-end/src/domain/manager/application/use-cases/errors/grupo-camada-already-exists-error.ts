import { UseCaseError } from '@/core/errors/use-case-error';

export class GrupoCamadaAlreadyExistsError
  extends Error
  implements UseCaseError
{
  public readonly grupoCamadaId: string;

  constructor(identifier: string) {
    super(`Grupo "${identifier}" already exists.`);
    this.grupoCamadaId = identifier;
  }
}
