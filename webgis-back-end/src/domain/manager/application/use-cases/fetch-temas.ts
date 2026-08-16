import { Either, right } from '@/core/either';
import { TemasRepository } from '../repositories/temas-repository';
import { Temas } from '@/domain/manager/enterprise/entities/temas';
import { Injectable } from '@nestjs/common';

interface FetchTemasUseCaseRequest {
  COD_TEMA_ID: string;
}

type FetchTemasUseCaseResponse = Either<
  null,
  {
    temas: Temas[];
  }
>;

@Injectable()
export class FetchTemasUseCase {
  constructor(private temasRepository: TemasRepository) {}

  async execute({
    COD_TEMA_ID,
  }: FetchTemasUseCaseRequest): Promise<FetchTemasUseCaseResponse> {
    const temas = await this.temasRepository.findManyByTemasId(COD_TEMA_ID);

    return right({
      temas,
    });
  }
}
