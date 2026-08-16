import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Pitometria } from '../../enterprise/entities/pitometria';
import { PitometriaRepository } from '../repositories/pitometria-repository';

type FetchPitometriaUseCaseResponse = Either<
  never,
  { pitometrias: Pitometria[] }
>;

@Injectable()
export class FetchPitometriaUseCase {
  constructor(private pitometriaRepository: PitometriaRepository) {}

  async execute(): Promise<FetchPitometriaUseCaseResponse> {
    const pitometrias = await this.pitometriaRepository.findMany();
    return right({ pitometrias });
  }
}
