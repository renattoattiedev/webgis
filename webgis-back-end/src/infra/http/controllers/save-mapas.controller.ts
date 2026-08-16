import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  Req,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { MapaAlreadyExistsError } from '@/domain/mapas/application/use-cases/errors/mapa-already-exists-error';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { CreateMapaUseCase } from '@/domain/mapas/application/use-cases/create-mapa';
import { GetMapaNomeUseCase } from '@/domain/mapas/application/use-cases/get-mapa-nome';
import { UpdateMapaUseCase } from '@/domain/mapas/application/use-cases/update-mapa';
import { GeoserverAPI } from '../../modulos_ext/geoserver/geoserver-api';
import { DeleteCamadaMapaUseCase } from '@/domain/mapas/application/use-cases/delete-camadas-mapa';
import { AssociateMapaCamadaUseCase } from '@/domain/mapas/application/use-cases/associate-mapa-camada';
import { AssociateMapaCamadaRasterUseCase } from '@/domain/mapas/application/use-cases/associate-mapa-camada-raster';
import { DeleteCamadaRasterMapaUseCase } from '@/domain/mapas/application/use-cases/delete-camadas-raster-mapa';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

const createCamadasBodySchema = z.object({
  id: z.string(),
  nomeCamada: z.string(),
  tituloCamada: z.string(),
  descricaoCamada: z.string(),
  linkMetadados: z.string(),
  termosDeUso: z.string(),
  nivelCompartilhamentoId: z.string(),
  grupoCamada: z.string(),
  tags: z.string(),
  pacoteConceitual: z.string(),
  fonteDadosCamada: z.string(),
  DHS_ALTERACAO: z.date().optional(),
  pacoteConceitualOriginal: z.string().optional(),
  ordemRenderizacao: z.number(),
  carregamentoDefault: z.boolean().optional(),
});

const createCamadasRasterBodySchema = z.object({
  id: z.string(),
  nomeCamada: z.string(),
  fonteDadosCamadaRaster: z.string(),
  tituloCamada: z.string(),
  descricaoCamada: z.string(),
  linkMetadados: z.string(),
  termosDeUso: z.string(),
  nivelCompartilhamentoId: z.string(),
  grupoCamada: z.string(),
  tags: z.string(),
  DHS_ALTERACAO: z.date().optional(),
  ordemRenderizacao: z.number(),
  carregamentoDefault: z.boolean().optional(),
});

const createMapasBodySchema = z.object({
  id: z.string().optional(),
  nomeMapa: z.string(),
  tituloMapa: z.string(),
  descricaoMapa: z.string(),
  nivelCompartilhamentoMapa: z.string(),
  grupoMapa: z.string(),
  camadas: z.array(createCamadasBodySchema),
  camadasRaster: z.array(createCamadasRasterBodySchema),
  boundingBoxMapa: z
    .object({
      minx: z.number(),
      maxx: z.number(),
      miny: z.number(),
      maxy: z.number(),
      crs: z.string(),
    })
    .optional(),
  carregamentoDefault: z.boolean().optional(),
});
const bodyValidationPipe = new ZodValidationPipe(createMapasBodySchema);

type CreateMapasBodySchema = z.infer<typeof createMapasBodySchema>;

