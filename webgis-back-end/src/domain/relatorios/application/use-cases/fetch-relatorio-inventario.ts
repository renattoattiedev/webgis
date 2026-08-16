import { Injectable } from '@nestjs/common';
import {
  RelatoriosRepository,
  RelatorioInventarioData,
} from '../repositories/relatorios-repository';

interface Request {
  temaId?: string;
  ativo?: boolean;
}

@Injectable()
export class FetchRelatorioInventarioUseCase {
  constructor(private relatoriosRepository: RelatoriosRepository) {}

  async execute(params: Request): Promise<RelatorioInventarioData> {
    return this.relatoriosRepository.fetchInventario(params);
  }
}
