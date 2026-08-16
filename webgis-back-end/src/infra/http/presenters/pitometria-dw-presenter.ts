import { PitometriaDw } from '@/domain/pitometria-dw/enterprise/entities/pitometria-dw';

export class PitometriaDwPresenter {
  static toHTTP(m: PitometriaDw) {
    return {
      codPontoMedicao: m.codPontoMedicao,
      nomePontoMedicao: m.nomePontoMedicao,
      localPontoMedicao: m.localPontoMedicao,
      tipoPontoMedicao: m.tipoPontoMedicao,
      situacaoVazao: m.situacaoVazao,
      tipoMedicao: m.tipoMedicao,
      tipoRegistro: m.tipoRegistro,
      codMedidorPressao: m.codMedidorPressao,
      cotaMedidor: m.cotaMedidor,
      instalacaoMedidor: m.instalacaoMedidor,
      diametroRede: m.diametroRede,
      diametroMedidor: m.diametroMedidor,
      matricula: m.matricula,
      dataRegistro: m.dataRegistro,
      ano: m.ano,
      mes: m.mes,
      dia: m.dia,
      hora: m.hora,
      minuto: m.minuto,
      pressaoMaxima: m.pressaoMaxima,
      pressaoMedia: m.pressaoMedia,
      pressaoMinima: m.pressaoMinima,
      amplitude: m.amplitude,
      piezometrica: m.piezometrica,
      desvioPadrao: m.desvioPadrao,
      qtdeRegistros: m.qtdeRegistros,
      numeroOs: m.numeroOs,
      houveOcorrencia: m.houveOcorrencia,
      observacao: m.observacao,
      longitude: m.longitude,
      latitude: m.latitude,
    };
  }
}
