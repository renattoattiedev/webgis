import { Atributos } from '@/domain/camadas/enterprise/entities/atributos';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { AtributosPresenter } from './atributos-presenter';

export class CamadasPresenter {
  static toHTTP(camada: Camadas) {
    return {
      id: camada.id.toString(),
      nomeCamada: camada.camadaNome,
      tituloCamada: camada.camadaTitulo,
      grupoCamada: camada.camadaGruposCamadas,
      pacoteConceitual: camada.camadaPacotesConceituais,
      descricaoCamada: camada.camadaDescricao,
      linkMetadados: camada.camadaLinkMetadados,
      termosDeUso: camada.camadaTermosDeUso,
      nivelCompartilhamentoId: camada.camadaNivelCompartilhamento,
      tags: camada.camadaTags,
      fonteDadosCamada: camada.camadaFonteDadosCamada,
      boundingBox: camada.camadaBoundingBox,
      atributos: camada.camadaAtributos.map((atributo: Atributos) =>
        AtributosPresenter.toHTTP(atributo),
      ),
      criadoEm: camada.createdAt,
      updatedAt: camada.updatedAt,
      deletedAt: camada.deletedAt,
      idUsrCriacao: camada.camadaUsuarioCriacao,
      camadaAtiva: camada.camadaAtiva,
      tipo: 'vetorial',
      carregamentoDefault: camada.camadaCarregamentoDefault || false,
    };
  }
}
