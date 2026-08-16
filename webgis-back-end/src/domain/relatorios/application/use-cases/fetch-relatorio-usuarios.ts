import { Injectable } from '@nestjs/common';
import {
  RelatoriosRepository,
  RelatorioUsuariosData,
} from '../repositories/relatorios-repository';

interface Request {
  perfil?: string;
  diasInativo?: number;
}

@Injectable()
export class FetchRelatorioUsuariosUseCase {
  constructor(private relatoriosRepository: RelatoriosRepository) {}

  async execute(params: Request): Promise<RelatorioUsuariosData> {
    return this.relatoriosRepository.fetchUsuarios(params);
  }
}
