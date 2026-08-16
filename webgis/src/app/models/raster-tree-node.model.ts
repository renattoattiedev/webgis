export interface RasterTreeNode {
  name: string;
  relativePath: string;
  type: 'dir' | 'file';
  size?: number;
  extension?: string;
  alreadyPublished?: boolean;
  camadaId?: string;
}

export interface RasterTreeResponse {
  items: RasterTreeNode[];
}

export interface RasterCheckResponse {
  alreadyPublished: boolean;
  camadaId?: string;
}
