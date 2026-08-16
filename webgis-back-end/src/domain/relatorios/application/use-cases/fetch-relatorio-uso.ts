import { Injectable } from '@nestjs/common';
import {
  RelatoriosRepository,
  RelatorioUsoData,
} from '../repositories/relatorios-repository';

interface Request {
  dataInicio: Date;
  dataFim: Date;
}

@Injectable()
export class FetchRelatorioUsoUseCase {
  constructor(private relatoriosRepository: RelatoriosRepository) {}

  async execute(params: Request): Promise<RelatorioUsoData> {
    return this.relatoriosRepository.fetchUso(params);
  }
}
