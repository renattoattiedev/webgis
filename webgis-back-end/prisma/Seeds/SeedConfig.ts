import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Config {
  NUM_GRUPO_ORDER: number;
  NUM_KEY_ORDER: number;
  DSC_GRUPO_KEY: string;
  DSC_KEY: string;
  DSC_VALUE: string;
}

export class SeedConfig {
  async run() {
    const configs: Config[] = [
      {
        NUM_GRUPO_ORDER: 1,
        NUM_KEY_ORDER: 1,
        DSC_GRUPO_KEY: 'ENDEREÇOS BASE',
        DSC_KEY: 'BASE_URL',
        DSC_VALUE: 'https://dev-api-giscesan.cesan.com.br',
      },
      {
        NUM_GRUPO_ORDER: 1,
        NUM_KEY_ORDER: 1,
        DSC_GRUPO_KEY: 'ENDEREÇOS BASE',
        DSC_KEY: 'BASE_URL_FRONTEND',
        DSC_VALUE: 'https://dev-giscesan.cesan.com.br/',
      },
      {
        NUM_GRUPO_ORDER: 2,
        NUM_KEY_ORDER: 1,
        DSC_GRUPO_KEY: 'GEOSERVER',
        DSC_KEY: 'GEOSERVER_USER',
        DSC_VALUE: 'admin',
      },
      {
        NUM_GRUPO_ORDER: 2,
        NUM_KEY_ORDER: 2,
        DSC_GRUPO_KEY: 'GEOSERVER',
        DSC_KEY: 'GEOSERVER_PASSWORD',
        DSC_VALUE: 'geoserver',
      },
      {
        NUM_GRUPO_ORDER: 2,
        NUM_KEY_ORDER: 3,
        DSC_GRUPO_KEY: 'GEOSERVER',
        DSC_KEY: 'GEOSERVER_URL',
        DSC_VALUE: 'http://localhost:8080/geoserver',
      },
      {
        NUM_GRUPO_ORDER: 3,
        NUM_KEY_ORDER: 1,
        DSC_GRUPO_KEY: 'COORDENADAS',
        DSC_KEY: 'LATITUDE',
        DSC_VALUE: '-15.7939',
      },
      {
        NUM_GRUPO_ORDER: 3,
        NUM_KEY_ORDER: 2,
        DSC_GRUPO_KEY: 'COORDENADAS',
        DSC_KEY: 'LONGITUDE',
        DSC_VALUE: '-47.8828',
      },
      {
        NUM_GRUPO_ORDER: 4,
        NUM_KEY_ORDER: 1,
        DSC_GRUPO_KEY: 'MINIO',
        DSC_KEY: 'MINIO_ENDPOINT',
        DSC_VALUE: 'localhost',
      },
      {
        NUM_GRUPO_ORDER: 4,
        NUM_KEY_ORDER: 2,
        DSC_GRUPO_KEY: 'MINIO',
        DSC_KEY: 'MINIO_PORT',
        DSC_VALUE: '9000',
      },
      {
        NUM_GRUPO_ORDER: 4,
        NUM_KEY_ORDER: 3,
        DSC_GRUPO_KEY: 'MINIO',
        DSC_KEY: 'MINIO_USE_SSL',
        DSC_VALUE: 'false',
      },
      {
        NUM_GRUPO_ORDER: 4,
        NUM_KEY_ORDER: 4,
        DSC_GRUPO_KEY: 'MINIO',
        DSC_KEY: 'MINIO_ACCESS_KEY',
        DSC_VALUE: 'vHWQPjUujJwsKuadTpBT',
      },
      {
        NUM_GRUPO_ORDER: 4,
        NUM_KEY_ORDER: 5,
        DSC_GRUPO_KEY: 'MINIO',
        DSC_KEY: 'MINIO_SECRET_KEY',
        DSC_VALUE: 'wjTlhKuV0yk2lpwarb9bBaWhyDO1atSXVty9JpK8',
      },
      {
        NUM_GRUPO_ORDER: 5,
        NUM_KEY_ORDER: 1,
        DSC_GRUPO_KEY: 'E-MAIL',
        DSC_KEY: 'MAIL_HOST',
        DSC_VALUE: 'mail-queue.cesan.com.br',
      },
      {
        NUM_GRUPO_ORDER: 5,
        NUM_KEY_ORDER: 2,
        DSC_GRUPO_KEY: 'E-MAIL',
        DSC_KEY: 'MAIL_PORT',
        DSC_VALUE: '587',
      },
      {
        NUM_GRUPO_ORDER: 5,
        NUM_KEY_ORDER: 3,
        DSC_GRUPO_KEY: 'E-MAIL',
        DSC_KEY: 'MAIL_USER',
        DSC_VALUE: 'webgis',
      },
      {
        NUM_GRUPO_ORDER: 5,
        NUM_KEY_ORDER: 4,
        DSC_GRUPO_KEY: 'E-MAIL',
        DSC_KEY: 'MAIL_PASS',
        DSC_VALUE: 'iU7ysGfat*hsfg#ooPpai8',
      },
      {
        NUM_GRUPO_ORDER: 5,
        NUM_KEY_ORDER: 5,
        DSC_GRUPO_KEY: 'E-MAIL',
        DSC_KEY: 'MAIL_FROM',
        DSC_VALUE: 'webgis@cesan.com.br',
      },
      {
        NUM_GRUPO_ORDER: 6,
        NUM_KEY_ORDER: 1,
        DSC_GRUPO_KEY: 'CAPTCHA GOOGLE',
        DSC_KEY: 'RECAPTCHA_SECRET_KEY',
        DSC_VALUE: '6LcOhqApAAAAALbmzGGdY3fiD7JqdznGKlMno2yI',
      },
      {
        NUM_GRUPO_ORDER: 6,
        NUM_KEY_ORDER: 2,
        DSC_GRUPO_KEY: 'CAPTCHA GOOGLE',
        DSC_KEY: 'PLUGIN_SECRET',
        DSC_VALUE: 'c48afe16-b76a-4429-b2d2-0e370747d9b7',
      },
      {
        NUM_GRUPO_ORDER: 7,
        NUM_KEY_ORDER: 1,
        DSC_GRUPO_KEY: 'JWT',
        DSC_KEY: 'JWT_PRIVATE_KEY',
        DSC_VALUE:
          'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRREFsR3NjenkzZGlaRjkKeUdqY1Mzd0tYZTNBakIzbVFYbFZaRC9ZbWZxN1V6a2IramloNUdXUmNBNkM4UmQxVjVqUDJYK05xcjZXL3Q1ZQpHQVVGWVV1b1VtT3grMmpxd0JKSWVnVnRvVzZjZVZqa3dlSmllRXJjVU1vRzBxbzBFbUk1VnVOVXhNYUJCT1RSClBtNmZqZ2RjL0k2QXo2eFgvZnBNZE9QSVVRejNadEd4a3UybXNGNktsN3REdEhKL0tvcUxpQnhSWWdibXJqTk4KRWJneEVUMmF4TnlMcllkKzFFWmtyWDAwSFFEV2lmSmpaeGZIMitTNFB1NVdlM2VYbWY2c0pYMnBEb2VvMFc1RAo1SzJtVnM1alBNQWtRQ09OTE0vbWRxVU1DT3lvN2tXT283akd2dkx4NFdBMkVSMjgrM1hRcEYzRkRCRm5RMlBFCnRmbnpZaWI3QWdNQkFBRUNnZ0VBQjFMOXVlUkZSY293SHQwSzQrbjVCem5vUzJ6b3pET01Sa3VnUkFBak1aR3EKTjk2dDNiWmVpSWYrL1VybkRmN3RZR1pRdkJZVTFwQk42NzAxSDYzQ0gxNDJ6WE9XMjJxL3AwTUF4dGtmYUZNVApKdXdhekl6dnArNW9xSmJGZzJKNW10MnJtck03SzNnQXJkYVdoWG4wM0x2OFBYam9nSlkzdVVXdXpoVUxEYk9wCjVna0l2ZWsyQUd1Zlk5OGtaMWM2TTVqWTVKbTc1cHlWTG9qQ0E2eFN5SkhyRDFLNU1heFFNRWl2TCt2dVZZa2EKL3oreEo0M0xxUkw0TjE0ajBOQWxVU0RlRS8xUEgxcURxKzZiaXgwK3dYZXpZZ1dGeHc5eVpZS0xDeHZaRi9HOQptRGpYYjdYYUI2L0lzcW5aVUNXYVZmbDRtcmwzdS83eWQvUWcwdWh4U1FLQmdRRDJVSHA2a0owWGFHMmgrdHBQCkVvWG1aa0krVVpraVFMbjh5bEUzbWdQOFNPNEFYTmdKSUltK1BCRXVNR0xKQ0hzMVMzS1oyK29VNzVVM1JLaHMKcVVUK3ZYcVJpT0I4dWNEVkM1bjljWUpFa2lPeGNIZTVTdnFsc014SngrcGhnVVNQRnBFa0xWakNEMlYwODcyWQoraktHQmc4ZDFpVkVUY2p5SlRFbkZuZko0d0tCZ1FESUp3VmVaV3dUK0toWXRScG54MFVEL1lVVnhtakNHbEx1CldLWFlOUWlXSGI3ZFNiYmloUFhDc1RtMk9iQTZvZ0NDbmNPcUFuRmFadDhYOEtvWVBJeFlsN1RQLzVUa3RiQTAKVUkyMU4xNUloaUFidVM5TVFtRFpvN2t4UGl4amJaL01KTy9aVGowVlFKVjBMS1pvRGV5dVRwVXd0bHAwYWpBdwpoREJFTXBrYUNRS0JnRm9pVFE5NHgrTis5VTltNm1neEVRcWt0T3oxRXlKenFSdVdOVzR4VC9BTUIvdmQvYmdwClRmNXRJS1JVVkhIWVJxM1Q5QlhWWWExVGxyam95UEVxWi9NSUIwZ21YRytIMGNha1BpOStUL3NqdHlnQlRlNWkKUDZKT05oTnhzcFVIcHJ6dHR5TVQ3UHptZ1d2d25aclRRNVhEdGRobk9xL3AvdlNOSTVWNEpWR2RBb0dBTEd2RQpuRU9rTGZhRTNsTXJUaGNDc1RVRjRXUk1nYSszOGlBSWhxaVdoRUtMeHE4Q2dObURkYmRCbUxqSzdPaGhkcHV1Ci9qOVdpdnJEenB0aUZNanpXUUlxWmZOU1IwUXZuQnk0cHB4b04yNVZGL0lNbGo4eElYeGRzSmtjM3VCSWs5VXEKeWk2OERjaHNvd0Q1MmFRbGdEWCtsSFlVTXp3Ui8rS0dsOHduQUlrQ2dZRUFneU44a1lYb3RGWkY0YkhHQjBqcQpZb3ladmczMVoyVTlHbjNZU1ZzR3Q3S0FDVnVTbXBxUzV4V0d3R2IxUkMvZTVoTkt3Y3RmZWR5U1hYTytsbTFHCjc3YVl5TXpoZGVWQ3hwS0o5VmdiYTBVVFhLMVBXUGNaaEZhUVR0eEtweGhaeWFGend6VEtOWUhibmhySkxxbkEKbmJTNDBWNGVTSnBKV01FajJtNzdrU2M9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0=',
      },
      {
        NUM_GRUPO_ORDER: 7,
        NUM_KEY_ORDER: 2,
        DSC_GRUPO_KEY: 'JWT',
        DSC_KEY: 'JWT_PUBLIC_KEY',
        DSC_VALUE:
          'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF3SlJySE04dDNZbVJmY2hvM0V0OApDbDN0d0l3ZDVrRjVWV1EvMkpuNnUxTTVHL280b2VSbGtYQU9ndkVYZFZlWXo5bC9qYXErbHY3ZVhoZ0ZCV0ZMCnFGSmpzZnRvNnNBU1NIb0ZiYUZ1bkhsWTVNSGlZbmhLM0ZES0J0S3FOQkppT1ZialZNVEdnUVRrMFQ1dW40NEgKWFB5T2dNK3NWLzM2VEhUanlGRU05MmJSc1pMdHByQmVpcGU3UTdSeWZ5cUtpNGdjVVdJRzVxNHpUUkc0TVJFOQptc1RjaTYySGZ0UkdaSzE5TkIwQTFvbnlZMmNYeDl2a3VEN3VWbnQzbDVuK3JDVjlxUTZIcU5GdVErU3RwbGJPCll6ekFKRUFqalN6UDVuYWxEQWpzcU81RmpxTzR4cjd5OGVGZ05oRWR2UHQxMEtSZHhRd1JaME5qeExYNTgySW0KK3dJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t',
      },
    ];

    const usuarioCriacao = await prisma.user.findFirst({
      where: {
        DSC_EMAIL: 'teste@teste.com.br',
      },
    });

    if (!usuarioCriacao) {
      throw new Error('Usuário de criação não encontrado');
    }

    for (const config of configs) {
      const configExistente = await prisma.config.findFirst({
        where: { DSC_KEY: config.DSC_KEY },
      });

      if (!configExistente) {
        await prisma.config.create({
          data: {
            NUM_GRUPO_ORDER: config.NUM_GRUPO_ORDER,
            NUM_KEY_ORDER: config.NUM_KEY_ORDER,
            DSC_GRUPO_KEY: config.DSC_GRUPO_KEY,
            DSC_KEY: config.DSC_KEY,
            DSC_VALUE: config.DSC_VALUE,
            COD_USUARIO_CRIACAO: usuarioCriacao.COD_USER_ID,
            DHS_INCLUSAO: new Date(),
          },
        });
      }
    }
  }
}
