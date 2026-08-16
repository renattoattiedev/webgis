import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../../security/application/repositories/user-repository';

interface ResetPasswordRequest {
  COD_USER_ID: string;
  DSC_RESET_PASSWORD_TOKEN: string;
  DHS_EXPIRES_RESET_PASSWORD: Date;
}

@Injectable()
export class SavePasswordResetUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({
    COD_USER_ID,
    DSC_RESET_PASSWORD_TOKEN,
    DHS_EXPIRES_RESET_PASSWORD,
  }: ResetPasswordRequest): Promise<void> {
    const user = await this.userRepository.findById(COD_USER_ID);

    if (!user) {
      throw new NotFoundException('Usário não encontrado');
    }

    await this.userRepository.savePasswordResetToken(
      COD_USER_ID,
      DSC_RESET_PASSWORD_TOKEN,
      DHS_EXPIRES_RESET_PASSWORD,
    );
  }
}
