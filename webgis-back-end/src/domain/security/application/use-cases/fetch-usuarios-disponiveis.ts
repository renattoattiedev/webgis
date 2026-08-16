import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user-repository';
import { PerfilRepository } from '../repositories/perfil-repository';

export type UsuarioDisponivel = {
  id: string;
  nome: string;
  email: string;
};

type FetchUsuariosDisponiveisUseCaseResponse = Either<
  null,
  { usuarios: UsuarioDisponivel[] }
>;

@Injectable()
export class FetchUsuariosDisponiveisUseCase {
  constructor(
    private userRepository: UserRepository,
    private perfilRepository: PerfilRepository,
  ) {}

  async execute(): Promise<FetchUsuariosDisponiveisUseCaseResponse> {
    const perfilAdmin = await this.perfilRepository.findByPerfil('Admin');
    const todosOsUsuarios = await this.userRepository.findAllUsers();

    const usuarios = todosOsUsuarios
      .filter(
        (u) =>
          u.userDataExclusao === null &&
          (!perfilAdmin || u.userPerfil !== perfilAdmin.id.toString()),
      )
      .map((u) => ({
        id: u.id.toString(),
        nome: u.userNome,
        email: u.userEmail,
      }));

    return right({ usuarios });
  }
}
