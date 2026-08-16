import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { AddGrupoMembroUseCase } from '@/domain/manager/application/use-cases/add-grupo-membro';
import { RemoveGrupoMembroUseCase } from '@/domain/manager/application/use-cases/remove-grupo-membro';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

const addMembroBodySchema = z.object({
  userId: z.string().uuid(),
});

const bodyValidationPipe = new ZodValidationPipe(addMembroBodySchema);

type AddMembroBodySchema = z.infer<typeof addMembroBodySchema>;

@Controller('/grupos/:grupoId/membros')
export class GrupoMembrosController {
  constructor(
    private addGrupoMembroUseCase: AddGrupoMembroUseCase,
    private removeGrupoMembroUseCase: RemoveGrupoMembroUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  private async perfilDe(userId: string): Promise<string | null> {
    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: userId,
    });
    return perfil.isRight() ? perfil.value.userPerfil : null;
  }

  @Post()
  @HttpCode(201)
  async add(
    @Param('grupoId') COD_GRUPO_ID: string,
    @Body(bodyValidationPipe) body: AddMembroBodySchema,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const result = await this.addGrupoMembroUseCase.execute({
      COD_GRUPO_ID,
      COD_USER_ID_ALVO: body.userId,
      COD_USER_SOLICITANTE: user.sub,
      DSC_PERFIL_SOLICITANTE: await this.perfilDe(user.sub),
    });

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException('Sem permissão para adicionar membros');
      }
      throw new BadRequestException('Grupo não encontrado');
    }
  }

  @Delete('/:userId')
  @HttpCode(204)
  async remove(
    @Param('grupoId') COD_GRUPO_ID: string,
    @Param('userId') COD_USER_ID_ALVO: string,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const result = await this.removeGrupoMembroUseCase.execute({
      COD_GRUPO_ID,
      COD_USER_ID_ALVO,
      COD_USER_SOLICITANTE: user.sub,
      DSC_PERFIL_SOLICITANTE: await this.perfilDe(user.sub),
      DSC_PERFIL_ALVO: await this.perfilDe(COD_USER_ID_ALVO),
    });

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException('Sem permissão para remover membros');
      }
      throw new BadRequestException('Vínculo não encontrado');
    }
  }
}
