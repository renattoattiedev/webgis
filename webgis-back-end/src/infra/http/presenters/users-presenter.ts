import { User } from '@/domain/security/enterprise/entities/user';

export class UserPresenter {
  static toHTTP(user: User) {
    return {
      id: user.id.toString(),
      nome: user.userNome,
      perfilId: user.userPerfil,
      email: user.userEmail,
      ultimaAutenticacao: user.userUltimaAutenticacao,
      dataExclusao: user.userDataExclusao,
    };
  }
}
