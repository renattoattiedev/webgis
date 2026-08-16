import {
  Controller,
  HttpCode,
  Post,
  Body,
  UsePipes,
  BadRequestException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { z } from 'zod';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe';
import { CreateCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/create-camada-raster';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { CamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-repository';
import { RasterPublicacaoService } from '@/infra/modulos_ext/geoserver/raster-publicacao.service';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';
import { GdalCogService } from '@/infra/modulos_ext/gdal/gdal-cog.service';
import { GwcSeedService } from '@/infra/modulos_ext/geoserver/gwc-seed.service';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { PublicacaoHistoricoRepository } from '@/domain/camadas/application/repositories/publicacao-historico-repository';

const createCamadasRasterBodySchema = z.object({
  relativePath: z.string().min(1),
  tituloCamada: z.string().min(1),
  descricaoCamada: z.string().min(10),
  linkMetadados: z.string().optional().default(''),
  termosDeUso: z.string().optional().default(''),
  nivelCompartilhamentoId: z.string(),
  grupoCamada: z.string(),
  tags: z.string().optional().default(''),
  carregamentoDefault: z.boolean().optional(),
});

const bodyValidationPipe = new ZodValidationPipe(createCamadasRasterBodySchema);

type CreateCamadasRasterBodySchema = z.infer<
  typeof createCamadasRasterBodySchema
>;

@Controller('/create-camadas-raster')
export class CreateCamadasRasterController {
  constructor(
    private createCamada: CreateCamadaRasterUseCase,
    private camadasRasterRepository: CamadasRasterRepository,
    private rasterPublicacaoService: RasterPublicacaoService,
    private geoserverClient: GeoserverAPI,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private prisma: PrismaService,
    private readonly gdalCogService: GdalCogService,
    private readonly gwcSeedService: GwcSeedService,
    private grupoAccessPolicy: GrupoAccessPolicy,
    private historico: PublicacaoHistoricoRepository,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(bodyValidationPipe)
  async handle(
    @Req() request: Request,
    @Body() body: CreateCamadasRasterBodySchema,
  ) {
    const user: UserPayload = request['user'];
    const COD_USER_ID = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({ COD_USER_ID });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const {
      relativePath,
      tituloCamada: DSC_TITULO,
      descricaoCamada: DSC_DESCRICAO,
      linkMetadados: DSC_LINK_METADADOS,
      termosDeUso: TXT_TERMOS_DE_USO,
      nivelCompartilhamentoId: NIVEL_COMPATILHAMENTO,
      grupoCamada: GRUPOS_CAMADAS,
      tags: TXT_TAGS,
      carregamentoDefault: BOL_CARREGAMENTO_DEFAULT,
    } = body;

    const nomeFlat = relativePath
      .replace(/\.tif$/i, '')
      .replace(/[\/\\]/g, '__');

    // Check for existing camada with same fonte (relativePath)
    const existente =
      await this.camadasRasterRepository.findByFonte(relativePath);

    if (existente) {
      throw new BadRequestException(
        'Já existe uma camada publicada para este arquivo. Use a republicação para sobrescrevê-la.',
      );
    }

    // Confirma autorização (membership no grupo, ou Admin) antes de publicar.
    const ctx = await this.grupoAccessPolicy.buildContext(
      COD_USER_ID,
      perfil.value?.userPerfil ?? null,
    );
    if (!this.grupoAccessPolicy.canAssignToGrupo(ctx, GRUPOS_CAMADAS)) {
      throw new ForbiddenException(
        'Você não é membro deste grupo — apenas Admin pode publicar em qualquer grupo',
      );
    }

    const result = await this.createCamada.execute({
      COD_CAMADA_RASTER_ID: new UniqueEntityID(),
      NOM_NOME: nomeFlat,
      DSC_FONTE_DADOS_CAMADA: relativePath,
      DSC_TITULO,
      DSC_DESCRICAO,
      DSC_LINK_METADADOS,
      TXT_TERMOS_DE_USO,
      NIVEL_COMPATILHAMENTO,
      GRUPOS_CAMADAS,
      TXT_TAGS,
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: COD_USER_ID,
      BOL_CARREGAMENTO_DEFAULT,
      COD_USER_SOLICITANTE: COD_USER_ID,
      DSC_PERFIL_SOLICITANTE: perfil.value?.userPerfil ?? null,
    });

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException(
          'Você não é membro deste grupo — apenas Admin pode publicar em qualquer grupo',
        );
      }
      throw new BadRequestException(result.value.message);
    }

    const camadaId = result.value.camadaRaster.id.toString();

    await this.prisma.camadasRaster.update({
      where: { COD_CAMADA_RASTER_ID: camadaId },
      data: {
        DSC_STATUS: 'publishing',
        NUM_UPLOAD_PROGRESS: 0,
        DSC_ERROR_MSG: null,
      },
    });

    setImmediate(() => this.publicarAsync(camadaId, relativePath, COD_USER_ID));

    return { camadaId, status: 'publishing' };
  }

  private async publicarAsync(
    camadaId: string,
    relativePath: string,
    usuarioId: string,
  ): Promise<void> {
    try {
      await this.prisma.camadasRaster.update({
        where: { COD_CAMADA_RASTER_ID: camadaId },
        data: { DSC_STATUS: 'converting', NUM_UPLOAD_PROGRESS: 50 },
      });

      const perfilCog = await this.gdalCogService.convertToCog(
        relativePath,
        async (pct) => {
          const overall = Math.min(100, 50 + Math.floor(pct / 2));
          await this.prisma.camadasRaster.update({
            where: { COD_CAMADA_RASTER_ID: camadaId },
            data: { NUM_UPLOAD_PROGRESS: overall },
          });
        },
      );

      await this.prisma.camadasRaster.update({
        where: { COD_CAMADA_RASTER_ID: camadaId },
        data: {
          DSC_STATUS: 'publishing',
          NUM_UPLOAD_PROGRESS: 100,
          DSC_COG_PERFIL: perfilCog,
        },
      });

      const nomeFlat =
        await this.rasterPublicacaoService.publicar(relativePath);
      const boundingBox =
        await this.geoserverClient.getBoundingBoxRaster(nomeFlat);

      await this.prisma.camadasRaster.update({
        where: { COD_CAMADA_RASTER_ID: camadaId },
        data: {
          DSC_STATUS: 'published',
          DSC_BOUNDING_BOX: boundingBox ? JSON.stringify(boundingBox) : null,
          DSC_ERROR_MSG: null,
        },
      });

      if (boundingBox) {
        await this.gwcSeedService.startSeed(nomeFlat, boundingBox);
        await this.prisma.camadasRaster.update({
          where: { COD_CAMADA_RASTER_ID: camadaId },
          data: { DSC_SEED_STATUS: 'seeding', NUM_SEED_PROGRESS: 0 },
        });
      }

      await this.historico.registrar({
        tipo: 'raster',
        camadaId,
        operacao: 'publicacao',
        status: 'sucesso',
        usuarioId,
      });

      console.log(`[CreateCamadaRaster] Publicação concluída: ${relativePath}`);
    } catch (err: any) {
      console.error(
        `[CreateCamadaRaster] Erro publicação (${relativePath}):`,
        err?.message,
      );
      await this.prisma.camadasRaster.update({
        where: { COD_CAMADA_RASTER_ID: camadaId },
        data: {
          DSC_STATUS: 'error',
          DSC_ERROR_MSG: (err?.message ?? 'Erro desconhecido').slice(0, 500),
        },
      });

      await this.historico.registrar({
        tipo: 'raster',
        camadaId,
        operacao: 'publicacao',
        status: 'erro',
        usuarioId,
        errorMsg: err?.message ?? 'Erro desconhecido',
      });
    }
  }
}
