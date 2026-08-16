declare module '@mapbox/shp-write' {
  import { FeatureCollection } from 'geojson';

  interface ZipOptions {
    folder?: string;
    types?: Record<string, string>;
    prj?: string;
    outputType?:
      | 'base64'
      | 'string'
      | 'text'
      | 'binarystring'
      | 'arraybuffer'
      | 'uint8array'
      | 'blob'
      | 'nodebuffer';
    compression?: 'STORE' | 'DEFLATE';
  }

  const shpwrite: {
    zip: (
      data: FeatureCollection,
      options?: ZipOptions,
      stream?: boolean,
    ) => Promise<Blob | ArrayBuffer | Uint8Array | string>;
  };

  export default shpwrite;
}
