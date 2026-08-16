import { Temas } from '../../enterprise/entities/temas';

export abstract class TemasRepository {
  abstract findById(COD_TEMA_ID: string): Promise<Temas | null>;
  abstract findByNome(NOM_NOME_TEMA: string): Promise<Temas | null>;
  abstract findManyByTemasId(COD_TEMA_ID: string): Promise<Temas[]>;
  abstract create(tema: Temas): Promise<void>;
  abstract save(tema: Temas): Promise<void>;
  abstract delete(
    COD_TEMA_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void>;
  abstract countByTemasId(COD_TEMA_ID: string): Promise<number>;
}
