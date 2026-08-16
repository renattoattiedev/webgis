import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Temas } from '../../enterprise/entities/temas';
import { TemasRepository } from '../repositories/temas-repository';

interface DeleteTemaUseCaseRequest {
  COD_TEMA_ID: string;
  COD_USUARIO_EXCLUSAO: string;
}

type DeleteTemaUseCaseResponse = Either<
  {
    mensagem: string;
  },
  {
    tema: Temas;
  }
>;

@Injectable()
export class DeleteTemaUseCase {
  constructor(private temasRepository: TemasRepository) {}

  async execute({
    COD_TEMA_ID,
    COD_USUARIO_EXCLUSAO,
  }: DeleteTemaUseCaseRequest): Promise<DeleteTemaUseCaseResponse> {
    const tema = await this.temasRepository.findById(COD_TEMA_ID);

    if (!tema) {
      return left({
        mensagem: 'Tema não encontrado',
      });
    }

    const countGrupos = await this.temasRepository.countByTemasId(COD_TEMA_ID);

    if (countGrupos > 0) {
      return left({
        mensagem: 'Tema possui grupos associados',
      });
    }

    await this.temasRepository.delete(COD_TEMA_ID, COD_USUARIO_EXCLUSAO);

    return right({
      tema: tema,
    });
  }
}
