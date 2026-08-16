import {
  PitometriaDw,
  PitometriaDwProps,
} from '@/domain/pitometria-dw/enterprise/entities/pitometria-dw';

export class PitometriaDwMapper {
  static toDomain(raw: Record<string, any>): PitometriaDw {
    const props: PitometriaDwProps = {
      CodPontoMedicao:
        raw['CodPontoMedicao'] != null ? String(raw['CodPontoMedicao']) : '',
      NomePontoMedicao: raw['NomePontoMedicao'] ?? null,
      LocalPontoMedicao: raw['LocalPontoMedicao'] ?? null,
      TipoPontoMedicao: raw['TipoPontoMedicao'] ?? null,
      SituacaoVazao: raw['SituacaoVazao'] ?? null,
      TipoMedicao: raw['TipoMedicao'] ?? null,
      TipoRegistro: raw['TipoRegistro'] ?? null,
      CodMedidorPressao: raw['CodMedidorPressao'] ?? null,
      CotaMedidor:
        raw['CotaMedidor'] != null ? Number(raw['CotaMedidor']) : null,
      InstalacaoMedidor: raw['InstalacaoMedidor'] ?? null,
      DiametroRede:
        raw['DiametroRede'] != null ? Number(raw['DiametroRede']) : null,
      DiametroMedidor:
        raw['DiametroMedidor'] != null ? Number(raw['DiametroMedidor']) : null,
      Matricula: raw['Matricula'] ?? null,
      DataRegistro: raw['DataRegistro'] ? new Date(raw['DataRegistro']) : null,
      Ano: raw['Ano'] != null ? Number(raw['Ano']) : null,
      Mes: raw['Mes'] != null ? Number(raw['Mes']) : null,
      Dia: raw['Dia'] != null ? Number(raw['Dia']) : null,
      Hora: raw['Hora'] != null ? Number(raw['Hora']) : null,
      Minuto: raw['Minuto'] != null ? Number(raw['Minuto']) : null,
      PressaoMaxima:
        raw['PressaoMaxima'] != null ? Number(raw['PressaoMaxima']) : null,
      PressaoMedia:
        raw['PressaoMedia'] != null ? Number(raw['PressaoMedia']) : null,
      PressaoMinima:
        raw['PressaoMinima'] != null ? Number(raw['PressaoMinima']) : null,
      Amplitude: raw['Amplitude'] != null ? Number(raw['Amplitude']) : null,
      Piezometrica:
        raw['Piezometrica'] != null ? Number(raw['Piezometrica']) : null,
      DesvioPadrao:
        raw['DesvioPadrao'] != null ? Number(raw['DesvioPadrao']) : null,
      QtdeRegistros:
        raw['QtdeRegistros'] != null ? Number(raw['QtdeRegistros']) : null,
      NumeroOS: raw['NumeroOS'] ?? null,
      HouveOcorrencia:
        raw['HouveOcorrencia'] != null ? Boolean(raw['HouveOcorrencia']) : null,
      Observacao: raw['Observacao'] ?? null,
      longitude: null,
      latitude: null,
    };
    return PitometriaDw.create(props);
  }
}
