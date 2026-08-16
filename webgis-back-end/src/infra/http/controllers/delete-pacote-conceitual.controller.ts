import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Req,
  ForbiddenException,
  ConflictException,
  HttpStatus,
  HttpException, // 🆕
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { DeletePacoteConceitualUseCase } from '@/domain/manager/application/use-cases/delete-pacote-conceitual';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';

@Controller('/delete-pacote-conceitual/:pacoteConceitualId')
export class DeletePacoteConceitualController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private deletePacoteConceitualUseCase: DeletePacoteConceitualUseCase,
    private fetchPacotesConceituaisUseCase: FetchPacotesConceituaisUseCase,
    private geoserverAPI: GeoserverAPI,
  ) {}

  @Delete()
  async handle(
    @Req() request: Request,
    @Param('pacoteConceitualId') COD_PACOTE_CONCEITUAL_ID: string,
  ) {
    try {
      const user: UserPayload = request['user'];
      const USUARIO_AUTENTICADO = user.sub;

      // 🔒 Verificar se é admin
      const perfil = await this.getUserPerfilUseCase.execute({
        COD_USER_ID: USUARIO_AUTENTICADO,
      });

      if (perfil.isLeft() || perfil.value?.userPerfil !== 'Admin') {
        console.warn(
          `🚫 Tentativa de exclusão negada: usuário ${USUARIO_AUTENTICADO} não é admin`,
        );
        throw new ForbiddenException(
          'Apenas administradores podem excluir pacotes conceituais',
        );
      }

      // 🔍 Buscar dados do pacote conceitual
      const pacoteResult =
        await this.fetchPacotesConceituaisUseCase.executeMany({
          COD_PACOTE_CONCEITUAL_ID,
        });

      if (pacoteResult.isLeft()) {
        throw new BadRequestException('Pacote conceitual não encontrado');
      }

      const pacote = pacoteResult.value.pacotesConceituaisMany.find(
        (p) => p.id.toString() === COD_PACOTE_CONCEITUAL_ID,
      );

      if (!pacote) {
        throw new BadRequestException('Pacote conceitual não encontrado');
      }

      const pacoteNome = pacote.pacoteConceitualNome;

      // 🔍 Verificar se o datastore existe no GeoServer
      console.log(`🔍 Verificando datastore "${pacoteNome}" no GeoServer...`);

      let datastoreExists = false;
      let publishedLayers: string[] = [];
      let geoserverError = false;

      try {
        // 🆕 Primeiro verificar se datastore existe
        datastoreExists =
          await this.geoserverAPI.checkDatastoreExists(pacoteNome);

        if (datastoreExists) {
          console.log(`✓ Datastore "${pacoteNome}" encontrado no GeoServer`);

          // 🆕 Verificar se há camadas publicadas usando este datastore
          publishedLayers = await this.checkPublishedLayers(pacoteNome);

          if (publishedLayers.length > 0) {
            console.warn(
              `⚠️ Datastore "${pacoteNome}" possui ${publishedLayers.length} camada(s) publicada(s):`,
              publishedLayers,
            );

            // 🔧 Usar HttpException ao invés de ConflictException para resposta JSON customizada
            throw new HttpException(
              {
                success: false,
                message: `Não é possível excluir o pacote conceitual "${pacoteNome}". O datastore possui camadas publicadas no GeoServer.`,
                error: 'Conflict',
                statusCode: 409,
                details: {
                  datastore: pacoteNome,
                  publishedLayers: publishedLayers,
                  layerCount: publishedLayers.length,
                  action: 'DELETE_BLOCKED',
                  reason: 'PUBLISHED_LAYERS_EXIST',
                  userFriendlyMessage: `O pacote conceitual "${pacoteNome}" possui ${publishedLayers.length} camada(s) publicada(s) no GeoServer.`,
                  solution:
                    'Despublique todas as camadas antes de excluir o pacote conceitual.',
                  layers: publishedLayers.map((layer) => ({
                    name: layer,
                    type: 'featureType',
                  })),
                },
              },
              HttpStatus.CONFLICT,
            );
          }

          console.log(
            `✓ Datastore "${pacoteNome}" não possui camadas publicadas. Exclusão permitida.`,
          );
        } else {
          console.log(`📭 Datastore "${pacoteNome}" não existe no GeoServer`);
        }
      } catch (error: any) {
        // Se o erro é de camadas publicadas, re-throw
        if (error instanceof HttpException && error.getStatus() === 409) {
          throw error;
        }

        // Para outros erros do GeoServer, marcar como erro mas continuar
        geoserverError = true;
        console.warn(
          `⚠️ Erro ao verificar datastore "${pacoteNome}" no GeoServer:`,
          error.message,
        );
        console.log(`📝 Prosseguindo com exclusão apenas no banco de dados...`);
      }

      // 🗑️ Tentar excluir datastore do GeoServer (se existir e não tiver camadas)
      let deletedFromGeoServer = false;
      if (datastoreExists && publishedLayers.length === 0 && !geoserverError) {
        try {
          console.log(`🗑️ Removendo datastore "${pacoteNome}" do GeoServer...`);
          await this.geoserverAPI.deleteDataStore(pacoteNome);
          deletedFromGeoServer = true;
          console.log(
            `✅ Datastore "${pacoteNome}" removido do GeoServer com sucesso`,
          );
        } catch (geoError: any) {
          console.error(
            `❌ Erro ao remover datastore do GeoServer:`,
            geoError.message,
          );
          // Não bloquear a exclusão do banco por erro no GeoServer
          console.log(`📝 Continuando com exclusão no banco de dados...`);
        }
      }

      // 🗑️ Excluir do banco de dados
      console.log(
        `🗑️ Removendo pacote conceitual "${pacoteNome}" do banco de dados...`,
      );

      const result = await this.deletePacoteConceitualUseCase.execute({
        COD_PACOTE_CONCEITUAL_ID,
        COD_USUARIO_EXCLUSAO: USUARIO_AUTENTICADO,
      });

      if (result.isLeft()) {
        const error = result.value;
        console.error(`❌ Erro ao excluir pacote do banco:`, error.mensagem);
        throw new BadRequestException(error.mensagem);
      }

      // 🔒 Log de auditoria
      console.log(
        `✅ EXCLUSÃO COMPLETA: Admin ${USUARIO_AUTENTICADO} excluiu pacote "${pacoteNome}" em ${new Date()}`,
      );

      return {
        success: true,
        message: `Pacote conceitual "${pacoteNome}" excluído com sucesso`,
        details: {
          pacoteId: COD_PACOTE_CONCEITUAL_ID,
          pacoteNome: pacoteNome,
          deletedFromGeoServer: deletedFromGeoServer,
          deletedFromDatabase: true,
          deletedBy: USUARIO_AUTENTICADO,
          deletedAt: new Date().toISOString(),
          geoserverWarnings: geoserverError
            ? 'Erro ao verificar/excluir do GeoServer'
            : null,
        },
      };
    } catch (error: any) {
      console.error(`❌ Erro durante exclusão:`, error);

      // 🔧 Tratar HttpException (camadas publicadas)
      if (error instanceof HttpException) {
        throw error;
      }

      // Re-throw erros específicos
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Erro genérico
      throw new BadRequestException(
        error.message || 'Erro interno do servidor durante exclusão',
      );
    }
  }

  // 🔧 Melhorar método para verificar camadas publicadas
  private async checkPublishedLayers(datastoreName: string): Promise<string[]> {
    try {
      console.log(
        `🔍 Verificando camadas publicadas no datastore "${datastoreName}"...`,
      );

      // Buscar feature types (camadas vetoriais) no datastore
      const featureTypes =
        await this.geoserverAPI.getFeatureTypes(datastoreName);

      if (!featureTypes) {
        console.log(`✓ Resposta vazia para datastore "${datastoreName}"`);
        return [];
      }

      // Verificar estrutura da resposta
      if (!featureTypes.featureTypes) {
        console.log(
          `✓ Nenhum featureTypes encontrado no datastore "${datastoreName}"`,
        );
        return [];
      }

      const featureTypeList = featureTypes.featureTypes.featureType;

      if (!featureTypeList) {
        console.log(
          `✓ Nenhuma featureType encontrada no datastore "${datastoreName}"`,
        );
        return [];
      }

      // Extrair nomes das camadas
      let layers: string[] = [];

      if (Array.isArray(featureTypeList)) {
        layers = featureTypeList.map((ft: any) => ft.name).filter(Boolean);
      } else {
        // Se for um único objeto
        if (featureTypeList.name) {
          layers = [featureTypeList.name];
        }
      }

      console.log(
        `📊 Encontradas ${layers.length} camada(s) no datastore "${datastoreName}":`,
        layers,
      );

      return layers;
    } catch (error: any) {
      console.warn(
        `⚠️ Erro ao verificar camadas no datastore "${datastoreName}":`,
        {
          status: error.response?.status,
          message: error.message,
        },
      );

      // Se não conseguir verificar, assumir que há camadas (abordagem segura)
      if (error.response?.status === 404) {
        // Se 404, o datastore não existe ou não tem camadas
        console.log(
          `📭 404: Datastore ou camadas não encontradas para "${datastoreName}"`,
        );
        return [];
      }

      // Para outros erros, assumir que há camadas por segurança
      console.warn(
        `🛡️ Por segurança, assumindo que há camadas publicadas devido ao erro`,
      );
      return ['ERRO_AO_VERIFICAR_CAMADAS'];
    }
  }
}
