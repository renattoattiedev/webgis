import { EventEmitter, Injectable } from '@angular/core';
import { Tema } from 'src/app/models/temas.model';
import { Camadas } from 'src/app/models/camadas.model';
import { Grupos } from 'src/app/models/grupo.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
} from 'rxjs';
import { Geometry, Point, MultiPoint } from 'geojson';
import * as turf from '@turf/turf';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { MatSidenav } from '@angular/material/sidenav';
import { Atributos } from '../../models/atributos.model';
import { GetConfigService } from '../get.config.service';
import {
  CamadaComOrdem,
  CamadaRasterComOrdem,
  Mapas,
} from 'src/app/models/mapas.model';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';
interface RequestBody {
  tipoConteudo: string;
  nomeCamada: string;
  atributos?: string[];
  tipoFiltro?: string;
  criterio?: string;
}
interface CamadaStatus {
  nomeCamada: string;
  status: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class ConteudoService {
  onTableDataChange: EventEmitter<string> = new EventEmitter();

  temas: Tema[] = [];
  grupoCamadas: Grupos[] = [];
  dadosAdicionais: {
    id: string;
    nomeConteudo: string;
    tituloConteudo: string;
    temaId: string;
    temaConteudoNome: string;
    grupoConteudo: string;
    grupoConteudoNome: string;
    linkMetadados: string;
    descricaoConteudo: string;
    pacoteConceitual: string;
    pacoteConceitualNome: string;
    nivelCompartilhamentoId: string;
    nivelCompartilhamento: string;
    tags: string;
    fonteDadosCamada: string;
    fonteDadosCamadaRaster: string;
    termosDeUso: string;
    boundingBox: string;
    criadoEm: string;
    updatedAt: string;
    deletedAt: string;
    conteudoAtivo: boolean;
    favorito: boolean;
    usrCriacao: string;
    visivel: boolean;
    ativo: boolean;
    atributos: any[] | null;
    popup: boolean;
    tableAttribute: boolean;
    perfil: boolean;
    carregamentoDefault: boolean;
    tipoConteudo: string;
    camadas: CamadaComOrdem[];
    camadasRaster: CamadaRasterComOrdem[];
  }[] = [];
  dadosAdicionaisFiltro: {
    id: string;
    nomeConteudo: string;
    tituloConteudo: string;
    temaId: string;
    temaConteudoNome: string;
    grupoConteudo: string;
    grupoConteudoNome: string;
    linkMetadados: string;
    descricaoConteudo: string;
    pacoteConceitual: string;
    pacoteConceitualNome: string;
    nivelCompartilhamentoId: string;
    nivelCompartilhamento: string;
    tags: string;
    fonteDadosCamada: string;
    fonteDadosCamadaRaster: string;
    termosDeUso: string;
    boundingBox: string;
    criadoEm: string;
    updatedAt: string;
    deletedAt: string;
    conteudoAtivo: boolean;
    favorito: boolean;
    usrCriacao: string;
    visivel: boolean;
    ativo: boolean;
    atributos: any[] | null;
    popup: boolean;
    tableAttribute: boolean;
    perfil: boolean;
    carregamentoDefault: boolean;
    tipoConteudo: string;
    camadas: CamadaComOrdem[];
    camadasRaster: CamadaRasterComOrdem[];
  }[] = [];
  public listaDadosTabela = new BehaviorSubject<any[]>([]);

  attributeTableisExpanded = false;
  private atualizarGruposSubject = new Subject<void>();
  atualizarGruposObservable = this.atualizarGruposSubject.asObservable();
  private highlightLayer!: VectorLayer<VectorSource>;
  private expandPerfilPanel = new Subject<Camadas | CamadasRaster | Mapas>();
  expandPanelPerfil$ = this.expandPerfilPanel.asObservable();
  private sidenav!: MatSidenav;
  public perfilPanel = false;
  atualizarCamadas$ = new Subject<void>();
  private camadaRemovidaSource = new Subject<CamadaStatus>();
  camadaRemovida$ = this.camadaRemovidaSource.asObservable();
  private camadasRemovidas: Set<string> = new Set<string>();
  private isLoading = false;
  private tableAttributesUpdatedSource = new Subject<void>();
  tableAttributesUpdated$ = this.tableAttributesUpdatedSource.asObservable();
  private cacheCamadas = new Map<string, any>();
  private carregandoCamadas = new Map<string, boolean>();

  public ativarCamadaContexto$ = new Subject<{
    temaId: string;
    grupoId: string;
    camadaId: string;
  }>();
  public toggleCamadaContexto$ = new Subject<{
    temaId: string;
    grupoId: string;
    camadaId: string;
    ativo: boolean;
  }>();
  public refreshCamadaContexto$ = new Subject<{
    temaId: string;
    grupoId: string;
    camadaId: string;
    hard?: boolean;
    layerId?: string;
    layersParam?: string;
  }>();

  public dwLinhaSelcionada$ = new Subject<string | null>();
  public abasDw: { nome: string; dados: any[]; colunas: string[] }[] = [];

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  ngAfterViewInit(): void {
    console.log('CamadaService ngOnInit');
  }

  public setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  public open() {
    return this.sidenav?.open();
  }

  public close() {
    return this.sidenav?.close();
  }

  public toggle(): void {
    this.sidenav?.toggle();
  }

  adicionarTema(tema: Tema) {
    this.temas.push(tema);
  }

  setEmptyTemas() {
    this.temas = [];
    this.grupoCamadas = [];
    this.dadosAdicionais = [];
    this.dadosAdicionaisFiltro = [];
  }

  adicionarGrupoCamadas(grupo: Grupos) {
    this.grupoCamadas.push(grupo);
  }

  adicionarDadoAdicional(dado: any) {
    this.dadosAdicionais.push(dado);
  }

  adicionarDadoAdicionalFiltro(dado: any) {
    this.dadosAdicionaisFiltro.push(dado);
  }

  getWFSLayerData(
    tipoConteudo: string,
    layerName: string,
    atributos: Atributos[],
    tipoFiltro?: string,
    criterio?: string,
  ): Observable<any> {
    const token = this.cookieService.get('access_token');

    const body: RequestBody = {
      tipoConteudo: tipoConteudo,
      nomeCamada: layerName,
    };

    if (atributos) {
      body['atributos'] = atributos.map((attr) => attr.nomeAtributo);
    }

    if (tipoFiltro) {
      body['tipoFiltro'] = tipoFiltro;
      body['criterio'] = criterio;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const url = this.getConfigService.getUrl('fetch-camadas-dados');

    if (url !== 'undefined') {
      return this.http.post(url, body, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao buscar os dados:', error);
          return of([]);
        }),
      );
    } else {
      console.error('URL inválida');
      return of([]);
    }
  }

