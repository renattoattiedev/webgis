import { describe, it, expect, beforeEach } from 'vitest';
import { AuthenticateUserUseCase } from './authenticate-user';
import { InMemoryUserRepository } from '../../../../../test/repositories/in-memory-user-repository';
import { User } from '../../enterprise/entities/user';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

class FakeHashComparer {
  async compare(_plain: string, _hash: string): Promise<boolean> {
    return true;
  }
}

class FakeEncrypter {
  async encrypt(payload: Record<string, unknown>): Promise<string> {
    return `token-${JSON.stringify(payload)}`;
  }
}

function makeUser(overrides: Partial<Parameters<typeof User.create>[0]> = {}) {
  return User.create(
    {
      NOM_USER: 'Usuário Teste',
      PERFIL_USER: 'perfil-editor',
      DSC_EMAIL: 'teste@cesan.com.br',
      DSC_PASSWORD: 'hashed-123456',
      COD_ENTRA_OBJECT_ID: null,
      DSC_AUTH_PROVIDER: 'local',
      DHS_ULTIMA_AUTENTICACAO: null,
      USUARIO_CRIACAO: null,
      DHS_INCLUSAO: new Date(),
      DHS_EXCLUSAO: null,
      DSC_EMAIL_VERIFICATION_TOKEN: null,
      DSC_EMAIL_VERIFICATION_EXPIRES: null,
      BOL_EMAIL_VERIFIED: true,
      DSC_RESET_PASSWORD_TOKEN: null,
      DHS_EXPIRES_RESET_PASSWORD: null,
      ...overrides,
    },
    new UniqueEntityID('u1'),
  );
}

describe('AuthenticateUserUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let sut: AuthenticateUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    sut = new AuthenticateUserUseCase(
      userRepo,
      new FakeHashComparer() as any,
      new FakeEncrypter() as any,
    );
  });

  it('autentica com sucesso quando a senha confere', async () => {
    userRepo.itens.push(makeUser());
    const result = await sut.execute({
      DSC_EMAIL: 'teste@cesan.com.br',
      DSC_PASSWORD: '123456',
    });
    expect(result.isRight()).toBe(true);
  });

  it('rejeita quando o usuário não tem senha local (conta 100% federada)', async () => {
    userRepo.itens.push(
      makeUser({ DSC_PASSWORD: null, DSC_AUTH_PROVIDER: 'entra' }),
    );
    const result = await sut.execute({
      DSC_EMAIL: 'teste@cesan.com.br',
      DSC_PASSWORD: 'qualquer-coisa',
    });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError);
    }
  });
});
