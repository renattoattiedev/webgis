import { UseCaseError } from '@/core/errors/use-case-error';

export class GrupoSiglaAlreadyExistsError
  extends Error
  implements UseCaseError
{
  public readonly sigla: string;

  constructor(sigla: string) {
    super(`Sigla de grupo "${sigla}" já está em uso.`);
    this.sigla = sigla;
  }
}
