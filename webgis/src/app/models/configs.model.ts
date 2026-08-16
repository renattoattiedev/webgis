export interface Configs {
  id: string;
  grupoOrder: number;
  keyOrder: number;
  grupoKey: string;
  key: string;
  value: string | null; // 🆕 Pode ser null para configs sensíveis
  isSensitive: boolean; // 🆕 Campo de segurança
  canEdit: boolean; // 🆕 Indica se usuário pode editar
  displayValue: string; // 🆕 Valor para exibição (mascarado ou real)
  criadoEm: Date;
  usrCriacao: string;
  updatedAt: string;
  usrAlteracao: string;
}

export interface RespostaApi {
  configs: Configs[];
}

// 🆕 Interface para edição de config sensível
export interface ConfigForEdit {
  id: string;
  key: string;
  value: string;
  isSensitive: boolean;
  warning?: string;
}
