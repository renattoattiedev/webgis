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
import { UpdateTemaUseCase } from '@/domain/manager/application/use-cases/update-tema';

const updateTemaBodySchema = z.object({
  id: z.string(),
  tituloTema: z.string(),
});

const bodyValidationPipe = new ZodValidationPipe(updateTemaBodySchema);

type UpdateTemaBodySchema = z.infer<typeof updateTemaBodySchema>;

@Controller('/update-tema')
export class UpdateTemaController {
  constructor(
    private updateTemaUseCase: UpdateTemaUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateTemaBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdateTemaBodySchema,
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

    const { id: COD_TEMA_ID, tituloTema: NOM_NOME_TEMA } = body;

    try {
      const result = await this.updateTemaUseCase.execute({
        COD_TEMA_ID,
        NOM_NOME_TEMA,
        USUARIO_ULTIMA_ALTERACAO: id_user.toString(),
      });

      if (result.isLeft()) {
        throw new BadRequestException();
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
