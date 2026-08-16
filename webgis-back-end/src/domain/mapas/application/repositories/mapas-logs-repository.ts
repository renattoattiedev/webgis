import { MapasLog } from '../../enterprise/entities/mapas-log';

export abstract class MapasLogRepository {
  abstract findById(COD_MAPA_ID: string): Promise<MapasLog | null>;
  abstract findByAcesso(DHS_ACESSO: Date): Promise<MapasLog | null>;
  abstract findMany(): Promise<MapasLog[]>;

  abstract getAcessosByMapasId(COD_MAPA_ID: string): Promise<number>;
  abstract findManyByAcesso(
    DHS_ACESSO_INICIO: Date,
    DHS_ACESSO_FIM: Date,
  ): Promise<MapasLog[]>;
  abstract create(mapasLog: MapasLog): Promise<void>;
}
