import { Either, left, right } from '@/core/either';
import { CroquiRepository } from '../repositories/croqui-endereco-repository';
import { CroquiEndereco } from '@/domain/croqui/enterprise/entities/croqui-endereco';
import { Injectable } from '@nestjs/common';

interface FetchCroquisEnderecoByCidadeUseCaseRequest {
  DSC_CIDADE: string;
}

type FetchCroquisEnderecoByCidadeUseCaseResponse = Either<
  null,
  {
    croquisEndereco: CroquiEndereco[];
  }
>;

@Injectable()
export class FetchCroquisEnderecoByCidadeUseCase {
  constructor(private croquiEnderecoRepository: CroquiRepository) {}

  async execute({
    DSC_CIDADE,
  }: FetchCroquisEnderecoByCidadeUseCaseRequest): Promise<FetchCroquisEnderecoByCidadeUseCaseResponse> {
    const croquisEndereco =
      await this.croquiEnderecoRepository.findCroquiEnderecoCompletoByCidade(
        DSC_CIDADE,
      );

    if (!croquisEndereco) {
      return left(null);
    }

    return right({
      croquisEndereco,
    });
  }
}
