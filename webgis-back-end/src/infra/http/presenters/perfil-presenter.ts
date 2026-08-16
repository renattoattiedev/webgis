import { Perfil } from '@/domain/security/enterprise/entities/perfil';

export class PerfilPresenter {
  static toHTTP(perfil: Perfil) {
    return {
      id: perfil.id.toString(),
      perfil: perfil.descricaoPerfil,
    };
  }
}
