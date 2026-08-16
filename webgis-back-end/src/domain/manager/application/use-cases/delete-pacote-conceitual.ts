import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { PacotesConceituais } from '../../enterprise/entities/pacotes-conceituais';
import { PacotesConceituaisRepository } from '../repositories/pacotes-conceituais-repository';

interface DeletePacoteConceitualUseCaseRequest {
  COD_PACOTE_CONCEITUAL_ID: string;
  COD_USUARIO_EXCLUSAO: string;
}

type DeletePacoteConceitualUseCaseResponse = Either<
  {
    mensagem: string;
  },
  {
    pacoteConceitual: PacotesConceituais;
  }
>;

@Injectable()
export class DeletePacoteConceitualUseCase {
  constructor(
    private pacotesConceituaisRepository: PacotesConceituaisRepository,
  ) {}

  async execute({
    COD_PACOTE_CONCEITUAL_ID,
    COD_USUARIO_EXCLUSAO,
  }: DeletePacoteConceitualUseCaseRequest): Promise<DeletePacoteConceitualUseCaseResponse> {
    const pacoteConceitual = await this.pacotesConceituaisRepository.findById(
      COD_PACOTE_CONCEITUAL_ID,
    );

    if (!pacoteConceitual) {
      return left({
        mensagem: 'Pacote conceitual não encontrado',
      });
    }

    const countCamadas =
      await this.pacotesConceituaisRepository.countByPacotesConceituaisId(
        COD_PACOTE_CONCEITUAL_ID,
      );

    if (countCamadas > 0) {
      return left({
        mensagem: 'Pacote conceitual possui camadas associadas',
      });
    }

    await this.pacotesConceituaisRepository.delete(
      COD_PACOTE_CONCEITUAL_ID,
      COD_USUARIO_EXCLUSAO,
    );

    return right({
      pacoteConceitual: pacoteConceitual,
    });
  }
}
