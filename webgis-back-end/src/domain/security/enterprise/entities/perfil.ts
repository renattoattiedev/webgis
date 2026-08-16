import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
export interface PerfilProps {
  DSC_PERFIL: string;
}

export class Perfil extends Entity<PerfilProps> {
  get descricaoPerfil() {
    return this.props.DSC_PERFIL;
  }
  SetDescricaoPerfil(descricaoPerfil: string) {
    this.props.DSC_PERFIL = descricaoPerfil;
  }
  static create(props: PerfilProps, id?: UniqueEntityID) {
    const perfil = new Perfil(props, id);

    return perfil;
  }
}
