import { Folders } from '@/domain/folder/enterprise/entities/folders';

export class FoldersPresenter {
  static toHTTP(folder: Folders) {
    return {
      id: folder.id.toString(),
      descricao: folder.descricaoFolder,
      usuarioCriacao: folder.usuarioCriacaoFolder,
    };
  }
}
