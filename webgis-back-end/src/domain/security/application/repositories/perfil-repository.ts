import { Perfil } from '../../enterprise/entities/perfil';

export abstract class PerfilRepository {
  abstract findById(COD_PERFIL_USER: string): Promise<Perfil | null>;
  abstract findByPerfil(DSC_PERFIL: string): Promise<Perfil | null>;
  abstract findManyPerfil(): Promise<Perfil[]>;
  abstract create(perfil: Perfil): Promise<void>;
}
