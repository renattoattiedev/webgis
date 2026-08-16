import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface FoldersCamadasProps {
  COD_FOLDER_CAMADADA_ID?: string;
  COD_FOLDER_ID: string;
  COD_CAMADA_ID: string;
}

export class FoldersCamadas extends Entity<FoldersCamadasProps> {
  get codFolderCamadaId() {
    return this.props.COD_FOLDER_CAMADADA_ID;
  }
  get codFolderId() {
    return this.props.COD_FOLDER_ID;
  }

  get codCamadaId() {
    return this.props.COD_CAMADA_ID;
  }

  setCodFolderId(codFolderId: string) {
    this.props.COD_FOLDER_ID = codFolderId;
  }

  setCodCamadaId(codCamadaId: string) {
    this.props.COD_CAMADA_ID = codCamadaId;
  }

  static create(props: FoldersCamadasProps, id?: UniqueEntityID) {
    const foldersCamadas = new FoldersCamadas(props, id);
    return foldersCamadas;
  }
}