  getExtentCamada(pacoteConceitualNome: string, layerName: string): any {
    const parametros = layerName.split(':');
    const token = this.cookieService.get('access_token');
    const url =
      this.getConfigService.getUrl('get-camadas-extent') +
      '/' +
      pacoteConceitualNome +
      '/' +
      parametros[1];

    const headers = {
      Authorization: `Bearer ${token}`,
    };
    return this.http.get(url, { headers }).pipe(
      catchError((error) => {
        console.error('Erro ao buscar os dados:', error);
        return of([]);
      }),
    );
  }

  atualizarGrupos() {
    this.atualizarGruposSubject.next();
  }

  calculateCentroid(geometry: Geometry): number[] {
    switch (geometry.type) {
      case 'Point':
        return (geometry as Point).coordinates;
      case 'MultiPoint':
        return (geometry as MultiPoint).coordinates[0];
      case 'Polygon':
      case 'MultiPolygon':
      case 'LineString':
      case 'MultiLineString':
        return turf.centroid(turf.feature(geometry)).geometry.coordinates;
      default:
        console.warn('Tipo de geometria desconhecido:', geometry.type);
        return [0, 0];
    }
  }

  emitTableDataChange(layer: string) {
    this.onTableDataChange.emit(layer);
  }

  setDadosTabela(dados: any[]) {
    this.listaDadosTabela.next(dados);
  }

  getDadosTabelaObservable() {
    return this.listaDadosTabela.asObservable();
  }

