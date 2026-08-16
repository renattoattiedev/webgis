import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../security/application/repositories/user-repository';

interface RegisterLastLoginRequest {
  COD_USER_ID: string;
}

@Injectable()
export class RegisterLastLoginUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({ COD_USER_ID }: RegisterLastLoginRequest) {
    await this.userRepository.updateLastLogin(COD_USER_ID);
  }
}
