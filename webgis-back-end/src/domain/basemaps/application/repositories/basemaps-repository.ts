import { Basemap } from '../../enterprise/entities/basemap';

export abstract class BasemapsRepository {
  abstract findById(COD_BASEMAP_ID: string): Promise<Basemap | null>;
  abstract findByNome(NOM_NOME_BASEMAP: string): Promise<Basemap | null>;
  abstract findManyByBasemapId(COD_BASEMAP_ID?: string): Promise<Basemap[]>;
  abstract create(basemap: Basemap): Promise<void>;
  abstract save(basemap: Basemap): Promise<void>;
  abstract delete(
    COD_BASEMAP_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void>;
}
