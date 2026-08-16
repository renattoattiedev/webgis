import { Atributos } from '@/domain/camadas/enterprise/entities/atributos';

export class AtributosPresenter {
  static toHTTP(atributos: Atributos) {
    return {
      id: atributos.id.toString(),
      nomeAtributo: atributos.atributoNome,
      label: atributos.atributoLabel,
      tipo: atributos.atributoTipo,
      tamanho: atributos.atributoTamanho,
      visivel: atributos.atributoVisivel,
      descricao: atributos.atributoDescricao,
      ordemRenderizacao: atributos.atributoOrdemRenderizacao,
      usuarioCriacao: atributos.atributoUsuarioCriacao,
      usuarioUltimaAlteracao: atributos.atributoUsuarioUltimaAlteracao,
      createdAt: atributos.createdAt,
      updatedAt: atributos.updatedAt,
    };
  }
}
