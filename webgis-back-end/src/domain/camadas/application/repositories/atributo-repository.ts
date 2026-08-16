import { Atributos } from '../../enterprise/entities/atributos';

export abstract class AtributosRepository {
  abstract findById(COD_ATRIBUTO_ID: string): Promise<Atributos | null>;
  abstract findByNome(NOM_NOME_ATRIBUTO: string): Promise<Atributos | null>;
  abstract findManyByAtributosCamadasId(
    COD_CAMADA_ID: string,
    manager: boolean,
  ): Promise<Atributos[]>;
  /** Todos os atributos da camada, incluindo soft-deletados e a coluna `id` — usado pela reconciliação de publicação. */
  abstract findAllByCamadaId(COD_CAMADA_ID: string): Promise<Atributos[]>;
  abstract create(atributo: Atributos): Promise<void>;
  abstract save(atributo: Atributos): Promise<void>;
}
