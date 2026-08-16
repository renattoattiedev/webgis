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
import { CreateTemaUseCase } from '@/domain/manager/application/use-cases/create-tema';

const createTemaBodySchema = z.object({
  tituloTema: z.string(),
});
const bodyValidationPipe = new ZodValidationPipe(createTemaBodySchema);

type CreateTemaBodySchema = z.infer<typeof createTemaBodySchema>;

@Controller('/create-tema')
export class CreateTemaController {
  constructor(
    private createTema: CreateTemaUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createTemaBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: CreateTemaBodySchema,
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

    const { tituloTema: NOM_NOME_TEMA } = body;

    const result = await this.createTema.execute({
      COD_TEMA_ID: new UniqueEntityID(),
      NOM_NOME_TEMA,
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: COD_USER_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }
  }
}
