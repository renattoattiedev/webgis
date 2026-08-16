/* eslint-disable prettier/prettier */
import axios from 'axios';
import * as fs from 'fs';
import { ConfigService } from '@/config/config.service';
import * as stream from 'stream';
import { promisify } from 'util';
import type { Stream } from 'stream';
import NodeCache from 'node-cache';
import { MinioAPI } from '@/infra/modulos_ext/minio/minio-api';
import { Injectable } from '@nestjs/common';


const pipeline = promisify<Stream, Stream, void>(stream.pipeline);

@Injectable()
export class GeoserverAPI {
  private cache: NodeCache;

  constructor(
    private readonly configService: ConfigService,
    private readonly minioAPI: MinioAPI
  ) {
    // Initialize NodeCache with options
    this.cache = new NodeCache({ stdTTL: 600 });
  }


  async publicarCamada(nomeCamada, pacoteConceitual) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpointPost = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}/featuretypes`;
    const endpointDelete = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}/featuretypes/${nomeCamada}?recurse=true`;

    if (!user || !password || !urlGeoserver) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const optionsDelete = {
      method: 'DELETE',
      url: endpointDelete,
      auth: { username: user, password: password },
    };

    try {
      await axios.request(optionsDelete);
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao deletar a camada existente (pode não existir):',
          error.message,
        );
      } else {
        console.error('Erro desconhecido ao tentar deletar a camada');
      }
    }

    // 1. Criar a camada básica
    const optionsPost = {
      method: 'POST',
      url: endpointPost,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password: password },
      data: {
        featureType: {
          name: nomeCamada,
          nativeName: nomeCamada,
          title: nomeCamada, // Garantir que o título seja definido
          abstract: `Camada ${nomeCamada}`, // Descrição básica
          namespace: { name: "content" },
          // Já incluir configurações básicas na criação
          maxFeatures: 5000,
          numDecimals: 6,
          padWithZeros: true,
          forcedDecimal: true,
          metadata: {
            entry: [
              {
                "@key": "cachingEnabled",
                "$": "true"
              },
              {
                "@key": "cacheAgeMax",
                "$": "86400"
              },
              {
                "@key": "cacheClientExpire",
                "$": "3600"
              }
            ]
          }
        },
      },
    };

    try {
      const response = await axios.request(optionsPost);

      // 2. Aguardar criação da camada
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Aplicar configurações adicionais
      await this.aplicarConfiguracaoOtimizada(nomeCamada, pacoteConceitual, user, password, urlGeoserver);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Erro ao publicar a camada no GeoServer:',
          error.response?.data || error.message,
        );
      } else if (error instanceof Error) {
        console.error('Erro ao publicar a camada no GeoServer:', error.message);
      } else {
        console.error('Erro desconhecido ao tentar publicar a camada');
      }
      throw error;
    }
  }

  private async aplicarConfiguracaoOtimizada(nomeCamada: string, pacoteConceitual: string, user: string, password: string, urlGeoserver: string) {
    try {
      // 1. Configurar FeatureType — retorna se a camada tem soft delete
      const temSoftDelete = await this.configurarFeatureType(nomeCamada, pacoteConceitual, user, password, urlGeoserver);

      // 2. Configurar Layer (configurações adicionais)
      await this.configurarLayer(nomeCamada, user, password, urlGeoserver);

      // 3. Configurar Tile Caching — desabilita GWC se a camada tiver soft delete
      await this.configurarTileCache(nomeCamada, user, password, urlGeoserver, temSoftDelete);

    } catch (error) {
      console.error('Erro ao aplicar configurações otimizadas:', error);
    }
  }

  private async configurarFeatureType(nomeCamada: string, pacoteConceitual: string, user: string, password: string, urlGeoserver: string): Promise<boolean> {
    const endpointFeatureType = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}/featuretypes/${nomeCamada}`;

    try {
      // Buscar configuração atual primeiro
      const getOptions = {
        method: 'GET',
        url: endpointFeatureType,
        headers: { 'Accept': 'application/json' },
        auth: { username: user, password: password }
      };

      const currentConfig = await axios.request(getOptions);

      // Detecta se a camada possui soft delete (campo dhs_exclusao)
      const atributos: any[] = currentConfig.data.featureType?.attributes?.attribute ?? [];
      const temSoftDelete = atributos.some((a) => a.name === 'dhs_exclusao');

      // Atualizar com configurações de otimização
      const featureTypeConfig = {
        featureType: {
          ...currentConfig.data.featureType,
          // Configurações da aba Publishing
          maxFeatures: 5000,
          numDecimals: 6,
          padWithZeros: true,
          forcedDecimal: true,
          // CQL Filter automático para soft delete
          ...(temSoftDelete ? { cqlFilter: 'dhs_exclusao IS NULL' } : {}),
          // Cache: desabilita para camadas com soft delete, mantém para as demais
          metadata: {
            entry: [
              ...(currentConfig.data.featureType.metadata?.entry || []).filter(
                entry => !['cachingEnabled', 'cacheAgeMax', 'cacheClientExpire'].includes(entry['@key'])
              ),
              {
                "@key": "cachingEnabled",
                "$": temSoftDelete ? "false" : "true"
              },
              ...(!temSoftDelete ? [
                { "@key": "cacheAgeMax", "$": "86400" },
                { "@key": "cacheClientExpire", "$": "3600" }
              ] : [])
            ]
          }
        }
      };

      const putOptions = {
        method: 'PUT',
        url: endpointFeatureType,
        headers: { 'Content-Type': 'application/json' },
        auth: { username: user, password: password },
        data: featureTypeConfig,
      };

      await axios.request(putOptions);
      console.log(`FeatureType configurado: ${nomeCamada}${temSoftDelete ? ' (cache desabilitado — soft delete detectado)' : ''}`);
      return temSoftDelete;

    } catch (error) {
      console.error(`Erro ao configurar FeatureType ${nomeCamada}:`, error);
      return false;
    }
  }

  private async configurarLayer(nomeCamada: string, user: string, password: string, urlGeoserver: string) {
    const endpointLayer = `${urlGeoserver}/rest/layers/content:${nomeCamada}`;

    try {
      // Buscar configuração atual da layer
      const getOptions = {
        method: 'GET',
        url: endpointLayer,
        headers: { 'Accept': 'application/json' },
        auth: { username: user, password: password }
      };

      const currentConfig = await axios.request(getOptions);

      // Atualizar com configurações de simplificação
      const layerConfig = {
        layer: {
          ...currentConfig.data.layer,
          resource: {
            ...currentConfig.data.layer.resource,
            metadata: {
              entry: [
                ...(currentConfig.data.layer.resource.metadata?.entry || []).filter(
                  entry => entry['@key'] !== 'geometry.simplification.distance'
                ),
                {
                  "@key": "geometry.simplification.distance",
                  "$": "1.0"
                }
              ]
            }
          }
        }
      };

      const putOptions = {
        method: 'PUT',
        url: endpointLayer,
        headers: { 'Content-Type': 'application/json' },
        auth: { username: user, password: password },
        data: layerConfig,
      };

      await axios.request(putOptions);
      console.log(`Layer configurada: ${nomeCamada}`);

    } catch (error) {
      console.error(`Erro ao configurar Layer ${nomeCamada}:`, error);
    }
  }

  private async configurarTileCache(nomeCamada: string, user: string, password: string, urlGeoserver: string, temSoftDelete = false) {
    try {
      const gwcEndpoint = `${urlGeoserver}/gwc/rest/layers/content:${nomeCamada}`;

      // Camadas com soft delete: desabilita GWC completamente para evitar servir dados excluídos
      const cacheConfigXML = temSoftDelete
        ? `<?xml version="1.0" encoding="UTF-8"?>
