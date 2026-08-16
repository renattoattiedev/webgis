import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { Componente } from '../../enterprise/entities/componente';
import { ComponenteRepository } from '../repositories/componente-repository';

interface GetComponenteByNomeUseCaseRequest {
  NOM_NOME_COMPONENTE: string;
}

type GetComponenteByNomeUseCaseResponse = Either<
  null,
  {
    componente: Componente;
  }
>;

@Injectable()
export class GetComponenteByNomeUseCase {
  constructor(private componenteRepository: ComponenteRepository) {}

  async execute({
    NOM_NOME_COMPONENTE,
  }: GetComponenteByNomeUseCaseRequest): Promise<GetComponenteByNomeUseCaseResponse> {
    const componente =
      await this.componenteRepository.findByNome(NOM_NOME_COMPONENTE);

    if (!componente) {
      return left(null);
    }

    return right({
      componente,
    });
  }
}
