import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRepository } from '../../../security/application/repositories/user-repository';
import { HashGenerator } from '../cryptography/hash-generator';
import { Either, right, left } from '@/core/either';

interface ResetPasswordRequest {
  DSC_RESET_PASSWORD_TOKEN: string;
  DSC_PASSWORD: string;
}

type ResetPasswordResponse = Either<BadRequestException, { DSC_EMAIL: string }>;

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    DSC_RESET_PASSWORD_TOKEN,
    DSC_PASSWORD,
  }: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const user = await this.userRepository.findByPasswordResetToken(
      DSC_RESET_PASSWORD_TOKEN,
    );

    if (
      !user ||
      !user.userResetPasswordExpires ||
      new Date() > user.userResetPasswordExpires
    ) {
      return left(new BadRequestException('Token inválido ou expirado'));
    }

    const hashedPassword = await this.hashGenerator.hash(DSC_PASSWORD);

    await this.userRepository.updatePassword(
      user.id.toString(),
      hashedPassword,
    );

    await this.userRepository.clearPasswordResetToken(user.id.toString());

    return right({ DSC_EMAIL: user.userEmail });
  }
}
