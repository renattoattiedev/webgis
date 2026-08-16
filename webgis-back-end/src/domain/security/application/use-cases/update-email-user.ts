import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user-repository';

interface UpdateEmailUserRequest {
  COD_USER_ID: string;
  DSC_EMAIL: string;
}

@Injectable()
export class UpdateEmailUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({ COD_USER_ID, DSC_EMAIL }: UpdateEmailUserRequest) {
    await this.userRepository.updateEmail(COD_USER_ID, DSC_EMAIL);
  }
}
