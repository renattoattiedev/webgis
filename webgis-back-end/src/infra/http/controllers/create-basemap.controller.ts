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
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { CreateBasemapUseCase } from '@/domain/basemaps/application/use-cases/create-basemap';
import { BasemapPresenter } from '../presenters/basemap-presenter';

const createBasemapBodySchema = z.object({
  name: z.string().min(1),
  thumbnail: z.string().nullable().optional(),
  source: z.string().min(1),
  wmsParams: z.any().optional(),
  order: z.number().int().nonnegative().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type CreateBasemapBodySchema = z.infer<typeof createBasemapBodySchema>;

@Controller('/create-basemap')
export class CreateBasemapController {
  constructor(
    private createBasemapUseCase: CreateBasemapUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createBasemapBodySchema))
  async handle(@Req() request: Request, @Body() body: CreateBasemapBodySchema) {
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

    const result = await this.createBasemapUseCase.execute({
      NOM_NOME_BASEMAP: body.name,
      DSC_THUMBNAIL: body.thumbnail ?? null,
      DSC_SOURCE: body.source,
      JSON_WMS_PARAMS: body.wmsParams ?? null,
      NUM_ORDEM: body.order ?? 0,
      BOL_DEFAULT: body.isDefault ?? false,
      FLG_ATIVO: body.isActive ?? true,
      COD_USUARIO_CRIACAO: COD_USER_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return {
      basemap: BasemapPresenter.toHTTP(result.value.basemap),
      success: true,
    };
  }
}
