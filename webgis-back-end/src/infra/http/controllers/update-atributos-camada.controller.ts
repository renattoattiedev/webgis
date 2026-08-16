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
import { UpdateAtributoUseCase } from '@/domain/camadas/application/use-cases/update-atributos-camada';

const updateAtributosCamadaBodySchema = z.object({
  id: z.string(),
  label: z.string(),
  visivel: z.boolean(),
  descricao: z.string(),
  ordemRenderizacao: z.number().optional(),
});
const bodyValidationPipe = new ZodValidationPipe(
  updateAtributosCamadaBodySchema,
);

type UpdateAtributosCamadaBodySchema = z.infer<
  typeof updateAtributosCamadaBodySchema
>;

@Controller('/update-atributos-camada')
export class UpdateAtributosCamadaController {
  constructor(
    private updateAtributosCamadaUseCase: UpdateAtributoUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateAtributosCamadaBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdateAtributosCamadaBodySchema,
  ) {
    const user: UserPayload = request['user'];

    const id = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: id,
    });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }
    const {
      id: COD_ATRIBUTO_ID,
      label: DSC_LABEL_ATRIBUTO,
      visivel: FLG_VISIVEL,
      descricao: TXT_DESCRICAO,
      ordemRenderizacao: NUM_ORDEM_RENDERIZACAO,
    } = body;

    try {
      await this.updateAtributosCamadaUseCase.execute({
        COD_ATRIBUTO_ID,
        DSC_LABEL_ATRIBUTO,
        FLG_VISIVEL,
        TXT_DESCRICAO,
        NUM_ORDEM_RENDERIZACAO,
        COD_USUARIO_ULTIMA_ALTERACAO: id.toString(),
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
