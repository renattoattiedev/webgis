import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Pitometria } from '../../enterprise/entities/pitometria';
import { PitometriaRepository } from '../repositories/pitometria-repository';

interface GetPitometriaByIdUseCaseRequest {
  id: string;
}

type GetPitometriaByIdUseCaseResponse = Either<
  Error,
  { pitometria: Pitometria }
>;

@Injectable()
export class GetPitometriaByIdUseCase {
  constructor(private pitometriaRepository: PitometriaRepository) {}

  async execute({
    id,
  }: GetPitometriaByIdUseCaseRequest): Promise<GetPitometriaByIdUseCaseResponse> {
    const pitometria = await this.pitometriaRepository.findById(id);

    if (!pitometria) {
      return left(new Error('Medição de pitometria não encontrada'));
    }

    return right({ pitometria });
  }
}
