import { RasterFile } from '../../enterprise/entities/raster-file';

export abstract class RasterFilesRepository {
  abstract listChildren(relativePath: string): Promise<RasterFile[]>;
  abstract exists(relativePath: string): Promise<boolean>;
}
