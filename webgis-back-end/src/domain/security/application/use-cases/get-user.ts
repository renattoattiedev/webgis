import { Either, left, right } from '@/core/either';
import { UserRepository } from '../../../security/application/repositories/user-repository';
import { User } from '@/domain/security/enterprise/entities/user';
import { Injectable } from '@nestjs/common';

interface GetUserUseCaseRequest {
  COD_USER_ID: string;
}

type GetUserUseCaseResponse = Either<
  null,
  {
    user: User;
  }
>;

@Injectable()
export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({
    COD_USER_ID,
  }: GetUserUseCaseRequest): Promise<GetUserUseCaseResponse> {
    const user = await this.userRepository.findById(COD_USER_ID);

    if (!user) {
      return left(null);
    }

    return right({
      user,
    });
  }
}
