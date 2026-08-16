import { Either, right } from '@/core/either';
import { CroquiRepository } from '../repositories/croqui-endereco-repository';
import { CroquiEndereco } from '@/domain/croqui/enterprise/entities/croqui-endereco';
import { Injectable } from '@nestjs/common';

interface FetchCroquiEnderecoByFiltrosUseCaseRequest {
  cd_cidade?: number;
  cd_bairro?: number;
  cd_logradouro?: number;
}

type FetchCroquiEnderecoByFiltrosUseCaseResponse = Either<
  null,
  {
    croquisEndereco: CroquiEndereco[];
  }
>;

@Injectable()
export class FetchCroquiEnderecoByFiltrosUseCase {
  constructor(private croquiEnderecoRepository: CroquiRepository) {}

  async execute({
    cd_cidade,
    cd_bairro,
    cd_logradouro,
  }: FetchCroquiEnderecoByFiltrosUseCaseRequest): Promise<FetchCroquiEnderecoByFiltrosUseCaseResponse> {
    const croquisEndereco =
      await this.croquiEnderecoRepository.findCroquiEnderecoCompletoByFiltros(
        cd_cidade,
        cd_bairro,
        cd_logradouro,
      );

    return right({
      croquisEndereco,
    });
  }
}
