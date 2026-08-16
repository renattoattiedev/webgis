import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { SolicitarParticipacaoGrupoUseCase } from '@/domain/manager/application/use-cases/solicitar-participacao-grupo';
import { ResponderSolicitacaoGrupoUseCase } from '@/domain/manager/application/use-cases/responder-solicitacao-grupo';
import { ParticiparGrupoUseCase } from '@/domain/manager/application/use-cases/participar-grupo';
import { SairGrupoUseCase } from '@/domain/manager/application/use-cases/sair-grupo';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

const responderBodySchema = z.object({
  aprovar: z.boolean(),
});

const responderValidationPipe = new ZodValidationPipe(responderBodySchema);

type ResponderBodySchema = z.infer<typeof responderBodySchema>;

@Controller('/grupos/:grupoId')
export class GrupoParticipacaoController {
  constructor(
    private solicitarParticipacaoGrupoUseCase: SolicitarParticipacaoGrupoUseCase,
    private responderSolicitacaoGrupoUseCase: ResponderSolicitacaoGrupoUseCase,
    private participarGrupoUseCase: ParticiparGrupoUseCase,
    private sairGrupoUseCase: SairGrupoUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Post('/solicitacoes')
  @HttpCode(201)
  async solicitar(
    @Param('grupoId') COD_GRUPO_ID: string,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');
    const result = await this.solicitarParticipacaoGrupoUseCase.execute({
      COD_GRUPO_ID,
      COD_USER_ID: user.sub,
    });
    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException('Grupo não aceita solicitações');
      }
      throw new BadRequestException('Grupo não encontrado');
    }
  }

  @Put('/solicitacoes/:userId')
  @HttpCode(200)
  async responder(
    @Param('grupoId') COD_GRUPO_ID: string,
    @Param('userId') COD_USER_ID_ALVO: string,
    @Body(responderValidationPipe) body: ResponderBodySchema,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');
    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: user.sub,
    });
    const result = await this.responderSolicitacaoGrupoUseCase.execute({
      COD_GRUPO_ID,
      COD_USER_ID_ALVO,
      APROVAR: body.aprovar,
      COD_USER_SOLICITANTE: user.sub,
      DSC_PERFIL_SOLICITANTE: perfil.isRight() ? perfil.value.userPerfil : null,
    });
    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(
          'Sem permissão para responder solicitações',
        );
      }
      throw new BadRequestException('Solicitação não encontrada');
    }
  }

  @Post('/participar')
  @HttpCode(201)
  async participar(
    @Param('grupoId') COD_GRUPO_ID: string,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');
    const result = await this.participarGrupoUseCase.execute({
      COD_GRUPO_ID,
      COD_USER_ID: user.sub,
    });
    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException('Grupo não é de participação aberta');
      }
      throw new BadRequestException('Grupo não encontrado');
    }
  }

  @Post('/sair')
  @HttpCode(200)
  async sair(
    @Param('grupoId') COD_GRUPO_ID: string,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');
    const result = await this.sairGrupoUseCase.execute({
      COD_GRUPO_ID,
      COD_USER_ID: user.sub,
    });
    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException('O dono não pode sair do grupo');
      }
      throw new BadRequestException('Vínculo não encontrado');
    }
  }
}
