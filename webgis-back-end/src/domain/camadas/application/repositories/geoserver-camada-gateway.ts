export abstract class GeoserverCamadaGateway {
  /** Atualiza o featuretype recalculando bounding boxes, preservando estilo e configurações do layer. */
  abstract atualizarCamada(
    nomeCamada: string,
    pacoteConceitualNome: string,
  ): Promise<void>;

  /** Invalida os tiles do GWC para a camada. */
  abstract truncarCache(nomeCamada: string): Promise<void>;

  abstract obterBoundingBox(
    pacoteConceitualNome: string,
    nomeCamada: string,
  ): Promise<unknown | null>;

  abstract obterNomePacoteConceitual(
    COD_PACOTE_CONCEITUAL_ID: string,
  ): Promise<string>;
}
