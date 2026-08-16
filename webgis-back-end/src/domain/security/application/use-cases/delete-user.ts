import { left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../security/application/repositories/user-repository';

interface DeleteUserUseCaseRequest {
  COD_USER_ID: string;
  COD_USUARIO_EXCLUSAO: string;
}

@Injectable()
export class DeleteUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({
    COD_USER_ID,
    COD_USUARIO_EXCLUSAO,
  }: DeleteUserUseCaseRequest) {
    const user = await this.userRepository.findById(COD_USER_ID);

    if (!user) {
      return left(new Error('Usuário não encontrada'));
    }

    await this.userRepository.deleteUser(COD_USER_ID, COD_USUARIO_EXCLUSAO);

    return right({
      user: user,
    });
  }
}
