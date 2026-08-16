import { Either, left, right } from '@/core/either';
import { UserRepository } from '../../../security/application/repositories/user-repository';
import { User } from '@/domain/security/enterprise/entities/user';
import { Injectable } from '@nestjs/common';

interface GetUserEmailUseCaseRequest {
  DSC_EMAIL: string;
}

type GetUserEmailUseCaseResponse = Either<
  null,
  {
    user: User;
  }
>;

@Injectable()
export class GetUserEmailUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({
    DSC_EMAIL,
  }: GetUserEmailUseCaseRequest): Promise<GetUserEmailUseCaseResponse> {
    const user = await this.userRepository.findByEmail(DSC_EMAIL);

    if (!user) {
      return left(null);
    }

    return right({
      user,
    });
  }
}
