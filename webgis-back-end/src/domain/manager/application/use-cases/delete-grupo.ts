import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Grupo } from '../../enterprise/entities/grupo';
import { GrupoRepository } from '../repositories/grupo-repository';

interface DeleteGrupoUseCaseRequest {
  COD_GRUPO_ID: string;
  COD_USUARIO_EXCLUSAO: string;
}

type DeleteGrupoUseCaseResponse = Either<
  {
    mensagem: string;
  },
  {
    grupo: Grupo;
  }
>;

@Injectable()
export class DeleteGrupoUseCase {
  constructor(private grupoRepository: GrupoRepository) {}

  async execute({
    COD_GRUPO_ID,
    COD_USUARIO_EXCLUSAO,
  }: DeleteGrupoUseCaseRequest): Promise<DeleteGrupoUseCaseResponse> {
    const grupo = await this.grupoRepository.findById(COD_GRUPO_ID);

    if (!grupo) {
      return left({
        mensagem: 'Grupo não encontrado',
      });
    }

    const countGrupos =
      await this.grupoRepository.countByGruposId(COD_GRUPO_ID);

    if (countGrupos > 0) {
      return left({
        mensagem: 'Grupo possui camadas associadas',
      });
    }

    await this.grupoRepository.delete(COD_GRUPO_ID, COD_USUARIO_EXCLUSAO);

    return right({
      grupo,
    });
  }
}
