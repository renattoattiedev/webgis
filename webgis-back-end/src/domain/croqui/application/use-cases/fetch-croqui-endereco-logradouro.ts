import { Either, left, right } from '@/core/either';
import { CroquiRepository } from '../repositories/croqui-endereco-repository';
import { CroquiEndereco } from '@/domain/croqui/enterprise/entities/croqui-endereco';
import { Injectable } from '@nestjs/common';

interface FetchCroquisEnderecoByLogradouroUseCaseRequest {
  DSC_LOGRADOURO: string;
}

type FetchCroquisEnderecoByLogradouroUseCaseResponse = Either<
  null,
  {
    croquisEndereco: CroquiEndereco[];
  }
>;

@Injectable()
export class FetchCroquisEnderecoByLogradouroUseCase {
  constructor(private croquiEnderecoRepository: CroquiRepository) {}

  async execute({
    DSC_LOGRADOURO,
  }: FetchCroquisEnderecoByLogradouroUseCaseRequest): Promise<FetchCroquisEnderecoByLogradouroUseCaseResponse> {
    const croquisEndereco =
      await this.croquiEnderecoRepository.findCroquiEnderecoCompletoByLogradouro(
        DSC_LOGRADOURO,
      );

    if (!croquisEndereco) {
      return left(null);
    }

    return right({
      croquisEndereco,
    });
  }
}
