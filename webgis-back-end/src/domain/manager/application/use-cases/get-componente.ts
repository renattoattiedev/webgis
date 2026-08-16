import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Componente } from '../../enterprise/entities/componente';
import { ComponenteRepository } from '../repositories/componente-repository';

interface GetComponenteUseCaseRequest {
  COD_COMPONENTE_ID: string;
}

type GetComponenteUseCaseResponse = Either<
  null,
  {
    componente: Componente;
  }
>;

@Injectable()
export class GetComponenteUseCase {
  constructor(private componenteRepository: ComponenteRepository) {}

  async execute({
    COD_COMPONENTE_ID,
  }: GetComponenteUseCaseRequest): Promise<GetComponenteUseCaseResponse> {
    const componente =
      await this.componenteRepository.findById(COD_COMPONENTE_ID);

    if (!componente) {
      return left(null);
    }

    return right({
      componente,
    });
  }
}
