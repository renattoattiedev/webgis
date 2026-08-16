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
import { UpdateConfiglUseCase } from '@/domain/manager/application/use-cases/update-config';

const updateConfigBodySchema = z.object({
  id: z.string(),
  value: z.string(),
});

const bodyValidationPipe = new ZodValidationPipe(updateConfigBodySchema);

type UpdateConfigBodySchema = z.infer<typeof updateConfigBodySchema>;

@Controller('/update-config')
export class UpdateConfigController {
  constructor(
    private updateConfiglUseCase: UpdateConfiglUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateConfigBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdateConfigBodySchema,
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

    const { id: COD_CONFIG_ID, value: DSC_VALUE } = body;

    try {
      const result = await this.updateConfiglUseCase.execute({
        COD_CONFIG_ID,
        DSC_VALUE,
        COD_USUARIO_ULTIMA_ALTERACAO: id_user.toString(),
      });

      if (result.isLeft()) {
        throw new BadRequestException();
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
