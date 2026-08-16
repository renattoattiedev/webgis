export interface User {
  user: any;
  id: string;
  nome: string;
  perfilId: string;
  perfil: string;
  email: string;
  ultimaAutenticacao: string;
  dataExclusao: string;
}

export interface RespostaApi {
  users: User[];
}
