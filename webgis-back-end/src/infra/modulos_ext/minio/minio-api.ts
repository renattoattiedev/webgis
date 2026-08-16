import axios from 'axios';
import { ConfigService } from '@/config/config.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, PostPolicy } from 'minio';
import { Stream } from 'stream';

@Injectable()
export class MinioAPI implements OnModuleInit {
  private minioClient!: Client;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeMinioClient();
  }

  async getObject(bucket: string, objectName: string): Promise<Stream> {
    return this.minioClient.getObject(bucket, objectName);
  }

  private async initializeMinioClient() {
    const [endPoint, port, useSSL, accessKey, secretKey] = await Promise.all([
      this.configService.getConfig('MINIO_ENDPOINT'),
      this.configService.getConfig('MINIO_PORT'),
      this.configService.getConfig('MINIO_USE_SSL'),
      this.configService.getConfig('MINIO_ACCESS_KEY'),
      this.configService.getConfig('MINIO_SECRET_KEY'),
    ]);

    if (!endPoint || !port || !accessKey || !secretKey) {
      throw new Error('Configurações do MinIO não estão completas');
    }

    this.minioClient = new Client({
      endPoint,
      port: Number(port),
      useSSL: useSSL === 'true',
      accessKey,
      secretKey,
    });
  }

  async gerarToken(
    fileName: string,
    contentType = 'application/octet-stream',
  ): Promise<{
    url: string;
    fields: Record<string, string>;
  }> {
    try {
      const bucketName = 'imagens';

      const bucketExists = await this.minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(bucketName);
      }

      const policy = new PostPolicy();

      policy.setExpires(new Date(Date.now() + 3600 * 1000));
      policy.setBucket(bucketName);
      policy.setKey(fileName);
      policy.setContentType(contentType);

      const result = await this.minioClient.presignedPostPolicy(policy);

      return {
        url: result.postURL,
        fields: result.formData,
      };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error('Erro ao gerar token de upload:', errorMessage);
      throw new Error(`Erro ao gerar token de upload: ${errorMessage}`);
    }
  }

  async deletarArquivoMinio(nomeCamada: string): Promise<void> {
    try {
      const bucketName = 'imagens';

      const objectsStream = this.minioClient.listObjects(
        bucketName,
        nomeCamada,
      );
      const objectsToDelete: string[] = [];

      for await (const obj of objectsStream) {
        if (obj.name.startsWith(nomeCamada)) {
          objectsToDelete.push(obj.name);
        }
      }

      for (const objectName of objectsToDelete) {
        await this.minioClient.removeObject(bucketName, objectName);
      }

      console.log(
        `Arquivos relacionados à camada ${nomeCamada} foram removidos do MinIO com sucesso`,
      );
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error('Erro ao deletar arquivo do MinIO:', errorMessage);
      throw new Error(`Erro ao deletar arquivo do MinIO: ${errorMessage}`);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Erro desconhecido';
  }
}
