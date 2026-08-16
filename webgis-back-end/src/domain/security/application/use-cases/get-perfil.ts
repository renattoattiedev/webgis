import { Either, left, right } from '@/core/either';
import { PerfilRepository } from '../../../security/application/repositories/perfil-repository';
import { Injectable } from '@nestjs/common';
import { Perfil } from '../../enterprise/entities/perfil';

interface GetPerfilUseCaseRequest {
  DSC_PERFIL: string;
}

type GetPerfilUseCaseResponse = Either<
  null,
  {
    perfil: Perfil;
  }
>;

@Injectable()
export class GetPerfilUseCase {
  constructor(private perfilRepository: PerfilRepository) {}

  async execute({
    DSC_PERFIL,
  }: GetPerfilUseCaseRequest): Promise<GetPerfilUseCaseResponse> {
    const perfil = await this.perfilRepository.findByPerfil(DSC_PERFIL);

    if (!perfil) {
      return left(null);
    }

    return right({
      perfil,
    });
  }
}
