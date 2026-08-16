import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface FoldersCamadasRasterProps {
  COD_FOLDER_CAMADADA_ID?: string;
  COD_FOLDER_ID: string;
  COD_CAMADA_RASTER_ID: string;
}

export class FoldersCamadasRaster extends Entity<FoldersCamadasRasterProps> {
  get codFolderCamadaId() {
    return this.props.COD_FOLDER_CAMADADA_ID;
  }
  get codFolderId() {
    return this.props.COD_FOLDER_ID;
  }

  get codCamadaId() {
    return this.props.COD_CAMADA_RASTER_ID;
  }

  setCodFolderId(codFolderId: string) {
    this.props.COD_FOLDER_ID = codFolderId;
  }

  setCodCamadaId(codCamadaId: string) {
    this.props.COD_CAMADA_RASTER_ID = codCamadaId;
  }

  static create(props: FoldersCamadasRasterProps, id?: UniqueEntityID) {
    const foldersCamadas = new FoldersCamadasRaster(props, id);
    return foldersCamadas;
  }
}
