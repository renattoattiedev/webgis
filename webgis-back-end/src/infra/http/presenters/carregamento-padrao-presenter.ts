import { UnifiedContentRow } from '@/domain/manager/application/repositories/content-repository';

export class CarregamentoPadraoPresenter {
  static toHTTP(row: UnifiedContentRow) {
    return {
      id: row.COD_CONTEUDO,
      grupoId: row.COD_GRUPO_ID,
      temaId: row.COD_TEMA_ID,
      tipo: row.DSC_TIPO, // 'V' | 'R' | 'M'
      carregamentoDefault: row.BOL_CARREGAMENTO_DEFAULT,
    };
  }

  static manyToHTTP(rows: UnifiedContentRow[]) {
    return rows.map(this.toHTTP);
  }
}
