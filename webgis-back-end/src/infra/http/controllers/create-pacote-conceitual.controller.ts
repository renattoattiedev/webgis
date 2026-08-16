import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GeoserverAPI } from '../../modulos_ext/geoserver/geoserver-api';
import { CreatePacoteConceitualUseCase } from '@/domain/manager/application/use-cases/create-pacote-conceitual';

const createPacoteConceitualBodySchema = z.object({
  tituloPacoteConceitual: z.string(),
  nomePacoteConceitual: z.string(),
  host: z.string(),
  database: z.string(),
  port: z.string(),
  schema: z.string(),
  user: z.string(),
  password: z.string(),
});
const bodyValidationPipe = new ZodValidationPipe(
  createPacoteConceitualBodySchema,
);

type CreatePacoteConceitualBodySchema = z.infer<
  typeof createPacoteConceitualBodySchema
>;

@Controller('/create-pacote-conceitual')
export class CreatePacoteConceitualController {
  constructor(
    private createPacoteConceitual: CreatePacoteConceitualUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private readonly geoserverClient: GeoserverAPI,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createPacoteConceitualBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: CreatePacoteConceitualBodySchema,
  ) {
    let shouldContinue = true;

    const userLogin: UserPayload = request['user'];

    const COD_USER_ID = userLogin.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID,
    });

    if (perfil.value?.userPerfil !== 'Admin') {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const {
      nomePacoteConceitual: NOM_NOME_PACOTE_CONCEITUAL,
      tituloPacoteConceitual: DSC_TITULO,
      host: DSC_HOST,
      database: DSC_DATABASE,
      port: DSC_PORT,
      schema: DSC_SCHEMA,
      user: DSC_USER,
      password: DSC_PASSWORD,
    } = body;

    const result = await this.createPacoteConceitual.execute({
      COD_PACOTE_CONCEITUAL_ID: new UniqueEntityID(),
      NOM_NOME_PACOTE_CONCEITUAL,
      DSC_TITULO,
      DSC_HOST,
      DSC_PORT,
      DSC_DATABASE,
      DSC_SCHEMA,
      DSC_USER,
      DSC_PASSWORD,
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: COD_USER_ID,
    });

    if (result.isLeft()) {
      shouldContinue = false;
      throw new BadRequestException();
    }

    if (shouldContinue) {
      try {
        await this.geoserverClient.createDataStore(
          DSC_HOST,
          DSC_DATABASE,
          DSC_PORT,
          DSC_SCHEMA,
          DSC_USER,
          DSC_PASSWORD,
          NOM_NOME_PACOTE_CONCEITUAL,
        );
      } catch (error) {
        console.error('Erro ao cadastrar o DataStore no GeoServer:', error);
      }
    }
  }
}
