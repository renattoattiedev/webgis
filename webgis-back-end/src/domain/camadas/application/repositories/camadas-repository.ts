import { PacotesConceituais } from '@/domain/manager/enterprise/entities/pacotes-conceituais';
import { Camadas } from '../../enterprise/entities/camadas';

export abstract class CamadasRepository {
  abstract findById(COD_CAMADA_ID: string): Promise<Camadas | null>;
  abstract findByNome(NOM_NOME: string): Promise<Camadas | null>;
  abstract findManyByCamadasId(NOM_NOME: string): Promise<Camadas[]>;
  abstract findPacoteConceitual(NOM_NOME: string): Promise<string | null>;
  abstract findManyByCamadasUserId(
    COD_USUARIO_CRIACAO: string,
  ): Promise<Camadas[]>;
  abstract findManyByCamadasGrupoId(COD_GRUPO_ID: string): Promise<Camadas[]>;
  /** Todas as camadas ativas (FLG_CAMADA_ATIVA true, não excluídas), independente de grupo. */
  abstract findManyAtivas(): Promise<Camadas[]>;
  /** Camadas ativas de um pacote conceitual — usado para casar tabelas do PostGIS com camadas já publicadas. */
  abstract findManyByPacoteConceitual(
    COD_PACOTE_CONCEITUAL_ID: string,
  ): Promise<Camadas[]>;
  abstract create(camada: Camadas): Promise<void>;
  abstract save(camada: Camadas): Promise<void>;
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

  abstract findComponentsAssociatedWithCamada(
    COD_CAMADA_ID: string,
  ): Promise<Array<{ COD_COMPONENTE_ID: string; NOM_NOME_COMPONENTE: string }>>;
}
