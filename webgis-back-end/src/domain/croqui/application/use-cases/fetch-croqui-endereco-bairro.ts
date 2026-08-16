import { Either, left, right } from '@/core/either';
import { CroquiRepository } from '../repositories/croqui-endereco-repository';
import { CroquiEndereco } from '@/domain/croqui/enterprise/entities/croqui-endereco';
import { Injectable } from '@nestjs/common';

interface FetchCroquisEnderecoByBairroUseCaseRequest {
  DSC_BAIRRO: string;
}

type FetchCroquisEnderecoByBairroUseCaseResponse = Either<
  null,
  {
    croquisEndereco: CroquiEndereco[];
  }
>;

@Injectable()
export class FetchCroquisEnderecoByBairroUseCase {
  constructor(private croquiEnderecoRepository: CroquiRepository) {}

  async execute({
    DSC_BAIRRO,
  }: FetchCroquisEnderecoByBairroUseCaseRequest): Promise<FetchCroquisEnderecoByBairroUseCaseResponse> {
    const croquisEndereco =
      await this.croquiEnderecoRepository.findCroquiEnderecoCompletoByBairro(
        DSC_BAIRRO,
      );

    if (!croquisEndereco) {
      return left(null);
    }

    return right({
      croquisEndereco,
    });
  }
}
