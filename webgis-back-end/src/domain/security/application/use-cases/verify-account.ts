import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../../security/application/repositories/user-repository';

interface VerifyAccountRequest {
  DSC_EMAIL_VERIFICATION_TOKEN: string;
}

@Injectable()
export class VerifyAccountUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({
    DSC_EMAIL_VERIFICATION_TOKEN,
  }: VerifyAccountRequest): Promise<void> {
    const user = await this.userRepository.findByVerificationToken(
      DSC_EMAIL_VERIFICATION_TOKEN,
    );

    if (!user) {
      throw new NotFoundException(
        'Token de verificação não encontrado ou já utilizado.',
      );
    }

    await this.userRepository.markEmailAsVerified(user.id.toString());
  }
}
