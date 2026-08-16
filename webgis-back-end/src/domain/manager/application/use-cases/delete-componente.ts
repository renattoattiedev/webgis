import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Componente } from '../../enterprise/entities/componente';
import { ComponenteRepository } from '../repositories/componente-repository';

interface DeleteComponenteRequest {
  COD_COMPONENTE_ID: string;
}

type DeleteComponenteResponse = Either<
  {
    mensagem: string;
  },
  {
    componente: Componente;
  }
>;

@Injectable()
export class DeleteComponenteUseCase {
  constructor(private componenteRepository: ComponenteRepository) {}

  async execute({
    COD_COMPONENTE_ID,
  }: DeleteComponenteRequest): Promise<DeleteComponenteResponse> {
    const componente =
      await this.componenteRepository.findById(COD_COMPONENTE_ID);

    if (!componente) {
      return left({
        mensagem: 'Componente não encontrado',
      });
    }

    await this.componenteRepository.delete(COD_COMPONENTE_ID);

    return right({
      componente,
    });
  }
}
