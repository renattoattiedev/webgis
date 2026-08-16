import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../security/application/repositories/user-repository';

interface UpdatePerfilUserRequest {
  COD_USER_ID: string;
  COD_PERFIL_USER: string;
}

@Injectable()
export class UpdatePerfilUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({ COD_USER_ID, COD_PERFIL_USER }: UpdatePerfilUserRequest) {
    await this.userRepository.updatePerfilUser(COD_USER_ID, COD_PERFIL_USER);
  }
}
