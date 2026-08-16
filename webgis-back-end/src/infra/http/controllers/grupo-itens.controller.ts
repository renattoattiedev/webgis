import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { AddItemToGrupoUseCase } from '@/domain/manager/application/use-cases/add-item-to-grupo';
import { RemoveItemFromGrupoUseCase } from '@/domain/manager/application/use-cases/remove-item-from-grupo';
import { GetItensDisponiveisGrupoUseCase } from '@/domain/manager/application/use-cases/get-itens-disponiveis-grupo';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { TipoItemGrupo } from '@/domain/manager/application/repositories/grupo-itens-adicionais-repository';

const addItemBodySchema = z.object({
  tipo: z.enum(['camada', 'raster', 'mapa']),
  itemId: z.string().uuid(),
});
const bodyValidationPipe = new ZodValidationPipe(addItemBodySchema);
type AddItemBodySchema = z.infer<typeof addItemBodySchema>;

const tipoParamSchema = z.enum(['camada', 'raster', 'mapa']);

@Controller('/grupos')
export class GrupoItensController {
  constructor(
    private addItemToGrupoUseCase: AddItemToGrupoUseCase,
    private removeItemFromGrupoUseCase: RemoveItemFromGrupoUseCase,
    private getItensDisponiveisGrupoUseCase: GetItensDisponiveisGrupoUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  private async perfilDe(userId: string): Promise<string | null> {
    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: userId,
    });
    return perfil.isRight() ? perfil.value.userPerfil : null;
  }

  @Post(':grupoId/itens')
  @HttpCode(201)
  async add(
    @Param('grupoId') grupoId: string,
    @Body(bodyValidationPipe) body: AddItemBodySchema,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const result = await this.addItemToGrupoUseCase.execute({
      grupoId,
      tipo: body.tipo,
      itemId: body.itemId,
      requesterId: user.sub,
      perfilRequester: await this.perfilDe(user.sub),
    });

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(
          'Sem permissão para vincular este item ao grupo',
        );
      }
      throw new BadRequestException('Item não encontrado');
    }
  }

  @Delete(':grupoId/itens/:tipo/:itemId')
  @HttpCode(204)
  async remove(
    @Param('grupoId') grupoId: string,
    @Param('tipo') tipo: TipoItemGrupo,
    @Param('itemId') itemId: string,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const tipoParseResult = tipoParamSchema.safeParse(tipo);
    if (!tipoParseResult.success) {
      throw new BadRequestException('Tipo de item inválido');
    }

    const result = await this.removeItemFromGrupoUseCase.execute({
      grupoId,
      tipo: tipoParseResult.data,
      itemId,
      requesterId: user.sub,
      perfilRequester: await this.perfilDe(user.sub),
    });

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException('Sem permissão para remover este vínculo');
      }
      throw new BadRequestException('Vínculo não encontrado');
    }
  }

  @Get(':grupoId/itens-disponiveis')
  async disponiveis(
    @Param('grupoId') grupoId: string,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const result = await this.getItensDisponiveisGrupoUseCase.execute({
      grupoId,
      requesterId: user.sub,
      perfilRequester: await this.perfilDe(user.sub),
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar itens disponíveis');
    }

    return {
      camadas: result.value.camadas.map((c) => ({
        id: c.id.toString(),
        titulo: c.camadaTitulo,
        nome: c.camadaNome,
      })),
      camadasRaster: result.value.camadasRaster.map((c) => ({
        id: c.id.toString(),
        titulo: c.camadaTitulo,
        nome: c.camadaNome,
      })),
      mapas: result.value.mapas.map((m) => ({
        id: m.id.toString(),
        titulo: m.mapaTitulo,
        nome: m.mapaNome,
      })),
    };
  }
}
