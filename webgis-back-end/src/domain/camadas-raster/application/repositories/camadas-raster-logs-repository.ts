import { CamadasRasterLog } from '../../enterprise/entities/camadas-raster-log';

export abstract class CamadasRasterLogRepository {
  abstract findById(COD_CAMADA_ID: string): Promise<CamadasRasterLog | null>;
  abstract findByAcesso(DHS_ACESSO: Date): Promise<CamadasRasterLog | null>;
  abstract findMany(): Promise<CamadasRasterLog[]>;

  abstract getAcessosByCamadasId(COD_CAMADA_ID: string): Promise<number>;
  abstract findManyByAcesso(
    DHS_ACESSO_INICIO: Date,
    DHS_ACESSO_FIM: Date,
  ): Promise<CamadasRasterLog[]>;
  abstract create(camadaLogs: CamadasRasterLog): Promise<void>;
}
