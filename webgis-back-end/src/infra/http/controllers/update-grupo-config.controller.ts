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
import { UpdateGrupoConfigUseCase } from '@/domain/manager/application/use-cases/update-grupo-config';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

const updateGrupoConfigBodySchema = z.object({
  visibilidade: z.enum(['membros', 'organizacao', 'publico']).optional(),
  politicaParticipacao: z.enum(['convite', 'solicitacao', 'aberto']).optional(),
  membrosContribuem: z.boolean().optional(),
  donoId: z.string().uuid().optional(),
  nome: z.string().min(1).optional(),
  temaId: z.string().min(1).optional(),
});

const bodyValidationPipe = new ZodValidationPipe(updateGrupoConfigBodySchema);

type UpdateGrupoConfigBodySchema = z.infer<typeof updateGrupoConfigBodySchema>;

@Controller('/grupos/:grupoId/config')
export class UpdateGrupoConfigController {
  constructor(
    private updateGrupoConfigUseCase: UpdateGrupoConfigUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  async handle(
    @Param('grupoId') COD_GRUPO_ID: string,
    @Body(bodyValidationPipe) body: UpdateGrupoConfigBodySchema,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: user.sub,
    });

    const result = await this.updateGrupoConfigUseCase.execute({
      COD_GRUPO_ID,
      COD_USER_SOLICITANTE: user.sub,
      DSC_PERFIL_SOLICITANTE: perfil.isRight() ? perfil.value.userPerfil : null,
      DSC_VISIBILIDADE: body.visibilidade,
      DSC_POLITICA_PARTICIPACAO: body.politicaParticipacao,
      BOL_MEMBROS_CONTRIBUEM: body.membrosContribuem,
      COD_USUARIO_DONO: body.donoId,
      NOM_NOME_GRUPO: body.nome,
      COD_TEMA_ID: body.temaId,
    });

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException('Sem permissão para configurar o grupo');
      }
      throw new BadRequestException('Grupo não encontrado');
    }
  }
}
