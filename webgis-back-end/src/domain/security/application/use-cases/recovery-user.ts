import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../security/application/repositories/user-repository';

interface RecoveryUserUseCaseRequest {
  COD_USER_ID: string;
}

@Injectable()
export class RecoveryUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({ COD_USER_ID }: RecoveryUserUseCaseRequest) {
    await this.userRepository.recoveryUser(COD_USER_ID);
  }
}
