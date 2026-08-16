import { Either, left, right } from '@/core/either';
import { PerfilRepository } from '../../../security/application/repositories/perfil-repository';
import { Injectable } from '@nestjs/common';
import { Perfil } from '../../enterprise/entities/perfil';

type FetchPerfilUseCaseResponse = Either<
  null,
  {
    perfil: Perfil[];
  }
>;

@Injectable()
export class FetchPerfilUseCase {
  constructor(private userRepository: PerfilRepository) {}

  async execute(): Promise<FetchPerfilUseCaseResponse> {
    const perfil = await this.userRepository.findManyPerfil();

    if (!perfil) {
      return left(null);
    }

    return right({
      perfil,
    });
  }
}
