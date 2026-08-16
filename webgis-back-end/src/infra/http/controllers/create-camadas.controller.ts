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
import { CreateCamadaUseCase } from '@/domain/camadas/application/use-cases/create-camada';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GeoserverAPI } from '../../modulos_ext/geoserver/geoserver-api';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { CreateAtributosUseCase } from '@/domain/camadas/application/use-cases/create-atributos';
import { MetadadosPostgis } from '@/infra/modulos_ext/metadados-postgis/metadados-postgis';
import { UpdateCamadaUseCase } from '@/domain/camadas/application/use-cases/update-camada';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { PublicacaoHistoricoRepository } from '@/domain/camadas/application/repositories/publicacao-historico-repository';

const createCamadasBodySchema = z.object({
  id: z.string().optional(),
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
  carregamentoDefault: z.boolean().optional(),
});
const bodyValidationPipe = new ZodValidationPipe(createCamadasBodySchema);

type CreateCamadasBodySchema = z.infer<typeof createCamadasBodySchema>;

@Controller('/create-camadas')
export class CreateCamadaController {
  constructor(
    private createCamada: CreateCamadaUseCase,
    private createAtributos: CreateAtributosUseCase,
    private metadadosPostgis: MetadadosPostgis,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private fetchPacotesConceituais: FetchPacotesConceituaisUseCase,
    private readonly geoserverClient: GeoserverAPI,
    private updateCamadaUseCase: UpdateCamadaUseCase,
    private historico: PublicacaoHistoricoRepository,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createCamadasBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: CreateCamadasBodySchema,
  ) {
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
      nomeCamada: NOM_NOME,
      tituloCamada: DSC_TITULO,
      descricaoCamada: DSC_DESCRICAO,
      linkMetadados: DSC_LINK_METADADOS,
      termosDeUso: TXT_TERMOS_DE_USO,
      nivelCompartilhamentoId: NIVEL_COMPATILHAMENTO,
      grupoCamada: GRUPOS_CAMADAS,
      tags: TXT_TAGS,
      pacoteConceitual: PACOTES_CONCEITUAIS,
      fonteDadosCamada: DSC_FONTE_DADOS_CAMADA,
      carregamentoDefault: BOL_CARREGAMENTO_DEFAULT,
    } = body;

    console.log(NOM_NOME);

    const result = await this.createCamada.execute({
      COD_CAMADA_ID: new UniqueEntityID(),
      NOM_NOME,
      DSC_TITULO,
      DSC_DESCRICAO,
      DSC_LINK_METADADOS,
      TXT_TERMOS_DE_USO,
      NIVEL_COMPATILHAMENTO,
      GRUPOS_CAMADAS,
      TXT_TAGS,
      PACOTES_CONCEITUAIS,
      DSC_FONTE_DADOS_CAMADA,
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: COD_USER_ID,
      BOL_CARREGAMENTO_DEFAULT,
      COD_USER_SOLICITANTE: COD_USER_ID,
      DSC_PERFIL_SOLICITANTE: perfil.value?.userPerfil ?? null,
    });

    if (result.isLeft() && result.value instanceof NotAllowedError) {
      throw new ForbiddenException(
        'Você não é membro deste grupo — apenas Admin pode publicar em qualquer grupo',
      );
    }

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    if (result.isRight()) {
      const COD_CAMADA_ID = result.value.camada.id.toString();

      const pacoteConceitual = await this.fetchPacotesConceituais.execute({
        COD_PACOTE_CONCEITUAL_ID: result.value.camada.camadaPacotesConceituais,
      });

      if (pacoteConceitual.isLeft()) {
        throw new BadRequestException();
      }

      const pacoteConceitualNome =
        pacoteConceitual.value.pacotesConceituais.pacoteConceitualNome;

      let geoserverPublicado = false;
      try {
        await this.geoserverClient.publicarCamada(
          NOM_NOME,
          pacoteConceitualNome,
        );
        await this.geoserverClient.associarEstiloCamada(
          NOM_NOME,
          pacoteConceitualNome,
        );
        geoserverPublicado = true;
      } catch (geoserverError) {
        console.error(
          `Falha ao publicar camada "${NOM_NOME}" no GeoServer (camada salva no banco):`,
          geoserverError instanceof Error
            ? geoserverError.message
            : geoserverError,
        );
      }

      const config = {
        host: pacoteConceitual.value.pacotesConceituais.pacoteConceitualHost,
        database:
          pacoteConceitual.value.pacotesConceituais.pacoteConceitualDatabase,
        port: pacoteConceitual.value.pacotesConceituais.pacoteConceitualPort,
        schema:
          pacoteConceitual.value.pacotesConceituais.pacoteConceitualSchema,
        user: pacoteConceitual.value.pacotesConceituais.pacoteConceitualUser,
        password:
          pacoteConceitual.value.pacotesConceituais.pacoteConceitualPassword,
        tableName: result.value.camada.camadaNome,
      };

      const atributos = await this.metadadosPostgis.getTableColumns(config);

      for (const atributo of atributos) {
        await this.createAtributos.execute({
          COD_CAMADA_ID,
          NOM_NOME_ATRIBUTO: atributo.column_name,
          DSC_TIPO: atributo.data_type,
          NUM_TAMANHO: atributo.character_maximum_length || 0,
          NUM_ORDEM_RENDERIZACAO: atributo.atributoOrdemRenderizacao,
          COD_USUARIO_CRIACAO: COD_USER_ID,
          DHS_INCLUSAO: new Date(),
        });
      }

      if (geoserverPublicado) {
        const boundingBox = await this.geoserverClient.getBoundingBox(
          pacoteConceitual.value.pacotesConceituais.pacoteConceitualNome,
          NOM_NOME,
        );

        if (boundingBox) {
          await this.updateCamadaUseCase.execute({
            COD_CAMADA_ID,
            NOM_NOME,
            DSC_TITULO,
            DSC_DESCRICAO,
            DSC_LINK_METADADOS,
            TXT_TERMOS_DE_USO,
            NIVEL_COMPATILHAMENTO,
            GRUPOS_CAMADAS,
            TXT_TAGS,
            DSC_FONTE_DADOS_CAMADA,
            DSC_BOUNDING_BOX: JSON.stringify(boundingBox),
            COD_USUARIO_ULTIMA_ALTERACAO: COD_USER_ID,
            BOL_CARREGAMENTO_DEFAULT,
          });
        } else {
          console.warn(
            `Bounding box não pôde ser obtido para a camada ${NOM_NOME}.`,
          );
        }
      }

      await this.historico.registrar({
        tipo: 'camada',
        camadaId: COD_CAMADA_ID,
        operacao: 'publicacao',
        status: geoserverPublicado ? 'sucesso' : 'erro',
        usuarioId: COD_USER_ID,
        errorMsg: geoserverPublicado
          ? null
          : 'Falha ao publicar no GeoServer (camada salva no banco)',
      });
    }
  }
}