  async carregarTabelaDados(
    layer: string,
    atributos: Atributos[],
    tipoFiltro?: string | null,
    criterio?: string | null,
    vazio = false,
  ) {
    const fetchData = async (camada: any) => {
      try {
        const dados = await this.getWFSLayerData(
          camada.tipoConteudo,
          layer,
          atributos,
          tipoFiltro ?? undefined,
          criterio ?? undefined,
        )
          .pipe(debounceTime(300), distinctUntilChanged())
          .toPromise();

        const layerData = Array.isArray(dados) ? dados[0]?.data : dados;

        if (layerData && layerData.features && layerData.features.length > 0) {
          const camadaData = {
            camadaNome: layer,
            geometry_type: null,
            features: [] as any[],
            dadosVazio: vazio,
          };

          // Determina conjunto de atributos visíveis com base nos metadados
          const visibleSet = (() => {
            if (camada.tipoConteudo === 'camada') {
              return this.getVisibleAttributeNames(layer);
            }
            if (camada.tipoConteudo === 'mapa') {
              // Para mapas, 'layer' refere-se ao nome da subcamada
              return this.getVisibleAttributeNamesForSubLayer(layer);
            }
            return null;
          })();

          layerData.features.forEach((objDados: any) => {
            if (camadaData.geometry_type === null && objDados.geometry) {
              camadaData.geometry_type = objDados.geometry.type;
            }
            if (objDados.properties) {
              const filteredProps: Record<string, any> = {};
              Object.entries(objDados.properties).forEach(([key, value]) => {
                // Se houver metadados de visibilidade, respeitar; caso contrário, incluir tudo
                if (visibleSet && !visibleSet.has(key)) {
                  return;
                }
                filteredProps[key] = value;
              });
              // Sempre incluir geometria como campo especial
              filteredProps['geometry'] = objDados.geometry;
              camadaData.features.push(filteredProps);
            }
          });

          return camadaData;
        } else {
          console.warn('⚠️ Sem features ou dados inválidos');
          return null;
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        return null;
      }
    };

    let listaAtual = this.listaDadosTabela.getValue();
    listaAtual = listaAtual.filter((c) => c.camadaNome !== layer);
    this.listaDadosTabela.next(listaAtual);

    const promises = this.dadosAdicionais.map((camada) => fetchData(camada));
    const results = await Promise.all(promises);
    const validResults = results.filter((result) => result !== null);

    if (validResults.length > 0) {
      listaAtual = this.listaDadosTabela.getValue();
      listaAtual.push(...validResults);
      this.listaDadosTabela.next(listaAtual);
    } else if (vazio) {
      console.log(`Nenhum dado válido encontrado para a camada ${layer}`);
    } else {
      await this.carregarTabelaDados(layer, atributos, null, null, true);
    }
  }

  setHighlightLayer(layer: VectorLayer<VectorSource>) {
    this.highlightLayer = layer;
  }

  getHighlightLayer() {
    return this.highlightLayer;
  }

  getAtributosDeCamadaEspecifica(nomeCamada: string): string[] {
    const atributosSet = new Set<string>();

    const listaDados = this.listaDadosTabela.getValue();

    const camadaEspecifica = listaDados.find(
      (camada) => camada.camadaNome === nomeCamada,
    );

    if (camadaEspecifica) {
      camadaEspecifica.features.forEach((feature: object) => {
        Object.keys(feature).forEach((key) => {
          if (key !== 'geometry') {
            atributosSet.add(key);
          }
        });
      });
    } else {
      console.warn(`Camada ${nomeCamada} não encontrada.`);
    }

    return Array.from(atributosSet);
  }

  getValoresCampos(
    nomeCamada: string,
    campo: string,
    sampleData: boolean,
  ): any[] {
    const valoresSet = new Set<any>();

    const listaDados = this.listaDadosTabela.getValue();

    const camadaEspecifica = listaDados.find(
      (camada) => camada.camadaNome === nomeCamada,
    );

    if (camadaEspecifica) {
      camadaEspecifica.features.forEach((feature: any) => {
        const valor = feature ? feature[campo] : undefined;
        if (valor) {
          valoresSet.add(valor);
        }
      });
    } else {
      console.warn(`Camada ${nomeCamada} não encontrada.`);
    }

    let valoresArray;
    if (sampleData) {
      valoresArray = Array.from(valoresSet).slice(0, 5);
    } else {
      valoresArray = Array.from(valoresSet);
    }
    return valoresArray.sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }
      if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
      }
      return 0;
    });
  }

  toggleExpandPerfilPanel(layerName: string) {
    const conteudo = this.dadosAdicionais.find(
      (c) => c.nomeConteudo === layerName,
    );

    if (!conteudo) return;

    if (conteudo.tipoConteudo === 'camada') {
      const camadasFormatada: Camadas = {
        id: conteudo.id,
        nomeCamada: conteudo.nomeConteudo,
        tituloCamada: conteudo.tituloConteudo,
        temaId: conteudo.temaId,
        temaCamadaNome: conteudo.temaConteudoNome,
        grupoCamada: conteudo.grupoConteudo,
        grupoCamadaNome: conteudo.grupoConteudoNome,
        linkMetadados: conteudo.linkMetadados,
        descricaoCamada: conteudo.descricaoConteudo,
        pacoteConceitual: conteudo.pacoteConceitual,
        pacoteConceitualNome: conteudo.pacoteConceitualNome,
        nivelCompartilhamentoId: conteudo.nivelCompartilhamentoId,
        nivelCompartilhamento: conteudo.nivelCompartilhamento,
        tags: conteudo.tags,
        fonteDadosCamada: conteudo.fonteDadosCamada,
        termosDeUso: conteudo.termosDeUso,
        boundingBox: conteudo.boundingBox,
        criadoEm: conteudo.criadoEm,
        updatedAt: conteudo.updatedAt,
        deletedAt: conteudo.deletedAt,
        camadaAtiva: conteudo.conteudoAtivo,
        favorito: conteudo.favorito,
        usrCriacao: conteudo.usrCriacao,
        visivel: conteudo.visivel,
        atributos: conteudo.atributos,
        tableAttribute: false,
        tipo: 'camada',
        carregamentoDefault: conteudo.carregamentoDefault,
      };
      if (this.perfilPanel) {
        this.perfilPanel = false;
        setTimeout(() => {
          this.perfilPanel = true;
          this.expandPerfilPanel.next(camadasFormatada);
        }, 300);
      } else {
        this.perfilPanel = true;
        this.expandPerfilPanel.next(camadasFormatada);
      }
    } else if (conteudo.tipoConteudo === 'raster') {
      const camadasFormatada: CamadasRaster = {
        id: conteudo.id,
        nomeCamada: conteudo.nomeConteudo,
        fonteDadosCamadaRaster: conteudo.fonteDadosCamadaRaster,
        tituloCamada: conteudo.tituloConteudo,
        linkMetadados: conteudo.linkMetadados,
        descricaoCamada: conteudo.descricaoConteudo,
        boundingBox: conteudo.boundingBox,
        criadoEm: conteudo.criadoEm,
        updatedAt: conteudo.updatedAt,
        usrCriacao: conteudo.usrCriacao,
        visivel: conteudo.visivel,
        tableAttribute: false,
        tipo: 'raster',
        temaId: '',
        temaCamadaNome: '',
        grupoCamada: '',
        grupoCamadaNome: '',
        nivelCompartilhamentoId: '',
        nivelCompartilhamento: '',
        tags: '',
        termosDeUso: '',
        deletedAt: '',
        camadaAtiva: false,
        favorito: false,
        carregamentoDefault: conteudo.carregamentoDefault,
      };
      if (this.perfilPanel) {
        this.perfilPanel = false;
        setTimeout(() => {
          this.perfilPanel = true;
          this.expandPerfilPanel.next(camadasFormatada);
        }, 300);
      } else {
        this.perfilPanel = true;
        this.expandPerfilPanel.next(camadasFormatada);
      }
    } else {
      const mapasFormatados: Mapas = {
        id: conteudo.id,
        nomeMapa: conteudo.nomeConteudo,
        tituloMapa: conteudo.tituloConteudo,
        descricaoMapa: conteudo.descricaoConteudo,
        boundingBoxMapa: conteudo.boundingBox,
        nivelCompartilhamento: conteudo.nivelCompartilhamento,
        nivelCompartilhamentoMapa: conteudo.nivelCompartilhamento,
        grupoMapa: conteudo.grupoConteudo,
        grupoMapaNome: conteudo.grupoConteudoNome,
        camadas: conteudo.camadas,
        camadasRaster: conteudo.camadasRaster,
        temaId: conteudo.temaId,
        temaMapaNome: conteudo.temaConteudoNome,
        favorito: conteudo.favorito,
        criadoEm: new Date(conteudo.criadoEm),
        updatedAt: new Date(conteudo.updatedAt),
        usrCriacao: conteudo.usrCriacao,
        visivel: conteudo.visivel,
        mapaAtivo: conteudo.conteudoAtivo,
        carregamentoDefault: conteudo.carregamentoDefault,
      };
      if (this.perfilPanel) {
        this.perfilPanel = false;
        setTimeout(() => {
          this.perfilPanel = true;
          this.expandPerfilPanel.next(mapasFormatados);
        }, 300);
      } else {
        this.perfilPanel = true;
        this.expandPerfilPanel.next(mapasFormatados);
      }
    }
  }

  closeExpandPerfilPanel() {
    this.perfilPanel = false;
  }

  translateAttributeNameToLabel(
    layerName: string,
    attributeName: string,
  ): string {
    const camadaEspecifica = this.dadosAdicionais.find(
      (camada) => camada.nomeConteudo === layerName,
    );
    if (camadaEspecifica && camadaEspecifica.atributos) {
      const atributoEspecifico = camadaEspecifica.atributos.find(
        (atributo) => atributo.nomeAtributo === attributeName,
      );
      return atributoEspecifico && atributoEspecifico.label
        ? atributoEspecifico.label
        : attributeName;
    }

    return attributeName;
  }

  /**
   * Retorna um conjunto com os nomes dos atributos visíveis para uma camada específica.
   * Caso a camada não seja encontrada ou não possua metadados de atributos,
   * retorna null para sinalizar que não há filtro de visibilidade a aplicar.
   */
  getVisibleAttributeNames(layerName: string): Set<string> | null {
    const camadaEspecifica = this.dadosAdicionais.find(
      (camada) => camada.nomeConteudo === layerName,
    );

    if (!camadaEspecifica || !Array.isArray(camadaEspecifica.atributos)) {
      return null;
    }

    const visiveis = camadaEspecifica.atributos
      .filter((atributo: any) => atributo && atributo.visivel === true)
      .map((atributo: any) => atributo.nomeAtributo)
      .filter((nome: string) => !!nome);

    return new Set(visiveis);
  }

  /**
   * Para camadas dentro de mapas (subcamadas), retorna os nomes visíveis.
   * Procura em `dadosAdicionaisFiltro` e também em `dadosAdicionais` se necessário.
   */
  getVisibleAttributeNamesForSubLayer(
    subLayerName: string,
  ): Set<string> | null {
    // Procura primeiro em dadosAdicionaisFiltro (onde mapas são frequentemente manipulados)
    for (const conteudo of this.dadosAdicionaisFiltro) {
      if (conteudo.tipoConteudo === 'mapa' && Array.isArray(conteudo.camadas)) {
        const sub = conteudo.camadas.find(
          (c: any) => c?.nomeCamada === subLayerName,
        );
        if (sub && Array.isArray(sub.atributos)) {
          const visiveis = sub.atributos
            .filter((atributo: any) => atributo && atributo.visivel === true)
            .map((atributo: any) => atributo.nomeAtributo)
            .filter((nome: string) => !!nome);
          return new Set(visiveis);
        }
      }
    }

    // Fallback: alguns fluxos podem armazenar mapas em dadosAdicionais também
    for (const conteudo of this.dadosAdicionais) {
      if (conteudo.tipoConteudo === 'mapa' && Array.isArray(conteudo.camadas)) {
        const sub = conteudo.camadas.find(
          (c: any) => c?.nomeCamada === subLayerName,
        );
        if (sub && Array.isArray(sub.atributos)) {
          const visiveis = sub.atributos
            .filter((atributo: any) => atributo && atributo.visivel === true)
            .map((atributo: any) => atributo.nomeAtributo)
            .filter((nome: string) => !!nome);
          return new Set(visiveis);
        }
      }
    }

    return null;
  }

  adicionarConteudoAoArray(nomeConteudo: string) {
    if (
      !this.dadosAdicionais.some(
        (conteudo) => conteudo.nomeConteudo === nomeConteudo,
      )
    ) {
      const camadaEncontrada = this.grupoCamadas
        .flatMap((grupo) => grupo.camadas)
        .find((camada) => `content:${camada.nomeCamada}` === nomeConteudo);

      const mapaEncontrado = this.grupoCamadas
        .flatMap((grupo) => grupo.mapas)
        .find((mapa) => `content:${mapa.nomeMapa}` === nomeConteudo);

      if (camadaEncontrada) {
        this.dadosAdicionais.push({
          id: camadaEncontrada.id,
          nomeConteudo: `content:${camadaEncontrada.nomeCamada}`,
          tituloConteudo: camadaEncontrada.tituloCamada,
          temaId: '',
          temaConteudoNome: '',
          grupoConteudo: '',
          grupoConteudoNome: '',
          linkMetadados: '',
          descricaoConteudo: '',
          pacoteConceitual: '',
          pacoteConceitualNome: '',
          nivelCompartilhamentoId: '',
          nivelCompartilhamento: '',
          tags: '',
          fonteDadosCamada: '',
          fonteDadosCamadaRaster: '',
          termosDeUso: '',
          boundingBox: '',
          criadoEm: '',
          updatedAt: '',
          deletedAt: '',
          conteudoAtivo: false,
          favorito: false,
          usrCriacao: '',
          visivel: false,
          ativo: false,
          atributos: [],
          popup: false,
          tableAttribute: false,
          perfil: false,
          carregamentoDefault: false,
          tipoConteudo: 'camada',
          camadas: [],
          camadasRaster: [],
        });
      } else if (mapaEncontrado) {
        this.dadosAdicionais.push({
          id: mapaEncontrado.id,
          nomeConteudo: `content:${mapaEncontrado.nomeMapa}`,
          tituloConteudo: mapaEncontrado.tituloMapa,
          temaId: '',
          temaConteudoNome: '',
          grupoConteudo: '',
          grupoConteudoNome: '',
          linkMetadados: '',
          descricaoConteudo: '',
          pacoteConceitual: '',
          pacoteConceitualNome: '',
          nivelCompartilhamentoId: '',
          nivelCompartilhamento: '',
          tags: '',
          fonteDadosCamada: '',
          fonteDadosCamadaRaster: '',
          termosDeUso: '',
          boundingBox: '',
          criadoEm: '',
          updatedAt: '',
          deletedAt: '',
          conteudoAtivo: false,
          favorito: false,
          usrCriacao: '',
          visivel: false,
          ativo: false,
          atributos: [],
          popup: false,
          tableAttribute: false,
          perfil: false,
          carregamentoDefault: false,
          tipoConteudo: 'mapa',
          camadas: [],
          camadasRaster: [],
        });
      }
    }
  }

  emitirAtualizacao() {
    this.atualizarCamadas$.next();
  }

  notificarCamadaRemovida(nomeCamada: string, status: boolean) {
    this.camadaRemovidaSource.next({ nomeCamada, status });

    if (!status) {
      this.camadasRemovidas.add(nomeCamada);
    } else {
      this.camadasRemovidas.delete(nomeCamada);
    }
  }

  isCamadaRemovida(nomeCamada: string): boolean {
    return this.camadasRemovidas.has(nomeCamada);
  }
  emitTableAttributesUpdated() {
    this.tableAttributesUpdatedSource.next();
  }

  clearCache() {
    this.cacheCamadas.clear();
  }

  public ativarCamadaPorId(camadaId: string): void {
    // Procura a camada em todos os grupos
    for (const grupo of this.grupoCamadas) {
      const camada = grupo.camadas.find((c) => c.id === camadaId);
      if (camada) {
        console.log(`Ativando camada: ${camada}`);
        camada.visivel = true;
        // Se você já tem um método para ativar a camada no mapa, chame aqui
        // Exemplo: this.toggleCamada(grupo.id, camada.id, true);
        this.emitirAtualizacao(); // Notifica outros componentes se necessário
        break;
      }
    }
  }

  public emitirAtivacaoCamadaComContexto(
    temaid: string,
    grupoid: string,
    camadaid: string,
  ): void {
    this.ativarCamadaContexto$.next({
      temaId: temaid,
      grupoId: grupoid,
      camadaId: camadaid,
    });
  }

  public emitirToggleCamadaComContexto(
    temaid: string,
    grupoid: string,
    camadaid: string,
    ativo: boolean,
  ): void {
    this.toggleCamadaContexto$.next({
      temaId: temaid,
      grupoId: grupoid,
      camadaId: camadaid,
      ativo,
    });
  }

  public emitirRefreshCamadaComContexto(
    temaid: string,
    grupoid: string,
    camadaid: string,
    hard = false,
    layerId?: string,
    layersParam?: string,
  ): void {
    this.refreshCamadaContexto$.next({
      temaId: temaid,
      grupoId: grupoid,
      camadaId: camadaid,
      hard,
      layerId,
      layersParam,
    });
  }

  public adicionarAbaDw(nome: string, dados: any[], colunas: string[]): void {
    const idx = this.abasDw.findIndex((a) => a.nome === nome);
    if (idx >= 0) {
      this.abasDw[idx] = { nome, dados, colunas };
    } else {
      this.abasDw.push({ nome, dados, colunas });
    }
    this.onTableDataChange.emit(nome);
  }

  public removerAbaDw(nome: string): void {
    this.abasDw = this.abasDw.filter((a) => a.nome !== nome);
  }
}
