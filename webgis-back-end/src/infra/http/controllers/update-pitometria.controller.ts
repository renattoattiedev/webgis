import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
  Req,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UpdatePitometriaUseCase } from '@/domain/pitometria/application/use-cases/update-pitometria';
import { PitometriaPresenter } from '../presenters/pitometria-presenter';

const updatePitometriaBodySchema = z.object({
  codigoSimp: z.string().min(1),
  matricula: z.string().min(1),
  tipo: z.enum(['VAZAO', 'PRESSAO']),
});

type UpdatePitometriaBodySchema = z.infer<typeof updatePitometriaBodySchema>;

@Controller('/pitometria/:id')
export class UpdatePitometriaController {
  constructor(
    private updatePitometriaUseCase: UpdatePitometriaUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  async handle(
    @Req() request: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePitometriaBodySchema))
    body: UpdatePitometriaBodySchema,
  ) {
    const userLogin: UserPayload = request['user'];
    const COD_USER_ID = userLogin.sub;

    const perfil = await this.getUserPerfilUseCase.execute({ COD_USER_ID });
    if (!['Editor', 'Admin'].includes(perfil.value?.userPerfil ?? '')) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const result = await this.updatePitometriaUseCase.execute({
      id,
      COD_SIMP: body.codigoSimp,
      MATRICULA: body.matricula,
      TIPO: body.tipo,
      COD_USUARIO_ATUALIZACAO: COD_USER_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return {
      pitometria: PitometriaPresenter.toHTTP(result.value.pitometria),
      success: true,
    };
  }
}
