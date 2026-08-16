export interface SeqSsItem {
  seqSs: number;
}

export interface SsSequenciasResponse {
  seqSs: SeqSsItem[];
  success: boolean;
  message: string;
  total: number;
  numSs: string;
}
