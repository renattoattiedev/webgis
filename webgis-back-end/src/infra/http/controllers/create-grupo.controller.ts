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
import { CreateGrupoUseCase } from '@/domain/manager/application/use-cases/create-grupo';
import { GrupoSiglaAlreadyExistsError } from '@/domain/manager/application/use-cases/errors/grupo-sigla-already-exists-error';

const createGrupoBodySchema = z.object({
  grupoNome: z.string(),
  grupoTema: z.string(),
  donoId: z.string().uuid().optional(),
  grupoSigla: z.string().length(2).optional(),
});
const bodyValidationPipe = new ZodValidationPipe(createGrupoBodySchema);

type CreateGrupoBodySchema = z.infer<typeof createGrupoBodySchema>;

@Controller('/create-grupo')
export class CreateGrupoCamadaController {
  constructor(
    private createGrupoUseCase: CreateGrupoUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createGrupoBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: CreateGrupoBodySchema,
  ) {
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
      grupoNome: NOM_NOME_GRUPO,
      grupoTema: COD_TEMA_ID,
      donoId: COD_USUARIO_DONO,
      grupoSigla: SGL_GRUPO_ID,
    } = body;

    const result = await this.createGrupoUseCase.execute({
      COD_GRUPO_CAMADA_ID: new UniqueEntityID(),
      NOM_NOME_GRUPO,
      COD_TEMA_ID,
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: COD_USER_ID,
      COD_USUARIO_DONO,
      SGL_GRUPO_ID,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof GrupoSiglaAlreadyExistsError) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException();
    }
  }
}
