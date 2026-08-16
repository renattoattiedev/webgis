import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UpdatePitometriaGeometryUseCase } from '@/domain/pitometria/application/use-cases/update-pitometria-geometry';

const updateGeometryBodySchema = z.object({
  longitude: z.number(),
  latitude: z.number(),
});

type UpdateGeometryBodySchema = z.infer<typeof updateGeometryBodySchema>;

@Controller('/pitometria/:id/geometry')
export class UpdatePitometriaGeometryController {
  constructor(
    private updatePitometriaGeometryUseCase: UpdatePitometriaGeometryUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Patch()
  @HttpCode(200)
  async handle(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: UpdateGeometryBodySchema,
  ) {
    const parsed = updateGeometryBodySchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.message);

    const userLogin: UserPayload = request['user'];
    const COD_USER_ID = userLogin.sub;

    const perfil = await this.getUserPerfilUseCase.execute({ COD_USER_ID });
    if (!['Editor', 'Admin'].includes(perfil.value?.userPerfil ?? '')) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const result = await this.updatePitometriaGeometryUseCase.execute({
      id,
      longitude: parsed.data.longitude,
      latitude: parsed.data.latitude,
      COD_USUARIO_ATUALIZACAO: COD_USER_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return { success: true };
  }
}
