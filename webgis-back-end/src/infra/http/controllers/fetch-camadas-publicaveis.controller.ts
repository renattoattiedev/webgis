import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';
import { MetadadosPostgis } from '@/infra/modulos_ext/metadados-postgis/metadados-postgis';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { CamadasRepository } from '@/domain/camadas/application/repositories/camadas-repository';
import { GrupoRepository } from '@/domain/manager/application/repositories/grupo-repository';

@Controller('/fetch-camadas-publicaveis/:pacoteConceitualId')
export class FetchCamadasPublicaveisController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private geoserverAPI: GeoserverAPI,
    private fetchPacotesConceituais: FetchPacotesConceituaisUseCase,
    private metadadosPostgis: MetadadosPostgis,
    private camadasRepository: CamadasRepository,
    private grupoRepository: GrupoRepository,
  ) {}

  @Get()
  async handle(
    @Param('pacoteConceitualId') COD_PACOTE_CONCEITUAL_ID: string,
    @CurrentUser() userLogin: UserPayload,
  ) {
    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: userLogin.sub,
    });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const pacote = await this.fetchPacotesConceituais.execute({
      COD_PACOTE_CONCEITUAL_ID,
    });

    if (pacote.isLeft()) {
      throw new BadRequestException('Erro ao buscar pacote conceitual');
    }

    const pacoteNome = pacote.value.pacotesConceituais.pacoteConceitualNome;
    const password = pacote.value.pacotesConceituais.pacoteConceitualPassword;

    const publishedLayers =
      await this.geoserverAPI.getPublishedLayers(pacoteNome);
    const dataStore = await this.geoserverAPI.getDataStore(pacoteNome);
    const connectionParams = dataStore.entry;

    const dbConfig = {
      host: connectionParams.find((p) => p['@key'] === 'host')?.$,
      database: connectionParams.find((p) => p['@key'] === 'database')?.$,
      schema: connectionParams.find((p) => p['@key'] === 'schema')?.$,
      port: connectionParams.find((p) => p['@key'] === 'port')?.$,
      user: connectionParams.find((p) => p['@key'] === 'user')?.$,
      password,
    };

    const allTables =
      await this.metadadosPostgis.listarTabelasPostGIS(dbConfig);

    const camadasDoPacote =
      await this.camadasRepository.findManyByPacoteConceitual(
        COD_PACOTE_CONCEITUAL_ID,
      );
    const camadaPorNome = new Map(
      camadasDoPacote.map((c) => [c.camadaNome, c]),
    );

    const grupoIds = [
      ...new Set(
        camadasDoPacote
          .map((c) => c.camadaGruposCamadas)
          .filter((id): id is string => !!id),
      ),
    ];
    const grupos = await Promise.all(
      grupoIds.map((id) => this.grupoRepository.findById(id)),
    );
    const temaPorGrupoId = new Map(
      grupos
        .filter((g): g is NonNullable<typeof g> => !!g)
        .map((g) => [g.id.toString(), g.grupoTema]),
    );

    const layers = allTables.map((tableName) => {
      const camada = camadaPorNome.get(tableName);

      return {
        tableName,
        published: publishedLayers.includes(tableName),
        camadaId: camada ? camada.id.toString() : null,
        titulo: camada ? camada.camadaTitulo : null,
        descricao: camada ? camada.camadaDescricao : null,
        linkMetadados: camada ? camada.camadaLinkMetadados : null,
        termosDeUso: camada ? camada.camadaTermosDeUso : null,
        nivelCompartilhamentoId: camada
          ? camada.camadaNivelCompartilhamento
          : null,
        grupoId: camada ? camada.camadaGruposCamadas : null,
        temaId:
          camada && camada.camadaGruposCamadas
            ? temaPorGrupoId.get(camada.camadaGruposCamadas) ?? null
            : null,
        tags: camada ? camada.camadaTags : null,
        fonteDadosCamada: camada ? camada.camadaFonteDadosCamada : null,
      };
    });

    return { layers };
  }
}
