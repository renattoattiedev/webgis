import { UseCaseError } from '@/core/errors/use-case-error';

export class DefaultProfileNotFoundError extends Error implements UseCaseError {
  constructor(perfil: string) {
    super(
      `Perfil padrão "${perfil}" não encontrado. Verifique o seed de PerfilUser.`,
    );
  }
}