@Controller('/save-mapas')
export class SaveMapaController {
  constructor(
    private createMapa: CreateMapaUseCase,
    private associateMapaCamadaUseCase: AssociateMapaCamadaUseCase,
    private associateMapaCamadaRasterUseCase: AssociateMapaCamadaRasterUseCase,
    private updateMapaUseCase: UpdateMapaUseCase,
    private getMapaNomeUseCase: GetMapaNomeUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private deleteCamadaMapaUseCase: DeleteCamadaMapaUseCase,
    private deleteCamadaRasterMapaUseCase: DeleteCamadaRasterMapaUseCase,
    private geoserverAPI: GeoserverAPI,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createMapasBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: CreateMapasBodySchema,
  ) {
    let shouldContinue = true;

    const user: UserPayload = request['user'];

    const COD_USER_ID = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID,
    });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const {
      nomeMapa: NOM_NOME_MAPA,
      tituloMapa: DSC_TITULO,
      descricaoMapa: DSC_DESCRICAO,
      nivelCompartilhamentoMapa: NIVEL_COMPATILHAMENTO,
      grupoMapa: GRUPOS_MAPAS,
      camadas,
      camadasRaster,
      boundingBoxMapa,
      carregamentoDefault: BOL_CARREGAMENTO_DEFAULT,
    } = body;

    const result = await this.createMapa.execute({
      COD_MAPA_ID: new UniqueEntityID(),
      NOM_NOME_MAPA,
      DSC_TITULO,
      DSC_DESCRICAO,
      DSC_BOUNDING_BOX: boundingBoxMapa
        ? JSON.stringify(boundingBoxMapa)
        : null,
      NIVEL_COMPATILHAMENTO,
      GRUPOS_MAPAS,
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: COD_USER_ID,
      BOL_CARREGAMENTO_DEFAULT: !!BOL_CARREGAMENTO_DEFAULT,
      COD_USER_SOLICITANTE: COD_USER_ID,
      DSC_PERFIL_SOLICITANTE: perfil.value?.userPerfil ?? null,
    });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof NotAllowedError) {
        throw new ForbiddenException(
          'Você não é membro deste grupo — apenas Admin pode salvar mapa em qualquer grupo',
        );
      }

      switch (error.constructor) {
        case MapaAlreadyExistsError:
          const NOM_NOME_MAPA = error.mapaId;

          const resultMapa = await this.getMapaNomeUseCase.execute({
            NOM_NOME_MAPA,
          });

          if (resultMapa.isLeft()) {
            throw new BadRequestException();
          }

          const COD_MAPA_ID = resultMapa.value.mapa.id.toString();
          const currentBounds = resultMapa.value.mapa.mapaBoundingBox;

          if (COD_MAPA_ID) {
            const editMapaRequest = {
              COD_MAPA_ID,
              NOM_NOME_MAPA,
              DSC_TITULO,
              DSC_DESCRICAO,
              DSC_BOUNDING_BOX: JSON.stringify(
                boundingBoxMapa || JSON.parse(currentBounds),
              ),
              NIVEL_COMPATILHAMENTO,
              GRUPOS_MAPAS,
              DHS_ALTERACAO: new Date(),
              COD_USUARIO_ULTIMA_ALTERACAO: COD_USER_ID,
              BOL_CARREGAMENTO_DEFAULT: !!BOL_CARREGAMENTO_DEFAULT,
              COD_USER_SOLICITANTE: COD_USER_ID,
              DSC_PERFIL_SOLICITANTE: perfil.value?.userPerfil ?? null,
            };
            const resultEdit =
              await this.updateMapaUseCase.execute(editMapaRequest);

            if (resultEdit.isLeft()) {
              const errorEdit = resultEdit.value;
              shouldContinue = false;
              if (errorEdit instanceof NotAllowedError) {
                throw new ForbiddenException(
                  'Sem permissão para alterar este conteúdo',
                );
              }
              throw new BadRequestException(errorEdit.message);
            }

            try {
              await this.geoserverAPI.deletarMapas(NOM_NOME_MAPA);
            } catch (error) {
              console.warn(
                `Mapa ${NOM_NOME_MAPA} não encontrado para deletar:`,
                error,
              );
            }

            try {
              resultMapa.value.camadas.map((camada) => {
                this.deleteCamadaMapaUseCase.execute({
                  COD_MAPA_ID,
                  COD_CAMADA_ID: camada.id.toString(),
                });
                resultMapa.value.camadasRaster.map((camadaRaster) => {
                  this.deleteCamadaRasterMapaUseCase.execute({
                    COD_MAPA_ID,
                    COD_CAMADA_RASTER_ID: camadaRaster.id.toString(),
                  });
                });
              });
              if (camadas && camadas.length > 0) {
                for (const camada of camadas) {
                  const result_associate =
                    await this.associateMapaCamadaUseCase.execute({
                      COD_MAPA_CAMADA_ID: new UniqueEntityID(),
                      COD_MAPA_ID: COD_MAPA_ID,
                      COD_CAMADA_ID: camada.id.toString(),
                      NUM_ORDEM_RENDERIZACAO: camada.ordemRenderizacao,
                    });

                  if (result_associate.isLeft()) {
                    throw new Error(
                      `Erro ao associar a camada ${camada.id} ao mapa ${COD_MAPA_ID}`,
                    );
                  }
                }
              }
              if (camadasRaster && camadasRaster.length > 0) {
                for (const camadaRaster of camadasRaster) {
                  const result_associate =
                    await this.associateMapaCamadaRasterUseCase.execute({
                      COD_MAPA_CAMADA_RASTER_ID: new UniqueEntityID(),
                      COD_MAPA_ID: COD_MAPA_ID,
                      COD_CAMADA_RASTER_ID: camadaRaster.id.toString(),
                      NUM_ORDEM_RENDERIZACAO: camadaRaster.ordemRenderizacao,
                    });

                  if (result_associate.isLeft()) {
                    throw new Error(
                      `Erro ao associar a camada ${camadaRaster.id} ao mapa ${COD_MAPA_ID}`,
                    );
                  }
                }
              }
              if (boundingBoxMapa) {
                await this.geoserverAPI.criarMapas(
                  NOM_NOME_MAPA,
                  DSC_TITULO,
                  camadas,
                  camadasRaster,
                  boundingBoxMapa,
                );
              }
            } catch (error) {
              console.error('Erro ao publicar o Mapa no GeoServer:', error);
            }

            return resultMapa.value.mapa;
          }
          break;

        default:
          shouldContinue = false;
          throw new BadRequestException(error.message);
      }
    }

    if (!shouldContinue) return;

    if (result.isRight()) {
      try {
        if (camadas && camadas.length > 0) {
          for (const camada of camadas) {
            const result_associate =
              await this.associateMapaCamadaUseCase.execute({
                COD_MAPA_CAMADA_ID: new UniqueEntityID(),
                COD_MAPA_ID: result.value.mapa.id.toString(),
                COD_CAMADA_ID: camada.id.toString(),
                NUM_ORDEM_RENDERIZACAO: camada.ordemRenderizacao,
              });

            if (result_associate.isLeft()) {
              throw new Error(
                `Erro ao associar a camada ${camada.id} ao mapa ${result.value.mapa.id}`,
              );
            }
          }
        }
        if (camadasRaster && camadasRaster.length > 0) {
          for (const camadaRaster of camadasRaster) {
            const result_associate =
              await this.associateMapaCamadaRasterUseCase.execute({
                COD_MAPA_CAMADA_RASTER_ID: new UniqueEntityID(),
                COD_MAPA_ID: result.value.mapa.id.toString(),
                COD_CAMADA_RASTER_ID: camadaRaster.id.toString(),
                NUM_ORDEM_RENDERIZACAO: camadaRaster.ordemRenderizacao,
              });

            if (result_associate.isLeft()) {
              throw new Error(
                `Erro ao associar a camada ${camadaRaster.id} ao mapa ${result.value.mapa.id}`,
              );
            }
          }
        }
        if (boundingBoxMapa) {
          await this.geoserverAPI.criarMapas(
            NOM_NOME_MAPA,
            DSC_TITULO,
            camadas,
            camadasRaster,
            boundingBoxMapa,
          );
        }
        return result.value.mapa;
      } catch (error) {
        console.error('Erro ao publicar o Mapa no GeoServer:', error);
      }
    }
  }
}
