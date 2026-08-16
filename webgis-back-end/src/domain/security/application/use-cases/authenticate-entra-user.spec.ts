import { describe, it, expect, beforeEach } from 'vitest';
import { AuthenticateEntraUserUseCase } from './authenticate-entra-user';
import { InMemoryUserRepository } from '../../../../../test/repositories/in-memory-user-repository';
import { InMemoryPerfilRepository } from '../../../../../test/repositories/in-memory-perfil-repository';
import { User } from '../../enterprise/entities/user';
import { Perfil } from '../../enterprise/entities/perfil';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

class FakeEncrypter {
  async encrypt(payload: Record<string, unknown>): Promise<string> {
    return `token-${JSON.stringify(payload)}`;
  }
}

function makeUser(overrides: Partial<Parameters<typeof User.create>[0]> = {}) {
  return User.create(
    {
      NOM_USER: 'Usuário Local',
      PERFIL_USER: 'perfil-editor',
      DSC_EMAIL: 'local@cesan.com.br',
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

describe('AuthenticateEntraUserUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let perfilRepo: InMemoryPerfilRepository;
  let sut: AuthenticateEntraUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    perfilRepo = new InMemoryPerfilRepository();
    perfilRepo.itens.push(
      Perfil.create(
        { DSC_PERFIL: 'Visualizador' },
        new UniqueEntityID('perfil-visualizador'),
      ),
    );
    sut = new AuthenticateEntraUserUseCase(
      userRepo,
      perfilRepo,
      new FakeEncrypter() as any,
    );
  });

  it('autentica direto quando já existe usuário vinculado pelo Entra Object ID', async () => {
    userRepo.itens.push(
      makeUser({ COD_ENTRA_OBJECT_ID: 'oid-1', DSC_AUTH_PROVIDER: 'entra' }),
    );

    const result = await sut.execute({
      entraObjectId: 'oid-1',
      email: 'outro-email-diferente@cesan.com.br',
      name: 'Usuário Local',
    });

    expect(result.isRight()).toBe(true);
    expect(userRepo.itens).toHaveLength(1);
  });

  it('vincula automaticamente quando existe usuário local com o mesmo e-mail', async () => {
    userRepo.itens.push(makeUser());

    const result = await sut.execute({
      entraObjectId: 'oid-2',
      email: 'local@cesan.com.br',
      name: 'Usuário Local',
    });

    expect(result.isRight()).toBe(true);
    expect(userRepo.itens).toHaveLength(1);
    expect(userRepo.itens[0].userEntraObjectId).toBe('oid-2');
    expect(userRepo.itens[0].userPassword).toBe('hashed-123456');
    expect(userRepo.itens[0].userPerfil).toBe('perfil-editor');
  });

  it('provisiona um novo usuário com perfil Visualizador quando não existe local nem vínculo prévio', async () => {
    const result = await sut.execute({
      entraObjectId: 'oid-3',
      email: 'novo@cesan.com.br',
      name: 'Usuário Novo',
    });

    expect(result.isRight()).toBe(true);
    expect(userRepo.itens).toHaveLength(1);
    expect(userRepo.itens[0].userEmail).toBe('novo@cesan.com.br');
    expect(userRepo.itens[0].userPassword).toBeNull();
    expect(userRepo.itens[0].userPerfil).toBe('perfil-visualizador');
    expect(userRepo.itens[0].userEmailVerified).toBe(true);
  });
});
