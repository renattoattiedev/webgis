import { UsuarioDisponivel } from '@/domain/security/application/use-cases/fetch-usuarios-disponiveis';

export class UsuarioDisponivelPresenter {
  static toHTTP(usuario: UsuarioDisponivel) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    };
  }
}
