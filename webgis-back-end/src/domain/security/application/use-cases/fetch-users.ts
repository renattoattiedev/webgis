import { Either, right } from '@/core/either';
import { UserRepository } from '../../../security/application/repositories/user-repository';
import { User } from '@/domain/security/enterprise/entities/user';
import { Injectable } from '@nestjs/common';

type FetchUsersUseCaseResponse = Either<
  null,
  {
    users: User[];
  }
>;

@Injectable()
export class FetchUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<FetchUsersUseCaseResponse> {
    const users = await this.userRepository.findAllUsers();

    return right({
      users,
    });
  }
}
