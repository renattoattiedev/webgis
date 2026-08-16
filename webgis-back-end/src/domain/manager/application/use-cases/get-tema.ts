import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Temas } from '../../enterprise/entities/temas';
import { TemasRepository } from '../repositories/temas-repository';

interface GetTemaUseCaseRequest {
  COD_TEMA_ID: string;
}

type GetTemaUseCaseResponse = Either<
  null,
  {
    tema: Temas;
  }
>;

@Injectable()
export class GetTemaUseCase {
  constructor(private temasRepository: TemasRepository) {}

  async execute({
    COD_TEMA_ID,
  }: GetTemaUseCaseRequest): Promise<GetTemaUseCaseResponse> {
    const tema = await this.temasRepository.findById(COD_TEMA_ID);

    if (!tema) {
      return left(null);
    }

    return right({
      tema,
    });
  }
}
