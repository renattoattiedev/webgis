import { Either, right } from '@/core/either';
import { AtributosRepository } from '../repositories/atributo-repository';
import { Atributos } from '@/domain/camadas/enterprise/entities/atributos';
import { Injectable } from '@nestjs/common';

interface FetchAtributosUseCaseRequest {
  COD_CAMADA_ID: string;
  manager: boolean;
}
type FetchAtributosUseCaseResponse = Either<
  null,
  {
    atributos: Atributos[];
  }
>;

@Injectable()
export class FetchAtributosCamadasUseCase {
  constructor(private atributosRepository: AtributosRepository) {}

  async execute({
    COD_CAMADA_ID,
    manager,
  }: FetchAtributosUseCaseRequest): Promise<FetchAtributosUseCaseResponse> {
    const atributos =
      await this.atributosRepository.findManyByAtributosCamadasId(
        COD_CAMADA_ID,
        manager,
      );

    return right({
      atributos,
    });
  }
}
