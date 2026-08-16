import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { PitometriaRepository } from '../repositories/pitometria-repository';

interface DeletePitometriaUseCaseRequest {
  id: string;
  COD_USUARIO_EXCLUSAO: string;
}

type DeletePitometriaUseCaseResponse = Either<Error, void>;

@Injectable()
export class DeletePitometriaUseCase {
  constructor(private pitometriaRepository: PitometriaRepository) {}

  async execute({
    id,
    COD_USUARIO_EXCLUSAO,
  }: DeletePitometriaUseCaseRequest): Promise<DeletePitometriaUseCaseResponse> {
    const pitometria = await this.pitometriaRepository.findById(id);

    if (!pitometria) {
      return left(new Error('Medição de pitometria não encontrada'));
    }

    await this.pitometriaRepository.delete(id, COD_USUARIO_EXCLUSAO);

    return right(undefined);
  }
}
