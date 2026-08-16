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
import { UpdateGrupoUseCase } from '@/domain/manager/application/use-cases/update-grupo';
import { GrupoSiglaAlreadyExistsError } from '@/domain/manager/application/use-cases/errors/grupo-sigla-already-exists-error';

const updateGrupoCamadaBodySchema = z.object({
  id: z.string(),
  grupoNome: z.string(),
  grupoTema: z.string(),
  grupoSigla: z.string().length(2),
});

const bodyValidationPipe = new ZodValidationPipe(updateGrupoCamadaBodySchema);

type UpdateGrupoCamadaBodySchema = z.infer<typeof updateGrupoCamadaBodySchema>;

@Controller('/update-grupo')
export class UpdateGrupoController {
  constructor(
    private updateGrupoUseCase: UpdateGrupoUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateGrupoCamadaBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdateGrupoCamadaBodySchema,
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
      id: COD_GRUPO_ID,
      grupoNome: NOM_NOME_GRUPO,
      grupoTema: COD_TEMA_ID,
      grupoSigla: SGL_GRUPO_ID,
    } = body;

    try {
      const result = await this.updateGrupoUseCase.execute({
        COD_GRUPO_ID,
        NOM_NOME_GRUPO,
        COD_TEMA_ID,
        SGL_GRUPO_ID,
        USUARIO_ULTIMA_ALTERACAO: id_user.toString(),
      });

      if (result.isLeft()) {
        const error = result.value;
        if (error instanceof GrupoSiglaAlreadyExistsError) {
          throw new BadRequestException(error.message);
        }
        throw new BadRequestException(
          error.message ?? 'Erro ao atualizar grupo',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error);
    }
  }
}
