import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GeoserverAPI } from '../../modulos_ext/geoserver/geoserver-api';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';

@Controller('/upload-estilo-camada/:codPacoteConceitualId/:nomCamada')
export class UploadEstiloController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private fetchPacotesConceituais: FetchPacotesConceituaisUseCase,
    private readonly geoserverClient: GeoserverAPI,
  ) {}

  @Post()
  @HttpCode(201)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './tmp_slds',
        filename: (req, file, cb) => {
          const camada = req.params.nomCamada;
          const extensao = '.sld';
          const nomeArquivo = `${camada}${extensao}`;
          cb(null, nomeArquivo);
        },
      }),
    }),
  )
  async handle(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Param('codPacoteConceitualId') COD_PACOTE_CONCEITUAL_ID: string,
    @Param('nomCamada') camada: string,
  ) {
    const user: UserPayload = request['user'];

    const COD_USER_ID = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID,
    });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const pacoteConceitual = await this.fetchPacotesConceituais.execute({
      COD_PACOTE_CONCEITUAL_ID,
    });

    if (pacoteConceitual.isLeft()) {
      throw new BadRequestException();
    }

    try {
      if (file) {
        await this.geoserverClient.publicarEstilo(camada);
        await this.geoserverClient.carregarEstilo(camada, file.path);
      }
    } catch (error) {
      console.error('Erro ao publicar a camada no GeoServer:', error);
    } finally {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
}
