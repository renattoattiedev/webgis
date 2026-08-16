import { Entity } from '@/core/entities/entity';

export interface UserPerfilProps {
  DSC_PERFIL: string;
}

export class UserPerfil extends Entity<UserPerfilProps> {
  get userPerfilDescricao() {
    return this.props.DSC_PERFIL;
  }
}
