import { Either, right } from '@/core/either';
import { ComponenteRepository } from '../repositories/componente-repository';
import { Componente } from '../../enterprise/entities/componente';
import { Injectable } from '@nestjs/common';

interface FetchComponentesUseCaseRequest {
  COD_COMPONENTE_ID: string;
}

type FetchComponentesUseCaseResponse = Either<
  null,
  {
    componentes: Componente[];
  }
>;

@Injectable()
export class FetchComponentesUseCase {
  constructor(private componenteRepository: ComponenteRepository) {}

  async execute({
    COD_COMPONENTE_ID,
  }: FetchComponentesUseCaseRequest): Promise<FetchComponentesUseCaseResponse> {
    const componentes =
      await this.componenteRepository.findManyByComponenteId(COD_COMPONENTE_ID);

    return right({
      componentes,
    });
  }
}
