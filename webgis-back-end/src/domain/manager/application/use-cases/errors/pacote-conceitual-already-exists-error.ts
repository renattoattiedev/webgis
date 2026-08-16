import { UseCaseError } from '@/core/errors/use-case-error';

export class PacoteConceitualAlreadyExistsError
  extends Error
  implements UseCaseError
{
  public readonly pacoteConceitualId: string;

  constructor(identifier: string) {
    super(`Pacote Conceitual "${identifier}" already exists.`);
    this.pacoteConceitualId = identifier;
  }
}
