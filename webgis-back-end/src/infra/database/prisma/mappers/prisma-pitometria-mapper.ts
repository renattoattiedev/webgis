import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  Pitometria,
  TipoPitometria,
} from '@/domain/pitometria/enterprise/entities/pitometria';

/**
 * Representa a estrutura crua retornada pela query SQL (colunas em snake_case minúsculas)
 */
export interface RawPitometria {
  cod_pitometria_id: string;
  cod_simp: string;
  matricula: string;
  tipo: TipoPitometria;
  longitude: number | null;
  latitude: number | null;
  cod_usuario_criacao: string;
  dhs_criacao: Date;
  cod_usuario_atualizacao: string | null;
  dhs_atualizacao: Date | null;
  dhs_exclusao: Date | null;
}

export class PrismaPitometriaMapper {
  /**
   * Converte dados brutos da query SQL para entidade de domínio
   */
  static toDomain(raw: RawPitometria): Pitometria {
    return Pitometria.create(
      {
        COD_SIMP: raw.cod_simp,
        MATRICULA: raw.matricula,
        TIPO: raw.tipo,
        longitude: raw.longitude,
        latitude: raw.latitude,
        COD_USUARIO_CRIACAO: raw.cod_usuario_criacao,
        DHS_CRIACAO: raw.dhs_criacao,
        COD_USUARIO_ATUALIZACAO: raw.cod_usuario_atualizacao,
        DHS_ATUALIZACAO: raw.dhs_atualizacao,
        DHS_EXCLUSAO: raw.dhs_exclusao,
      },
      new UniqueEntityID(raw.cod_pitometria_id),
    );
  }
}
