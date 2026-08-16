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
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { CreatePitometriaUseCase } from '@/domain/pitometria/application/use-cases/create-pitometria';
import { PitometriaPresenter } from '../presenters/pitometria-presenter';

const createPitometriaBodySchema = z.object({
  codigoSimp: z.string().min(1),
  matricula: z.string().min(1),
  tipo: z.enum(['VAZAO', 'PRESSAO']),
  longitude: z.number(),
  latitude: z.number(),
});

type CreatePitometriaBodySchema = z.infer<typeof createPitometriaBodySchema>;

@Controller('/pitometria')
export class CreatePitometriaController {
  constructor(
    private createPitometriaUseCase: CreatePitometriaUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createPitometriaBodySchema))
  async handle(
    @Req() request: Request,
    @Body() body: CreatePitometriaBodySchema,
  ) {
    const userLogin: UserPayload = request['user'];
    const COD_USER_ID = userLogin.sub;

    const perfil = await this.getUserPerfilUseCase.execute({ COD_USER_ID });
    if (!['Editor', 'Admin'].includes(perfil.value?.userPerfil ?? '')) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const result = await this.createPitometriaUseCase.execute({
      COD_SIMP: body.codigoSimp,
      MATRICULA: body.matricula,
      TIPO: body.tipo,
      longitude: body.longitude,
      latitude: body.latitude,
      COD_USUARIO_CRIACAO: COD_USER_ID,
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
