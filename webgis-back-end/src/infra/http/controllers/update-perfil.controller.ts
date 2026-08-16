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
import { UpdatePerfilUserUseCase } from '@/domain/security/application/use-cases/update-perfil-user';

const updatePerfilBodySchema = z.object({
  COD_USER_ID: z.string(),
  COD_PERFIL_USER: z.string(),
});
const bodyValidationPipe = new ZodValidationPipe(updatePerfilBodySchema);

type UpdatePerfilBodySchema = z.infer<typeof updatePerfilBodySchema>;

@Controller('/update-perfil')
export class UpdatePerfilController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private updatePerfilUserUseCase: UpdatePerfilUserUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updatePerfilBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdatePerfilBodySchema,
  ) {
    const user: UserPayload = request['user'];

    const id = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: id,
    });

    if (perfil.value?.userPerfil !== 'Admin') {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const { COD_USER_ID, COD_PERFIL_USER } = body;

    try {
      await this.updatePerfilUserUseCase.execute({
        COD_USER_ID,
        COD_PERFIL_USER,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
