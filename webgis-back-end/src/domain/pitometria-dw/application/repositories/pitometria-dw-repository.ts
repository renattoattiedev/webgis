import { PitometriaDw } from '../../enterprise/entities/pitometria-dw';

export interface FetchPitometriaDwFiltros {
  codSimp?: string;
  matricula?: string;
  numeroOs?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface FetchPitometriaDwSpatialFiltros {
  codigos: string[];
  dataInicio?: Date;
  dataFim?: Date;
  medicaoPressao?: boolean;
  medicaoVazao?: boolean;
  /** Valores exatos de TipoRegistro a incluir. undefined = sem filtro (todos). [] = nenhum. */
  fontesDados?: string[];
  incluirOcorrencia?: boolean;
}

export abstract class PitometriaDwRepository {
  abstract fetchMedicoes(
    filtros: FetchPitometriaDwFiltros,
  ): Promise<PitometriaDw[]>;
  abstract fetchMedicoesByCodigos(
    filtros: FetchPitometriaDwSpatialFiltros,
  ): Promise<PitometriaDw[]>;
}
