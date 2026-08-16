export interface RasterFileProps {
  name: string;
  relativePath: string;
  type: 'dir' | 'file';
  size?: number;
  extension?: string;
}

export class RasterFile {
  readonly name: string;
  readonly relativePath: string;
  readonly type: 'dir' | 'file';
  readonly size?: number;
  readonly extension?: string;

  constructor(props: RasterFileProps) {
    this.name = props.name;
    this.relativePath = props.relativePath;
    this.type = props.type;
    this.size = props.size;
    this.extension = props.extension;
  }

  static directory(name: string, relativePath: string): RasterFile {
    return new RasterFile({ name, relativePath, type: 'dir' });
  }

  static file(
    name: string,
    relativePath: string,
    size: number,
    extension: string,
  ): RasterFile {
    return new RasterFile({
      name,
      relativePath,
      type: 'file',
      size,
      extension,
    });
  }
}
