import { Either, right } from '@/core/either';
import { CroquiRepository } from '../repositories/croqui-endereco-repository';
import { CroquiEndereco } from '@/domain/croqui/enterprise/entities/croqui-endereco';
import { Injectable } from '@nestjs/common';

interface GetCroquiEnderecoByMatriculaUseCaseRequest {
  NUM_MATRICULA_IMOVEL: number;
}

type GetCroquiEnderecoByMatriculaUseCaseResponse = Either<
  null,
  {
    croquiEndereco: CroquiEndereco | null;
  }
>;

@Injectable()
export class GetCroquiEnderecoByMatriculaUseCase {
  constructor(private croquiEnderecoRepository: CroquiRepository) {}

  async execute({
    NUM_MATRICULA_IMOVEL,
  }: GetCroquiEnderecoByMatriculaUseCaseRequest): Promise<GetCroquiEnderecoByMatriculaUseCaseResponse> {
    const croquiEndereco =
      await this.croquiEnderecoRepository.findCroquiEnderecoCompletoByMatricula(
        NUM_MATRICULA_IMOVEL,
      );

    return right({
      croquiEndereco,
    });
  }
}
