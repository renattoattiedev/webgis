import { Componente } from '../../enterprise/entities/componente';

export abstract class ComponenteRepository {
  abstract findById(COD_COMPONENTE_ID: string): Promise<Componente | null>;
  abstract findByNome(NOM_NOME_COMPONENTE: string): Promise<Componente | null>;
  abstract findManyByComponenteId(
    COD_COMPONENTE_ID: string,
  ): Promise<Componente[]>;
  abstract create(componente: Componente): Promise<void>;
  abstract save(componente: Componente): Promise<void>;
  abstract delete(COD_COMPONENTE_ID: string): Promise<void>;
  abstract countByComponenteId(COD_COMPONENTE_ID: string): Promise<number>;
}
