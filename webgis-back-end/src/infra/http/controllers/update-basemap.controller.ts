import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Put,
  Req,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UpdateBasemapUseCase } from '@/domain/basemaps/application/use-cases/update-basemap';
import { BasemapPresenter } from '../presenters/basemap-presenter';

const updateBasemapBodySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  thumbnail: z.string().nullable().optional(),
  source: z.string().min(1),
  wmsParams: z.any().optional(),
  order: z.number().int().nonnegative().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type UpdateBasemapBodySchema = z.infer<typeof updateBasemapBodySchema>;

@Controller('/update-basemap')
export class UpdateBasemapController {
  constructor(
    private updateBasemapUseCase: UpdateBasemapUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateBasemapBodySchema))
  async handle(@Req() request: Request, @Body() body: UpdateBasemapBodySchema) {
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

    const result = await this.updateBasemapUseCase.execute({
      COD_BASEMAP_ID: body.id,
      NOM_NOME_BASEMAP: body.name,
      DSC_THUMBNAIL: body.thumbnail ?? null,
      DSC_SOURCE: body.source,
      JSON_WMS_PARAMS: body.wmsParams ?? null,
      NUM_ORDEM: body.order ?? 0,
      BOL_DEFAULT: body.isDefault ?? false,
      FLG_ATIVO: body.isActive ?? true,
      COD_USUARIO_ULTIMA_ALTERACAO: COD_USER_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    return {
      basemap: BasemapPresenter.toHTTP(result.value.basemap),
      success: true,
    };
  }
}
