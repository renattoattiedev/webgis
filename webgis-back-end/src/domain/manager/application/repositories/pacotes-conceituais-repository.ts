import { PacotesConceituais } from '../../enterprise/entities/pacotes-conceituais';

export abstract class PacotesConceituaisRepository {
  abstract findById(COD_TEMA_ID: string): Promise<PacotesConceituais | null>;
  abstract findByNome(
    NOM_NOME_PACOTE_CONCEITUAL: string,
  ): Promise<PacotesConceituais | null>;
  abstract findManyByPacotesConceituaisId(
    COD_PACOTE_CONCEITUAL_ID: string,
  ): Promise<PacotesConceituais[]>;
  abstract create(pacoteConceitual: PacotesConceituais): Promise<void>;
  abstract save(pacoteConceitual: PacotesConceituais): Promise<void>;
  abstract delete(
    COD_PACOTE_CONCEITUAL_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void>;
  abstract countByPacotesConceituaisId(
    COD_PACOTE_CONCEITUAL_ID: string,
  ): Promise<number>;
}
