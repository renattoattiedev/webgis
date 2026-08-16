import { Controller, Get, Query, Res, Logger, Inject } from '@nestjs/common';
import { Response } from 'express';
import { MinioAPI } from '@/infra/modulos_ext/minio/minio-api';

@Controller('minio')
export class SessionMinioController {
  private readonly logger = new Logger(SessionMinioController.name);

  constructor(
    @Inject(MinioAPI)
    private readonly minioAPI: MinioAPI,
  ) {}

  @Get('generate-presigned-url')
  async generatePresignedUrl(
    @Query('fileName') fileName: string,
    @Res() res: Response,
  ) {
    try {
      if (!fileName) {
        return res.status(400).send({ error: 'fileName é obrigatório' });
      }

      const contentType = this.getContentType(fileName);

      const result = await this.minioAPI.gerarToken(fileName, contentType);

      this.logger.log(`Generated presigned URL for ${fileName}`);

      return res.status(200).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao gerar URL pré-assinada:', errorMessage);
      return res.status(500).json({ error: 'Erro ao gerar URL pré-assinada' });
    }
  }

  private getContentType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    const contentTypes: { [key: string]: string } = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      tiff: 'image/tiff',
      pdf: 'application/pdf',
      zip: 'application/zip',
      tif: 'image/tiff',
    };

    return contentTypes[extension || ''] || 'application/octet-stream';
  }
}
