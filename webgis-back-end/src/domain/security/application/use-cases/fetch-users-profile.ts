import { Either, right } from '@/core/either';
import { UserRepository } from '../../../security/application/repositories/user-repository';
import { User } from '@/domain/security/enterprise/entities/user';
import { Injectable } from '@nestjs/common';

interface FetchUsersProfileUseCaseRequest {
  COD_PERFIL_USER: string[];
}
type FetchUsersProfileUseCaseResponse = Either<
  null,
  {
    users: User[];
  }
>;

@Injectable()
export class FetchUsersProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({
    COD_PERFIL_USER,
  }: FetchUsersProfileUseCaseRequest): Promise<FetchUsersProfileUseCaseResponse> {
    const users =
      await this.userRepository.findAllUsersByProfile(COD_PERFIL_USER);

    return right({
      users,
    });
  }
}
