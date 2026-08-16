export type TipoPitometria = 'VAZAO' | 'PRESSAO';

export interface Pitometria {
  id: string;
  codigoSimp: string;
  matricula: string;
  tipo: TipoPitometria;
  longitude: number | null;
  latitude: number | null;
  criadoEm: string;
  atualizadoEm: string | null;
}

export interface PitometriaContagem {
  total: number;
  totalVazao: number;
  totalPressao: number;
}

export interface PitometriaFormData {
  codigoSimp: string;
  matricula: string;
  tipo: TipoPitometria;
}
