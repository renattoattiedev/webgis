export interface PitometriaDwProps {
  CodPontoMedicao: string;
  NomePontoMedicao: string | null;
  LocalPontoMedicao: string | null;
  TipoPontoMedicao: string | null;
  SituacaoVazao: string | null;
  TipoMedicao: string | null;
  TipoRegistro: string | null;
  CodMedidorPressao: string | null;
  CotaMedidor: number | null;
  InstalacaoMedidor: string | null;
  DiametroRede: number | null;
  DiametroMedidor: number | null;
  Matricula: string | null;
  DataRegistro: Date | null;
  Ano: number | null;
  Mes: number | null;
  Dia: number | null;
  Hora: number | null;
  Minuto: number | null;
  PressaoMaxima: number | null;
  PressaoMedia: number | null;
  PressaoMinima: number | null;
  Amplitude: number | null;
  Piezometrica: number | null;
  DesvioPadrao: number | null;
  QtdeRegistros: number | null;
  NumeroOS: string | null;
  HouveOcorrencia: boolean | null;
  Observacao: string | null;
  longitude: number | null;
  latitude: number | null;
}

export class PitometriaDw {
  constructor(public readonly props: PitometriaDwProps) {}

  get codPontoMedicao() {
    return this.props.CodPontoMedicao;
  }
  get nomePontoMedicao() {
    return this.props.NomePontoMedicao;
  }
  get localPontoMedicao() {
    return this.props.LocalPontoMedicao;
  }
  get tipoPontoMedicao() {
    return this.props.TipoPontoMedicao;
  }
  get situacaoVazao() {
    return this.props.SituacaoVazao;
  }
  get tipoMedicao() {
    return this.props.TipoMedicao;
  }
  get tipoRegistro() {
    return this.props.TipoRegistro;
  }
  get codMedidorPressao() {
    return this.props.CodMedidorPressao;
  }
  get cotaMedidor() {
    return this.props.CotaMedidor;
  }
  get instalacaoMedidor() {
    return this.props.InstalacaoMedidor;
  }
  get diametroRede() {
    return this.props.DiametroRede;
  }
  get diametroMedidor() {
    return this.props.DiametroMedidor;
  }
  get matricula() {
    return this.props.Matricula;
  }
  get dataRegistro() {
    return this.props.DataRegistro;
  }
  get ano() {
    return this.props.Ano;
  }
  get mes() {
    return this.props.Mes;
  }
  get dia() {
    return this.props.Dia;
  }
  get hora() {
    return this.props.Hora;
  }
  get minuto() {
    return this.props.Minuto;
  }
  get pressaoMaxima() {
    return this.props.PressaoMaxima;
  }
  get pressaoMedia() {
    return this.props.PressaoMedia;
  }
  get pressaoMinima() {
    return this.props.PressaoMinima;
  }
  get amplitude() {
    return this.props.Amplitude;
  }
  get piezometrica() {
    return this.props.Piezometrica;
  }
  get desvioPadrao() {
    return this.props.DesvioPadrao;
  }
  get qtdeRegistros() {
    return this.props.QtdeRegistros;
  }
  get numeroOs() {
    return this.props.NumeroOS;
  }
  get houveOcorrencia() {
    return this.props.HouveOcorrencia;
  }
  get observacao() {
    return this.props.Observacao;
  }
  get longitude() {
    return this.props.longitude;
  }
  get latitude() {
    return this.props.latitude;
  }

  static create(props: PitometriaDwProps): PitometriaDw {
    return new PitometriaDw(props);
  }
}
