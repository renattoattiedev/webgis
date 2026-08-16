import { Temas } from '@/domain/manager/enterprise/entities/temas';

export class TemasPresenter {
  static toHTTP(tema: Temas) {
    return {
      id: tema.id.toString(),
      tituloTema: tema.temaNome,
      criadoEm: tema.createdAt,
      nomeUsrCriacao: tema.temaUsuarioCriacao,
      updatedAt: tema.updatedAt,
      nomeUsrAlteracao: tema.temaUsuarioAlteracao,
    };
  }
}
