import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadasLogRepository } from '../repositories/camadas-logs-repository';

interface GetAcessosCamadaUseCaseRequest {
  COD_CAMADA_ID: string;
}

type GetAcessosCamadaUseCaseResponse = Either<
  null,
  {
    acessos: number;
  }
>;

@Injectable()
export class GetAcessosCamadaUseCase {
  constructor(private camadasLogRepository: CamadasLogRepository) {}

  async execute({
    COD_CAMADA_ID,
  }: GetAcessosCamadaUseCaseRequest): Promise<GetAcessosCamadaUseCaseResponse> {
    const acessos =
      await this.camadasLogRepository.getAcessosByCamadasId(COD_CAMADA_ID);

    return right({
      acessos,
    });
  }
}
