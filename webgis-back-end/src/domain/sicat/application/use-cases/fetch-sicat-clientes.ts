import { Either, right } from '@/core/either';
import { SicatRepository } from '../repositories/sicat-repository';
import { Injectable } from '@nestjs/common';
import { SicatCliente } from '../../enterprise/entities/sicat-cliente';

interface FetchSicatClientesUseCaseRequest {}

type FetchSicatClientesUseCaseResponse = Either<
  null,
  {
    clientes: SicatCliente[];
  }
>;

@Injectable()
export class FetchSicatClientesUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute({}: FetchSicatClientesUseCaseRequest): Promise<FetchSicatClientesUseCaseResponse> {
    const clientes = await this.sicatRepository.findManyClientes();

    return right({
      clientes,
    });
  }
}
