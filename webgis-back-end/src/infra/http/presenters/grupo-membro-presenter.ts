import { GrupoMembroComUsuario } from '@/domain/manager/application/repositories/grupo-membros-repository';

export class GrupoMembroPresenter {
  static toHTTP(item: GrupoMembroComUsuario) {
    return {
      userId: item.membro.userId,
      nome: item.nome,
      email: item.email,
      perfil: item.perfil,
      status: item.membro.status,
      desde: item.membro.createdAt,
    };
  }
}
