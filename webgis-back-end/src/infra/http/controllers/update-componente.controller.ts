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
import { UpdateComponenteUseCase } from '@/domain/manager/application/use-cases/update-componente';

const updateComponenteBodySchema = z.object({
  id: z.string(),
  nome: z.string(),
  descricao: z.string().nullable().optional(),
  configuracao: z.any(),
  habilitado: z.boolean(),
});

type UpdateComponenteBodySchema = z.infer<typeof updateComponenteBodySchema>;

@Controller('/update-componente')
export class UpdateComponenteController {
  constructor(
    private updateComponenteUseCase: UpdateComponenteUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateComponenteBodySchema))
  async handle(
    @Req() request: Request,
    @Body() body: UpdateComponenteBodySchema,
  ) {
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
      id: COD_COMPONENTE_ID,
      nome: NOM_NOME_COMPONENTE,
      descricao: DSC_DESCRICAO,
      configuracao: JSON_CONFIGURACAO,
      habilitado: FLG_HABILITADO,
    } = body;

    try {
      const result = await this.updateComponenteUseCase.execute({
        COD_COMPONENTE_ID,
        NOM_NOME_COMPONENTE,
        DSC_DESCRICAO,
        JSON_CONFIGURACAO,
        FLG_HABILITADO,
      });

      if (result.isLeft()) {
        throw new BadRequestException();
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
