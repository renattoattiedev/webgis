import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user-repository';
import { HashGenerator } from '../cryptography/hash-generator';

interface UpdatePasswordUserRequest {
  COD_USER_ID: string;
  DSC_PASSWORD: string;
}

@Injectable()
export class UpdatePasswordUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({ COD_USER_ID, DSC_PASSWORD }: UpdatePasswordUserRequest) {
    const hashedPassword = await this.hashGenerator.hash(DSC_PASSWORD);

    await this.userRepository.updatePassword(COD_USER_ID, hashedPassword);
  }
}
