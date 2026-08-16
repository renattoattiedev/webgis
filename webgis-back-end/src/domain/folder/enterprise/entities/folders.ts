import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface FoldersProps {
  DSC_FOLDER: string;
  COD_USUARIO_CRIACAO: string;
}

export class Folders extends Entity<FoldersProps> {
  get descricaoFolder() {
    return this.props.DSC_FOLDER;
  }

  get usuarioCriacaoFolder() {
    return this.props.COD_USUARIO_CRIACAO;
  }

  SetDescricaoFolder(descricaoFolder: string) {
    this.props.DSC_FOLDER = descricaoFolder;
  }

  setFolderUsuarioCriacao(userUsuarioCriacao: string) {
    this.props.COD_USUARIO_CRIACAO = userUsuarioCriacao;
  }

  static create(props: FoldersProps, id?: UniqueEntityID) {
    const folder = new Folders(props, id);

    return folder;
  }
}
