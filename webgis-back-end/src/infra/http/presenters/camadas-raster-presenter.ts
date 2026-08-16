import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

export class CamadasRasterPresenter {
  static toHTTP(camada: CamadasRaster) {
    const fonteRaw = camada.camadaFonteDadosCamada;
    const fonteDiscriminador = fonteRaw === 'uploaded' ? 'uploaded' : 'raster';
    const caminhoArquivo = fonteRaw === 'uploaded' ? null : fonteRaw ?? null;
    return {
      id: camada.id.toString(),
      nomeCamada: camada.camadaNome,
      fonteDadosCamadaRaster: fonteDiscriminador,
      caminhoArquivo,
      tituloCamada: camada.camadaTitulo,
      grupoCamada: camada.camadaGruposCamadas,
      descricaoCamada: camada.camadaDescricao,
      linkMetadados: camada.camadaLinkMetadados,
      termosDeUso: camada.camadaTermosDeUso,
      nivelCompartilhamentoId: camada.camadaNivelCompartilhamento,
      tags: camada.camadaTags,
      boundingBox: camada.camadaBoundingBox,
      criadoEm: camada.createdAt,
      updatedAt: camada.updatedAt,
      deletedAt: camada.deletedAt,
      idUsrCriacao: camada.camadaUsuarioCriacao,
      camadaAtiva: camada.camadaAtiva,
      tipo: 'raster',
      carregamentoDefault: camada.camadaCarregamentoDefault,
      status: camada.camadaStatus,
      uploadProgress: camada.camadaUploadProgress,
      seedStatus: camada.camadaSeedStatus,
      seedProgress: camada.camadaSeedProgress,
      cogPerfil: camada.camadaCogPerfil,
    };
  }
}
