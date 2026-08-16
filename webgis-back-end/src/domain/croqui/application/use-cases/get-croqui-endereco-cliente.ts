import { Either, right } from '@/core/either';
import { CroquiRepository } from '../repositories/croqui-endereco-repository';
import { CroquiEndereco } from '@/domain/croqui/enterprise/entities/croqui-endereco';
import { Injectable } from '@nestjs/common';

interface GetCroquiEnderecoByClienteUseCaseRequest {
  NOM_CLIENTE_INTERNO: string;
}

type GetCroquiEnderecoByClienteUseCaseResponse = Either<
  null,
  {
    croquiEndereco: CroquiEndereco | null;
  }
>;

@Injectable()
export class GetCroquiEnderecoByClienteUseCase {
  constructor(private croquiEnderecoRepository: CroquiRepository) {}

  async execute({
    NOM_CLIENTE_INTERNO,
  }: GetCroquiEnderecoByClienteUseCaseRequest): Promise<GetCroquiEnderecoByClienteUseCaseResponse> {
    const croquiEndereco =
      await this.croquiEnderecoRepository.findCroquiEnderecoCompletoByCliente(
        NOM_CLIENTE_INTERNO,
      );

    return right({
      croquiEndereco,
    });
  }
}
