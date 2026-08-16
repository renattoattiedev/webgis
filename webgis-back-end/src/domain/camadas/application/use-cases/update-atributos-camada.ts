import { Injectable } from '@nestjs/common';
import { AtributosRepository } from '../repositories/atributo-repository';

interface UpdateAtributoRequest {
  COD_ATRIBUTO_ID: string;
  DSC_LABEL_ATRIBUTO: string;
  FLG_VISIVEL: boolean;
  TXT_DESCRICAO: string;
  NUM_ORDEM_RENDERIZACAO?: number;
  COD_USUARIO_ULTIMA_ALTERACAO: string;
}

@Injectable()
export class UpdateAtributoUseCase {
  constructor(private atributosRepository: AtributosRepository) {}

  async execute({
    COD_ATRIBUTO_ID,
    DSC_LABEL_ATRIBUTO,
    FLG_VISIVEL,
    TXT_DESCRICAO,
    NUM_ORDEM_RENDERIZACAO,
    COD_USUARIO_ULTIMA_ALTERACAO,
  }: UpdateAtributoRequest) {
    const atributo = await this.atributosRepository.findById(
      COD_ATRIBUTO_ID.toString(),
    );
    if (!atributo) {
      throw new Error('Atributo not found');
    }

    atributo.setAtributoLabel(DSC_LABEL_ATRIBUTO);
    atributo.setAtributoVisivel(FLG_VISIVEL);
    atributo.setAtributoDescricao(TXT_DESCRICAO);
    if (NUM_ORDEM_RENDERIZACAO) {
      atributo.setAtributoOrdemRenderizacao(NUM_ORDEM_RENDERIZACAO);
    }
    if (COD_USUARIO_ULTIMA_ALTERACAO) {
      atributo.setAtributoUsuarioUltimaAlteracao(COD_USUARIO_ULTIMA_ALTERACAO);
    }
    await this.atributosRepository.save(atributo);
  }
}
