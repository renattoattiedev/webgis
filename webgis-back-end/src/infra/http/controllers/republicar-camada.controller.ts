import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { RepublicarCamadaUseCase } from '@/domain/camadas/application/use-cases/republicar-camada';
import { RepublicarCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/republicar-camada-raster';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { RasterRepublicacaoRunner } from '@/infra/modulos_ext/geoserver/raster-republicacao.runner';
import { RepublicarCamadaRunner } from '@/infra/modulos_ext/geoserver/republicar-camada.runner';

const republicarBodySchema = z.object({
  tituloCamada: z.string().min(1),
  descricaoCamada: z.string(),
  linkMetadados: z.string().optional().default(''),
  termosDeUso: z.string().optional().default(''),
  nivelCompartilhamentoId: z.string(),
  grupoCamada: z.string(),
  tags: z.string().optional().default(''),
  fonteDadosCamada: z.string().optional().default(''),
  carregamentoDefault: z.boolean().optional(),
});

const bodyValidationPipe = new ZodValidationPipe(republicarBodySchema);
type RepublicarBodySchema = z.infer<typeof republicarBodySchema>;

@Controller()
export class RepublicarCamadaController {
  constructor(
    private republicarCamada: RepublicarCamadaUseCase,
    private republicarCamadaRaster: RepublicarCamadaRasterUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private rasterRunner: RasterRepublicacaoRunner,
    private camadaRunner: RepublicarCamadaRunner,
  ) {}

  private async perfilDe(userId: string): Promise<string | null> {
    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: userId,
    });
    return perfil.isRight() ? perfil.value.userPerfil : null;
  }

  @Post('/camadas/:camadaId/republicar')
  @HttpCode(200)
  async camada(
    @Param('camadaId') camadaId: string,
    @Body(bodyValidationPipe) body: RepublicarBodySchema,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const result = await this.republicarCamada.execute({
      COD_CAMADA_ID: camadaId,
      metadados: {
        DSC_TITULO: body.tituloCamada,
        DSC_DESCRICAO: body.descricaoCamada,
        DSC_LINK_METADADOS: body.linkMetadados,
        TXT_TERMOS_DE_USO: body.termosDeUso,
        NIVEL_COMPATILHAMENTO: body.nivelCompartilhamentoId,
        GRUPOS_CAMADAS: body.grupoCamada,
        TXT_TAGS: body.tags,
        DSC_FONTE_DADOS_CAMADA: body.fonteDadosCamada,
        BOL_CARREGAMENTO_DEFAULT: body.carregamentoDefault,
      },
      requesterId: user.sub,
      perfilRequester: await this.perfilDe(user.sub),
    });

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(
          'Você não tem permissão para sobrescrever esta camada',
        );
      }
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException('Camada não encontrada');
      }
      // Exhaustivo hoje (Left só é ResourceNotFoundError | NotAllowedError),
      // mantém a narrowing de `result` para Right abaixo.
      throw new BadRequestException('Falha ao republicar a camada');
    }

    setImmediate(() => this.camadaRunner.republicar(camadaId, user.sub));

    return { status: 'publishing' };
  }

  @Post('/camadas-raster/:camadaId/republicar')
  @HttpCode(200)
  async raster(
    @Param('camadaId') camadaId: string,
    @Body(bodyValidationPipe) body: RepublicarBodySchema,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const result = await this.republicarCamadaRaster.execute({
      COD_CAMADA_RASTER_ID: camadaId,
      metadados: {
        DSC_TITULO: body.tituloCamada,
        DSC_DESCRICAO: body.descricaoCamada,
        DSC_LINK_METADADOS: body.linkMetadados,
        TXT_TERMOS_DE_USO: body.termosDeUso,
        NIVEL_COMPATILHAMENTO: body.nivelCompartilhamentoId,
        GRUPOS_CAMADAS: body.grupoCamada,
        TXT_TAGS: body.tags,
        BOL_CARREGAMENTO_DEFAULT: body.carregamentoDefault,
      },
      requesterId: user.sub,
      perfilRequester: await this.perfilDe(user.sub),
    });

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(
          'Você não tem permissão para sobrescrever esta camada',
        );
      }
      if (result.value instanceof ResourceNotFoundError) {
        throw new NotFoundException('Camada raster não encontrada');
      }
      // Exhaustivo hoje (Left só é ResourceNotFoundError | NotAllowedError),
      // mas mantém a narrowing de `result` para Right abaixo e cobre
      // qualquer Left futuro que não seja um dos dois tipos conhecidos.
      throw new BadRequestException('Falha ao republicar a camada raster');
    }

    const { relativePath } = result.value;

    await this.rasterRunner.marcarPublishing(camadaId);

    setImmediate(() =>
      this.rasterRunner.republicar(camadaId, relativePath, user.sub),
    );

    return { camadaId, status: 'publishing' };
  }
}
