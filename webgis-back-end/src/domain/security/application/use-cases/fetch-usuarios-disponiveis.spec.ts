import { describe, it, expect, beforeEach } from 'vitest';
import { FetchUsuariosDisponiveisUseCase } from './fetch-usuarios-disponiveis';
import { InMemoryUserRepository } from '../../../../../test/repositories/in-memory-user-repository';
import { InMemoryPerfilRepository } from '../../../../../test/repositories/in-memory-perfil-repository';
import { User } from '../../enterprise/entities/user';
import { Perfil } from '../../enterprise/entities/perfil';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

function makeUser(
  id: string,
  overrides: Partial<Parameters<typeof User.create>[0]> = {},
) {
  return User.create(
    {
      NOM_USER: `Usuário ${id}`,
      PERFIL_USER: 'perfil-editor',
      DSC_EMAIL: `${id}@cesan.com.br`,
      DSC_PASSWORD: 'hash',
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
    new UniqueEntityID(id),
  );
}

describe('FetchUsuariosDisponiveisUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let perfilRepo: InMemoryPerfilRepository;
  let sut: FetchUsuariosDisponiveisUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    perfilRepo = new InMemoryPerfilRepository();
    perfilRepo.itens.push(
      Perfil.create(
        { DSC_PERFIL: 'Admin' },
        new UniqueEntityID('perfil-admin'),
      ),
      Perfil.create(
        { DSC_PERFIL: 'Editor' },
        new UniqueEntityID('perfil-editor'),
      ),
    );
    sut = new FetchUsuariosDisponiveisUseCase(userRepo, perfilRepo);
  });

  it('exclui usuarios com perfil Admin', async () => {
    userRepo.itens.push(
      makeUser('u1', { PERFIL_USER: 'perfil-editor' }),
      makeUser('u2', { PERFIL_USER: 'perfil-admin' }),
    );
    const result = await sut.execute();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.usuarios).toHaveLength(1);
      expect(result.value.usuarios[0].id).toBe('u1');
    }
  });

  it('exclui usuarios com exclusao logica', async () => {
    userRepo.itens.push(
      makeUser('u1', {
        PERFIL_USER: 'perfil-editor',
        DHS_EXCLUSAO: new Date(),
      }),
    );
    const result = await sut.execute();
    if (result.isRight()) {
      expect(result.value.usuarios).toHaveLength(0);
    }
  });

  it('retorna id, nome e email', async () => {
    userRepo.itens.push(
      makeUser('u1', { NOM_USER: 'Maria', DSC_EMAIL: 'maria@cesan.com.br' }),
    );
    const result = await sut.execute();
    if (result.isRight()) {
      expect(result.value.usuarios[0]).toEqual({
        id: 'u1',
        nome: 'Maria',
        email: 'maria@cesan.com.br',
      });
    }
  });
});
