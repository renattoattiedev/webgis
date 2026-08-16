import { CamadasRaster } from '../../enterprise/entities/camadas-raster';

export abstract class CamadasRasterRepository {
  abstract findById(COD_CAMADA_ID: string): Promise<CamadasRaster | null>;
  abstract findByNome(NOM_NOME: string): Promise<CamadasRaster | null>;
  abstract findByNomeFonte(
    NOM_NOME: string,
    DSC_FONTE_DADOS_CAMADA: string,
  ): Promise<CamadasRaster | null>;
  abstract findByFonte(
    DSC_FONTE_DADOS_CAMADA: string,
  ): Promise<CamadasRaster | null>;
  abstract findManyByCamadasId(NOM_NOME: string): Promise<CamadasRaster[]>;
  abstract findManyByCamadasUserId(
    COD_USUARIO_CRIACAO: string,
  ): Promise<CamadasRaster[]>;
  abstract findManyByCamadasGrupoId(
    COD_GRUPO_ID: string,
  ): Promise<CamadasRaster[]>;
  /** Todas as camadas raster ativas (FLG_CAMADA_ATIVA true, não excluídas), independente de grupo. */
  abstract findManyAtivas(): Promise<CamadasRaster[]>;
  abstract create(camada: CamadasRaster): Promise<void>;
  abstract save(camada: CamadasRaster): Promise<void>;
  abstract changeOwner(
    COD_CAMADA_ID: string,
    COD_USUARIO_CRIACAO: string,
    COD_NEW_OWNER: string,
  ): Promise<void>;
  abstract deleteCamada(
    COD_CAMADA_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void>;
  abstract recoveryCamada(COD_CAMADA_ID: string): Promise<void>;
  abstract deactivateCamada(COD_CAMADA_ID: string): Promise<void>;
  abstract activateCamada(COD_CAMADA_ID: string): Promise<void>;
}
