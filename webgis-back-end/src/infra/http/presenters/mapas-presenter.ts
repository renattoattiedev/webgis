import { Mapas } from '@/domain/mapas/enterprise/entities/mapas';
import { CamadasPresenter } from './camadas-presenter';
import { CamadasRasterPresenter } from './camadas-raster-presenter';

export class MapasPresenter {
  static toHTTP(mapa: Mapas) {
    return {
      id: mapa.id.toString(),
      nomeMapa: mapa.mapaNome,
      tituloMapa: mapa.mapaTitulo,
      descricaoMapa: mapa.mapaDescricao,
      boundingBoxMapa: mapa.mapaBoundingBox || null,
      nivelCompartilhamentoMapa: mapa.mapaNivelCompartilhamento,
      grupoMapa: mapa.mapaGrupo,
      usrCriacao: mapa.mapaUsuarioCriacao,
      idUsrAlteracao: mapa.mapaUsuarioUltimaAlteracao,
      criadoEm: mapa.createdAt,
      updatedAt: mapa.updatedAt,
      deletedAt: mapa.deletedAt,
      carregamentoDefault: mapa.mapaCarregamentoDefault || false,
    };
  }
}
