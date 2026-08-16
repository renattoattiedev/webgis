import { Either, left, right } from '@/core/either';
import { UserRepository } from '../../../security/application/repositories/user-repository';
import { Injectable } from '@nestjs/common';

interface GetUserPerfilUseCaseRequest {
  COD_USER_ID: string;
}

type GetUserPerfilUseCaseResponse = Either<
  null,
  {
    userPerfil: string;
  }
>;

@Injectable()
export class GetUserPerfilUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute({
    COD_USER_ID,
  }: GetUserPerfilUseCaseRequest): Promise<GetUserPerfilUseCaseResponse> {
    const userPerfil = await this.userRepository.getPerfilById(COD_USER_ID);

    if (!userPerfil) {
      return left(null);
    }

    return right({
      userPerfil,
    });
  }
}