<GeoServerLayer>
  <name>content:${nomeCamada}</name>
  <enabled>false</enabled>
</GeoServerLayer>`
        : `<?xml version="1.0" encoding="UTF-8"?>
<GeoServerLayer>
  <name>content:${nomeCamada}</name>
  <enabled>true</enabled>
  <mimeFormats>
    <string>image/png</string>
    <string>image/jpeg</string>
  </mimeFormats>
  <gridSubsets>
    <gridSubset>
      <gridSetName>SIRGAS2000_UTM_24S</gridSetName>
      <zoomStart>0</zoomStart>
      <zoomStop>10</zoomStop>
    </gridSubset>
    <gridSubset>
      <gridSetName>WebMercator_3857</gridSetName>
      <zoomStart>0</zoomStart>
      <zoomStop>10</zoomStop>
    </gridSubset>
    <gridSubset>
      <gridSetName>EPSG:4326</gridSetName>
      <zoomStart>0</zoomStart>
      <zoomStop>10</zoomStop>
    </gridSubset>
    <gridSubset>
      <gridSetName>EPSG:900913</gridSetName>
      <zoomStart>0</zoomStart>
      <zoomStop>10</zoomStop>
    </gridSubset>
  </gridSubsets>
  <metaWidthHeight>
    <int>4</int>
    <int>4</int>
  </metaWidthHeight>
  <expireCache>86400</expireCache>
  <expireClients>3600</expireClients>
  <gutter>10</gutter>
