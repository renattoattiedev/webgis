import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Req,
  UsePipes,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UpdatePacoteConceitualUseCase } from '@/domain/manager/application/use-cases/update-pacote-conceitual';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';

const updatePacoteConceitualBodySchema = z.object({
  id: z.string(),
  tituloPacoteConceitual: z.string(),
  nomePacoteConceitual: z.string(),
  host: z.string().nullable().optional(),
  database: z.string().nullable().optional(),
  port: z.string().nullable().optional(),
  schema: z.string().nullable().optional(),
  user: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
});

const bodyValidationPipe = new ZodValidationPipe(
  updatePacoteConceitualBodySchema,
);

type UpdatePacoteConceitualBodySchema = z.infer<
  typeof updatePacoteConceitualBodySchema
>;

@Controller('/update-pacote-conceitual')
export class UpdatePacoteConceitualController {
  constructor(
    private updatePacoteConceitualUseCase: UpdatePacoteConceitualUseCase,
    private fetchPacotesConceituaisUseCase: FetchPacotesConceituaisUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private readonly geoserverClient: GeoserverAPI,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updatePacoteConceitualBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdatePacoteConceitualBodySchema,
  ) {
    let shouldContinue = true;

    const user_login: UserPayload = request['user'];

    const id_user = user_login.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: id_user,
    });

    if (perfil.value?.userPerfil !== 'Admin') {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const {
      id: COD_PACOTE_CONCEITUAL_ID,
      nomePacoteConceitual: NOM_NOME_PACOTE_CONCEITUAL,
      tituloPacoteConceitual: DSC_TITULO,
      host: DSC_HOST,
      database: DSC_DATABASE,
      port: DSC_PORT,
      schema: DSC_SCHEMA,
      user: DSC_USER,
      password: DSC_PASSWORD,
    } = body;

    try {
      const pacoteConceitualVelho =
        await this.fetchPacotesConceituaisUseCase.execute({
          COD_PACOTE_CONCEITUAL_ID,
        });

      const result = await this.updatePacoteConceitualUseCase.execute({
        COD_PACOTE_CONCEITUAL_ID,
        NOM_NOME_PACOTE_CONCEITUAL,
        DSC_TITULO,
        DSC_HOST: DSC_HOST ?? '',
        DSC_PORT: DSC_PORT ?? '',
        DSC_DATABASE: DSC_DATABASE ?? '',
        DSC_SCHEMA: DSC_SCHEMA ?? '',
        DSC_USER: DSC_USER ?? '',
        DSC_PASSWORD: DSC_PASSWORD ?? '',
        USUARIO_ULTIMA_ALTERACAO: id_user.toString(),
      });

      if (result.isLeft()) {
        shouldContinue = false;
        throw new BadRequestException();
      }

      const hasConnParams = [
        DSC_HOST,
        DSC_DATABASE,
        DSC_PORT,
        DSC_SCHEMA,
        DSC_USER,
        DSC_PASSWORD,
      ].every((v) => typeof v === 'string' && v.trim().length > 0);

      if (shouldContinue && pacoteConceitualVelho.value && hasConnParams) {
        try {
          await this.geoserverClient.updateDataStore(
            DSC_HOST as string,
            DSC_DATABASE as string,
            DSC_PORT as string,
            DSC_SCHEMA as string,
            DSC_USER as string,
            DSC_PASSWORD as string,
            pacoteConceitualVelho.value.pacotesConceituais.pacoteConceitualNome,
            NOM_NOME_PACOTE_CONCEITUAL,
          );
        } catch (error) {
          console.error('Erro ao atualizar o DataStore no GeoServer:', error);
        }
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
