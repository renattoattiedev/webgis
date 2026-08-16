import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { MoverItensGrupoUseCase } from '@/domain/manager/application/use-cases/mover-itens-grupo';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

const moverItensGrupoBodySchema = z.object({
  grupoDestinoId: z.string().uuid(),
});

const bodyValidationPipe = new ZodValidationPipe(moverItensGrupoBodySchema);

type MoverItensGrupoBodySchema = z.infer<typeof moverItensGrupoBodySchema>;

@Controller('/grupos/:grupoId/mover-itens')
export class MoverItensGrupoController {
  constructor(
    private moverItensGrupoUseCase: MoverItensGrupoUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  async handle(
    @Param('grupoId') COD_GRUPO_ORIGEM_ID: string,
    @Body(bodyValidationPipe) body: MoverItensGrupoBodySchema,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: user.sub,
    });

    const result = await this.moverItensGrupoUseCase.execute({
      COD_GRUPO_ORIGEM_ID,
      COD_GRUPO_DESTINO_ID: body.grupoDestinoId,
      COD_USER_SOLICITANTE: user.sub,
      DSC_PERFIL_SOLICITANTE: perfil.isRight() ? perfil.value.userPerfil : null,
    });

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException('Sem permissão para mover estes itens');
      }
      throw new BadRequestException('Grupo não encontrado');
    }

    return { qtdItensMovidos: result.value.qtdItensMovidos };
  }
}
