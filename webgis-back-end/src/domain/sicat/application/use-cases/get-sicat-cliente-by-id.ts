import { Either, right, left } from '@/core/either';
import { SicatRepository } from '../repositories/sicat-repository';
import { Injectable } from '@nestjs/common';
import { SicatCliente } from '../../enterprise/entities/sicat-cliente';

interface GetSicatClienteByIdUseCaseRequest {
  cd_cliente: number;
}

type GetSicatClienteByIdUseCaseResponse = Either<
  null,
  {
    cliente: SicatCliente;
  }
>;

@Injectable()
export class GetSicatClienteByIdUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute({
    cd_cliente,
  }: GetSicatClienteByIdUseCaseRequest): Promise<GetSicatClienteByIdUseCaseResponse> {
    const cliente = await this.sicatRepository.findClienteById(cd_cliente);

    if (!cliente) {
      return left(null);
    }

    return right({
      cliente,
    });
  }
}
