import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface FoldersMapasProps {
  COD_FOLDER_MAPA_ID?: string;
  COD_FOLDER_ID: string;
  COD_MAPA_ID: string;
}

export class FoldersMapas extends Entity<FoldersMapasProps> {
  get codFolderMapaId() {
    return this.props.COD_FOLDER_MAPA_ID;
  }
  get codFolderId() {
    return this.props.COD_FOLDER_ID;
  }

  get codMapaId() {
    return this.props.COD_MAPA_ID;
  }

  setCodFolderId(codFolderId: string) {
    this.props.COD_FOLDER_ID = codFolderId;
  }

  setCodMapaId(codMapaId: string) {
    this.props.COD_MAPA_ID = codMapaId;
  }

  static create(props: FoldersMapasProps, id?: UniqueEntityID) {
    const foldersMapas = new FoldersMapas(props, id);
    return foldersMapas;
  }
}
