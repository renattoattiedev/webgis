import { Either, right } from '@/core/either';
import { CroquiRepository } from '../repositories/croqui-endereco-repository';
import { CroquiEndereco } from '@/domain/croqui/enterprise/entities/croqui-endereco';
import { Injectable } from '@nestjs/common';

interface FetchCroquiEnderecoCompletoUseCaseRequest {}

type FetchCroquiEnderecoCompletoUseCaseResponse = Either<
  null,
  {
    croquiEnderecos: CroquiEndereco[];
  }
>;

@Injectable()
export class FetchCroquiEnderecoCompletoUseCase {
  constructor(private croquiEnderecoRepository: CroquiRepository) {}

  async execute({}: FetchCroquiEnderecoCompletoUseCaseRequest): Promise<FetchCroquiEnderecoCompletoUseCaseResponse> {
    const croquiEnderecos =
      await this.croquiEnderecoRepository.findCroquiEnderecoCompleto();

    return right({
      croquiEnderecos,
    });
  }
}