</GeoServerLayer>`;

      const cacheOptions = {
        method: 'PUT',
        url: `${gwcEndpoint}.xml`,
        headers: { 'Content-Type': 'application/xml' },
        auth: { username: user, password: password },
        data: cacheConfigXML,
      };

      await axios.request(cacheOptions);
      console.log(`Tile Cache configurado para: ${nomeCamada}${temSoftDelete ? ' (GWC desabilitado — soft delete detectado)' : ''}`);

    } catch (error) {
      console.error(`Erro ao configurar Tile Cache para ${nomeCamada}:`, error);

      // Fallback: tentar configurar apenas habilitando o cache básico
      try {
        const basicCacheEndpoint = `${urlGeoserver}/rest/layers/content:${nomeCamada}`;
        const basicCacheConfig = {
          layer: {
            type: "VECTOR",
            defaultStyle: {
              name: "CAMADA PADRÃO"
            }
          }
        };

        const basicOptions = {
          method: 'PUT',
          url: basicCacheEndpoint,
          headers: { 'Content-Type': 'application/json' },
          auth: { username: user, password: password },
          data: basicCacheConfig,
        };

        await axios.request(basicOptions);
        console.log(`Cache básico configurado para: ${nomeCamada}`);
      } catch (fallbackError) {
        console.error('Falha no fallback do cache:', fallbackError);
      }
    }
  }


  async publicarEstilo(nomeCamada: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpoint = `${urlGeoserver}/rest/workspaces/content/styles`;

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const optionsPost = {
      method: 'POST',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: user,
        password: password,
      },
      data: {
        style: { name: nomeCamada, filename: `${nomeCamada}.sld` },
      },
    };
    try {
      const response = await axios.request(optionsPost);
      return response.data;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.data.includes('already exists')
      ) {
        const optionsDelete = {
          method: 'DELETE',
          url: `${endpoint}/${nomeCamada}?recurse=true`,
          auth: { username: user, password: password },
        };
        try {
          await axios.request(optionsDelete);
        } catch (error) {
          console.error('Erro ao deletar a camada existente:', error);
          throw error;
        }

        // Tentar POST novamente
        try {
          return await axios.request(optionsPost);
        } catch (error) {
          console.error('Erro ao publicar a camada após a deleção:', error);
          throw error;
        }
      } else {
        console.error('Erro ao publicar o estilo no GeoServer:', error);
        throw error;
      }
    }
  }
  async carregarEstilo(nomeCamada, filePath) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const endpoint = `${urlGeoserver}/rest/workspaces/content/styles/${nomeCamada}`;

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const options = {
        method: 'PUT',
        url: endpoint,
        headers: {
          'Content-Type': 'application/vnd.ogc.se+xml',
        },
        auth: {
          username: user,
          password: password,
        },
        data: fileContent,
      };

      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async associarEstiloCamada(nomeCamada: string, pacoteConceitual: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpoint = `${urlGeoserver}/rest/workspaces/content/layers/${nomeCamada}`;

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const options = {
      method: 'PUT',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: user,
        password: password,
      },
      data: {
        layer: {
          defaultStyle: {
            name: nomeCamada,
            workspace: pacoteConceitual,
          },
        },
      },
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async getDataStore(pacoteConceitual: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpoint = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}`;
    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const options = {
      method: 'GET',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: user,
        password: password,
      },
      timeout: 15000,
    };

    try {
      const response = await axios.request(options);
      const dataStore = response.data;

      if (
        dataStore &&
        dataStore.dataStore &&
        dataStore.dataStore.connectionParameters
      ) {
        return dataStore.dataStore.connectionParameters;
      } else {
        console.log('Connection parameters not found in the response');
      }
    } catch (error) {
      console.error('Error fetching data store:', error);
      throw error;
    }
  }


  async deleteCamada(nomeCamada: string, pacoteConceitual: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpoint = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}/featuretypes/${nomeCamada}?recurse=true`;

    if (!user || !password) {
      throw new Error('Variáveis de ambiente do GeoServer não estão configuradas corretamente.');
    }

    const options = {
      method: 'DELETE',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: user,
        password: password,
      },
    };

    try {
      const camadaExiste = await this.camadaExiste(nomeCamada);

      const groupLayers = await axios.get(
        `${urlGeoserver}/rest/workspaces/content/layergroups`,
        {
          auth: { username: user, password: password },
        }
      );

      const layerGroups = groupLayers.data.layerGroups?.layerGroup;

      if (Array.isArray(layerGroups)) {
        for (const groupLayer of layerGroups) {
          const groupLayerDetails = await axios.get(
            `${urlGeoserver}/rest/workspaces/content/layergroups/${groupLayer.name}`,
            {
              auth: { username: user, password: password },
            }
          );

          let updatedPublished = groupLayerDetails.data.layerGroup.publishables.published;
          let updatedStyles = groupLayerDetails.data.layerGroup.styles.style;

          if (!Array.isArray(updatedPublished)) {
            updatedPublished = [updatedPublished];
          }
          if (!Array.isArray(updatedStyles)) {
            updatedStyles = [updatedStyles];
          }

          // Filtra as camadas e estilos que não correspondem ao nome da camada a ser removida
          updatedPublished = updatedPublished.filter(
            (published) => published.name !== `content:${nomeCamada}`
          );

          updatedStyles = updatedStyles.slice(0, updatedPublished.length);

          if (updatedPublished.length === 0) {
            // Remove o grupo de camadas se não houver mais camadas publicadas
            await axios.delete(
              `${urlGeoserver}/rest/workspaces/content/layergroups/${groupLayer.name}`,
              {
                auth: { username: user, password: password },
              }
            );
          } else {
            // Atualiza o grupo de camadas com as camadas e estilos restantes
            const updatedLayerGroup = {
              ...groupLayerDetails.data.layerGroup,
              publishables: {
                published: updatedPublished.length === 1 ? updatedPublished[0] : updatedPublished,
              },
              styles: {
                style: updatedStyles.length === 1 ? updatedStyles[0] : updatedStyles,
              },
            };

            await axios.put(
              `${urlGeoserver}/rest/workspaces/content/layergroups/${groupLayer.name}`,
              { layerGroup: updatedLayerGroup },
              {
                auth: { username: user, password: password },
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
        }
      }

      if (await camadaExiste) {
        const result = await axios.request(options);
        if (result.status === 200) {
          this.deleteEstilo(nomeCamada);
        }
      } else {
        console.warn(`Camada ${nomeCamada} não encontrada. Nenhuma ação de exclusão necessária.`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Erro ao deletar a camada no GeoServer:',
          error.response?.data || error.message
        );
        throw new Error(`Erro ao deletar a camada: ${error.response?.data || error.message}`);
      } else {
        console.error('Erro desconhecido ao tentar deletar a camada');
        throw error;
      }
    }
  }


  async deleteEstilo(nomeCamada: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpoint = `${urlGeoserver}/rest/workspaces/content/styles/${nomeCamada}`;
    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }
    const options = {
      method: 'DELETE',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: user,
        password: password,
      },
    };

    try {
      await axios.request(options);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createWorkSpace(pacoteConceitual) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpointPost = `${urlGeoserver}/rest/workspaces`;
    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const optionsPost = {
      method: 'POST',
      url: endpointPost,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password: password },
      data: {
        workspace: {
          name: pacoteConceitual,
        },
      },
    };

    try {
      const response = await axios.request(optionsPost);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao cadastrar a WorkSpace no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }

  async updateNamespace(nomePacoteConceitualNovo) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpointPost = `${urlGeoserver}/rest/namespaces/${nomePacoteConceitualNovo}`;
    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const optionsPut = {
      method: 'PUT',
      url: endpointPost,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password: password },
      data: {
        namespace: {
          prefix: nomePacoteConceitualNovo,
          uri: `http://${nomePacoteConceitualNovo}`,
        },
      },
    };

    try {
      const response = await axios.request(optionsPut);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao atualizar o Namespace no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }
  async updateWorkSpace(nomePacoteConceitualVelho, nomePacoteConceitualNovo) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpointPost = `${urlGeoserver}/rest/workspaces/${nomePacoteConceitualVelho}`;
    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const optionsPut = {
      method: 'PUT',
      url: endpointPost,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password: password },
      data: {
        workspace: {
          name: nomePacoteConceitualNovo,
        },
      },
    };

    try {
      const response = await axios.request(optionsPut);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao atualizar a WorkSpace no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }

  async createDataStore(
    host,
    database,
    port,
    schemaDatabase,
    userDatabase,
    passwordDatabase,
    pacoteConceitual,
  ) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpointPost = `${urlGeoserver}/rest/workspaces/content/datastores`;
    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const auth =
      'Basic ' + Buffer.from(user + ':' + password).toString('base64');

    const data = JSON.stringify({
      dataStore: {
        name: pacoteConceitual,
        connectionParameters: {
          entry: [
            {
              '@key': 'host',
              $: host,
            },
            {
              '@key': 'port',
              $: port,
            },
            {
              '@key': 'database',
              $: database,
            },
            {
              '@key': 'schema',
              $: schemaDatabase,
            },
            {
              '@key': 'user',
              $: userDatabase,
            },
            {
              '@key': 'passwd',
              $: passwordDatabase,
            },
            {
              '@key': 'dbtype',
              $: 'postgis',
            },
          ],
        },
      },
    });

    const response = await axios({
      method: 'POST',
      url: endpointPost,
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      data: data,
    });

    const responseBody = await response.data;

    try {
      return responseBody;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao cadastrar o DataStore no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }

  async updateDataStore(
    host,
    database,
    port,
    schemaDatabase,
    userDatabase,
    passwordDatabase,
    nomePacoteConceitualVelho,
    nomePacoteConceitualNovo,
  ) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpointPost = `${urlGeoserver}/rest/workspaces/content/datastores/${nomePacoteConceitualVelho}`;
    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const auth =
      'Basic ' + Buffer.from(user + ':' + password).toString('base64');

    const data = JSON.stringify({
      dataStore: {
        name: nomePacoteConceitualNovo,
        connectionParameters: {
          entry: [
            {
              '@key': 'host',
              $: host,
            },
            {
              '@key': 'port',
              $: port,
            },
            {
              '@key': 'database',
              $: database,
            },
            {
              '@key': 'schema',
              $: schemaDatabase,
            },
            {
              '@key': 'user',
              $: userDatabase,
            },
            {
              '@key': 'passwd',
              $: passwordDatabase,
            },
            {
              '@key': 'namespace',
              $: `http://${nomePacoteConceitualNovo}`,
            },
            { '@key': 'dbtype', $: 'postgis' },
          ],
        },
      },
    });

    const response = await axios({
      method: 'PUT',
      url: endpointPost,
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      data: data,
    });

    const responseBody = await response.data;

    try {
      return responseBody;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao cadastrar o DataStore no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }

  async habilitarCamada(pacoteConceitual, nomeCamada) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpoint = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}/featuretypes/${nomeCamada}.json`;

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const options = {
      method: 'PUT',
      url: endpoint,
      auth: { username: user, password: password },
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        featureType: {
          enabled: true,
        },
      }),
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao habilitar a camada no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }

  async habilitarCamadaRaster(nomeCamada) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpoint = `${urlGeoserver}/rest/workspaces/content/coveragestores/${nomeCamada}.json`;

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const options = {
      method: 'PUT',
      url: endpoint,
      auth: { username: user, password: password },
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        coverageStore: {
          enabled: true,
        },
      }),
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao habilitar a camada no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }


  async desabilitarCamada(pacoteConceitual, nomeCamada) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpoint = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}/featuretypes/${nomeCamada}.json`;

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const options = {
      method: 'PUT',
      url: endpoint,
      auth: { username: user, password: password },
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        featureType: {
          enabled: false,
        },
      }),
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao desabilitar a camada no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }

  async desabilitarCamadaRaster(nomeCamada) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpoint = `${urlGeoserver}/rest/workspaces/content/coveragestores/${nomeCamada}.json`;
    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const options = {
      method: 'PUT',
      url: endpoint,
      auth: { username: user, password: password },
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        coverageStore: {
          enabled: false,
        },
      }),
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao desabilitar a camada no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }

  async getPublishedLayers(pacoteConceitual: string): Promise<string[]> {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpoint = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}/featuretypes.json`;

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const options = {
      method: 'GET',
      url: endpoint,
      auth: { username: user, password: password },
      headers: { 'Content-Type': 'application/json' },
    };

    try {
      const response = await axios.request(options);
      if (
        response.data.featureTypes &&
        response.data.featureTypes.featureType
      ) {
        return response.data.featureTypes.featureType.map((ft) => ft.name);
      } else {
        return [];
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao recuperar as camadas publicadas:',
          error.message,
        );
        throw error;
      }
    }
    return [];
  }

  async criarMapas(
    nomeGrupo: string,
    tituloGrupo: string,
    camadas: { nomeCamada: string }[],
    camadasRaster: { nomeCamada: string, fonteDadosCamadaRaster: string }[],
    bounds: { minx: number; maxx: number; miny: number; maxy: number; crs: string }
  ) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpointPost = `${urlGeoserver}/rest/workspaces/content/layergroups`;

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const layerGroupBody = `
      <layerGroup>
        <name>${nomeGrupo}</name>
        <title>${tituloGrupo}</title>
        <layers>
          ${camadas
        .map((camada) => `<layer>content:${camada.nomeCamada}</layer>`)
        .join('')}
          ${camadasRaster
        .map((camada) => `<layer>content:${camada.nomeCamada}_${camada.fonteDadosCamadaRaster}</layer>`)
        .join('')}
        </layers>
        <styles>
          ${camadas
        .map((camada) => `<style>content:${camada.nomeCamada}</style>`)
        .join('')}
          ${camadasRaster
        .map((camada) => `<style>content:${camada.nomeCamada}_${camada.fonteDadosCamadaRaster}</style>`)
        .join('')}
        </styles>
        <bounds>
          <minx>${bounds.minx}</minx>
          <maxx>${bounds.maxx}</maxx>
          <miny>${bounds.miny}</miny>
          <maxy>${bounds.maxy}</maxy>
        <crs>${bounds.crs}</crs>
      </bounds>
      </layerGroup>
    `;

    const optionsPost = {
      method: 'POST',
      url: endpointPost,
      headers: {
        'Content-Type': 'application/xml',
      },
      auth: {
        username: user,
        password: password,
      },
      data: layerGroupBody,
    };

    try {
      const response = await axios.request(optionsPost);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao criar grupo de camadas no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }

  async deletarMapas(nomeMapa: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    const endpointDelete = `${urlGeoserver}/rest/layergroups/${nomeMapa}`;

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const optionsDelete = {
      method: 'DELETE',
      url: endpointDelete,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: user,
        password: password,
      },
    };

    try {
      const response = await axios.request(optionsDelete);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Erro ao deletar o mapa de camadas no GeoServer:',
          error.message,
        );
        throw error;
      }
    }
  }

  async getBoundingBox(pacoteConceitual: string, nomeCamada: string) {
    try {
      const dataStoreExists = await this.dataStoreExists(pacoteConceitual);
      if (!dataStoreExists) {
        throw new Error(`Datastore ${pacoteConceitual} não existe.`);
      }

      const camadaExiste = await this.camadaExiste(nomeCamada);
      if (!camadaExiste) {
        console.warn(`Camada ${nomeCamada} não encontrada no GeoServer.`);
        return null; // Retorna null para indicar que o bounding box não pôde ser obtido
      }

      const extentData = await this.getExtentCamadas(pacoteConceitual, nomeCamada);
      if (extentData?.featureType?.nativeBoundingBox) {
        const bbox = extentData.featureType.nativeBoundingBox;
        return {
          minx: bbox.minx,
          maxx: bbox.maxx,
          miny: bbox.miny,
          maxy: bbox.maxy,
          crs: bbox.crs,
        };
      } else {
        throw new Error('Bounding box não encontrado para a camada especificada.');
      }
    } catch (error) {
      console.error('Erro ao obter o bounding box da camada:', error);
      throw error;
    }
  }


  async getBoundingBoxRaster(nomeCamada: string) {
    try {

      const camadaExiste = await this.camadaExiste(nomeCamada);
      if (!camadaExiste) {
        console.warn(`Camada ${nomeCamada} não encontrada no GeoServer.`);
        return null;
      }

      const extentData = await this.getExtentCamadasRaster(nomeCamada);
      if (extentData?.coverage?.nativeBoundingBox) {
        const bbox = extentData.coverage.nativeBoundingBox;
        return {
          minx: bbox.minx,
          maxx: bbox.maxx,
          miny: bbox.miny,
          maxy: bbox.maxy,
          crs: bbox.crs,
        };
      } else {
        throw new Error('Bounding box não encontrado para a camada especificada.');
      }
    } catch (error) {
      console.error('Erro ao obter o bounding box da camada:', error);
      throw error;
    }
  }

  async dataStoreExists(pacoteConceitual: string): Promise<boolean> {
    try {
      const user = await this.configService.getConfig('GEOSERVER_USER');
      const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
      const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
      const endpoint = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}.json`;

      if (!user || !password) {
        console.error('Usuário ou senha do GeoServer não estão configurados corretamente.');
        return false; // ou você pode lançar um erro, dependendo do seu caso de uso
      }

      const options = {
        method: 'GET',
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: user,
          password: password,
        },
      };

      const response = await axios.request(options);

      // Verifica se o status da resposta é 200 (OK), indicando que o DataStore existe
      return response.status === 200;
    } catch (error) {
      // Captura e loga qualquer erro que ocorra durante a verificação
      console.error('Erro ao verificar a existência do DataStore:', error);
      return false;
    }
  }

  async camadaExiste(nomeCamada: string): Promise<boolean> {
    try {
      const user = await this.configService.getConfig('GEOSERVER_USER');
      const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
      const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
      const endpoint = `${urlGeoserver}/rest/workspaces/content/layers/${nomeCamada}.json`;

      if (!user || !password) {
        console.error('Usuário ou senha do GeoServer não estão configurados corretamente.');
        return false; // ou você pode lançar um erro, dependendo do seu caso de uso
      }

      const options = {
        method: 'GET',
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: user,
          password: password,
        },
      };

      const response = await axios.request(options);

      return response.status === 200;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn(`Camada ${nomeCamada} não encontrada no GeoServer.`);
        return false; // Retorna falso para indicar que a camada não existe
      } else {
        console.error('Erro ao verificar a existência da camada:', error);
        throw error; // Lança o erro para que ele possa ser tratado mais acima, se necessário
      }
    }
  }


  async getExtentCamadas(pacoteConceitual: string, layerName: string) {
    try {
      const user = await this.configService.getConfig('GEOSERVER_USER');
      const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
      const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
      const endpoint = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}/featuretypes/${layerName}.json`;

      if (!user || !password) {
        console.error('Usuário ou senha do GeoServer não estão configurados corretamente.');
        return false; // ou você pode lançar um erro, dependendo do seu caso de uso
      }

      const options = {
        method: 'GET',
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: user,
          password: password,
        },
      };

      const response = await axios.request(options);

      return response.data;
    } catch (error) {
      console.error('Erro ao obter extensão da camada:', error);
      throw error;
    }
  }

  async getExtentCamadasRaster(layerName: string) {
    try {
      const user = await this.configService.getConfig('GEOSERVER_USER');
      const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
      const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
      const endpoint = `${urlGeoserver}/rest/workspaces/content/coveragestores/${layerName}/coverages/${layerName}.json`;
      if (!user || !password) {
        console.error('Usuário ou senha do GeoServer não estão configurados corretamente.');
        return false; // ou você pode lançar um erro, dependendo do seu caso de uso
      }

      const options = {
        method: 'GET',
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: user,
          password: password,
        },
      };

      const response = await axios.request(options);

      return response.data;
    } catch (error) {
      console.error('Erro ao obter extensão da camada:', error);
      throw error;
    }
  }

  async criaDataStoreS3GeoTiff(nomeCamada: string, fonteRaster: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    const timeout = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (!user || !password) {
      throw new Error('Variáveis de ambiente do Geoserver não estão configuradas corretamente.');
    }

    const endpointPost = `${urlGeoserver}/rest/workspaces/content/coveragestores`;

    const minioUrl = `minio://imagens/${nomeCamada}.tif`;

    const dataStoreBody = {
      coverageStore: {
        name: `${nomeCamada}_${fonteRaster}`,
        type: 'S3GeoTiff',
        enabled: true,
        workspace: { name: 'content' },
        url: minioUrl,
      },
    };

    const optionsPost = {
      method: 'POST',
      url: endpointPost,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password: password },
      data: dataStoreBody,
    };
    try {
      const response = await axios.request(optionsPost);
      clearTimeout(timeoutId);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        clearTimeout(timeoutId);
        console.error('Erro ao criar o datastore S3GeoTiff no GeoServer:', error.response?.data || error.message);
      } else {
        console.error('Erro desconhecido ao tentar criar o datastore S3GeoTiff');
      }
      throw error;
    }
  }

  async publicarCamadaS3GeoTiff(nomeCamada: string, fonteRaster: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    const cacheKey = `${nomeCamada}_${fonteRaster}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (!user || !password) {
      throw new Error('Variáveis de ambiente do Geoserver não estão configuradas corretamente.');
    }

    const endpointPostCoverage = `${urlGeoserver}/rest/workspaces/content/coveragestores/${nomeCamada}_${fonteRaster}/coverages`;

    const coverageBody = {
      coverage: {
        name: `${nomeCamada}_${fonteRaster}`,
        nativeName: nomeCamada,
        title: nomeCamada,
        enabled: true,
        srs: "EPSG:31984",
        nativeCRS: "EPSG:31984",
        store: {
          name: `${nomeCamada}_${fonteRaster}`,
          type: "S3GeoTiff",
        },
      },
    };

    const optionsPostCoverage = {
      method: 'POST',
      url: endpointPostCoverage,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password: password },
      data: coverageBody,
    };

    try {
      const response = await axios.request(optionsPostCoverage);
      this.cache.set(cacheKey, response);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Erro ao publicar a camada raster no GeoServer:', error.response?.data || error.message);
      } else {
        console.error('Erro desconhecido ao tentar publicar a camada raster');
      }
      throw error;
    }
  }



  async processarPublicacaoS3GeoTiff(nomeCamada: string, fonteCamada: string) {
    let objectStream: stream.Readable | null = null;
    try {
      objectStream = await this.minioAPI.getObject(
        'imagens',
        `${nomeCamada}.tif`
      ) as stream.Readable;

      const chunks: Buffer[] = [];

      await new Promise((resolve, reject) => {
        objectStream!.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        objectStream!.on('end', () => resolve(Buffer.concat(chunks as unknown as Uint8Array[])));
        objectStream!.on('error', reject);
      });

      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          await this.criaDataStoreS3GeoTiff(nomeCamada, fonteCamada);
          await this.publicarCamadaS3GeoTiff(nomeCamada, fonteCamada);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      // Properly type-check and cleanup the stream
      if (objectStream && !objectStream.destroyed) {
        objectStream.destroy();
      }

      return true;
    } catch (error) {
      // Ensure cleanup even in case of error
      if (objectStream && !objectStream.destroyed) {
        objectStream.destroy();
      }
      console.error('Erro ao processar GeoTiff:', error);
      throw error;
    }
  }

  async criaDataStoreGeoTiff(nomeCamada: string, fonteRaster: string, filePath: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const endpointPost = `${urlGeoserver}/rest/workspaces/content/coveragestores`;

    const dataStoreBody = {
      coverageStore: {
        name: `${nomeCamada}_${fonteRaster}`,
        type: 'GeoTIFF',
        enabled: true,
        workspace: { name: 'content' },
        url: `file://${filePath}`, // Referência ao caminho no sistema de arquivos
      },
    };

    const optionsPost = {
      method: 'POST',
      url: endpointPost,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password: password },
      data: dataStoreBody,
    };

    try {
      const response = await axios.request(optionsPost);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Erro ao criar o datastore GeoTIFF no GeoServer:',
          error.response?.data || error.message,
        );
      } else {
        console.error('Erro desconhecido ao tentar criar o datastore GeoTIFF');
      }
      throw error;
    }
  }

  async publicarCamadaGeoTiff(nomeCamada: string, fonteRaster: string, nativeName?: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    if (!user || !password) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const endpointPostCoverage = `${urlGeoserver}/rest/workspaces/content/coveragestores/${nomeCamada}_${fonteRaster}/coverages`;

    const coverageBody = {
      coverage: {
        name: `${nomeCamada}_${fonteRaster}`,
        nativeName: nativeName ?? nomeCamada,
        title: nomeCamada,
        enabled: true,
        srs: 'EPSG:31984',
        nativeCRS: 'EPSG:31984',
        store: {
          name: `${nomeCamada}_${fonteRaster}`,
          type: 'GeoTIFF',
        },
      },
    };

    const optionsPostCoverage = {
      method: 'POST',
      url: endpointPostCoverage,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password: password },
      data: coverageBody,
    };

    try {
      const response = await axios.request(optionsPostCoverage);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Erro ao publicar a camada GeoTIFF no GeoServer:',
          error.response?.data || error.message,
        );
      } else {
        console.error('Erro desconhecido ao tentar publicar a camada GeoTIFF');
      }
      throw error;
    }
  }


  async deletarCamadaGeoTiff(nomeCamada: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    if (!user || !password) {
      throw new Error('Variáveis de ambiente do GeoServer não estão configuradas corretamente.');
    }

    const endpointDeleteCoverage = `${urlGeoserver}/rest/workspaces/content/coveragestores/${nomeCamada}/coverages/${nomeCamada}`;

    const optionsDeleteCoverage = {
      method: 'DELETE',
      url: endpointDeleteCoverage,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password: password },
      params: { recurse: 'true' },
    };

    try {
      const groupLayers = await axios.get(
        `${urlGeoserver}/rest/workspaces/content/layergroups`,
        {
          auth: { username: user, password: password },
        }
      );

      const layerGroups = groupLayers.data.layerGroups?.layerGroup;

      if (Array.isArray(layerGroups)) {
        for (const groupLayer of layerGroups) {
          const groupLayerDetails = await axios.get(
            `${urlGeoserver}/rest/workspaces/content/layergroups/${groupLayer.name}`,
            {
              auth: { username: user, password: password },
            }
          );

          let updatedPublished = groupLayerDetails.data.layerGroup.publishables.published;
          let updatedStyles = groupLayerDetails.data.layerGroup.styles.style;

          if (!Array.isArray(updatedPublished)) {
            updatedPublished = [updatedPublished];
          }
          if (!Array.isArray(updatedStyles)) {
            updatedStyles = [updatedStyles];
          }

          updatedPublished = updatedPublished.filter(
            (published) => published.name !== `content:${nomeCamada}`
          );

          updatedStyles = updatedStyles.filter(
            (style, index) => index < updatedPublished.length
          );

          if (updatedPublished.length === 0) {
            await axios.delete(
              `${urlGeoserver}/rest/workspaces/content/layergroups/${groupLayer.name}`,
              {
                auth: { username: user, password: password },
              }
            );
          } else {
            const updatedLayerGroup = {
              ...groupLayerDetails.data.layerGroup,
              publishables: {
                published: updatedPublished.length === 1 ? updatedPublished[0] : updatedPublished,
              },
              styles: {
                style: updatedStyles.length === 1 ? updatedStyles[0] : updatedStyles,
              },
            };

            await axios.put(
              `${urlGeoserver}/rest/workspaces/content/layergroups/${groupLayer.name}`,
              { layerGroup: updatedLayerGroup },
              {
                auth: { username: user, password: password },
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
        }
      }

      await this.requestTolerando404(optionsDeleteCoverage);

      const endpointDeleteStore = `${urlGeoserver}/rest/workspaces/content/coveragestores/${nomeCamada}`;

      const optionsDeleteStore = {
        ...optionsDeleteCoverage,
        url: endpointDeleteStore,
      };

      await this.requestTolerando404(optionsDeleteStore);

      return { message: `Camada GeoTIFF ${nomeCamada} deletada com sucesso.` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Erro ao deletar a camada GeoTIFF no GeoServer:', error.response?.data || error.message);
        throw new Error(`Erro ao deletar a camada GeoTIFF: ${error.response?.data || error.message}`);
      } else {
        console.error('Erro desconhecido ao tentar deletar a camada GeoTIFF');
        throw error;
      }
    }
  }

  private async requestTolerando404(options: any) {
    try {
      return await axios.request(options);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }


  async deletarCamadaS3GeoTiff(nomeCamada: string) {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    if (!user || !password) {
      throw new Error('Variáveis de ambiente do GeoServer não estão configuradas corretamente.');
    }

    // Endpoint para deletar a cobertura (coverage)
    const endpointDeleteCoverage = `${urlGeoserver}/rest/workspaces/content/coveragestores/${nomeCamada}/coverages/${nomeCamada}`;

    const optionsDeleteCoverage = {
      method: 'DELETE',
      url: endpointDeleteCoverage,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password: password },
      params: { recurse: 'true' },
    };

    try {
      const groupLayers = await axios.get(
        `${urlGeoserver}/rest/workspaces/content/layergroups`,
        {
          auth: { username: user, password: password },
        }
      );

      const layerGroups = groupLayers.data.layerGroups?.layerGroup;

      if (Array.isArray(layerGroups)) {
        for (const groupLayer of layerGroups) {
          const groupLayerDetails = await axios.get(
            `${urlGeoserver}/rest/workspaces/content/layergroups/${groupLayer.name}`,
            {
              auth: { username: user, password: password },
            }
          );

          let updatedPublished = groupLayerDetails.data.layerGroup.publishables.published;
          let updatedStyles = groupLayerDetails.data.layerGroup.styles.style;

          if (!Array.isArray(updatedPublished)) {
            updatedPublished = [updatedPublished];
          }
          if (!Array.isArray(updatedStyles)) {
            updatedStyles = [updatedStyles];
          }

          updatedPublished = updatedPublished.filter(
            (published) => published.name !== `content:${nomeCamada}`
          );

          updatedStyles = updatedStyles.filter(
            (style, index) => index < updatedPublished.length
          );

          if (updatedPublished.length === 0) {
            await axios.delete(
              `${urlGeoserver}/rest/workspaces/content/layergroups/${groupLayer.name}`,
              {
                auth: { username: user, password: password },
              }
            );
          } else {
            const updatedLayerGroup = {
              ...groupLayerDetails.data.layerGroup,
              publishables: {
                published: updatedPublished.length === 1 ? updatedPublished[0] : updatedPublished,
              },
              styles: {
                style: updatedStyles.length === 1 ? updatedStyles[0] : updatedStyles,
              },
            };

            await axios.put(
              `${urlGeoserver}/rest/workspaces/content/layergroups/${groupLayer.name}`,
              { layerGroup: updatedLayerGroup },
              {
                auth: { username: user, password: password },
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
        }
      }

      await this.requestTolerando404(optionsDeleteCoverage);

      const endpointDeleteStore = `${urlGeoserver}/rest/workspaces/content/coveragestores/${nomeCamada}`;

      const optionsDeleteStore = {
        ...optionsDeleteCoverage,
        url: endpointDeleteStore,
      };

      await this.requestTolerando404(optionsDeleteStore);

      return { message: `Camada S3GeoTiff ${nomeCamada} deletada com sucesso.` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Erro ao deletar a camada S3GeoTiff no GeoServer:', error.response?.data || error.message);
        throw new Error(`Erro ao deletar a camada S3GeoTiff: ${error.response?.data || error.message}`);
      } else {
        console.error('Erro desconhecido ao tentar deletar a camada S3GeoTiff');
        throw error;
      }
    }
  }

  // 🔧 Corrigir método getFeatureTypes
  async getFeatureTypes(datastoreName: string): Promise<any> {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    
    try {
      // 🔧 URL corrigida - adicionado /rest/
      const url = `${urlGeoserver}/rest/workspaces/content/datastores/${datastoreName}/featuretypes`;

      console.log(`🔍 Buscando feature types do datastore: ${url}`);

      const response = await axios.get(url, {
        auth: {
          username: user || '',
          password: password || '',
        },
        headers: {
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      console.log(`📊 Resposta do GeoServer para ${datastoreName}:`, JSON.stringify(response.data, null, 2));
      return response.data;
      
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`📭 Nenhum feature type encontrado para datastore "${datastoreName}"`);
        return null;
      }

      console.error(`❌ Erro ao buscar feature types do datastore "${datastoreName}":`, {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url
      });
      throw error;
    }
  }

  // 🔧 Corrigir método deleteDataStore
  async deleteDataStore(datastoreName: string): Promise<void> {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    
    try {
      // 🔧 URL corrigida - adicionado /rest/
      const url = `${urlGeoserver}/rest/workspaces/content/datastores/${datastoreName}`;

      console.log(`🗑️ Excluindo datastore: ${url}`);

      const response = await axios.delete(url, {
        auth: {
          username: user || '',
          password: password || '',
        },
        params: {
          recurse: 'true', // Excluir recursivamente (incluindo feature types)
          quietOnNotFound: 'true', // Não dar erro se não encontrar
        },
        timeout: 15000,
      });

      console.log(`✅ Datastore "${datastoreName}" excluído com sucesso. Status: ${response.status}`);
      
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`📭 Datastore "${datastoreName}" não encontrado (pode já ter sido excluído)`);
        return; // Não considerar como erro se já não existe
      }

      console.error(`❌ Erro ao excluir datastore "${datastoreName}":`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
    });
    throw error;
    }
  }

  // 🆕 Método adicional para verificar se datastore existe antes de tentar excluir
  async checkDatastoreExists(datastoreName: string): Promise<boolean> {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');
    
    try {
      const url = `${urlGeoserver}/rest/workspaces/content/datastores/${datastoreName}`;
      
      const response = await axios.get(url, {
        auth: {
          username: user || '',
          password: password || '',
        },
        headers: {
          'Accept': 'application/json',
        },
        timeout: 5000,
      });

      console.log(`✓ Datastore "${datastoreName}" existe no GeoServer`);
      return true;
      
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`📭 Datastore "${datastoreName}" não existe no GeoServer`);
        return false;
      }
      
      console.warn(`⚠️ Erro ao verificar existência do datastore "${datastoreName}":`, error.message);
      return false; // Assumir que não existe em caso de erro
    }
  }

  async configurarTileCacheRaster(nomeFlat: string): Promise<void> {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    if (!user || !password || !urlGeoserver) {
      throw new Error('Variáveis de ambiente do Geoserver não estão configuradas corretamente.');
    }

    const layerName = `content:${nomeFlat}`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<GeoServerLayer>
  <name>${layerName}</name>
  <enabled>true</enabled>
  <mimeFormats>
    <string>image/jpeg</string>
    <string>image/png</string>
  </mimeFormats>
  <gridSubsets>
    <gridSubset>
      <gridSetName>EPSG:900913</gridSetName>
      <zoomStart>0</zoomStart><zoomStop>18</zoomStop>
    </gridSubset>
    <gridSubset>
      <gridSetName>EPSG:4326</gridSetName>
      <zoomStart>0</zoomStart><zoomStop>18</zoomStop>
    </gridSubset>
  </gridSubsets>
  <metaWidthHeight><int>4</int><int>4</int></metaWidthHeight>
  <expireCache>2592000</expireCache>
  <expireClients>86400</expireClients>
  <gutter>0</gutter>
</GeoServerLayer>`;

    await axios.request({
      method: 'PUT',
      url: `${urlGeoserver}/gwc/rest/layers/${layerName}.xml`,
      headers: { 'Content-Type': 'application/xml' },
      auth: { username: user, password: password },
      data: xml,
    });
  }

  /**
   * Atualiza o featuretype de uma camada vetorial já publicada, recalculando os
   * bounding boxes a partir da tabela. Diferente de deletar e republicar, o PUT
   * preserva o estilo associado e as configurações do layer.
   */
  async atualizarCamada(
    nomeCamada: string,
    pacoteConceitual: string,
  ): Promise<void> {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    if (!user || !password || !urlGeoserver) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const endpoint = `${urlGeoserver}/rest/workspaces/content/datastores/${pacoteConceitual}/featuretypes/${nomeCamada}?recalculate=nativebbox,latlonbbox`;

    await axios.request({
      method: 'PUT',
      url: endpoint,
      headers: { 'Content-Type': 'application/json' },
      auth: { username: user, password },
      data: {
        featureType: {
          name: nomeCamada,
          nativeName: nomeCamada,
          enabled: true,
        },
      },
      // Recalcular o bbox escaneia a tabela inteira no PostGIS — pode
      // demorar bastante em camadas grandes, mas precisa de um teto para
      // não travar a request indefinidamente se o GeoServer/PostGIS travar.
      timeout: 120000,
    });
  }

  /**
   * Invalida os tiles do GWC para a camada. Necessário porque `publicarCamada`
   * configura tile cache também para camadas vetoriais — sem truncar, o
   * GeoServer continua servindo os tiles antigos após a republicação.
   */
  async truncarCache(nomeCamada: string): Promise<void> {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    if (!user || !password || !urlGeoserver) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    await axios.request({
      method: 'POST',
      url: `${urlGeoserver}/gwc/rest/masstruncate`,
      headers: { 'Content-Type': 'text/xml' },
      auth: { username: user, password },
      data: `<truncateLayer><layerName>content:${nomeCamada}</layerName></truncateLayer>`,
      timeout: 30000,
    });
  }

  /**
   * Remove o coveragestore de um raster, com recurse para levar junto o layer.
   * Tolera 404: se o store não existe, a republicação segue e recria.
   */
  async deleteCoverageStore(nomeFlat: string): Promise<void> {
    const user = await this.configService.getConfig('GEOSERVER_USER');
    const password = await this.configService.getConfig('GEOSERVER_PASSWORD');
    const urlGeoserver = await this.configService.getConfig('GEOSERVER_URL');

    if (!user || !password || !urlGeoserver) {
      throw new Error(
        'Variáveis de ambiente do Geoserver não estão configuradas corretamente.',
      );
    }

    const endpoint = `${urlGeoserver}/rest/workspaces/content/coveragestores/${nomeFlat}_raster?recurse=true&purge=none`;

    try {
      await axios.request({
        method: 'DELETE',
        url: endpoint,
        auth: { username: user, password },
        timeout: 15000,
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return;
      }
      throw error;
    }
  }
}

