import { CamadasLog } from '../../enterprise/entities/camadas-log';

export abstract class CamadasLogRepository {
  abstract findById(COD_CAMADA_ID: string): Promise<CamadasLog | null>;
  abstract findByAcesso(DHS_ACESSO: Date): Promise<CamadasLog | null>;
  abstract findMany(): Promise<CamadasLog[]>;

  abstract getAcessosByCamadasId(COD_CAMADA_ID: string): Promise<number>;
  abstract findManyByAcesso(
    DHS_ACESSO_INICIO: Date,
    DHS_ACESSO_FIM: Date,
  ): Promise<CamadasLog[]>;
  abstract create(camadaLogs: CamadasLog): Promise<void>;
}
