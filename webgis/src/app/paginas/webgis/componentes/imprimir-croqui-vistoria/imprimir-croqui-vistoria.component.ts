import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  Optional,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  VistoriaService,
  RegistroVistoria,
  EstatisticasConsulta,
} from '../../../../services/vistoria.service';
import { SicatCidade } from 'src/app/models/sicat-cidades.model';
import { SicatBairro } from 'src/app/models/sicat-bairro.model';
import { SicatLogradouro } from 'src/app/models/sicat-logradouro.model';
import { FetchSicatCidadesService } from 'src/app/services/api/fetch-sicat-cidades.service';
import { FetchSicatBairrosService } from 'src/app/services/api/fetch-sicat-bairros.service';
import { FetchSicatLogradourosService } from 'src/app/services/api/fetch-sicat-logradouros.service';
import { FetchCroquiEnderecoFiltrosService } from 'src/app/services/api/fetch-croqui-endereco-filtros.service';
import { FetchSicatImovelByHidrometroService } from 'src/app/services/api/fetch-sicat-imovel-by-hidrometro.service';
import { FetchSicatImovelService } from 'src/app/services/api/fetch-sicat-imovel.service';
import { FetchSolicitacaoServicosDetalhadaService } from 'src/app/services/api/fetch-solicitacao-servicos-detalhada.service';
import { FetchSolicitacaoServicosSequenciasService } from 'src/app/services/api/feth-solicitacao-servicos-sequencias.service';
import { CroquiEndereco } from 'src/app/models/croqui-endereco.model';
import { SicatImovelHidrometroDetalhado } from 'src/app/models/sicat-imovel-hidrometro.model';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime } from 'rxjs';
import { GetComponenteNomeService } from 'src/app/services/api/get-componente-nome.service';
import { Componente } from 'src/app/models/componente.model';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { MapaService } from 'src/app/services/mapa.service';
import { Atributos } from 'src/app/models/atributos.model';
import Geometry from 'ol/geom/Geometry';
import Overlay from 'ol/Overlay';
import { WindowBehavior } from 'src/app/shared/window/window-behavior';
import { DomSanitizer } from '@angular/platform-browser';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import BaseLayer from 'ol/layer/Base';
import XYZ from 'ol/source/XYZ';
import { ImovelDetalhado } from 'src/app/models/sicat-imovel.model';
import { EnderecosSelecaoDialogComponent } from './enderecos-selecao-dialog/enderecos-selecao-dialog.component';
import {
  ConfigImprimirCroquiVistoriaDialogComponent,
  CroquiVistoriaConfig,
} from './config-imprimir-croqui-vistoria-dialog/config-imprimir-croqui-vistoria-dialog.component';

interface RegistroConsulta {
  id: string;
  tipo: 'SS' | 'Matricula' | 'Hidrometro';
  codigo: string;
  nome: string;
  dadosCompletos: RegistroVistoria;
  selecionado?: boolean;
  cd_atendimento?: string;
  seq_ss?: string;
  imprimirDadosSS?: boolean;
}

type RegistroSelecionado = CroquiEndereco | RegistroConsulta;

@Component({
  selector: 'app-imprimir-croqui-vistoria',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
      useValue: {
        color: '#4DA9E7',
      },
    },
  ],
  templateUrl: './imprimir-croqui-vistoria.component.html',
  styleUrl: './imprimir-croqui-vistoria.component.scss',
})
export class ImprimirCroquiVistoriaComponent
  extends WindowBehavior
  implements OnInit, OnDestroy, AfterViewInit
{
  componenteImprimirCroqui: Componente | null = null;

  markers = new Map();
  markerState = new Map();
  markerLayerAssociations: { [key: string]: string } = {};

  private readonly capturaConfig = {
    // 300 dpi é suficiente para A4 com boa nitidez e reduz o volume de tiles requisitados
    targetDpi: 300,
    exibicaoScale: 0.55,
    maxPixelRatio: 1.5,
  };

  bairros: SicatBairro[] = [];
  bairroSelecionado: SicatBairro | null = null;
  bairroInput: string = '';
  bairrosFiltrados: SicatBairro[] = [];
  bairroControl = new FormControl();

  logradouros: SicatLogradouro[] = [];
  logradouroSelecionado: SicatLogradouro | null = null;
  logradouroInput: string = '';
  logradourosFiltrados: SicatLogradouro[] = [];

  cidades: SicatCidade[] = [];
  cidadeControl = new FormControl();
  cidadesFiltradas: SicatCidade[] = [];
  cidadesSelecionadas: SicatCidade[] = [];
  cidadeInput: string = '';
  carregandoCidades = false;

  tipoConsulta: 'SS' | 'Matricula' | 'Hidrometro' = 'SS';
  codigoDigitado: string = '';
  seq_ss: string = '';
  sequenciasDisponiveis: number[] = [];
  carregandoSequencias: boolean = false;

  estatisticas: EstatisticasConsulta = {
    totalLidos: 0,
    totalImportados: 0,
    totalNaoImportados: 0,
  };

  @Output() fechado = new EventEmitter<void>();

  selectedTabIndex = 0;

  loading = false;
  buscandoDados = false;
  buscandoLocalizacao = false;
  posicionandoMapa = false;
  mapaPosicionado = false;

  localidade: string = 'VILA VELHA';
  logradouro: string = '';
  bairro: string = '';
  manterSelecao = false;

  registrosEncontrados: CroquiEndereco[] = [];
  paginaAtual: number = 0;
  tamanhoPagina: number = 3;
  registrosSelecionados: RegistroSelecionado[] = [];

  displayedColumns: string[] = [
    'select',
    'matricula',
    'hd',
    'nome',
    'numero',
    'bairro',
  ];

  get displayedColumnsWithMap(): string[] {
    return ['select', 'matricula', 'hd', 'nome', 'numero', 'bairro'];
  }

  @ViewChild('popup', { static: false }) popupRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cidadeInputRef', { static: false })
  cidadeInputRef!: ElementRef<HTMLInputElement>;
  popupOverlay: Overlay | null = null;
  popupData: {
    matricula: string;
    hd: string;
    nome: string;
    numero: string;
    bairro: string;
  } | null = null;
  private mapClickHandlerRegistered = false;

  private readonly markerIconHeight = 41;
  private readonly popupArrowSize = 12;
  private readonly popupGapAbove = 4;

  private markerOverlays: { [key: string]: Overlay } = {};
  private tooltips: { [key: string]: Overlay } = {};
  // Seleção e ativação de camadas auxiliares
  auxCamadasAplicadasIds: Set<string> = new Set<string>();
  croquiConfig: CroquiVistoriaConfig = {
    imprimirLegenda: true,
    auxSelecionadasIds: [],
  };

  get totalPaginas(): number {
    return Math.ceil(this.registrosEncontrados.length / this.tamanhoPagina);
  }

  get registrosPaginados(): CroquiEndereco[] {
    const inicio = this.paginaAtual * this.tamanhoPagina;
    return this.registrosEncontrados.slice(inicio, inicio + this.tamanhoPagina);
  }

  abrirSelecaoEnderecos(): void {
    const preSelecionados = this.registrosSelecionados.filter((r) =>
      this.isCroquiEndereco(r),
    ) as CroquiEndereco[];
    const ref = this.dialog.open(EnderecosSelecaoDialogComponent, {
      width: '560px',
      data: { registros: this.registrosEncontrados, preSelecionados },
    });
    ref
      .afterClosed()
      .subscribe((selecionados: CroquiEndereco[] | undefined) => {
        if (!selecionados || selecionados.length === 0) return;
        const novos = selecionados.filter(
          (s) =>
            !this.registrosSelecionados.some(
              (r) => this.getMatricula(r) === String(s.matriculaImovel ?? ''),
            ),
        );
        if (this.manterSelecao) {
          this.registrosSelecionados = [
            ...this.registrosSelecionados,
            ...novos,
          ];
        } else {
          const existentesConsulta = this.registrosSelecionados.filter((r) =>
            this.isRegistroConsulta(r),
          );
          this.registrosSelecionados = [...existentesConsulta, ...selecionados];
        }
        this.cdr.detectChanges();
      });
  }

  constructor(
    private vistoriaService: VistoriaService,
    private snackBar: MatSnackBar,
    cdr: ChangeDetectorRef,
    private cidadesService: FetchSicatCidadesService,
    private bairrosService: FetchSicatBairrosService,
    private logradourosService: FetchSicatLogradourosService,
    private croquiEnderecoFiltrosService: FetchCroquiEnderecoFiltrosService,
    private sicatHidrometroService: FetchSicatImovelByHidrometroService,
    private sicatImovelService: FetchSicatImovelService,
    private solicitacaoServicosService: FetchSolicitacaoServicosDetalhadaService,
    private ssSequenciasService: FetchSolicitacaoServicosSequenciasService,
    private getComponenteNomeService: GetComponenteNomeService,
    private conteudoService: ConteudoService,
    public mapaService: MapaService,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
    @Optional()
    private dialogRef: MatDialogRef<ImprimirCroquiVistoriaComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    super(cdr);
    this.defaultSize = { width: 800, height: 650 };
    this.minimizedSize = { width: 360, height: 42 };
  }

  // Helpers para estrutura de configuração (camada alvo geral + camada alvo SS)
  private isSsContext(): boolean {
    return this.tipoConsulta === 'SS';
  }

  private getTargetConfig(useSsTarget: boolean = this.isSsContext()): any {
    const cfg = this.componenteImprimirCroqui?.configuracao || {};
    if (useSsTarget && cfg?.camada_alvo_ss) return cfg.camada_alvo_ss;
    if (cfg?.camada_alvo) return cfg.camada_alvo;
    // Fallback antigo
    return {
      tema: cfg.tema,
      grupo: cfg.grupo,
      camada: cfg.camada,
      camadaNome: cfg.camadaNome,
      campoChave: cfg.campoChave,
    };
  }

  private getTargetCampoChave(
    useSsTarget: boolean = this.isSsContext(),
  ): string | null {
    const alvo = this.getTargetConfig(useSsTarget);
    return alvo?.campoChave ?? null;
  }

  private getValorByCampo(obj: any, campoChave: string): any {
    if (!obj || !campoChave) return undefined;

    if (obj[campoChave] !== undefined && obj[campoChave] !== null) {
      return obj[campoChave];
    }

    const campoLower = campoChave.toLowerCase();
    const keyEncontrada = Object.keys(obj).find(
      (k) => k.toLowerCase() === campoLower,
    );
    if (!keyEncontrada) return undefined;

    return obj[keyEncontrada];
  }

  private getRegistroValorParaCampoChave(
    registro: RegistroSelecionado,
    campoChave: string,
  ): string {
    if (!campoChave) return '';

    const valorDiretoRegistro = this.getValorByCampo(
      registro as any,
      campoChave,
    );
    if (
      valorDiretoRegistro !== undefined &&
      valorDiretoRegistro !== null &&
      String(valorDiretoRegistro).trim() !== ''
    ) {
      return String(valorDiretoRegistro).trim();
    }

    if (this.isRegistroConsulta(registro)) {
      const dados = registro.dadosCompletos as any;
      const valorDiretoDados = this.getValorByCampo(dados, campoChave);
      if (
        valorDiretoDados !== undefined &&
        valorDiretoDados !== null &&
        String(valorDiretoDados).trim() !== ''
      ) {
        return String(valorDiretoDados).trim();
      }

      const chave = campoChave.toLowerCase();
      if (registro.tipo === 'SS') {
        if (['num_ss', 'ss', 'ref_atendimento'].includes(chave)) {
          return String(registro.codigo || dados?.ref_atendimento || '').trim();
        }
        if (chave === 'cd_atendimento') {
          return String(
            registro.cd_atendimento || dados?.cd_atendimento || '',
          ).trim();
        }
        if (chave === 'seq_ss') {
          return String(registro.seq_ss || dados?.seq_ss || '').trim();
        }
      }
    }

    if (this.isCroquiEndereco(registro)) {
      if (campoChave.toLowerCase() === 'matricula') {
        return String(registro.matriculaImovel ?? '').trim();
      }
    }

    if (
      this.isRegistroConsulta(registro) &&
      campoChave.toLowerCase() === 'matricula'
    ) {
      return String(registro.dadosCompletos?.matricula ?? '').trim();
    }

    return '';
  }

  private getTargetTemaId(
    useSsTarget: boolean = this.isSsContext(),
  ): string | null {
    const alvo = this.getTargetConfig(useSsTarget);
    return alvo?.tema ?? null;
  }

  private getTargetGrupoId(
    useSsTarget: boolean = this.isSsContext(),
  ): string | null {
    const alvo = this.getTargetConfig(useSsTarget);
    return alvo?.grupo ?? null;
  }

  private getTargetCamadaId(
    useSsTarget: boolean = this.isSsContext(),
  ): string | null {
    const alvo = this.getTargetConfig(useSsTarget);
    return alvo?.camada ?? null;
  }

  private getTargetCamadaNome(
    useSsTarget: boolean = this.isSsContext(),
  ): string | null {
    const alvo = this.getTargetConfig(useSsTarget);
    return alvo?.camadaNome ?? null;
  }

  private shouldUseSsTargetForSelectedRecords(): boolean {
    const selecionados = this.getRegistrosSelecionadosParaMapa();
    if (!selecionados.length) {
      return this.isSsContext();
    }

    return selecionados.every(
      (r) => this.isRegistroConsulta(r) && r.tipo === 'SS',
    );
  }

  private getTemplate(id: 'croqui' | 'ss'): string {
    const cfg = this.componenteImprimirCroqui?.configuracao || {};
    // Novo formato: templates[] com ids 'croqui' e 'ss'
    if (Array.isArray(cfg.templates)) {
      const t = cfg.templates.find((p: any) => p.id === id);
      if (t?.template) return t.template;
    }
    // Compatibilidade com formato antigo: pages[] ('croqui' e 'formulario')
    if (Array.isArray(cfg.pages)) {
      const legacyId = id === 'ss' ? 'formulario' : 'croqui';
      const p = cfg.pages.find((pp: any) => pp.id === legacyId);
      if (p?.template) return p.template;
    }
    // Fallback muito antigo: cfg.html para croqui
    if (id === 'croqui') return cfg.html || '';
    return '';
  }

  private getTemplateForRegistro(registro: RegistroSelecionado): string {
    // Se for registro de consulta do tipo SS e houver template SS, usa-o; caso contrário, usa croqui
    if (this.isRegistroConsulta(registro) && registro.tipo === 'SS') {
      const ss = this.getTemplate('ss');
      if (ss && ss.trim()) return ss;
    }
    return this.getTemplate('croqui');
  }

  // Aux layer helpers
  getAuxCamadasList(): Array<{
    tema: string | null;
    grupo: string | null;
    camada: string | null;
    camadaNome?: string | null;
  }> {
    const cfg = this.componenteImprimirCroqui?.configuracao || {};
    const arr = Array.isArray(cfg.camadas) ? cfg.camadas : [];
    return arr.filter((c: any) => c && (c.camada || c.camadaNome));
  }

  isAuxAplicada(camadaId: string | null): boolean {
    if (!camadaId) return false;
    return this.auxCamadasAplicadasIds.has(camadaId);
  }

  aplicarCamadaAux(aux: {
    tema: string | null;
    grupo: string | null;
    camada: string | null;
  }): void {
    if (!aux?.tema || !aux?.grupo || !aux?.camada) {
      this.mostrarMensagem('Camada auxiliar inválida para ativação', 'error');
      return;
    }
    this.conteudoService.emitirAtivacaoCamadaComContexto(
      aux.tema,
      aux.grupo,
      aux.camada,
    );
    this.auxCamadasAplicadasIds.add(aux.camada);
    this.mostrarMensagem('Camada auxiliar ativada no mapa', 'success');
  }

  aplicarAuxiliaresSelecionadasNoMapa(): void {
    const auxList = this.getAuxCamadasList();
    auxList.forEach((aux) => {
      if (this.isAuxAplicada(aux.camada || null)) {
        this.aplicarCamadaAux(aux as any);
      }
    });
  }

  abrirConfigCroqui(): void {
    const selecionadasAtuais = this.getAuxCamadasAtivasIdsFromConteudo();
    const registrosSelecionados = this.getRegistrosSelecionadosParaMapa();
    const registroSelecionado = registrosSelecionados.length
      ? registrosSelecionados[0]
      : null;
    const mostrarCamposSS = !!(
      registroSelecionado &&
      this.isRegistroConsulta(registroSelecionado) &&
      registroSelecionado.tipo === 'SS'
    );
    const ref = this.dialog.open(ConfigImprimirCroquiVistoriaDialogComponent, {
      width: '440px',
      data: {
        componente: this.componenteImprimirCroqui,
        selecionadas: selecionadasAtuais,
        config: this.croquiConfig,
        mostrarCamposSS,
      },
    });
    ref.afterClosed().subscribe((result: CroquiVistoriaConfig | undefined) => {
      if (!result) return;
      this.croquiConfig = result;
      this.auxCamadasAplicadasIds = new Set(result.auxSelecionadasIds || []);
      this.aplicarAuxiliaresSelecionadasNoMapa();
      this.mostrarMensagem('Configurações aplicadas', 'success');
    });
  }

  private getAuxCamadasAtivasIdsFromConteudo(): string[] {
    const idsAtivos: string[] = [];
    const cfg = this.componenteImprimirCroqui?.configuracao;
    if (!cfg || !Array.isArray(cfg.camadas))
      return Array.from(this.auxCamadasAplicadasIds);

    for (const aux of cfg.camadas) {
      const camadaId = aux?.camada;
      if (!camadaId) continue;
      const grupoId = aux?.grupo;
      const temaId = aux?.tema;
      const grupo = this.conteudoService.grupoCamadas.find(
        (g) => g.id === grupoId,
      );
      const camada = grupo?.camadas?.find((c) => c.id === camadaId);
      const ativoPorEstado = !!camada?.visivel;

      let ativoPorMapa = false;
      try {
        const mapa = this.mapaService.getMapa();
        const nomeCamada = camada?.nomeCamada || aux?.camadaNome;
        if (mapa && nomeCamada) {
          const layerId = `content:${nomeCamada}`;
          const layers = mapa.getLayers().getArray();
          ativoPorMapa = layers.some(
            (l) =>
              typeof (l as any).get === 'function' &&
              (l as any).get('id') === layerId,
          );
        }
      } catch {}

      if (ativoPorEstado || ativoPorMapa) {
        idsAtivos.push(camadaId);
      }
    }

    return idsAtivos.length
      ? idsAtivos
      : Array.from(this.auxCamadasAplicadasIds);
  }

  ngOnInit(): void {
    this.buscandoDados = false;
    this.buscandoLocalizacao = false;

    if (this.data) {
      this.localidade = this.data.localidade || this.localidade;
      this.selectedTabIndex = this.data.tabIndex || 0;
    }

    this.centerWindow();
    this.configurarAutocomplete();
    this.configurarAutocompleteBairro();
    this._carregarCidades();

    this.getComponenteNomeService
      .getComponenteByNome('imprimir-croqui')
      .subscribe({
        next: (componente) => {
          this.componenteImprimirCroqui = componente;
        },
        error: (err) => {
          console.error('Erro ao buscar componente imprimir-croqui:', err);
        },
      });
  }

  ngAfterViewInit(): void {
    this.ensurePopupOverlay();
    this.registerMapClickHandler();
    this.positionTopRight();
    this.initWindowBehaviorLifecycle?.();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.removeAllMarkers();
    if (this.popupOverlay) {
      const map = this.mapaService.getMapa();
      map?.removeOverlay(this.popupOverlay);
      this.popupOverlay = null;
    }
  }

  private ensurePopupOverlay(): void {
    const map = this.mapaService.getMapa();
    const el = this.popupRef?.nativeElement;
    if (!map || !el) return;

    const offsetY =
      -1 * (this.popupArrowSize + this.markerIconHeight - this.popupGapAbove);

    if (!this.popupOverlay) {
      this.popupOverlay = new Overlay({
        element: el,
        autoPan: { animation: { duration: 250 } },
        positioning: 'bottom-center',
        offset: [0, offsetY],
        stopEvent: true,
      });
      map.addOverlay(this.popupOverlay);
    } else {
      try {
        (this.popupOverlay as any).setOffset([0, offsetY]);
      } catch {}
    }
  }

  private registerMapClickHandler(): void {
    const map = this.mapaService.getMapa();
    if (!map || this.mapClickHandlerRegistered) return;
    this.mapClickHandlerRegistered = true;

    map.on('singleclick', (evt) => {
      const feature = map.forEachFeatureAtPixel(
        evt.pixel,
        (f: any) => f,
      ) as Feature<Geometry> | null;
      if (!feature) {
        this.closePopup();
        return;
      }
      const geom = feature.getGeometry();
      const data = feature.get('popupData') as
        | { matricula?: any; hd?: any; nome?: any; numero?: any; bairro?: any }
        | undefined;
      if (!geom || !data) {
        this.closePopup();
        return;
      }

      this.popupData = {
        matricula: String(data.matricula ?? ''),
        hd: String(data.hd ?? ''),
        nome: String(data.nome ?? ''),
        numero: String(data.numero ?? ''),
        bairro: String(data.bairro ?? ''),
      };

      this.popupOverlay?.setPosition((geom as any).getCoordinates());
      this.cdr.detectChanges();
    });
  }

  closePopup(): void {
    this.popupData = null;
    this.popupOverlay?.setPosition(undefined);
    this.cdr.detectChanges();
  }

  private findRegistroInfoByKey(keyValue: string | number, campoChave: string) {
    const chave = String(keyValue);
    const reg = this.registrosSelecionados.find((r) => {
      const valorCampo = this.getRegistroValorParaCampoChave(r, campoChave);
      return valorCampo && String(valorCampo) === chave;
    });

    if (reg && this.isCroquiEndereco(reg)) {
      return {
        matricula: String(reg.matriculaImovel ?? ''),
        hd: String(reg.dv ?? ''),
        nome: reg.nomeClienteInterno ?? '',
        numero: reg.numeroEndereco ?? '',
        bairro: reg.bairro ?? '',
        ss: '',
        seq_ss: '',
      };
    }

    if (reg && this.isRegistroConsulta(reg)) {
      const d = reg.dadosCompletos as any;
      return {
        matricula: String(d?.matricula ?? reg.codigo ?? ''),
        hd: String(d?.dv ?? ''),
        nome: d?.nome ?? '',
        numero: d?.numeroEndereco ?? d?.numero ?? '',
        bairro: d?.bairro ?? '',
        ss: reg.tipo === 'SS' ? String(reg.codigo ?? '') : '',
        seq_ss: reg.tipo === 'SS' ? String(reg.seq_ss ?? '') : '',
      };
    }

    return {
      matricula: chave,
      hd: '',
      nome: '',
      numero: '',
      bairro: '',
      ss: '',
      seq_ss: '',
    };
  }

  addRemoveMarkerToGeometry(featureOrGeojson: any, isSs: boolean = false) {
    try {
      const geometry = featureOrGeojson?.geometry ?? featureOrGeojson;
      const coordinates = this.conteudoService.calculateCentroid(geometry) as [
        number,
        number,
      ];
      const coordKey = coordinates.join(',');
      const map = this.mapaService.getMapa();
      if (!map) return;

      if (this.markerOverlays[coordKey]) {
        try {
          map.removeOverlay(this.markerOverlays[coordKey]);
        } catch {}
        delete this.markerOverlays[coordKey];
      }
      if (this.tooltips[coordKey]) {
        try {
          map.removeOverlay(this.tooltips[coordKey]);
        } catch {}
        delete this.tooltips[coordKey];
      }

      const useSsTarget = this.shouldUseSsTargetForSelectedRecords();
      const campoChave = (
        this.getTargetCampoChave(useSsTarget) || 'matricula'
      ).trim();
      const keyValue =
        featureOrGeojson?.properties?.[campoChave] ??
        featureOrGeojson?.properties?.matricula ??
        '';
      const info = this.findRegistroInfoByKey(keyValue, campoChave);

      const ssLabel =
        info.ss && info.seq_ss ? `${info.ss} / ${info.seq_ss}` : info.ss || '';

      const wrapperElement = document.createElement('div');
      wrapperElement.className = 'croqui-marker-wrapper';

      const pinEl = document.createElement('div');
      pinEl.className = 'croqui-pin';
      pinEl.innerHTML =
        '<img src="https://unpkg.com/leaflet@1.3.4/dist/images/marker-icon.png" style="border:0;" />';
      wrapperElement.appendChild(pinEl);

      if (isSs && ssLabel) {
        const ssEl = document.createElement('div');
        ssEl.className = 'croqui-callout croqui-callout--ss';
        ssEl.innerHTML = `<span class="croqui-callout__label">Nº SS</span><span class="croqui-callout__value">${ssLabel}</span>`;
        wrapperElement.appendChild(ssEl);
      }

      const matEl = document.createElement('div');
      matEl.className = 'croqui-callout croqui-callout--mat';
      matEl.innerHTML = `<span class="croqui-callout__label">Matrícula</span><span class="croqui-callout__value">${info.matricula || '-'}</span>`;
      wrapperElement.appendChild(matEl);

      const hdEl = document.createElement('div');
      hdEl.className = 'croqui-callout croqui-callout--hd';
      hdEl.innerHTML = `<span class="croqui-callout__label">Hidrômetro</span><span class="croqui-callout__value">${info.hd || '-'}</span>`;
      wrapperElement.appendChild(hdEl);

      const marker = new Overlay({
        position: coordinates,
        positioning: 'center-center',
        element: wrapperElement,
        stopEvent: false,
      });
      map.addOverlay(marker);
      this.markerOverlays[coordKey] = marker;

      const tooltipElement = document.createElement('div');
      tooltipElement.className = 'tooltip';
      tooltipElement.style.display = 'none';
      tooltipElement.innerHTML = `
        <div class="header-bar">
          <button class="close-tooltip"><i class="fa fa-times"></i></button>
        </div>
        <div class="content-tooltip">
          <p><b>Matrícula:</b> ${info.matricula || '-'}</p>
          <p><b>HD:</b> ${info.hd || '-'}</p>
          <p><b>Nome:</b> ${info.nome || '-'}</p>
          <p><b>Nº:</b> ${info.numero || '-'}</p>
          <p><b>Bairro:</b> ${info.bairro || '-'}</p>
          <button class="imprimir-croqui-btn mat-raised-button">Imprimir Croqui</button>
        </div>`;

      tooltipElement
        .querySelector('.close-tooltip')
        ?.addEventListener('click', () => {
          tooltipElement.style.display = 'none';
        });
      tooltipElement
        .querySelector('.imprimir-croqui-btn')
        ?.addEventListener('click', () => {
          this.imprimirCroqui();
        });

      const tooltip = new Overlay({
        element: tooltipElement,
        offset: [0, -50],
        positioning: 'bottom-center',
        stopEvent: true,
      });
      map.addOverlay(tooltip);
      this.tooltips[coordKey] = tooltip;

      pinEl.addEventListener('click', () => {
        tooltip.setPosition(coordinates);
        const el = tooltip.getElement() as HTMLElement;
        if (el) el.style.display = 'block';
      });
    } catch (error) {
      console.error('Erro ao criar marker/tooltip:', error);
    }
  }

  removeAllMarkers(): void {
    const map = this.mapaService.getMapa();
    if (map) {
      Object.values(this.markerOverlays).forEach((o) => {
        try {
          map.removeOverlay(o);
        } catch {}
      });
      Object.values(this.tooltips).forEach((o) => {
        try {
          map.removeOverlay(o);
        } catch {}
      });
      this.markers?.forEach((layer: any) => {
        try {
          layer.getSource?.()?.clear?.();
        } catch {}
        try {
          map.removeLayer(layer);
        } catch {}
      });
    }
    this.markerOverlays = {};
    this.tooltips = {};
    this.markers?.clear?.();
    this.markerState?.clear?.();
    this.markerLayerAssociations = {};
    this.closePopup?.();
  }

  async posicionarNoMapa(): Promise<void> {
    if (this.posicionandoMapa) {
      return;
    }

    this.posicionandoMapa = true;
    this.mapaPosicionado = false;
    this.cdr.detectChanges();

    try {
      const useSsTarget = this.shouldUseSsTargetForSelectedRecords();
      const temaid = this.getTargetTemaId(useSsTarget);
      const grupoid = this.getTargetGrupoId(useSsTarget);
      const camadaId = this.getTargetCamadaId(useSsTarget);

      if (temaid && grupoid && camadaId) {
        this.conteudoService.emitirAtivacaoCamadaComContexto(
          temaid,
          grupoid,
          camadaId,
        );
        await this.aguardarMapaPronto();
      }

      // Aplicar auxiliares já selecionadas (se houver)
      this.aplicarAuxiliaresSelecionadasNoMapa();

      this.ensurePopupOverlay();
      this.registerMapClickHandler();

      await this.selecionarEZoomarFeatures();
    } finally {
      this.posicionandoMapa = false;
      this.cdr.detectChanges();
    }
  }

  private async aguardarMapaPronto(): Promise<void> {
    return new Promise((resolve) => {
      let tentativas = 0;
      const maxTentativas = 20;

      const verificar = setInterval(() => {
        const map = this.mapaService.getMapa();
        tentativas++;

        if (
          (map && map.getView() && map.getLayers().getLength() > 0) ||
          tentativas >= maxTentativas
        ) {
          clearInterval(verificar);

          setTimeout(() => resolve(), 200);
        }
      }, 3000);
    });
  }

  async selecionarEZoomarFeatures(): Promise<void> {
    const useSsTarget = this.shouldUseSsTargetForSelectedRecords();
    const camadaNome = this.getTargetCamadaNome(useSsTarget);
    if (!camadaNome) {
      console.warn('Nome da camada não configurado');
      return;
    }

    const registrosSelecionadosParaMapa =
      this.getRegistrosSelecionadosParaMapa();
    const campoChave = (
      this.getTargetCampoChave(useSsTarget) || 'matricula'
    ).trim();
    const valoresChaveSelecionados = registrosSelecionadosParaMapa
      .map((reg) => this.getRegistroValorParaCampoChave(reg, campoChave))
      .filter((v) => !!v && v !== 'N/A');

    if (!valoresChaveSelecionados.length) {
      this.mostrarMensagem(
        'Nenhum registro selecionado para posicionar no mapa.',
      );
      return;
    }

    const valoresIn = valoresChaveSelecionados
      .map((v) => `'${String(v).replace(/'/g, "''")}'`)
      .join(',');

    const criterio = `${campoChave} IN (${valoresIn})`;

    const atributos: Atributos[] = [
      {
        id: '',
        nomeAtributo: campoChave,
        label: '',
        tipo: '',
        tamanho: '',
        visivel: true,
        descricao: '',
        ordemRenderizacao: 0,
        usuarioCriacao: '',
        usuarioUltimaAlteracao: '',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '',
        nomeAtributo: 'geometry',
        label: '',
        tipo: '',
        tamanho: '',
        visivel: true,
        ordemRenderizacao: 0,
        descricao: '',
        usuarioCriacao: '',
        usuarioUltimaAlteracao: '',
        createdAt: '',
        updatedAt: '',
      },
    ];

    this.conteudoService
      .getWFSLayerData('vetor', camadaNome, atributos, 'expressao', criterio)
      .subscribe({
        next: async (response: any[]) => {
          const camadaData = response.find((r) => r.layerName === camadaNome);
          if (!camadaData?.data?.features?.length) {
            this.mostrarMensagem(
              'Nenhuma feature encontrada para as matrículas selecionadas',
            );
            return;
          }

          const features = camadaData.data.features;

          this.removeAllMarkers();
          await new Promise((resolve) => setTimeout(resolve, 200));

          this.zoomToFeatures(features);

          await new Promise((resolve) => setTimeout(resolve, 1500));

          const isSs = this.shouldUseSsTargetForSelectedRecords();
          for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            if (feature.geometry) {
              await new Promise((resolve) => setTimeout(resolve, 100));

              this.addRemoveMarkerToGeometry(feature, isSs);
            }
          }

          this.mostrarMensagem(
            `${features.length} marcador(es) adicionado(s) ao mapa`,
            'success',
          );
          this.mapaPosicionado = true;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao buscar features:', error);
          this.mostrarMensagem('Erro ao buscar dados no mapa', 'error');
        },
      });
  }

  private zoomToFeatures(features: any[]): void {
    const map = this.mapaService.getMapa();
    if (!map || !features.length) return;

    try {
      const format = new GeoJSON();
      const olFeatures: Feature<Geometry>[] = [];

      features.forEach((f) => {
        try {
          const feature = format.readFeature(f, {
            dataProjection: 'EPSG:3857',
            featureProjection: map.getView().getProjection(),
          });

          if (feature instanceof Feature) {
            olFeatures.push(feature as Feature<Geometry>);
          }
        } catch (e) {
          console.warn('Erro ao ler feature:', e);
        }
      });

      if (olFeatures.length > 0) {
        const tempSource = new VectorSource({ features: olFeatures });
        const extent = tempSource.getExtent();

        if (extent && !extent.some(isNaN)) {
          // Zoom mais próximo para melhorar qualidade do basemap
          map.getView().fit(extent, {
            duration: 1000,
            maxZoom: 20, // Aumentou de 18 para 20 - muito mais próximo do solo
            padding: [20, 20, 20, 20], // Reduziu padding de 50 para 20 - área mais focada
          });
        }
      }
    } catch (error) {
      console.error('Erro ao fazer zoom:', error);
    }
  }

  isRegistroConsulta(
    registro: RegistroSelecionado,
  ): registro is RegistroConsulta {
    return (
      'tipo' in registro && 'codigo' in registro && 'dadosCompletos' in registro
    );
  }

  isCroquiEndereco(registro: RegistroSelecionado): registro is CroquiEndereco {
    return 'matriculaImovel' in registro && 'enderecoCompleto' in registro;
  }

  isRegistroSelecionadoParaMapa(registro: RegistroSelecionado): boolean {
    if (this.isRegistroConsulta(registro)) {
      return registro.selecionado || false;
    }
    return (registro as any).selecionado || false;
  }

  setRegistroSelecionado(
    registro: RegistroSelecionado,
    selecionado: boolean,
  ): void {
    this.resetMapaPosicionado();
    if (this.isRegistroConsulta(registro)) {
      registro.selecionado = selecionado;
    } else {
      (registro as any).selecionado = selecionado;
    }
  }

  onRegistroItemClick(registro: RegistroSelecionado): void {
    // Single selection: deselect others, select clicked
    this.registrosSelecionados.forEach((r) =>
      this.setRegistroSelecionado(r, r === registro),
    );
    this.cdr.detectChanges();
  }

  private resetMapaPosicionado(): void {
    if (this.mapaPosicionado) {
      this.mapaPosicionado = false;
      this.cdr.detectChanges();
    }
  }

  getRegistrosSelecionadosParaMapa(): RegistroSelecionado[] {
    // Only return explicitly selected records; if none, return empty per new requirement
    return this.registrosSelecionados.filter((reg) =>
      this.isRegistroSelecionadoParaMapa(reg),
    );
  }

  get registrosSelecionadosParaMapaCount(): number {
    return this.getRegistrosSelecionadosParaMapa().length;
  }

  selecionarTodosParaMapa(): void {
    this.registrosSelecionados.forEach((registro) => {
      this.setRegistroSelecionado(registro, true);
    });
    this.cdr.detectChanges();
  }

  desmarcarTodosParaMapa(): void {
    this.registrosSelecionados.forEach((registro) => {
      this.setRegistroSelecionado(registro, false);
    });
    this.cdr.detectChanges();
  }

  getRegistroDisplay(registro: RegistroSelecionado): any {
    if (this.isRegistroConsulta(registro)) {
      if (registro.tipo === 'SS') {
        const numSs = registro.codigo || '';
        const seqSs = registro.seq_ss || '';
        const codigo = seqSs ? `${numSs}/${seqSs}` : numSs;
        return {
          tipo: registro.tipo,
          codigo: codigo,
          nome: registro.nome,
        };
      }
      return {
        tipo: registro.tipo,
        codigo: registro.codigo,
        nome: registro.nome,
      };
    } else {
      return {
        tipo: 'ENDEREÇO',
        codigo: this.getMatricula(registro),
        nome: this.getNome(registro),
      };
    }
  }

  private _carregarCidades(): void {
    this.carregandoCidades = true;
    this.cidadesService.getCidades().subscribe({
      next: (cidades) => {
        const cidadesValidas = (cidades || []).filter((c) => c && c.cidade);
        this.cidades = cidadesValidas.sort((a, b) =>
          a.cidade.localeCompare(b.cidade),
        );
        this.carregandoCidades = false;
      },
      error: (erro) => {
        this.mostrarMensagem(
          'Erro ao carregar cidades. Tente novamente.',
          'error',
        );
        this.carregandoCidades = false;
        console.error('Erro ao carregar cidades:', erro);
      },
    });
  }

  carregarBairrosPorCidade(codigos: number[]) {
    if (!codigos || codigos.length === 0) {
      this.bairros = [];
      this.bairrosFiltrados = [];
      this.bairroSelecionado = null;
      return;
    }
    this.bairrosService.getBairros(codigos).subscribe({
      next: (bairros: SicatBairro[]) => {
        this.bairros = bairros || [];
        this.bairrosFiltrados = this.bairros;
        this.bairroSelecionado = null;
      },
      error: () => {
        this.bairros = [];
        this.bairrosFiltrados = [];
        this.bairroSelecionado = null;
      },
    });
  }

  carregarLogradourosPorCidade(codigos: number[]) {
    if (!codigos || codigos.length === 0) {
      this.logradouros = [];
      this.logradourosFiltrados = [];
      this.logradouroSelecionado = null;
      return;
    }
    this.logradourosService.getLogradouros(codigos).subscribe({
      next: (logradouros: SicatLogradouro[]) => {
        this.logradouros = logradouros || [];
        this.logradourosFiltrados = this.logradouros;
        this.logradouroSelecionado = null;
      },
      error: () => {
        this.logradouros = [];
        this.logradourosFiltrados = [];
        this.logradouroSelecionado = null;
      },
    });
  }

  onTipoConsultaChange(tipo: 'SS' | 'Matricula' | 'Hidrometro') {
    this.tipoConsulta = tipo;
    this.codigoDigitado = '';
    this.seq_ss = '';
  }

  onNumeroSsChange(): void {
    const numSs = this.codigoDigitado.trim();

    // Limpar sequências anteriores
    this.sequenciasDisponiveis = [];
    this.seq_ss = '';

    // Buscar sequências quando o número tiver 12 caracteres
    if (this.tipoConsulta === 'SS' && numSs.length === 12) {
      this.carregandoSequencias = true;
      this.ssSequenciasService.getSequenciasByNumSs(numSs).subscribe({
        next: (response) => {
          this.carregandoSequencias = false;
          if (response.success && response.seqSs && response.seqSs.length > 0) {
            this.sequenciasDisponiveis = response.seqSs
              .map((item) => item.seqSs)
              .sort((a, b) => a - b);
            // Se houver apenas uma sequência, seleciona automaticamente
            if (this.sequenciasDisponiveis.length === 1) {
              this.seq_ss = String(this.sequenciasDisponiveis[0]);
            }
            this.mostrarMensagem(
              response.message ||
                `${response.total} sequência(s) encontrada(s)`,
              'success',
            );
          } else {
            this.mostrarMensagem(
              'Nenhuma sequência encontrada para esta SS',
              'info',
            );
          }
          this.cdr.detectChanges();
        },
        error: (erro) => {
          this.carregandoSequencias = false;
          console.error('Erro ao buscar sequências:', erro);
          this.mostrarMensagem('Erro ao buscar sequências da SS', 'error');
          this.cdr.detectChanges();
        },
      });
    }
  }

  adicionarRegistro() {
    if (!this.codigoDigitado.trim()) {
      this.mostrarMensagem(
        `Digite o número ${this.getTipoLabel()} para adicionar`,
      );
      return;
    }

    const jaExiste = this.registrosSelecionados.some((registro) => {
      if (this.isRegistroConsulta(registro)) {
        if (registro.tipo === 'SS' && this.tipoConsulta === 'SS') {
          // Para SS, verificar tanto o código quanto a sequência
          return (
            registro.codigo === this.codigoDigitado.trim() &&
            registro.dadosCompletos?.seq_ss === String(this.seq_ss).trim()
          );
        }
        // Para outros tipos, verificar apenas código e tipo
        return (
          registro.codigo === this.codigoDigitado.trim() &&
          registro.tipo === this.tipoConsulta
        );
      }
      return false;
    });

    if (jaExiste) {
      this.mostrarMensagem('Este registro já foi adicionado');
      return;
    }

    this.buscandoDados = true;

    const timeoutId = setTimeout(() => {
      if (this.buscandoDados) {
        this.buscandoDados = false;
        this.cdr.detectChanges();
        this.mostrarMensagem('Timeout na busca. Tente novamente.', 'error');
      }
    }, 30000);

    if (this.tipoConsulta === 'Matricula') {
      this.sicatImovelService.getImovel(this.codigoDigitado.trim()).subscribe({
        next: (imovelDetalhado: ImovelDetalhado) => {
          clearTimeout(timeoutId);
          const registroVistoria: RegistroVistoria = {
            id: `matricula_${this.codigoDigitado.trim()}_${Date.now()}`,
            matricula: String(imovelDetalhado.matriculaImovel),
            hd: '',
            nome: imovelDetalhado.nomeClienteInterno || 'Nome não informado',
            numero: imovelDetalhado.numeroEndereco || '',
            bairro: imovelDetalhado.descricaoBairro || '',
            localidade: imovelDetalhado.descricaoCidade || '',
            logradouro: imovelDetalhado.descricaoLogradouro || '',
          };

          const novoRegistro: RegistroConsulta = {
            id: `matricula_${this.codigoDigitado.trim()}_${Date.now()}`,
            tipo: 'Matricula',
            codigo: this.codigoDigitado.trim(),
            nome: imovelDetalhado.nomeClienteInterno || 'Nome não informado',
            dadosCompletos: registroVistoria,
            selecionado: true,
          };

          this.resetMapaPosicionado();
          this.registrosSelecionados.push(novoRegistro);
          this.cdr.detectChanges();
          this.estatisticas.totalLidos++;
          this.estatisticas.totalImportados++;
          this.mostrarMensagem(
            `Matrícula ${this.codigoDigitado} adicionada com sucesso`,
            'success',
          );
          this.codigoDigitado = '';
          this.buscandoDados = false;
        },
        error: (erro) => {
          clearTimeout(timeoutId);
          this.mostrarMensagem(
            `Matrícula ${this.codigoDigitado} não encontrada`,
            'error',
          );
          this.buscandoDados = false;
          this.cdr.detectChanges();
        },
      });
      return;
    }

    if (this.tipoConsulta === 'Hidrometro') {
      this.sicatHidrometroService
        .getImovelByHidrometro(this.codigoDigitado.trim())
        .subscribe({
          next: (imovelDetalhado: SicatImovelHidrometroDetalhado) => {
            clearTimeout(timeoutId);
            const registroVistoria: RegistroVistoria = {
              id: `hidrometro_${this.codigoDigitado.trim()}_${Date.now()}`,
              matricula: String(imovelDetalhado.matriculaImovel),
              hd: imovelDetalhado.codigoHidrometro,
              nome: imovelDetalhado.nomeClienteInterno,
              numero: imovelDetalhado.numeroEndereco,
              bairro: imovelDetalhado.descricaoBairro,
              localidade: imovelDetalhado.descricaoCidade,
              logradouro:
                `${imovelDetalhado.siglaLogradouro} ${imovelDetalhado.descricaoLogradouro}`.trim(),
            };

            const novoRegistro: RegistroConsulta = {
              id: `hidrometro_${this.codigoDigitado.trim()}_${Date.now()}`,
              tipo: 'Hidrometro',
              codigo: this.codigoDigitado.trim(),
              nome: imovelDetalhado.nomeClienteInterno || 'Nome não informado',
              dadosCompletos: registroVistoria,
              selecionado: true,
            };

            this.resetMapaPosicionado();
            this.registrosSelecionados.push(novoRegistro);
            this.cdr.detectChanges();
            this.estatisticas.totalLidos++;
            this.estatisticas.totalImportados++;
            this.mostrarMensagem(
              `Hidrômetro ${this.codigoDigitado} adicionado com sucesso`,
              'success',
            );
            this.codigoDigitado = '';
            this.buscandoDados = false;
          },
          error: (erro) => {
            clearTimeout(timeoutId);
            this.mostrarMensagem(
              `Hidrômetro ${this.codigoDigitado} não encontrado`,
              'error',
            );
            this.buscandoDados = false;
            this.cdr.detectChanges();
          },
        });
      return;
    }

    if (this.tipoConsulta === 'SS') {
      this.solicitacaoServicosService
        .getSolicitacaoServicos(
          this.codigoDigitado.trim(),
          String(this.seq_ss).trim(),
        )
        .subscribe({
          next: (solicitacao) => {
            clearTimeout(timeoutId);

            if (!solicitacao) {
              this.mostrarMensagem(
                `SS ${this.codigoDigitado} não encontrada`,
                'error',
              );
              this.buscandoDados = false;
              this.cdr.detectChanges();
              return;
            }

            try {
              const registroVistoria: RegistroVistoria = {
                id: `ss_${this.codigoDigitado.trim()}_${Date.now()}`,
                matricula: solicitacao.matricula || '',
                hd: solicitacao.hidrometro || '',
                nome: solicitacao.cliente || 'Nome não informado',
                numero: solicitacao.numImovel || '',
                bairro: solicitacao.bairro || '',
                localidade: solicitacao.unidade || '',
                logradouro: solicitacao.logradouro || '',
                // Dados adicionais da SS
                cd_atendimento: solicitacao.cdAtendimento || '',
                ref_atendimento:
                  solicitacao.refAtendimento || this.codigoDigitado.trim(),
                seq_ss: String(this.seq_ss || '').trim(),
                sigla_logradouro: '',
                dc_logradouro: solicitacao.logradouro || '',
                // Novos campos do backend
                servico: solicitacao.servico || '',
                operacional: solicitacao.operacional || '',
                unidade: solicitacao.unidade || '',
                cpfCnpj: solicitacao.cpfCnpj || '',
                telefone: solicitacao.telefone || '',
                referencia: solicitacao.referencia || '',
                obs: solicitacao.obs || '',
              };

              const novoRegistro: RegistroConsulta = {
                id: `ss_${this.codigoDigitado.trim()}_${Date.now()}`,
                tipo: 'SS',
                codigo: this.codigoDigitado.trim(),
                nome: solicitacao.cliente || 'Nome não informado',
                dadosCompletos: registroVistoria,
                selecionado: true,
                cd_atendimento: solicitacao.cdAtendimento || '',
                seq_ss: String(this.seq_ss || '').trim(),
                imprimirDadosSS: true,
              };

              this.resetMapaPosicionado();
              this.registrosSelecionados.push(novoRegistro);
              this.cdr.detectChanges();
              this.estatisticas.totalLidos++;
              this.estatisticas.totalImportados++;
              this.mostrarMensagem(
                `SS ${this.codigoDigitado} adicionada com sucesso`,
                'success',
              );
              this.codigoDigitado = '';
              this.seq_ss = '';
              this.buscandoDados = false;
            } catch (erro) {
              this.mostrarMensagem(
                `Erro ao processar dados da SS ${this.codigoDigitado}`,
                'error',
              );
              this.buscandoDados = false;
              this.cdr.detectChanges();
            }
          },
          error: (erro) => {
            clearTimeout(timeoutId);
            this.mostrarMensagem(
              `SS ${this.codigoDigitado} não encontrada`,
              'error',
            );
            this.buscandoDados = false;
            this.cdr.detectChanges();
          },
        });
      return;
    }
  }

  getTipoLabel(): string {
    switch (this.tipoConsulta) {
      case 'SS':
        return 'da SS';
      case 'Matricula':
        return 'da Matrícula';
      case 'Hidrometro':
        return 'do Hidrômetro';
      default:
        return 'do código';
    }
  }

  removerRegistro(index: number) {
    this.resetMapaPosicionado();
    const registroRemovido = this.registrosSelecionados[index];
    this.registrosSelecionados.splice(index, 1);
    this.estatisticas.totalLidos = Math.max(
      0,
      this.estatisticas.totalLidos - 1,
    );
    this.estatisticas.totalImportados = Math.max(
      0,
      this.estatisticas.totalImportados - 1,
    );

    if (this.isRegistroConsulta(registroRemovido)) {
      this.mostrarMensagem(
        `${registroRemovido.tipo} ${registroRemovido.codigo} removido`,
      );
    } else {
      this.mostrarMensagem(
        `Endereço ${registroRemovido.matriculaImovel} removido`,
      );
    }
  }

  removerSelecionado() {
    this.resetMapaPosicionado();
    this.registrosSelecionados = [];
    this.estatisticas = {
      totalLidos: 0,
      totalImportados: 0,
      totalNaoImportados: 0,
    };
    this.mostrarMensagem('Todos os registros selecionados foram removidos');
  }

  selecionarTodos() {
    this.resetMapaPosicionado();
    if (this.todosSelecionados()) {
      this.registrosSelecionados = this.registrosSelecionados.filter((r) =>
        this.isRegistroConsulta(r),
      );
    } else {
      this.registrosEncontrados.forEach((registro) => {
        if (!this.isRegistroSelecionado(registro)) {
          this.setRegistroSelecionado(registro, true);
          this.registrosSelecionados.push(registro);
        }
      });
    }

    this.cdr.detectChanges();
  }

  toggleSelecaoRegistro(registro: CroquiEndereco) {
    this.resetMapaPosicionado();
    const index = this.registrosSelecionados.findIndex((r) => {
      if (this.isCroquiEndereco(r)) {
        return (
          r.matriculaImovel === registro.matriculaImovel &&
          r.numeroEndereco === registro.numeroEndereco
        );
      }
      return false;
    });

    if (index > -1) {
      this.registrosSelecionados.splice(index, 1);
    } else {
      this.setRegistroSelecionado(registro, true);
      this.registrosSelecionados.push(registro);
    }

    this.cdr.detectChanges();
  }

  isRegistroSelecionado(registro: CroquiEndereco): boolean {
    return this.registrosSelecionados.some((r) => {
      if (this.isCroquiEndereco(r)) {
        return (
          r.matriculaImovel === registro.matriculaImovel &&
          r.numeroEndereco === registro.numeroEndereco
        );
      }
      return false;
    });
  }

  todosSelecionados(): boolean {
    return (
      this.registrosEncontrados.length > 0 &&
      this.registrosEncontrados.every((registro) =>
        this.isRegistroSelecionado(registro),
      )
    );
  }

  limparTudo() {
    this.resetMapaPosicionado();
    this.registrosSelecionados = [];
    this.registrosEncontrados = [];
    this.estatisticas = {
      totalLidos: 0,
      totalImportados: 0,
      totalNaoImportados: 0,
    };
    this.removeAllMarkers();
    this.mostrarMensagem('Dados limpos');
  }

  /**
   * Gera um nome único para o arquivo PDF
   * Formato: croqui_{{matricula}}_yymmdd
   */
  private gerarNomeArquivo(dadosRegistro: any, sufixo: string = ''): string {
    const agora = new Date();

    // Extrair ano (2 dígitos), mês e dia com zero-padding
    const yy = String(agora.getFullYear()).slice(-2);
    const mm = String(agora.getMonth() + 1).padStart(2, '0');
    const dd = String(agora.getDate()).padStart(2, '0');
    const data = `${yy}${mm}${dd}`;

    const matricula = dadosRegistro.matricula || 'sem_matricula';

    // Formato: croqui_{{matricula}}_yymmdd (sufixo removido conforme solicitado)
    return `croqui_${matricula}_${data}`.replace(/\s+/g, '_');
  }

  /**
   * Converte um registro selecionado para o formato de dados do popup
   */
  private converterRegistroParaDados(registro: RegistroSelecionado): any {
    if (this.isRegistroConsulta(registro)) {
      const dados = registro.dadosCompletos;
      return {
        matricula: String(dados.matricula || registro.codigo || ''),
        hd: String(dados.hd || ''),
        nome: dados.nome || registro.nome || '',
        numero: dados.numero || '',
        bairro: dados.bairro || '',
        localidade: dados.localidade || '',
        logradouro: dados.logradouro || '',
        // Dados extras da SS
        cd_atendimento: dados.cd_atendimento || '',
        ref_atendimento: dados.ref_atendimento || registro.codigo || '',
        sigla_logradouro: dados.sigla_logradouro || '',
        dc_logradouro: dados.dc_logradouro || '',
        observacoes: dados.obs || '',
      };
    } else if (this.isCroquiEndereco(registro)) {
      return {
        matricula: String(registro.matriculaImovel || ''),
        hd: String(registro.dv || ''),
        nome: registro.nomeClienteInterno || '',
        numero: registro.numeroEndereco || '',
        bairro: registro.bairro || '',
        localidade: registro.cidade || '',
        logradouro: registro.logradouro || '',
      };
    }

    return {
      matricula: 'N/A',
      hd: '',
      nome: 'Nome não informado',
      numero: '',
      bairro: '',
      localidade: '',
      logradouro: '',
    };
  }

  async imprimirCroqui(): Promise<void> {
    const registrosParaImpressao = this.getRegistrosSelecionadosParaMapa();
    if (registrosParaImpressao.length === 0) {
      this.mostrarMensagem('Selecione um registro para imprimir');
      return;
    }

    if (!this.mapaPosicionado) {
      this.mostrarMensagem('Posicione no mapa antes de imprimir.');
      return;
    }

    // Verifica se há template correspondente ao primeiro registro selecionado
    const primeiro = registrosParaImpressao[0];
    const templatePrimeiro = this.getTemplateForRegistro(primeiro);
    if (!templatePrimeiro || !templatePrimeiro.trim()) {
      const ehSS = this.isRegistroConsulta(primeiro) && primeiro.tipo === 'SS';
      const msgTipo = ehSS ? 'Solicitação de Serviço (SS)' : 'Croqui';
      this.mostrarMensagem(
        `Template de impressão (${msgTipo}) não configurado. Configure o componente imprimir-croqui.`,
        'error',
      );
      return;
    }

    const registrosParaValidacao = registrosParaImpressao.map((registro) => {
      if (this.isRegistroConsulta(registro)) {
        return registro.dadosCompletos;
      } else if (this.isCroquiEndereco(registro)) {
        return {
          ...registro,
          matricula: registro.matriculaImovel?.toString() || '',
          codigo: registro.matriculaImovel?.toString() || '',
        };
      }
      return registro;
    });

    const validacao = this.vistoriaService.validarDadosImpressao(
      registrosParaValidacao,
    );

    if (!validacao.valido) {
      this.mostrarMensagem(`Erro na validação: ${validacao.erros.join(', ')}`);
      return;
    }

    this.loading = true;

    try {
      console.log('[IMPRESSÃO] Iniciando processo de impressão...');

      // Forçar renderização do mapa e aguardar carregamento completo dos tiles (evita "desbotado" no 1º clique)
      const map = this.mapaService.getMapa();
      if (map) {
        map.render();
        map.renderSync();
        try {
          await this.aguardarRenderizacaoCompletaMapa(map as any, 12000);
        } catch {
          // prossegue mesmo assim (fallbacks cuidam)
        }
      }

      let mapImage: string | null = null;

      // Sistema de fallback robusto com múltiplas estratégias
      console.log(
        '[IMPRESSÃO] Iniciando captura com sistema de fallback robusto...',
      );

      const estrategias = [
        {
          nome: 'html2canvas (viewport real)',
          metodo: () => this.capturarImagemMapaHtml2Canvas(),
        },
        {
          nome: 'Resolução MÁXIMA (900 DPI)',
          metodo: () => this.capturarMapaResolucaoFixa(),
        },
        {
          nome: 'Captura com Marcadores',
          metodo: () => this.capturarImagemMapaComMarcadores(),
        },
        {
          nome: 'Método Alternativo',
          metodo: () => this.capturarImagemMapaAlternativo(),
        },
        { nome: 'Captura Simples', metodo: () => this.capturaMapaSimples() },
        {
          nome: 'Captura de Emergência',
          metodo: () => this.capturaEmergencia(),
        },
      ];

      for (const estrategia of estrategias) {
        try {
          console.log(`[IMPRESSÃO] Tentando: ${estrategia.nome}...`);
          mapImage = await estrategia.metodo();

          if (mapImage && mapImage.length > 100) {
            // Validar se a imagem não está vazia
            console.log(
              `[IMPRESSÃO] Sucesso com ${estrategia.nome}! Tamanho: ${mapImage.length} chars`,
            );
            break;
          } else {
            console.warn(
              `[IMPRESSÃO] ${estrategia.nome} retornou imagem inválida`,
            );
            mapImage = null;
          }
        } catch (error) {
          console.error(`[IMPRESSÃO] Erro em ${estrategia.nome}:`, error);
          mapImage = null;
        }
      }

      // Último recurso: placeholder informativo
      if (!mapImage) {
        console.warn(
          '[IMPRESSÃO] Todas as estratégias falharam, criando placeholder...',
        );
        mapImage = this.criarImagemPlaceholder();
      }

      console.log(
        '[IMPRESSÃO] Imagem capturada:',
        mapImage ? `${mapImage.length} chars` : 'null',
      );

      for (let i = 0; i < registrosParaImpressao.length; i++) {
        const registro = registrosParaImpressao[i];

        const dadosRegistro = this.converterRegistroParaDados(registro);

        const templateHtml = this.getTemplateForRegistro(registro);

        const htmlProcessado = this.substituirVariaveisTemplate(
          templateHtml,
          dadosRegistro,
          mapImage || '',
          this.seq_ss,
          registro,
        );

        const nomeArquivo = this.gerarNomeArquivo(
          dadosRegistro,
          `_sel_${i + 1}`,
        );
        await this.gerarPdfIndividual(htmlProcessado, nomeArquivo);

        if (i < registrosParaImpressao.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      this.mostrarMensagem(
        `${registrosParaImpressao.length} croqui(s) gerado(s) com sucesso!`,
        'success',
      );

      if (this.dialogRef) {
        this.dialogRef.close({
          acao: 'impressao',
          dados: registrosParaImpressao,
        });
      }
    } catch (error) {
      console.error('Erro ao imprimir croquis:', error);
      this.mostrarMensagem('Erro ao gerar croquis. Tente novamente.', 'error');
    } finally {
      this.loading = false;
    }
  }

  cancelar() {
    this.removeAllMarkers();

    if (this.dialogRef) {
      this.dialogRef.close();
    }

    this.fechado.emit();
  }

  async concluir(): Promise<void> {
    await this.imprimirCroqui();
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
  }

  private mostrarMensagem(
    mensagem: string,
    tipo: 'success' | 'error' | 'info' = 'info',
  ) {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 3000,
      panelClass: [`snackbar-${tipo}`],
    });
  }

  get statusSelecao(): string {
    return this.registrosSelecionados.length > 0
      ? `${this.registrosSelecionados.length} registro(s) selecionado(s)`
      : 'Nenhum registro selecionado';
  }

  get podeImprimir(): boolean {
    return (
      this.registrosSelecionados.length > 0 &&
      !this.loading &&
      this.mapaPosicionado
    );
  }

  getMatricula(registro: RegistroSelecionado): string {
    if (this.isCroquiEndereco(registro)) {
      return registro.matriculaImovel?.toString() || 'N/A';
    } else if (this.isRegistroConsulta(registro)) {
      return registro.dadosCompletos?.matricula?.toString() || 'N/A';
    }
    return 'N/A';
  }

  getHd(registro: CroquiEndereco): string {
    return registro.dv?.toString() || 'N/A';
  }

  getNome(registro: CroquiEndereco): string {
    return registro.nomeClienteInterno || 'Nome não informado';
  }

  getNumero(registro: CroquiEndereco): string {
    return registro.numeroEndereco || 'N/A';
  }

  getBairro(registro: CroquiEndereco): string {
    return registro.bairro || 'N/A';
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  private validarCidadeSelecionada(): boolean {
    const valor: any = this.cidadeControl.value;

    if (
      Array.isArray(valor) &&
      valor.length > 0 &&
      valor[0] &&
      valor[0].cidade
    ) {
      return true;
    }
    if (typeof valor === 'string' && valor && valor.trim()) {
      const cidadeEncontrada = this.cidades.find(
        (c) => c.cidade.toLowerCase() === valor.toLowerCase().trim(),
      );
      return !!cidadeEncontrada;
    }
    return false;
  }

  get statusAutocomplete(): string {
    if (this.carregandoCidades) {
      return 'Carregando cidades...';
    }

    if (this.cidades.length === 0) {
      return 'Nenhuma cidade disponível';
    }

    if (this.cidadesSelecionadas.length > 0) {
      return `Cidades selecionadas: ${this.cidadesSelecionadas.map((c) => c.cidade).join(', ')}`;
    }

    return 'Digite para buscar cidade';
  }

  buscarCidadePorId(id: number): SicatCidade | undefined {
    return this.cidades.find((c) => c.codigoCidade === id);
  }

  configurarAutocomplete(): void {
    this.cidadeControl.valueChanges
      .pipe(debounceTime(200))
      .subscribe((value: string) => {
        this.onCidadeInputChange(value);
      });
  }

  configurarAutocompleteBairro(): void {
    this.bairroControl.valueChanges
      .pipe(debounceTime(200))
      .subscribe((value: any) => {
        const texto =
          typeof value === 'string'
            ? value
            : value && value.bairro
              ? value.bairro
              : '';
        this.onBairroInputChange(texto);
      });
  }

  onCidadeInputChange(value: string) {
    this.cidadeInput = value;
    if (!value || value.length < 2) {
      this.cidadesFiltradas = this.cidades.slice(0, 20);
      return;
    }
    const filtro = value.toLowerCase().trim();
    this.cidadesFiltradas = this.cidades
      .filter(
        (cidade) =>
          cidade.cidade && cidade.cidade.toLowerCase().includes(filtro),
      )
      .slice(0, 20);
  }

  adicionarCidade(cidade: SicatCidade) {
    if (
      !this.cidadesSelecionadas.some(
        (c) => c.codigoCidade === cidade.codigoCidade,
      )
    ) {
      this.cidadesSelecionadas.push(cidade);
      // Clear input text after selecting a city from autocomplete
      this.cidadeInput = '';
      this.cidadeControl.reset('');
      try {
        this.cidadeInputRef?.nativeElement &&
          (this.cidadeInputRef.nativeElement.value = '');
      } catch {}
      this.cidadesFiltradas = this.cidades.slice(0, 20);
      const codigos = this.cidadesSelecionadas.map((c) => c.codigoCidade);
      this.carregarBairrosPorCidade(codigos);
      this.carregarLogradourosPorCidade(codigos);
    }
  }

  removerCidade(cidade: SicatCidade) {
    this.cidadesSelecionadas = this.cidadesSelecionadas.filter(
      (c) => c.codigoCidade !== cidade.codigoCidade,
    );
    const codigos = this.cidadesSelecionadas.map((c) => c.codigoCidade);
    this.carregarBairrosPorCidade(codigos);
    this.carregarLogradourosPorCidade(codigos);
  }

  listarPorLocalizacao() {
    this.paginaAtual = 0;
    if (!this.cidadesSelecionadas.length) {
      this.mostrarMensagem(
        'Selecione ao menos uma cidade para buscar endereços.',
        'info',
      );
      return;
    }

    this.buscandoLocalizacao = true;
    this.registrosEncontrados = [];
    this.cdr.detectChanges();

    const cd_cidade = this.cidadesSelecionadas[0]?.codigoCidade;
    const cd_bairro = this.bairroSelecionado
      ? Number(this.bairroSelecionado.codigoBairro)
      : undefined;
    const cd_logradouro = this.logradouroSelecionado
      ? Number(this.logradouroSelecionado.codigoLogradouro)
      : undefined;

    const timeoutId = setTimeout(() => {
      if (this.buscandoLocalizacao) {
        this.buscandoLocalizacao = false;
        this.cdr.detectChanges();
        this.mostrarMensagem('Timeout na busca. Tente novamente.', 'error');
      }
    }, 30000);

    this.croquiEnderecoFiltrosService
      .getEnderecosPorFiltros({
        cd_cidade,
        cd_bairro,
        cd_logradouro,
      })
      .subscribe({
        next: (enderecos: CroquiEndereco[]) => {
          clearTimeout(timeoutId);
          this.registrosEncontrados = enderecos || [];
          this.paginaAtual = 0;
          this.buscandoLocalizacao = false;
          this.cdr.detectChanges();
          if (!enderecos?.length) {
            this.mostrarMensagem(
              'Nenhum endereço encontrado para os filtros selecionados.',
              'info',
            );
          } else {
            // Abre diálogo de seleção automaticamente
            this.abrirSelecaoEnderecos();
          }
        },
        error: (err) => {
          clearTimeout(timeoutId);
          this.registrosEncontrados = [];
          this.buscandoLocalizacao = false;
          this.cdr.detectChanges();
          this.mostrarMensagem('Erro ao buscar endereços.', 'error');
        },
      });
  }

  get podeBuscarPorLocalizacao(): boolean {
    return this.cidadesSelecionadas.length > 0 && !this.buscandoLocalizacao;
  }

  onBairroInputChange(value: any) {
    this.bairroInput =
      typeof value === 'string'
        ? value
        : value && value.bairro
          ? value.bairro
          : '';
    if (!this.bairroInput) {
      this.bairrosFiltrados = this.bairros;
      return;
    }
    const filtro = this.bairroInput.toLowerCase();
    this.bairrosFiltrados = this.bairros.filter(
      (b) => b.bairro && b.bairro.toLowerCase().includes(filtro),
    );
  }

  displayBairro = (bairro: SicatBairro | null): string => {
    return bairro && bairro.bairro ? bairro.bairro : '';
  };

  onBairroSelected(bairro: SicatBairro) {
    this.bairroSelecionado = bairro;
    this.bairroInput = this.displayBairro(bairro);
    this.bairrosFiltrados = this.bairros; // reset list
    // set control to selected object so displayWith shows name in input
    try {
      this.bairroControl.setValue(bairro);
    } catch {}
  }

  onLogradouroInputChange(value: string) {
    this.logradouroInput = value;
    if (!value) {
      this.logradourosFiltrados = this.logradouros;
      return;
    }
    const filtro = value.toLowerCase();
    this.logradourosFiltrados = this.logradouros.filter(
      (l) =>
        l.logradouroCompleto &&
        l.logradouroCompleto.toLowerCase().includes(filtro),
    );
  }

  displayLogradouro = (logradouro: SicatLogradouro | null): string => {
    return logradouro && logradouro.logradouroCompleto
      ? logradouro.logradouroCompleto
      : '';
  };

  irParaPagina(pagina: number) {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.paginaAtual = pagina;
    }
  }

  proximaPagina() {
    this.irParaPagina(this.paginaAtual + 1);
  }

  paginaAnterior() {
    this.irParaPagina(this.paginaAtual - 1);
  }

  async imprimirCroquiIndividual(): Promise<void> {
    if (!this.popupData) {
      this.mostrarMensagem(
        'Template de impressão não configurado ou dados não disponíveis',
        'error',
      );
      return;
    }

    this.loading = true;

    try {
      // Usar captura com resolução fixa independente do monitor
      console.log('[IMPRESSÃO] Iniciando captura com resolução fixa...');
      let mapImage = await this.capturarMapaResolucaoFixa();

      if (!mapImage) {
        console.warn(
          'Captura com resolução fixa falhou, tentando método padrão...',
        );
        mapImage = await this.capturarImagemMapa();
      }

      if (!mapImage) {
        console.warn('Captura padrão falhou, tentando método alternativo...');
        mapImage = await this.capturarImagemMapaAlternativo();
      }

      if (!mapImage) {
        throw new Error(
          'Falha ao capturar imagem do mapa com todos os métodos',
        );
      }

      const templateHtml =
        (this.popupData as any)?.tipo === 'SS'
          ? this.getTemplate('ss') || this.getTemplate('croqui')
          : this.getTemplate('croqui');

      const htmlProcessado = this.substituirVariaveisTemplate(
        templateHtml,
        this.popupData,
        mapImage,
        '',
      );

      const nomeArquivo = this.gerarNomeArquivo(this.popupData, '_individual');
      await this.gerarPdfIndividual(htmlProcessado, nomeArquivo);

      this.mostrarMensagem('Croqui individual gerado com sucesso!', 'success');
      this.closePopup();
    } catch (error) {
      console.error('Erro ao imprimir croqui individual:', error);
      this.mostrarMensagem('Erro ao gerar croqui. Tente novamente.', 'error');
    } finally {
      this.loading = false;
    }
  }

  private async capturarImagemMapaAlternativo(): Promise<string | null> {
    return new Promise((resolve) => {
      const map = this.mapaService.getMapa();
      if (!map) {
        console.warn(
          '[CAPTURA ALT] Mapa não disponível para captura alternativa',
        );
        resolve(null);
        return;
      }

      try {
        const mapTarget = map.getTarget();
        let mapElement: HTMLElement | null = null;

        if (typeof mapTarget === 'string') {
          mapElement = document.getElementById(mapTarget);
        } else if (mapTarget instanceof HTMLElement) {
          mapElement = mapTarget;
        }

        if (!mapElement) {
          console.warn('[CAPTURA ALT] Elemento do mapa não encontrado');
          resolve(null);
          return;
        }

        const size = map.getSize();
        if (!size) {
          console.warn('[CAPTURA ALT] Tamanho do mapa não disponível');
          resolve(null);
          return;
        }

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = size[0];
        finalCanvas.height = size[1];
        const finalContext = finalCanvas.getContext('2d');

        if (!finalContext) {
          console.warn('[CAPTURA ALT] Contexto do canvas não disponível');
          resolve(null);
          return;
        }

        finalContext.fillStyle = '#ffffff';
        finalContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        let canvases: HTMLCanvasElement[] = [];
        const seletores = [
          '.ol-viewport canvas',
          '.ol-layer canvas',
          'canvas.ol-unselectable',
          'canvas',
        ];

        for (const seletor of seletores) {
          const found = Array.from(
            mapElement.querySelectorAll(seletor),
          ) as HTMLCanvasElement[];
          if (found.length > 0) {
            canvases = found;
            break;
          }
        }

        if (canvases.length === 0) {
          console.warn('[CAPTURA ALT] Nenhum canvas encontrado');
          resolve(null);
          return;
        }

        let canvasCombinados = 0;
        let canvasComConteudo = 0;

        canvases.forEach((canvas, index) => {
          if (canvas.width > 0 && canvas.height > 0) {
            try {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const imageData = ctx.getImageData(
                  0,
                  0,
                  Math.min(canvas.width, 10),
                  Math.min(canvas.height, 10),
                );
                const hasContent = imageData.data.some((value, idx) => {
                  if (idx % 4 === 3) return value > 0;
                  return false;
                });

                if (hasContent) {
                  canvasComConteudo++;

                  const computedStyle = window.getComputedStyle(canvas);
                  const opacity = parseFloat(computedStyle.opacity || '1');
                  const display = computedStyle.display;

                  if (opacity > 0 && display !== 'none') {
                    // Heurística: se o canvas cobre grande parte do finalCanvas, trate como basemap
                    const areaCanvas = canvas.width * canvas.height;
                    const areaFinal = finalCanvas.width * finalCanvas.height;
                    const cobertura = areaCanvas / areaFinal;

                    const isBasemapLike =
                      cobertura > 0.6 ||
                      (canvas.width === finalCanvas.width &&
                        canvas.height === finalCanvas.height);

                    // Para basemap, ignorar opacity CSS (usar alpha = 1) para evitar aspecto esmaecido.
                    const usarAlpha = isBasemapLike ? 1 : opacity;

                    if (
                      canvas.width === finalCanvas.width &&
                      canvas.height === finalCanvas.height
                    ) {
                      finalContext.globalAlpha = usarAlpha;
                      finalContext.drawImage(canvas, 0, 0);
                      finalContext.globalAlpha = 1;
                    } else {
                      const scale = Math.min(
                        finalCanvas.width / canvas.width,
                        finalCanvas.height / canvas.height,
                      );
                      const scaledWidth = canvas.width * scale;
                      const scaledHeight = canvas.height * scale;
                      const x = (finalCanvas.width - scaledWidth) / 2;
                      const y = (finalCanvas.height - scaledHeight) / 2;

                      finalContext.globalAlpha = usarAlpha;
                      finalContext.drawImage(
                        canvas,
                        x,
                        y,
                        scaledWidth,
                        scaledHeight,
                      );
                      finalContext.globalAlpha = 1;
                    }
                    canvasCombinados++;
                  }
                }
              }
            } catch (e) {
              console.error(
                `[CAPTURA ALT] Erro ao combinar canvas ${index}:`,
                e,
              );
            }
          } else {
            console.log(
              `[CAPTURA ALT] Canvas ${index} tem dimensões inválidas`,
            );
          }
        });

        if (canvasCombinados > 0) {
          const dataURL = finalCanvas.toDataURL('image/png', 0.9);
          if (dataURL && dataURL.length > 1000) {
            resolve(dataURL);
            return;
          }
        }

        console.warn(
          '[CAPTURA ALT] Nenhum canvas válido, criando placeholder...',
        );
        this.criarPlaceholderMapa(finalCanvas, finalContext);
        const dataURL = finalCanvas.toDataURL('image/png', 0.9);
        resolve(dataURL);
      } catch (error) {
        console.error('[CAPTURA ALT] Erro na captura alternativa:', error);
        resolve(null);
      }
    });
  }

  private criarPlaceholderMapa(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): void {
    const width = canvas.width;
    const height = canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e8f4f8');
    gradient.addColorStop(0.5, '#d1ecf1');
    gradient.addColorStop(1, '#bee5eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#17a2b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.setLineDash([]);

    ctx.fillStyle = '#2c3e50';
    ctx.font = `bold ${Math.max(16, width / 40)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = width / 2;
    const centerY = height / 2;

    ctx.fillText('ÁREA DO MAPA', centerX, centerY - 60);

    ctx.font = `${Math.max(12, width / 60)}px Arial, sans-serif`;
    ctx.fillStyle = '#495057';
    ctx.fillText('Visualização disponível na tela', centerX, centerY - 20);
    ctx.fillText('Captura automática não disponível', centerX, centerY + 10);

    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ffffff';

    const mapRect = {
      x: centerX - 80,
      y: centerY + 40,
      width: 160,
      height: 100,
    };

    ctx.fillRect(mapRect.x, mapRect.y, mapRect.width, mapRect.height);
    ctx.strokeRect(mapRect.x, mapRect.y, mapRect.width, mapRect.height);

    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 1;

    for (let i = 1; i < 4; i++) {
      const y = mapRect.y + (mapRect.height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(mapRect.x + 10, y);
      ctx.lineTo(mapRect.x + mapRect.width - 10, y);
      ctx.stroke();
    }

    for (let i = 1; i < 4; i++) {
      const x = mapRect.x + (mapRect.width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, mapRect.y + 10);
      ctx.lineTo(x, mapRect.y + mapRect.height - 10);
      ctx.stroke();
    }

    ctx.fillStyle = '#dc3545';
    ctx.beginPath();
    ctx.arc(centerX, mapRect.y + mapRect.height / 2, 6, 0, 2 * Math.PI);
    ctx.fill();
  }

  private async capturarImagemMapaComMarcadores(): Promise<string | null> {
    const mapaBase = await this.capturarImagemMapa();

    if (!mapaBase) {
      console.warn('[MARCADORES] Não foi possível capturar o mapa base');
      return null;
    }

    const map = this.mapaService.getMapa();
    if (!map) {
      console.warn('[MARCADORES] Mapa não disponível');
      return mapaBase;
    }

    return new Promise((resolve) => {
      try {
        const size = map.getSize();
        if (!size) {
          resolve(mapaBase);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = size[0];
        canvas.height = size[1];
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(mapaBase);
          return;
        }

        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);

          let marcadoresDesenhados = 0;

          Object.entries(this.markerOverlays).forEach(([coordKey, overlay]) => {
            try {
              const position = overlay.getPosition();
              if (!position) return;

              const pixel = map.getPixelFromCoordinate(position);
              if (!pixel) return;

              this.desenharMarcador(ctx, pixel[0], pixel[1]);
              marcadoresDesenhados++;
            } catch (e) {
              console.warn('[MARCADORES] Erro ao desenhar marcador:', e);
            }
          });

          const dataURL = canvas.toDataURL('image/png', 0.95);
          resolve(dataURL);
        };

        img.onerror = () => {
          console.error('[MARCADORES] Erro ao carregar imagem do mapa base');
          resolve(mapaBase);
        };

        img.src = mapaBase;
      } catch (error) {
        console.error('[MARCADORES] Erro ao adicionar marcadores:', error);
        resolve(mapaBase);
      }
    });
  }

  /**
   * Redimensiona imagem de alta resolução para exibição otimizada
   */
  private async redimensionarImagemParaExibicao(
    imagemAltaResolucao: string,
    larguraExibicao: number,
    alturaExibicao: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log(
          '[OTIMIZAÇÃO] Redimensionando imagem para exibição:',
          `${larguraExibicao}x${alturaExibicao}`,
        );

        const canvas = document.createElement('canvas');
        canvas.width = larguraExibicao;
        canvas.height = alturaExibicao;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.warn('[OTIMIZAÇÃO] Contexto do canvas não disponível');
          resolve(imagemAltaResolucao);
          return;
        }

        const img = new Image();

        img.onload = () => {
          console.log('[OTIMIZAÇÃO] Imagem carregada, redimensionando...');

          // Usar algoritmo de redimensionamento suave para melhor qualidade
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Desenhar imagem redimensionada com alta qualidade
          ctx.drawImage(img, 0, 0, larguraExibicao, alturaExibicao);

          // Converter para data URL com MÁXIMA qualidade
          const imagemOtimizada = canvas.toDataURL('image/png', 1.0); // 100% qualidade para nitidez máxima
          console.log(
            '[OTIMIZAÇÃO] Redimensionamento com qualidade máxima concluído!',
          );
          resolve(imagemOtimizada);
        };

        img.onerror = () => {
          console.error(
            '[OTIMIZAÇÃO] Erro ao carregar imagem para redimensionamento',
          );
          resolve(imagemAltaResolucao);
        };

        img.src = imagemAltaResolucao;
      } catch (error) {
        console.error('[OTIMIZAÇÃO] Erro no redimensionamento:', error);
        resolve(imagemAltaResolucao);
      }
    });
  }

  /**
   * Adiciona marcadores na imagem com dimensões fixas
   */
  private async adicionarMarcadoresNaImagemFixa(
    mapaBase: string,
    larguraFixa: number,
    alturaFixa: number,
  ): Promise<string> {
    return new Promise((resolve) => {
      try {
        console.log(
          '[MARCADORES] Adicionando marcadores na imagem com dimensões fixas...',
        );

        const canvas = document.createElement('canvas');
        canvas.width = larguraFixa;
        canvas.height = alturaFixa;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.warn('[MARCADORES] Contexto do canvas não disponível');
          resolve(mapaBase);
          return;
        }

        const img = new Image();

        img.onload = () => {
          console.log('[MARCADORES] Imagem base carregada');

          // Desenhar imagem base
          ctx.drawImage(img, 0, 0, larguraFixa, alturaFixa);

          // Adicionar marcadores se existirem
          const map = this.mapaService.getMapa();
          if (
            !map ||
            !this.markerOverlays ||
            Object.keys(this.markerOverlays).length === 0
          ) {
            console.log('[MARCADORES] Nenhum marcador para adicionar');
            resolve(canvas.toDataURL('image/png', 0.95));
            return;
          }

          let marcadoresDesenhados = 0;

          // Desenhar cada marcador nas coordenadas corretas
          Object.entries(this.markerOverlays).forEach(([coordKey, overlay]) => {
            try {
              const position = overlay.getPosition();
              if (!position) return;

              // Converter coordenadas para pixels na imagem com dimensões fixas
              const pixel = map.getPixelFromCoordinate(position);
              if (!pixel) return;

              // Ajustar posição para as dimensões de alta resolução
              const tamanhoAtualMapa = map.getSize();
              if (!tamanhoAtualMapa) return;

              const escalaX = larguraFixa / tamanhoAtualMapa[0];
              const escalaY = alturaFixa / tamanhoAtualMapa[1];

              const pixelAjustado = [pixel[0] * escalaX, pixel[1] * escalaY];

              // Desenhar marcador com tamanho ajustado para alta resolução
              this.desenharMarcadorAltaResolucao(
                ctx,
                pixelAjustado[0],
                pixelAjustado[1],
                Math.max(escalaX, escalaY),
              );
              marcadoresDesenhados++;
            } catch (e) {
              console.warn('[MARCADORES] Erro ao desenhar marcador:', e);
            }
          });

          console.log(
            `[MARCADORES] ${marcadoresDesenhados} marcadores adicionados`,
          );
          const dataURL = canvas.toDataURL('image/png', 0.95);
          resolve(dataURL);
        };

        img.onerror = () => {
          console.error('[MARCADORES] Erro ao carregar imagem do mapa base');
          resolve(mapaBase);
        };

        img.src = mapaBase;
      } catch (error) {
        console.error('[MARCADORES] Erro ao adicionar marcadores:', error);
        resolve(mapaBase);
      }
    });
  }

  /**
   * Desenha marcador em alta resolução com escala ajustada
   */
  private desenharMarcadorAltaResolucao(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    escala: number,
  ): void {
    // Ajustar tamanho do marcador baseado na escala de alta resolução
    const markerHeight = 41 * escala;
    const markerWidth = 25 * escala;
    const lineWidth = Math.max(2 * escala, 1);

    const pinX = x;
    const pinY = y - markerHeight;

    ctx.save();

    // Sombra do marcador
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y, markerWidth / 2, 5 * escala, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Corpo do marcador
    ctx.fillStyle = '#2A81CB';
    ctx.strokeStyle = '#1A5490';
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(pinX, y);
    ctx.bezierCurveTo(
      pinX - markerWidth / 2,
      pinY + markerHeight * 0.6,
      pinX - markerWidth / 2,
      pinY + markerHeight * 0.3,
      pinX,
      pinY,
    );
    ctx.bezierCurveTo(
      pinX + markerWidth / 2,
      pinY + markerHeight * 0.3,
      pinX + markerWidth / 2,
      pinY + markerHeight * 0.6,
      pinX,
      y,
    );
    ctx.fill();
    ctx.stroke();

    // Ponto central do marcador
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(pinX, pinY + markerHeight * 0.25, markerWidth / 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }

  private desenharMarcador(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
  ): void {
    const markerHeight = 41;
    const markerWidth = 25;

    const pinX = x;
    const pinY = y - markerHeight;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y, markerWidth / 2, 5, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#2A81CB';
    ctx.strokeStyle = '#1A5490';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(pinX, y);
    ctx.bezierCurveTo(
      pinX - markerWidth / 2,
      pinY + markerHeight * 0.6,
      pinX - markerWidth / 2,
      pinY + markerHeight * 0.3,
      pinX,
      pinY,
    );
    ctx.bezierCurveTo(
      pinX + markerWidth / 2,
      pinY + markerHeight * 0.3,
      pinX + markerWidth / 2,
      pinY + markerHeight * 0.6,
      pinX,
      y,
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(pinX, pinY + markerHeight * 0.25, markerWidth / 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Captura o mapa em resolução fixa independente do monitor
   */
  private async capturarMapaResolucaoFixa(): Promise<string | null> {
    const mapaPrincipal = this.mapaService.getMapa();
    if (!mapaPrincipal) {
      console.warn('[CAPTURA] Mapa principal não disponível');
      return null;
    }

    try {
      console.log(
        `[CAPTURA] Iniciando captura em resolução fixa (target ${this.capturaConfig.targetDpi} DPI)...`,
      );

      const dimensoesAltaResolucao = this.calcularDimensoesImpressao();
      const dimensoesExibicao = this.calcularDimensoesExibicao(
        dimensoesAltaResolucao,
      );

      console.log(
        '[CAPTURA] Dimensões alta resolução:',
        dimensoesAltaResolucao,
      );
      console.log('[CAPTURA] Dimensões para exibição:', dimensoesExibicao);

      const temporario = this.criarMapaTemporarioParaCaptura(
        mapaPrincipal,
        dimensoesAltaResolucao,
      );
      if (!temporario) {
        console.warn(
          '[CAPTURA] Não foi possível criar mapa temporário para impressão',
        );
        return null;
      }

      const { mapaTemporario, container, limpar, infoBasemap } = temporario;
      console.log(
        `[CAPTURA] Mapa temporário criado usando basemap: ${infoBasemap}`,
      );

      try {
        await this.aguardarRenderizacaoCompletaMapa(mapaTemporario, 20000);
        console.log(
          '[CAPTURA] Renderização completa do mapa temporário alcançada.',
        );

        const mapCanvas = document.createElement('canvas');
        mapCanvas.width = dimensoesAltaResolucao.width;
        mapCanvas.height = dimensoesAltaResolucao.height;
        const mapContext = mapCanvas.getContext('2d');

        if (!mapContext) {
          console.warn('[CAPTURA] Contexto do canvas não disponível');
          return null;
        }

        mapContext.fillStyle = '#ffffff';
        mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

        const imagemBase = await this.capturarCanvasCamadas(
          mapContext,
          mapCanvas.width,
          mapCanvas.height,
          container,
        );
        if (!imagemBase) {
          console.warn(
            '[CAPTURA] Falha na captura das camadas do mapa temporário',
          );
          return null;
        }

        let imagemAltaResolucao: string;
        try {
          imagemAltaResolucao = await this.adicionarMarcadoresNaImagemFixa(
            imagemBase,
            dimensoesAltaResolucao.width,
            dimensoesAltaResolucao.height,
          );
          console.log(
            '[CAPTURA] Captura em alta resolução concluída, iniciando otimização...',
          );
        } catch (error) {
          console.error(
            '[CAPTURA] Erro ao adicionar marcadores, usando imagem base:',
            error,
          );
          imagemAltaResolucao = imagemBase;
        }

        try {
          const imagemOtimizada = await this.redimensionarImagemParaExibicao(
            imagemAltaResolucao,
            dimensoesExibicao.width,
            dimensoesExibicao.height,
          );
          console.log('[CAPTURA] Imagem otimizada para exibição!');
          return imagemOtimizada;
        } catch (error) {
          console.warn(
            '[CAPTURA] Falha ao otimizar imagem, retornando alta resolução:',
            error,
          );
          return imagemAltaResolucao;
        }
      } finally {
        limpar();
      }
    } catch (error) {
      console.error('[CAPTURA] Erro ao configurar captura:', error);
      return null;
    }
  }

  private criarMapaTemporarioParaCaptura(
    mapaPrincipal: OlMap,
    dimensoes: { width: number; height: number },
  ): {
    mapaTemporario: OlMap;
    container: HTMLDivElement;
    limpar: () => void;
    infoBasemap: string;
  } | null {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-100000px';
    container.style.top = '0';
    container.style.width = `${dimensoes.width}px`;
    container.style.height = `${dimensoes.height}px`;
    container.style.pointerEvents = 'none';
    container.style.opacity = '0';
    container.style.overflow = 'hidden';
    container.setAttribute('data-impressao', 'true');
    document.body.appendChild(container);

    const originalLayers = mapaPrincipal.getLayers().getArray();
    if (!originalLayers.length) {
      console.warn('[CAPTURA] Nenhuma camada encontrada no mapa principal');
      container.remove();
      return null;
    }

    const clonedLayers: BaseLayer[] = [];
    let infoBasemap = 'Desconhecido';

    originalLayers.forEach((layer, index) => {
      if (
        typeof (layer as any).getVisible === 'function' &&
        !(layer as any).getVisible()
      ) {
        return;
      }

      let clonedLayer: BaseLayer | null = null;

      if (index === 0) {
        const resultadoBasemap = this.clonarBasemapParaCaptura(
          layer as BaseLayer,
        );
        clonedLayer = resultadoBasemap.layer;
        infoBasemap = resultadoBasemap.info;
      } else if (typeof (layer as any).clone === 'function') {
        try {
          clonedLayer = (layer as any).clone();
        } catch (error) {
          console.warn(
            '[CAPTURA] Falha ao clonar camada secundária, ignorando:',
            error,
          );
        }
      }

      if (clonedLayer) {
        try {
          clonedLayer.setOpacity?.(layer.getOpacity?.() ?? 1);
        } catch {}
        try {
          clonedLayer.setVisible?.(true);
        } catch {}
        try {
          clonedLayer.setZIndex?.(layer.getZIndex?.() ?? index);
        } catch {}
        clonedLayers.push(clonedLayer);
      }
    });

    if (!clonedLayers.length) {
      console.warn('[CAPTURA] Nenhuma camada pôde ser clonada para impressão');
      container.remove();
      return null;
    }

    const originalView = mapaPrincipal.getView();
    const view = new OlView({
      center: originalView.getCenter(),
      projection: originalView.getProjection(),
      rotation: originalView.getRotation(),
      enableRotation: originalView.get('enableRotation') ?? true,
      minZoom: originalView.getMinZoom() ?? 0,
      maxZoom: Math.max(originalView.getMaxZoom() ?? 20, 22),
      constrainResolution: false,
    });

    const tamanhoOriginal = mapaPrincipal.getSize() ?? [
      dimensoes.width,
      dimensoes.height,
    ];
    const extentOriginal = originalView.calculateExtent(tamanhoOriginal);
    view.fit(extentOriginal, {
      size: [dimensoes.width, dimensoes.height],
      nearest: true,
    });

    const desiredPixelRatio = Math.max(1, this.capturaConfig.targetDpi / 400);
    const basePixelRatio =
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const pixelRatioBoost = Math.min(
      this.capturaConfig.maxPixelRatio,
      Math.max(1, basePixelRatio, desiredPixelRatio),
    );

    const mapaTemporario = new OlMap({
      target: container,
      layers: clonedLayers,
      view,
      pixelRatio: pixelRatioBoost,
      controls: [],
    });

    const limpar = () => {
      try {
        mapaTemporario.setTarget(undefined as any);
      } catch {}
      try {
        (mapaTemporario as any).dispose?.();
      } catch {}
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };

    return { mapaTemporario, container, limpar, infoBasemap };
  }

  private clonarBasemapParaCaptura(layer: BaseLayer): {
    layer: BaseLayer | null;
    info: string;
  } {
    const source = (layer as any).getSource?.();
    let info = 'Desconhecido';

    if (source instanceof XYZ) {
      const urls = source.getUrls?.() ?? undefined;
      if (urls && urls.length > 0) {
        info = urls[0];
      }

      const tileGrid = source.getTileGrid?.();
      // Evita solicitar níveis maiores que o suportado pelos provedores (OSM costuma ir até 19)
      const maxZoom = Math.min(tileGrid?.getMaxZoom?.() ?? 22, 19);
      const minZoom = tileGrid?.getMinZoom?.() ?? 0;
      const attributions = source.getAttributions?.();
      const tilePixelRatio = Math.min(
        this.capturaConfig.maxPixelRatio,
        Math.max(1, this.capturaConfig.targetDpi / 400),
      );

      const cloneSourceOptions: any = {
        crossOrigin: 'anonymous',
        maxZoom,
        minZoom,
        tilePixelRatio,
      };

      if (urls && urls.length === 1) {
        cloneSourceOptions.url = urls[0];
      } else if (urls && urls.length > 1) {
        cloneSourceOptions.urls = urls;
      } else if (typeof (source as any).getUrl === 'function') {
        const singleUrl = (source as any).getUrl();
        if (singleUrl) {
          cloneSourceOptions.url = singleUrl;
          info = singleUrl;
        }
      }

      if (attributions) {
        cloneSourceOptions.attributions = attributions;
      }

      const cloneSource = new XYZ(cloneSourceOptions);
      const tileLoadFunction = source.getTileLoadFunction?.();
      if (tileLoadFunction) {
        cloneSource.setTileLoadFunction(tileLoadFunction);
      }

      const transition = (layer as any).get('transition');
      const cloneLayer = new TileLayer({ source: cloneSource });
      if (transition !== undefined) {
        cloneLayer.set('transition', transition);
      }

      return { layer: cloneLayer, info };
    }

    if (typeof (layer as any).clone === 'function') {
      try {
        const clone = (layer as any).clone();
        return { layer: clone, info };
      } catch (error) {
        console.warn('[CAPTURA] Falha ao clonar basemap genérico:', error);
      }
    }

    return { layer: null, info };
  }

  private async aguardarRenderizacaoCompletaMapa(
    mapa: OlMap,
    timeoutMs = 15000,
  ): Promise<void> {
    const fontes: any[] = [];
    mapa.getLayers().forEach((layer: any) => {
      const source = layer.getSource?.();
      if (source?.on && source?.un) {
        fontes.push(source);
      }
    });

    await new Promise<void>((resolve) => {
      let pendentes = 0;
      let resolvido = false;

      const finalizar = () => {
        if (!resolvido && pendentes === 0) {
          resolvido = true;
          cleanup();
          resolve();
        }
      };

      const onStart = () => {
        pendentes++;
      };

      const onEnd = () => {
        pendentes = Math.max(0, pendentes - 1);
        if (pendentes === 0) {
          setTimeout(finalizar, 120);
        }
      };

      const onError = () => {
        pendentes = Math.max(0, pendentes - 1);
        if (pendentes === 0) {
          setTimeout(finalizar, 120);
        }
      };

      const onRenderComplete = () => {
        if (pendentes === 0) {
          setTimeout(finalizar, 120);
        }
      };

      const cleanup = () => {
        clearTimeout(fallbackTimeout);
        mapa.un('rendercomplete', onRenderComplete);
        fontes.forEach((fonte) => {
          fonte.un?.('tileloadstart', onStart);
          fonte.un?.('tileloadend', onEnd);
          fonte.un?.('tileloaderror', onError);
        });
      };

      const fallbackTimeout = setTimeout(() => {
        if (!resolvido) {
          console.warn(
            '[CAPTURA] Timeout aguardando carregamento completo dos tiles, prosseguindo mesmo assim.',
          );
          resolvido = true;
          cleanup();
          resolve();
        }
      }, timeoutMs);

      mapa.on('rendercomplete', onRenderComplete);

      fontes.forEach((fonte) => {
        fonte.on?.('tileloadstart', onStart);
        fonte.on?.('tileloadend', onEnd);
        fonte.on?.('tileloaderror', onError);
      });

      if (!fontes.length) {
        mapa.once('rendercomplete', () => {
          cleanup();
          resolve();
        });
      }

      mapa.renderSync();
    });
  }

  /**
   * Calcula as dimensões ideais para impressão (independente do monitor)
   */
  private calcularDimensoesImpressao(): { width: number; height: number } {
    const larguraTemplate = 297; // mm (A4 landscape)
    const alturaTemplate = 210; // mm (A4 portrait)

    const margemHorizontal = 40; // mm
    const margemVertical = 60; // mm

    const larguraDisponivel = larguraTemplate - margemHorizontal;
    const alturaDisponivel = alturaTemplate - margemVertical;

    const pixelsPorMm = this.capturaConfig.targetDpi / 25.4;

    let width = Math.round(larguraDisponivel * pixelsPorMm);
    let height = Math.round(alturaDisponivel * pixelsPorMm);

    const maxPixels = 24000000; // 24 megapixels (~96 MB em RGBA)
    const totalPixels = width * height;
    if (totalPixels > maxPixels) {
      const fatorReducao = Math.sqrt(maxPixels / totalPixels);
      width = Math.round(width * fatorReducao);
      height = Math.round(height * fatorReducao);
      console.warn(
        '[CAPTURA] Dimensões reduzidas automaticamente para evitar estouro de memória:',
        { width, height },
      );
    }

    return { width, height };
  }

  /**
   * Calcula dimensões para exibição no template (alta qualidade, otimizada)
   */
  private calcularDimensoesExibicao(dimensoesAltas?: {
    width: number;
    height: number;
  }): { width: number; height: number } {
    const baseDimensoes = dimensoesAltas ?? this.calcularDimensoesImpressao();
    const fatorReducao = Math.min(
      1,
      Math.max(0.3, this.capturaConfig.exibicaoScale),
    );

    return {
      width: Math.round(baseDimensoes.width * fatorReducao),
      height: Math.round(baseDimensoes.height * fatorReducao),
    };
  }

  /**
   * Captura os canvas das camadas do mapa
   */
  private async capturarCanvasCamadas(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    mapElement: HTMLElement,
  ): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        // Estratégia aprimorada para capturar TODAS as camadas incluindo vetoriais
        const canvases: HTMLCanvasElement[] = [];

        // 1. Buscar canvas das camadas específicas do OpenLayers
        const layerCanvases = Array.from(
          mapElement.querySelectorAll('.ol-layer canvas'),
        ) as HTMLCanvasElement[];
        console.log(
          '[CAPTURA] Canvas das camadas ol-layer encontrados:',
          layerCanvases.length,
        );
        canvases.push(...layerCanvases);

        // 2. Buscar canvas das camadas de overlay e vetoriais
        const overlayCanvases = Array.from(
          mapElement.querySelectorAll(
            '.ol-overlay canvas, .ol-overlaycontainer canvas',
          ),
        ) as HTMLCanvasElement[];
        console.log(
          '[CAPTURA] Canvas de overlays encontrados:',
          overlayCanvases.length,
        );
        canvases.push(...overlayCanvases);

        // 3. Buscar todos os canvas como fallback (remove duplicatas)
        const allCanvases = Array.from(
          mapElement.querySelectorAll('canvas'),
        ) as HTMLCanvasElement[];
        console.log('[CAPTURA] Total de canvas no mapa:', allCanvases.length);

        // Adicionar canvas não encontrados ainda
        allCanvases.forEach((canvas) => {
          if (!canvases.includes(canvas)) {
            canvases.push(canvas);
          }
        });

        console.log(
          '[CAPTURA] Total de canvas únicos para processar:',
          canvases.length,
        );

        const processados = new Set<HTMLCanvasElement>();
        let canvasProcessados = 0;

        const canvasPrincipal = canvases.reduce(
          (best, current) => {
            if (!best) return current;
            const bestArea = best.width * best.height;
            const currentArea = current.width * current.height;
            return currentArea > bestArea ? current : best;
          },
          null as HTMLCanvasElement | null,
        );

        const isWhiteOverlay = (
          canvas: HTMLCanvasElement,
          isLargest: boolean,
        ): boolean => {
          try {
            // Nunca classificar o maior canvas como overlay
            if (isLargest) return false;
            const ctx = canvas.getContext('2d', {
              willReadFrequently: true,
            } as any) as CanvasRenderingContext2D | null;
            if (!ctx) return false;
            const w = Math.min(40, canvas.width);
            const h = Math.min(40, canvas.height);
            const data = ctx.getImageData(0, 0, w, h).data;
            let sumLum = 0,
              sumA = 0,
              n = w * h;
            let sumLum2 = 0;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i],
                g = data[i + 1],
                b = data[i + 2],
                a = data[i + 3];
              const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              sumLum += lum;
              sumLum2 += lum * lum;
              sumA += a;
            }
            const avgA = sumA / n,
              avgLum = sumLum / n;
            const variance = Math.max(0, sumLum2 / n - avgLum * avgLum);
            // Overlay branco típico: quase puro branco, baixíssima variação
            return avgLum > 252 && variance < 5 && avgA > 10;
          } catch {
            return false;
          }
        };

        const desenharCanvas = (
          canvas: HTMLCanvasElement,
          index: number,
          forcarAlpha?: number,
        ) => {
          if (canvas.width > 0 && canvas.height > 0) {
            try {
              // Buscar opacity tanto da camada quanto do overlay
              let opacity = 1;
              const layerElement = canvas.closest('.ol-layer') as HTMLElement;
              const overlayElement = canvas.closest(
                '.ol-overlay, .ol-overlaycontainer',
              ) as HTMLElement;

              if (layerElement) {
                const parsed = parseFloat(layerElement.style.opacity || '1');
                opacity = Number.isFinite(parsed) ? parsed : 1;
              } else if (overlayElement) {
                const parsed = parseFloat(overlayElement.style.opacity || '1');
                opacity = Number.isFinite(parsed) ? parsed : 1;
              }

              const canvasType = layerElement
                ? 'layer'
                : overlayElement
                  ? 'overlay'
                  : 'unknown';
              console.log(
                `[CAPTURA] Processando canvas ${index} (${canvasType}): ${canvas.width}x${canvas.height}, opacity: ${opacity}`,
              );

              // Ignorar efeitos de fade/opacity do DOM e também overlays brancos que lavam o mapa
              if (
                (opacity >= 0 && opacity <= 1) ||
                typeof forcarAlpha === 'number'
              ) {
                const isLargest = canvas === canvasPrincipal;
                if (isWhiteOverlay(canvas, isLargest)) {
                  console.log(
                    `[CAPTURA] Canvas ${index} identificado como overlay branco - ignorado`,
                  );
                  return;
                }
                const previousGlobalAlpha = context.globalAlpha;
                const previousComposite = context.globalCompositeOperation;
                context.globalCompositeOperation = 'source-over';
                context.globalAlpha = 1;

                // Configurações de MÁXIMA qualidade para renderização
                const previousImageSmoothingEnabled =
                  context.imageSmoothingEnabled;
                const previousImageSmoothingQuality =
                  context.imageSmoothingQuality;

                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';

                // Estratégia de redimensionamento aprimorada
                try {
                  if (canvas.width === width && canvas.height === height) {
                    // Tamanho exato - cópia direta
                    context.drawImage(canvas, 0, 0);
                  } else {
                    // Redimensionamento com máxima qualidade
                    context.drawImage(
                      canvas,
                      0,
                      0,
                      canvas.width,
                      canvas.height,
                      0,
                      0,
                      width,
                      height,
                    );
                  }
                  canvasProcessados++;
                  console.log(
                    `[CAPTURA] Canvas ${index} (${canvasType}) processado com sucesso`,
                  );
                } catch (drawError) {
                  console.warn(
                    `[CAPTURA] Erro ao desenhar canvas ${index}:`,
                    drawError,
                  );
                  // Tentar método alternativo mais tolerante
                  try {
                    context.drawImage(
                      canvas,
                      0,
                      0,
                      Math.min(canvas.width, width),
                      Math.min(canvas.height, height),
                    );
                    canvasProcessados++;
                    console.log(
                      `[CAPTURA] Canvas ${index} processado com método alternativo`,
                    );
                  } catch (altError) {
                    console.warn(
                      `[CAPTURA] Falha completa no canvas ${index}:`,
                      altError,
                    );
                  }
                }

                // Restaurar configurações
                context.imageSmoothingEnabled = previousImageSmoothingEnabled;
                context.imageSmoothingQuality = previousImageSmoothingQuality;
                context.globalAlpha = previousGlobalAlpha;
                context.globalCompositeOperation = previousComposite;
                processados.add(canvas);
              } else {
                console.log(
                  `[CAPTURA] Canvas ${index} ignorado por opacity baixa: ${opacity}`,
                );
              }
            } catch (e) {
              console.warn(
                `[CAPTURA] Erro geral ao processar canvas ${index}:`,
                e,
              );
            }
          } else {
            console.log(
              `[CAPTURA] Canvas ${index} ignorado por dimensões inválidas: ${canvas.width}x${canvas.height}`,
            );
          }
        };

        if (canvasPrincipal) {
          console.log('[CAPTURA] Desenhando canvas principal com alpha 1');
          desenharCanvas(canvasPrincipal, canvases.indexOf(canvasPrincipal), 1);
        }

        canvases.forEach((canvas, index) => {
          if (canvas !== canvasPrincipal || !processados.has(canvas)) {
            desenharCanvas(canvas, index);
          }
        });

        console.log(
          `[CAPTURA] Total de canvas processados: ${processados.size}`,
        );

        if (processados.size === 0 && canvasPrincipal) {
          // fallback: nunca retornar vazio, desenhar ao menos o canvas principal
          try {
            context.globalAlpha = 1;
            context.globalCompositeOperation = 'source-over';
            context.drawImage(
              canvasPrincipal,
              0,
              0,
              canvasPrincipal.width,
              canvasPrincipal.height,
              0,
              0,
              width,
              height,
            );
            console.warn(
              '[CAPTURA] Nenhum canvas válido processado, fallback desenhando canvas principal',
            );
          } catch {}
        }

        if (processados.size === 0 && !canvasPrincipal) {
          console.warn('[CAPTURA] Nenhum canvas foi processado');
          resolve(null);
          return;
        }

        const dataURL = context.canvas.toDataURL('image/png', 0.95);
        resolve(dataURL);
      } catch (error) {
        console.error('[CAPTURA] Erro ao capturar canvas das camadas:', error);
        resolve(null);
      }
    });
  }

  private async capturarImagemMapa(): Promise<string | null> {
    return new Promise((resolve) => {
      const map = this.mapaService.getMapa();
      if (!map) {
        console.warn('[CAPTURA] Mapa não disponível');
        resolve(null);
        return;
      }

      try {
        let renderHandled = false;

        map.once('rendercomplete', () => {
          if (renderHandled) return;
          renderHandled = true;

          try {
            const size = map.getSize();
            if (!size) {
              console.warn('[CAPTURA] Tamanho do mapa não disponível');
              resolve(null);
              return;
            }

            const mapCanvas = document.createElement('canvas');
            mapCanvas.width = size[0];
            mapCanvas.height = size[1];
            const mapContext = mapCanvas.getContext('2d');

            if (!mapContext) {
              console.warn('[CAPTURA] Contexto do canvas não disponível');
              resolve(null);
              return;
            }

            mapContext.fillStyle = '#ffffff';
            mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
            const mapTarget = map.getTarget();
            let mapElement: HTMLElement | null = null;

            if (typeof mapTarget === 'string') {
              mapElement = document.getElementById(mapTarget);
            } else if (mapTarget instanceof HTMLElement) {
              mapElement = mapTarget;
            }

            if (!mapElement) {
              console.warn('[CAPTURA] Elemento do mapa não encontrado');
              resolve(null);
              return;
            }

            const layers = map.getLayers().getArray();
            const layersVisible = layers.filter((l) => l.getVisible());

            let canvases: HTMLCanvasElement[] = [];

            const seletores = [
              '.ol-layer canvas',
              'canvas.ol-unselectable',
              '.ol-viewport canvas',
              'canvas',
            ];

            for (const seletor of seletores) {
              const found = Array.from(
                mapElement.querySelectorAll(seletor),
              ) as HTMLCanvasElement[];
              if (found.length > 0) {
                canvases = found;
                break;
              }
            }

            if (canvases.length === 0) {
              console.warn(
                '[CAPTURA] Nenhum canvas encontrado com seletores padrão',
              );
              resolve(null);
              return;
            }

            let canvasProcessados = 0;
            let canvasComConteudo = 0;

            // Preferir o maior canvas (basemap) e evitar overlays brancos
            const baseCanvas = canvases.reduce(
              (best, c) => {
                if (!best) return c;
                return c.width * c.height > best.width * best.height ? c : best;
              },
              null as HTMLCanvasElement | null,
            );

            const isWhiteOverlay = (canvas: HTMLCanvasElement): boolean => {
              try {
                const ctx = canvas.getContext('2d', {
                  willReadFrequently: true,
                } as any) as CanvasRenderingContext2D | null;
                if (!ctx) return false;
                const w = Math.min(40, canvas.width);
                const h = Math.min(40, canvas.height);
                const data = ctx.getImageData(0, 0, w, h).data;
                let sumLum = 0,
                  sumA = 0,
                  n = w * h;
                for (let i = 0; i < data.length; i += 4) {
                  const r = data[i],
                    g = data[i + 1],
                    b = data[i + 2],
                    a = data[i + 3];
                  sumLum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
                  sumA += a;
                }
                const avgLum = sumLum / n;
                const avgA = sumA / n;
                return avgLum > 240 && avgA > 10;
              } catch {
                return false;
              }
            };

            // Desenhar primeiro apenas o baseCanvas
            if (baseCanvas) {
              try {
                mapContext.drawImage(baseCanvas, 0, 0);
                canvasProcessados++;
              } catch {}
            }

            canvases.forEach((canvas, index) => {
              if (baseCanvas && canvas === baseCanvas) return; // já desenhado
              if (canvas.width > 0 && canvas.height > 0) {
                try {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    const imageData = ctx.getImageData(
                      0,
                      0,
                      Math.min(canvas.width, 50),
                      Math.min(canvas.height, 50),
                    );
                    const hasContent = imageData.data.some((value, idx) => {
                      if (idx % 4 === 3) {
                        return value > 0;
                      }
                      return false;
                    });

                    if (hasContent) {
                      canvasComConteudo++;
                    }
                  }

                  if (
                    canvas.style.display !== 'none' &&
                    !isWhiteOverlay(canvas)
                  ) {
                    mapContext.drawImage(canvas, 0, 0);
                    canvasProcessados++;
                  }
                } catch (e) {
                  console.error(
                    `[CAPTURA] Erro ao processar canvas ${index}:`,
                    e,
                  );
                }
              }
            });

            if (canvasProcessados === 0) {
              console.warn(
                '[CAPTURA] Nenhum canvas foi processado com sucesso',
              );
              resolve(null);
              return;
            }

            const dataURL = mapCanvas.toDataURL('image/png', 0.95);

            if (dataURL.length < 1000) {
              console.warn(
                '[CAPTURA] Imagem capturada parece estar vazia (muito pequena)',
              );
              resolve(null);
              return;
            }

            resolve(dataURL);
          } catch (error) {
            console.error('[CAPTURA] Erro durante captura:', error);
            resolve(null);
          }
        });

        map.render();

        const timeoutId = setTimeout(() => {
          if (!renderHandled) {
            console.warn(
              '[CAPTURA] Timeout (15s) - renderização não completou',
            );
            renderHandled = true;
            resolve(null);
          }
        }, 15000);

        map.once('rendercomplete', () => {
          clearTimeout(timeoutId);
        });
      } catch (error) {
        console.error('[CAPTURA] Erro ao configurar captura:', error);
        resolve(null);
      }
    });
  }

  /**
   * Parse de transformações CSS para aplicar no canvas
   */
  private parseTransform(transform: string): any {
    if (transform === 'none' || !transform) return null;

    const match = transform.match(/matrix\((.+)\)/);
    if (match) {
      const values = match[1].split(',').map((v) => parseFloat(v.trim()));
      if (values.length === 6) {
        return {
          a: values[0],
          b: values[1],
          c: values[2],
          d: values[3],
          e: values[4],
          f: values[5],
        };
      }
    }
    return null;
  }

  private substituirVariaveisTemplate(
    template: string,
    data: any,
    mapImage: string,
    sequencia: string = '',
    registro?: RegistroSelecionado,
  ): string {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR');

    let mapContent = '';
    if (
      mapImage &&
      mapImage.startsWith('data:image/') &&
      mapImage.length > 1000
    ) {
      console.log(
        '[TEMPLATE] Criando tag img com resolução fixa para impressão...',
      );
      // CSS otimizado para preenchimento total da área do mapa independente do monitor
      mapContent = `<img src="${mapImage}" 
        style="
          width: 100% !important; 
          height: 100% !important; 
          object-fit: cover !important; 
          object-position: center !important;
          border: 1px solid #ccc; 
          display: block !important; 
          margin: 0 !important; 
          padding: 0 !important;
          max-width: none !important;
          max-height: none !important;
          min-width: 100% !important;
          min-height: 100% !important;
        " 
        alt="Mapa capturado com resolução fixa" 
        onload="console.log('Imagem do mapa carregada no template - resolução fixa')" 
        onerror="console.error('Erro ao carregar imagem do mapa no template')"/>`;
    } else {
      console.warn('[TEMPLATE] Usando fallback para imagem do mapa');
      mapContent = `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border: 2px dashed #ccc; background-color: #f9f9f9;">
          <div style="text-align: center; color: #666;">
            <p><strong>Erro na captura do mapa</strong></p>
            <p>Imagem não capturada</p>
            <p style="font-size: 12px;">Debug: ${mapImage ? `Imagem inválida (${mapImage.length} chars)` : 'Imagem nula'}</p>
            <p style="font-size: 10px;">Monitor: ${window.screen.width}x${window.screen.height}</p>
          </div>
        </div>`;
    }

    const legendItems = this.croquiConfig?.imprimirLegenda
      ? this.gerarItensLegenda(data)
      : '';

    const featureData = this.gerarDadosFeature(data);

    const variaveis: { [key: string]: string } = {
      '{{MAP_TITLE}}': `Croqui de Vistoria - Matrícula ${data.matricula || 'N/A'}`,
      '{{MAP_SUBTITLE}}': `${data.nome || 'Nome não informado'}`,
      '{{MAP_CONTENT}}': mapContent,
      '{{AUTHOR}}': 'Sistema WebGIS',
      '{{DATE}}': `${dataFormatada} ${horaFormatada}`,
      '{{SCALE}}': '1:1000',
      '{{PROJECTION}}': 'EPSG:4326',
      '{{DATUM}}': 'WGS84',
      '{{DATA_SOURCE}}': 'Base Cartográfica Municipal',
      '{{PAGE}}': '1/1',
      '{{LOGO}}': 'LOGO',
      '{{SEQUENCIA}}': this.tipoConsulta === 'SS' && sequencia ? sequencia : '',

      '{{COORD_TOP_LEFT}}': '-40.123456, -20.654321',
      '{{COORD_TOP_RIGHT}}': '-40.098765, -20.654321',
      '{{COORD_BOTTOM_LEFT}}': '-40.123456, -20.678901',
      '{{COORD_BOTTOM_RIGHT}}': '-40.098765, -20.678901',

      '{{SCALE_1}}': '100m',
      '{{SCALE_2}}': '200m',
      '{{SCALE_3}}': '300m',
      '{{SCALE_4}}': '400m',
      '{{SCALE_5}}': '500m',
      '{{SCALE_UNIT}}': 'metros',

      '{{LEGEND_ITEMS}}':
        legendItems ||
        '<p style="color: red;">Nenhuma camada encontrada para legenda</p>',

      '{{FEATURE_DATA}}':
        featureData || '<p style="color: #999;">Dados não disponíveis</p>',
      '{{SS_DATA}}': this.tipoConsulta === 'SS' ? featureData : '',
      '{{OBSERVACOES}}':
        data && typeof data.observacoes === 'string' && data.observacoes.trim()
          ? data.observacoes
          : (registro && this.isRegistroConsulta(registro)
              ? registro.dadosCompletos?.obs
              : null) || '',

      // ===== Variáveis do Template SS =====
      // Cabeçalho
      '{{SS_TITLE}}': 'SOLICITAÇÃO DE SERVIÇO - CESAN',
      '{{SS_SUBTITLE}}': '',
      '{{SS_NUMBER}}':
        registro && this.isRegistroConsulta(registro)
          ? `${registro.codigo}/${registro.seq_ss}`
          : data.ref_atendimento || data.cd_atendimento || 'N/A',

      // Dados da SS
      '{{OPERACIONAL}}':
        (registro && this.isRegistroConsulta(registro)
          ? registro.dadosCompletos?.operacional
          : null) || '',
      '{{SERVICO_COD}}': '',
      '{{SERVICO_DESC}}':
        (registro && this.isRegistroConsulta(registro)
          ? registro.dadosCompletos?.servico
          : null) || '',
      '{{UNIDADE}}':
        (registro && this.isRegistroConsulta(registro)
          ? registro.dadosCompletos?.unidade
          : null) ||
        data.localidade ||
        '',
      '{{REQUEST_DATE}}': '',
      '{{DUE_DATE}}': '',
      '{{DESCRIPTION}}':
        (registro && this.isRegistroConsulta(registro)
          ? registro.dadosCompletos?.obs
          : null) || '',

      // Dados do Cliente
      '{{CLIENT_NAME}}': data.nome || 'Não informado',
      '{{CPF_CNPJ}}':
        (registro && this.isRegistroConsulta(registro)
          ? registro.dadosCompletos?.cpfCnpj
          : null) || '',
      '{{MATRICULA}}': data.matricula || 'N/A',
      '{{HIDROMETRO}}': data.hd || 'N/A',
      '{{LOGRADOURO}}': data.logradouro || 'Não informado',
      '{{NUMERO}}': data.numero || 'S/N',
      '{{TELEFONE}}':
        (registro && this.isRegistroConsulta(registro)
          ? registro.dadosCompletos?.telefone
          : null) || '',
      '{{BAIRRO}}': data.bairro || 'Não informado',
      '{{CITY}}': data.localidade || 'Não informado',
      '{{REFERENCIA}}':
        (registro && this.isRegistroConsulta(registro)
          ? registro.dadosCompletos?.referencia
          : null) || '',
    };

    let htmlProcessado = template;
    Object.keys(variaveis).forEach((variavel) => {
      const regex = new RegExp(variavel.replace(/[{}]/g, '\\$&'), 'g');
      htmlProcessado = htmlProcessado.replace(regex, variaveis[variavel]);
    });

    // Se for SS e imprimirDadosSS for false, remover a página 1 (formulário)
    if (
      registro &&
      this.isRegistroConsulta(registro) &&
      registro.tipo === 'SS' &&
      registro.imprimirDadosSS === false
    ) {
      console.log(
        '[TEMPLATE] Removendo página 1 (formulário SS) - imprimirDadosSS = false',
      );
      // Remove toda a primeira página usando os marcadores explícitos
      const regexPage1 =
        /<!-- SS_PAGE_1_START -->[\s\S]*?<!-- SS_PAGE_1_END -->/;
      const matchResult = htmlProcessado.match(regexPage1);
      if (matchResult) {
        htmlProcessado = htmlProcessado.replace(regexPage1, '');
        console.log(
          '[TEMPLATE] Página 1 removida com sucesso. Mantendo apenas página 2 (croqui)',
        );
      } else {
        console.warn(
          '[TEMPLATE] Marcadores SS_PAGE_1_START/END não encontrados no template. Tentando fallback por estrutura HTML.',
        );

        // Fallback 1: remover bloco da página 1 usando comentários de seção (template_ss padrão)
        const regexSecaoPagina1 =
          /<!--\s*=+\s*-->\s*<!--\s*P[ÁA]GINA\s*1[\s\S]*?<!--\s*P[ÁA]GINA\s*2[\s\S]*?-->\s*/i;
        if (regexSecaoPagina1.test(htmlProcessado)) {
          htmlProcessado = htmlProcessado.replace(regexSecaoPagina1, '');
          console.log(
            '[TEMPLATE] Página 1 removida via fallback por comentários de seção',
          );
        } else {
          // Fallback 2: remover bloco da primeira página até o início da página de croqui
          const regexDivPagina1AteCroqui =
            /<div[^>]*class=["'][^"']*\bpage\b[^"']*\bportrait\b[^"']*["'][^>]*>[\s\S]*?(?=<div[^>]*class=["'][^"']*\bpage\b[^"']*\bcroqui-wrapper\b[^"']*["'][^>]*>)/i;
          if (regexDivPagina1AteCroqui.test(htmlProcessado)) {
            htmlProcessado = htmlProcessado.replace(
              regexDivPagina1AteCroqui,
              '',
            );
            console.log(
              '[TEMPLATE] Página 1 removida via fallback por classes CSS (page portrait -> croqui-wrapper)',
            );
          } else {
            console.warn(
              '[TEMPLATE] Não foi possível remover a página 1 automaticamente. Estrutura do template não reconhecida.',
            );
          }
        }
      }
    } else if (
      registro &&
      this.isRegistroConsulta(registro) &&
      registro.tipo === 'SS'
    ) {
      console.log('[TEMPLATE] Mantendo página 1 e 2 - imprimirDadosSS = true');
    }

    // Higienização AGRESSIVA anti-página-em-branco:
    // 1. Remover page-break-after/before legados
    // 2. Remover .page-break elements
    // 3. Remover espaço APÓS </html> (CRÍTICO - causa 3ª folha)
    // 4. Garantir que HTML termina EXATAMENTE em </html>
    // 5. Remover divs vazias que podem causar páginas extras
    htmlProcessado = htmlProcessado
      .replace(
        /page-break-after\s*:\s*always\s*;?/gi,
        'page-break-after: avoid;',
      )
      .replace(/break-after\s*:\s*page\s*;?/gi, 'break-after: avoid;')
      .replace(
        /page-break-before\s*:\s*always\s*;?(?=(?:(?!\.page\s+\+\s+\.page).)*$)/gi,
        'page-break-before: auto;',
      )
      .replace(
        /break-before\s*:\s*page\s*;?(?=(?:(?!\.page\s+\+\s+\.page).)*$)/gi,
        'break-before: auto;',
      );

    // Remover elementos .page-break completamente
    htmlProcessado = htmlProcessado.replace(
      /<div[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>\s*<\/div>/gi,
      '',
    );

    // Remover divs vazias que podem estar causando páginas extras
    htmlProcessado = htmlProcessado.replace(
      /<div[^>]*>\s*<\/div>(?=\s*<\/body>)/gi,
      '',
    );

    // CRÍTICO: remover TODO espaço/quebra/caractere invisível APÓS </html>
    htmlProcessado = htmlProcessado.replace(/<\/html>[\s\S]*$/i, '</html>');

    // Remover padding do body no CSS do template (causa overflow na impressão)
    htmlProcessado = htmlProcessado.replace(
      /body\s*\{([^}]*)padding\s*:\s*[^;]+;([^}]*)\}/gi,
      (match, before, after) =>
        `body {${before}padding: 0 !important;${after}}`,
    );

    // Garantir que não há espaços antes de </body> e </html>
    htmlProcessado = htmlProcessado.replace(/\s+<\/body>/gi, '</body>');
    htmlProcessado = htmlProcessado.replace(/\s+<\/html>/gi, '</html>');

    // Remover múltiplas quebras de linha consecutivas
    htmlProcessado = htmlProcessado.replace(/\n{3,}/g, '\n\n');

    const temMapContent =
      htmlProcessado.includes('MAP_CONTENT') ||
      htmlProcessado.includes('<img src="data:image/');

    if (!template.includes('{{MAP_CONTENT}}') && mapImage) {
      console.warn(
        'Template não contém {{MAP_CONTENT}}, tentando injetar imagem automaticamente...',
      );

      const bodyMatch = htmlProcessado.match(/<body[^>]*>/i);
      if (bodyMatch) {
        const imageHtml = `<div style="text-align: center; margin: 20px 0;"><img src="${mapImage}" style="max-width: 100%; height: auto; border: 1px solid #ccc;" alt="Mapa"></div>`;
        htmlProcessado = htmlProcessado.replace(
          bodyMatch[0],
          bodyMatch[0] + imageHtml,
        );
      } else {
        const imageHtml = `<div style="text-align: center; margin: 20px 0;"><img src="${mapImage}" style="max-width: 100%; height: auto; border: 1px solid #ccc;" alt="Mapa"></div>`;
        htmlProcessado = imageHtml + htmlProcessado;
      }
    }

    // Ajustar altura do body conforme quantidade de páginas efetiva no template processado
    // (1 página = apenas croqui; 2 páginas = ficha + croqui)

    // Ajustar altura do body conforme quantidade de páginas efetiva no template processado
    // (1 página = apenas croqui; 2 páginas = ficha + croqui)
    // IMPORTANTE: remover blocos <style> antes de verificar, pois o CSS contém
    // ".page.portrait" que satisfaz a regex mesmo quando a div já foi removida.
    const htmlSemEstilos = htmlProcessado.replace(
      /<style[\s\S]*?<\/style>/gi,
      '',
    );
    const temPaginaFormulario =
      /class=["'][^"']*\bpage\b[^"']*\bportrait\b[^"']*["']/i.test(
        htmlSemEstilos,
      );
    const alturaBody = temPaginaFormulario ? '594mm' : '297mm';

    htmlProcessado = htmlProcessado.replace(
      /<body([^>]*)>/i,
      (match, attrs) => {
        if (/style\s*=\s*["'][^"']*["']/i.test(attrs)) {
          return `<body${attrs.replace(
            /style\s*=\s*["']([^"']*)["']/i,
            (_styleMatch: string, styleValue: string) => {
              const styleLimpo = styleValue
                .replace(/\s*height\s*:\s*[^;]+;?/gi, '')
                .replace(/\s*max-height\s*:\s*[^;]+;?/gi, '')
                .replace(/\s*overflow\s*:\s*[^;]+;?/gi, '')
                .trim();
              const prefixo = styleLimpo ? `${styleLimpo};` : '';
              return `style="${prefixo}height:${alturaBody};max-height:${alturaBody};overflow:hidden;"`;
            },
          )}>`;
        }

        return `<body${attrs} style="height:${alturaBody};max-height:${alturaBody};overflow:hidden;">`;
      },
    );

    return htmlProcessado;
  }

  private gerarDadosFeature(data: any): string {
    const itens: string[] = [];

    if (data.matricula) {
      itens.push(`
        <div class="dados-row">
          <span class="dados-label">Matrícula:</span>
          <span class="dados-value">${data.matricula}</span>
        </div>
      `);
    }

    if (data.hd) {
      itens.push(`
        <div class="dados-row">
          <span class="dados-label">Hidrômetro:</span>
          <span class="dados-value">${data.hd}</span>
        </div>
      `);
    }

    if (data.nome) {
      itens.push(`
        <div class="dados-row">
          <span class="dados-label">Nome:</span>
          <span class="dados-value">${data.nome}</span>
        </div>
      `);
    }

    if (data.numero || data.bairro) {
      const endereco = [data.numero, data.bairro].filter(Boolean).join(' - ');
      itens.push(`
        <div class="dados-row">
          <span class="dados-label">Endereço:</span>
          <span class="dados-value">${endereco}</span>
        </div>
      `);
    }

    if (itens.length === 0) {
      return '<p style="color: #999; font-size: 8pt; text-align: center;">Dados não disponíveis</p>';
    }
    return itens.join('');
  }

  private gerarItensLegenda(data: any): string {
    const itens: string[] = [];

    const map = this.mapaService.getMapa();
    if (!map) {
      console.warn('[LEGENDA] Mapa não disponível');
      return '';
    }

    // Obter as camadas do basemap (primeira camada)
    const baseLayer = map.getLayers().item(0) as any;
    const baseLayerParams = baseLayer?.getSource?.()?.getParams?.();
    const baseLayerLayers = baseLayerParams?.LAYERS || '';

    const resolution = map.getView().getResolution();
    const layers = map.getLayers().getArray();
    layers.forEach((layer, index) => {
      try {
        const visible = layer.getVisible();
        if (!visible) {
          return;
        }

        const layerProps = layer.getProperties();
        const source = (layer as any).getSource?.();
        if (!source) {
          return;
        }

        const sourceType = source.constructor?.name || 'Unknown';

        const isImageWMS = sourceType === 'ImageWMS';
        const hasGetLegendUrl = typeof source.getLegendUrl === 'function';
        const hasGetParams = typeof source.getParams === 'function';

        if (hasGetLegendUrl) {
          // Verificar se essa camada WMS faz parte do basemap
          if (hasGetParams) {
            const params = source.getParams();
            const currentLayerLayers = params?.LAYERS || params?.layers || '';
            if (baseLayerLayers && currentLayerLayers === baseLayerLayers) {
              console.log(
                `[LEGENDA] Ignorando camada ${index} (${currentLayerLayers}) - faz parte do basemap`,
              );
              return;
            }
          }

          // Priorizar o título amigável (tituloCamada) em vez do nome técnico
          const layerTitle =
            layerProps['titulo'] ||
            (layer as any).get('titulo') ||
            layerProps['title'] ||
            layerProps['name'] ||
            'Camada WMS';

          // Fallback: usar nome técnico se título não estiver disponível
          let layerName = layerTitle;
          if (hasGetParams) {
            const params = source.getParams();
            const technicalName = params?.LAYERS || params?.layers;
            // Se o título é genérico, usar o nome técnico como fallback
            if (layerTitle === 'Camada WMS' && technicalName) {
              layerName = technicalName;
            }
          }

          try {
            const legendUrl = source.getLegendUrl(resolution);
            if (legendUrl) {
              itens.push(`
                <div class="legend-item" style="margin-bottom: 5mm;">
                  <div style="font-weight: bold; margin-bottom: 3px; font-size: 10px;">${layerTitle}</div>
                  <img src="${legendUrl}" alt="${layerTitle}" style="max-width: 100%; height: auto; display: block;" onerror="console.error('Erro ao carregar legenda WMS')"/>
                </div>
              `);
              return;
            } else {
              console.warn(
                `[LEGENDA] Camada ${index} (${layerTitle}) getLegendUrl() retornou NULL ou UNDEFINED`,
              );
              // Exibir título da camada mesmo sem legenda
              itens.push(`
                <div class="legend-item">
                  <div class="legend-symbol" style="background: #e8e8e8; width: 16px; height: 16px; border: 1px solid #999;"></div>
                  <div class="legend-text">${layerTitle} (sem legenda disponível)</div>
                </div>
              `);
              return;
            }
          } catch (e) {
            console.warn(
              `[LEGENDA] Camada ${index} ERRO ao chamar getLegendUrl():`,
              e,
            );
            // Exibir título da camada mesmo com erro
            itens.push(`
              <div class="legend-item">
                <div class="legend-symbol" style="background: #e8e8e8; width: 16px; height: 16px; border: 1px solid #999;"></div>
                <div class="legend-text">${layerTitle} (erro ao carregar legenda)</div>
              </div>
            `);
            return;
          }
        }

        const hasGetFeatures = typeof source.getFeatures === 'function';
        if (hasGetFeatures) {
          try {
            const features = source.getFeatures();
            if (features && features.length > 0) {
              const style = (layer as any).getStyle?.();
              if (style) {
                // Priorizar o TÍTULO amigável (tituloCamada) em vez do nome técnico
                // Procurar em múltiplas fontes
                const layerTitle =
                  (layer as any).get('titulo') || // ✨ Primeiro: propriedade titulo setada em adicionar-dados
                  layerProps['titulo'] || // ✨ Propriedade em português
                  (layer as any).get('tituloCamada') || // ✨ Nome completo em português
                  layerProps['title'] || // ✨ Título em inglês
                  layerProps['name'] || // ✨ Nome em inglês
                  (layer as any).get('name') ||
                  (layer as any).get('title') ||
                  'Camada Vetorial'; // ✨ Fallback

                const simbolo = this.extrairSimboloDoEstilo(style);

                if (simbolo) {
                  itens.push(`
                    <div class="legend-item">
                      <div class="legend-symbol" style="${simbolo.css}"></div>
                      <div class="legend-text">${layerTitle}</div>
                    </div>
                  `);
                  return;
                } else {
                  // Se não conseguir extrair símbolo, ainda assim exibir o título da camada
                  itens.push(`
                    <div class="legend-item">
                      <div class="legend-symbol" style="background: #cccccc; width: 16px; height: 16px; border: 1px solid #999;"></div>
                      <div class="legend-text">${layerTitle}</div>
                    </div>
                  `);
                  return;
                }
              }
            }
          } catch (e) {
            console.error(
              `[LEGENDA] Camada ${index} erro ao processar vetorial:`,
              e,
            );
          }
        }
      } catch (e) {
        console.error(`[LEGENDA] ERRO FATAL ao processar camada ${index}:`, e);
      }
    });
    return itens.join('');
  }

  private extrairSimboloDoEstilo(style: any): { css: string } | null {
    try {
      const styleObj = typeof style === 'function' ? style() : style;

      if (Array.isArray(styleObj)) {
        return this.extrairSimboloDoEstilo(styleObj[0]);
      }

      const image = styleObj?.getImage?.();
      if (image) {
        if (image.constructor.name === 'CircleStyle' || image.getRadius) {
          const radius = image.getRadius?.() || 5;
          const fill = image.getFill?.();
          const stroke = image.getStroke?.();

          const fillColor = fill
            ? this.rgbaToString(fill.getColor())
            : '#ff0000';
          const strokeColor = stroke
            ? this.rgbaToString(stroke.getColor())
            : 'transparent';
          const strokeWidth = stroke ? stroke.getWidth?.() || 1 : 0;

          const css = `
            background: ${fillColor};
            border: ${strokeWidth}px solid ${strokeColor};
            border-radius: 50%;
            width: ${Math.min(radius * 2, 16)}px;
            height: ${Math.min(radius * 2, 16)}px;
          `
            .trim()
            .replace(/\s+/g, ' ');

          return { css };
        }

        if (image.constructor.name === 'RegularShape') {
          const fill = image.getFill?.();
          const stroke = image.getStroke?.();

          const fillColor = fill
            ? this.rgbaToString(fill.getColor())
            : '#ff0000';
          const strokeColor = stroke
            ? this.rgbaToString(stroke.getColor())
            : 'transparent';
          const strokeWidth = stroke ? stroke.getWidth?.() || 1 : 0;

          const css = `background: ${fillColor}; border: ${strokeWidth}px solid ${strokeColor};`;
          return { css };
        }

        if (image.constructor.name === 'Icon' || image.getSrc) {
          const src = image.getSrc?.();
          if (src) {
            const css = `background-image: url(${src}); background-size: contain; background-repeat: no-repeat; background-position: center;`;
            return { css };
          }
        }
      }

      const fill = styleObj?.getFill?.();
      const stroke = styleObj?.getStroke?.();

      if (fill) {
        const color = fill.getColor();
        const css = `background: ${this.rgbaToString(color)}; border: ${stroke ? '2px solid ' + this.rgbaToString(stroke.getColor()) : 'none'};`;
        return { css };
      } else if (stroke) {
        const color = stroke.getColor();
        const width = stroke.getWidth() || 2;
        const css = `background: ${this.rgbaToString(color)}; height: ${width}px; border: none;`;
        return { css };
      }

      console.warn('[LEGENDA] Não foi possível extrair estilo visual');
      return null;
    } catch (e) {
      console.error('[LEGENDA] Erro ao extrair símbolo:', e);
      return null;
    }
  }

  private rgbaToString(color: any): string {
    if (typeof color === 'string') {
      return color;
    }

    if (Array.isArray(color)) {
      if (color.length === 3) {
        return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      } else if (color.length === 4) {
        return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
      }
    }

    return '#cccccc';
  }

  private async gerarPdfIndividual(
    htmlProcessado: string,
    nomeArquivo: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Detectar número de páginas para definir altura correta do iframe
        // e evitar overflow que gera páginas em branco
        const htmlSemEstilosIframe = htmlProcessado.replace(
          /<style[\s\S]*?<\/style>/gi,
          '',
        );
        const temFormularioIframe =
          /class=["'][^"']*\bpage\b[^"']*\bportrait\b[^"']*["']/i.test(
            htmlSemEstilosIframe,
          );

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.top = '-9999px';
        iframe.style.width = '1400px';
        // 297mm ≈ 1122px a 96dpi → 1300px garante margem sem gerar página extra
        // 594mm ≈ 2244px a 96dpi → 2600px para 2 páginas
        iframe.style.height = temFormularioIframe ? '2600px' : '1300px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          document.body.removeChild(iframe);
          reject(new Error('Não foi possível acessar documento do iframe'));
          return;
        }

        const cssImpressao = `
  <style>
    /* === RESET TOTAL ANTI-PÁGINA-EM-BRANCO === */
    @media print {
      @page {
        size: A4 portrait !important;
        margin: 0 !important;
      }

      * {
        box-sizing: border-box !important;
      }

      html {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        height: 100% !important;
        max-height: 100% !important;
      }

      body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        background: white !important;
      }

      .page {
        margin: 0 !important;
        padding: 0 !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box !important;
      }

      .page + .page {
        page-break-before: always !important;
        break-before: page !important;
      }

      .page:last-child,
      .page:last-of-type {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      .page:empty {
        display: none !important;
      }

      .page-break {
        display: none !important;
      }

      /* CRÍTICO: croqui-wrapper não pode vazar além de 297mm */
      .page.croqui-wrapper {
        overflow: hidden !important;
        clip-path: inset(0) !important;
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        min-height: unset !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        box-sizing: border-box !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* portrait também precisa de controle total */
      .page.portrait {
        overflow: hidden !important;
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        min-height: unset !important;
        box-sizing: border-box !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* CRÍTICO: mover o layout box de top:297mm → top:0 para que o motor
         de impressão do Chrome não veja conteúdo além da 2ª página.
         O transform compensatório (translateY(297mm) rotate(-90deg)) produz
         exatamente o mesmo resultado visual que o original
         (top:297mm + rotate(-90deg) com transform-origin:top left). */
      .croqui-rotated {
        contain: strict !important;
        top: 0 !important;
        transform: translateY(297mm) rotate(-90deg) !important;
        transform-origin: top left !important;
      }

      img[alt*="Mapa"] {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        object-position: center !important;
        page-break-inside: avoid !important;
        max-width: none !important;
        max-height: none !important;
        min-width: 100% !important;
        min-height: 100% !important;
      }

      .no-print { display: none !important; }
    }

    body {
      font-family: Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }

    img[alt*="Mapa capturado"] {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      object-position: center !important;
      border: 1px solid #ccc !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
      max-height: none !important;
      min-width: 100% !important;
      min-height: 100% !important;
    }
  </style>
`;
        // ✨ Substituir título do documento (usado pelo navegador para nomear o PDF)
        const novoTituloTag = `<title>${nomeArquivo}</title>`;

        // PASSO 1: Substituir <title> existente no htmlProcessado ANTES de adicionar CSS
        let htmlComCSS = htmlProcessado.replace(
          /<title>[^<]*<\/title>/gi,
          novoTituloTag,
        );

        // PASSO 2: Se não houver <title>, inserir antes de </head>
        if (!htmlComCSS.includes('<title>')) {
          if (htmlComCSS.includes('</head>')) {
            htmlComCSS = htmlComCSS.replace(
              '</head>',
              novoTituloTag + '\n</head>',
            );
          } else if (htmlComCSS.includes('</body>')) {
            // Fallback: inserir no início do body
            htmlComCSS = htmlComCSS.replace(
              '<body>',
              '<head>' + novoTituloTag + '</head><body>',
            );
          }
        }

        // PASSO 3: Adicionar CSS de impressão
        htmlComCSS = htmlComCSS.replace('</head>', cssImpressao + '</head>');

        // ✨ SANITIZAÇÃO FINAL CRÍTICA: remover TODO espaço/quebra APÓS </html>
        let htmlFinal = htmlComCSS;

        // Remover absolutamente TUDO após </html>
        htmlFinal = htmlFinal.replace(/<\/html>[\s\S]*$/i, '</html>');

        // Garantir que não há espaços antes dos fechamentos
        htmlFinal = htmlFinal.replace(/\s+<\/body>/gi, '\n</body>');
        htmlFinal = htmlFinal.replace(/\s+<\/html>/gi, '\n</html>');

        // Remover múltiplos espaços em branco consecutivos
        htmlFinal = htmlFinal.replace(/[ \t]+\n/g, '\n');

        // Se houver algum conteúdo após </html>, cortar
        const htmlEndIndex = htmlFinal.toLowerCase().lastIndexOf('</html>');
        if (htmlEndIndex !== -1) {
          htmlFinal = htmlFinal.substring(0, htmlEndIndex + 7); // 7 = length of '</html>'
        }

        // Debug: verificar se há conteúdo após </html>
        const afterHtml = htmlFinal.substring(htmlEndIndex + 7);
        if (afterHtml.length > 0) {
          console.warn(
            '[SANITIZAÇÃO] Conteúdo encontrado após </html>:',
            afterHtml.length,
            'caracteres:',
            JSON.stringify(afterHtml),
          );
        } else {
          console.log('[SANITIZAÇÃO] ✓ HTML termina exatamente em </html>');
        }

        iframeDoc.open();
        iframeDoc.write(htmlFinal);
        iframeDoc.close();

        setTimeout(() => {
          try {
            const iframeBody = iframeDoc.body;
            if (iframeBody) {
              iframeBody.style.setProperty('padding', '0', 'important');
              iframeBody.style.setProperty('margin', '0', 'important');
            }
            // Forçar também em todos os .page
            const pages = iframeDoc.querySelectorAll('.page');
            pages.forEach((page: Element) => {
              (page as HTMLElement).style.setProperty(
                'margin',
                '0',
                'important',
              );
              (page as HTMLElement).style.setProperty(
                'padding',
                '0',
                'important',
              );
              (page as HTMLElement).style.setProperty(
                'box-sizing',
                'border-box',
                'important',
              );
            });
          } catch (e) {
            console.warn('[IFRAME DOM] Erro ao forçar estilos:', e);
          }
        }, 100);

        const aguardarCarregamento = () => {
          const iframeWindow = iframe.contentWindow;
          if (!iframeWindow) {
            console.error('Janela do iframe não disponível');
            document.body.removeChild(iframe);
            reject(new Error('Janela do iframe não disponível'));
            return;
          }

          const images = iframeDoc.querySelectorAll('img');
          let imagensCarregadas = 0;
          const totalImagens = images.length;

          if (totalImagens === 0) {
            this.executarImpressao(iframe, resolve, reject, nomeArquivo);
            return;
          }

          let tentativas = 0;
          const maxTentativas = 25;
          let impressaoJaExecutada = false;

          const verificarCarregamento = () => {
            if (impressaoJaExecutada) return;

            tentativas++;
            imagensCarregadas = 0;

            images.forEach((img: HTMLImageElement) => {
              if (img.complete && img.naturalWidth > 0) {
                imagensCarregadas++;
              }
            });

            if (imagensCarregadas === totalImagens) {
              impressaoJaExecutada = true;
              this.executarImpressao(iframe, resolve, reject, nomeArquivo);
            } else if (tentativas >= maxTentativas) {
              console.warn(
                'Timeout no carregamento de imagens, imprimindo mesmo assim...',
              );
              impressaoJaExecutada = true;
              this.executarImpressao(iframe, resolve, reject, nomeArquivo);
            } else {
              setTimeout(verificarCarregamento, 200);
            }
          };

          setTimeout(verificarCarregamento, 500);
        };

        if (iframeDoc.readyState === 'complete') {
          aguardarCarregamento();
        } else {
          iframeDoc.addEventListener('DOMContentLoaded', aguardarCarregamento);
          setTimeout(aguardarCarregamento, 1000);
        }
      } catch (error) {
        console.error('Erro na geração de PDF:', error);
        reject(error);
      }
    });
  }

  private async executarImpressao(
    iframe: HTMLIFrameElement,
    resolve: Function,
    reject: Function,
    nomeArquivo: string,
  ): Promise<void> {
    try {
      const iframeWindow = iframe.contentWindow;
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeWindow || !iframeDoc) {
        document.body.removeChild(iframe);
        reject(new Error('Janela do iframe não disponível para impressão'));
        return;
      }

      // ✨ Usar print() do navegador (melhor qualidade e proporção)
      try {
        // ✨ Mudar title da página PRINCIPAL antes de imprimir
        const titleOriginal = document.title;
        document.title = nomeArquivo;

        // Simplesmente usar o print() - funciona melhor para HTML
        iframeWindow.print();

        // ✨ Restaurar title original após printing
        setTimeout(() => {
          document.title = titleOriginal;
        }, 100);

        // Limpar recursos
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve();
        }, 500);
      } catch (pdfError) {
        console.error('Erro ao gerar PDF com jsPDF:', pdfError);

        // Fallback: usar print() se jsPDF falhar
        console.warn('Fallback para print()...');
        iframeWindow.print();

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve();
        }, 500);
      }
    } catch (error) {
      console.error('Erro durante geração de PDF:', error);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      reject(error);
    }
  }

  private async capturaMapaSimples(): Promise<string | null> {
    return new Promise((resolve) => {
      const map = this.mapaService.getMapa();
      if (!map) {
        console.warn('[CAPTURA SIMPLES] Mapa não disponível');
        resolve(null);
        return;
      }

      try {
        const mapTarget = map.getTarget();
        let mapElement: HTMLElement | null = null;

        if (typeof mapTarget === 'string') {
          mapElement = document.getElementById(mapTarget);
        } else if (mapTarget instanceof HTMLElement) {
          mapElement = mapTarget;
        }

        if (!mapElement) {
          console.warn('[CAPTURA SIMPLES] Elemento do mapa não encontrado');
          resolve(null);
          return;
        }

        const seletores = [
          '.ol-viewport canvas',
          '.ol-layer canvas',
          'canvas.ol-unselectable',
          'canvas',
        ];

        let canvases: HTMLCanvasElement[] = [];
        for (const seletor of seletores) {
          const found = Array.from(
            mapElement.querySelectorAll(seletor),
          ) as HTMLCanvasElement[];
          if (found.length > 0) {
            canvases = found;
            break;
          }
        }

        if (canvases.length === 0) {
          console.warn('[CAPTURA SIMPLES] Nenhum canvas encontrado');
          resolve(null);
          return;
        }

        for (let i = 0; i < canvases.length; i++) {
          const canvas = canvases[i];
          if (canvas.width > 100 && canvas.height > 100) {
            try {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const imageData = ctx.getImageData(
                  0,
                  0,
                  Math.min(canvas.width, 50),
                  Math.min(canvas.height, 50),
                );
                const hasContent = imageData.data.some((value, idx) => {
                  if (idx % 4 === 3) return value > 0;
                  return false;
                });

                if (hasContent) {
                  const dataURL = canvas.toDataURL('image/png', 0.9);
                  if (dataURL && dataURL.length > 1000) {
                    resolve(dataURL);
                    return;
                  }
                }
              }
            } catch (e) {
              console.warn(
                `[CAPTURA SIMPLES] Erro ao capturar canvas ${i}:`,
                e,
              );
            }
          }
        }

        console.warn('[CAPTURA SIMPLES] Nenhum canvas válido encontrado');
        resolve(null);
      } catch (error) {
        console.error('[CAPTURA SIMPLES] Erro na captura simples:', error);
        resolve(null);
      }
    });
  }

  /**
   * Captura usando html2canvas o viewport real do OpenLayers
   */
  private async capturarImagemMapaHtml2Canvas(): Promise<string | null> {
    try {
      const map = this.mapaService.getMapa();
      if (!map) return null;

      const viewport = map.getViewport() as HTMLElement;
      if (!viewport) return null;

      // aguardamos um micro-delay para garantir que qualquer re-render finalize
      await new Promise((r) => setTimeout(r, 120));

      const html2canvas = (await import('html2canvas')).default;
      // Ignorar controles de UI do OpenLayers durante a captura
      const ignoreSelectors = [
        '.ol-control',
        '.ol-overviewmap',
        '.ol-attribution',
        '.ol-scale-line',
        '.ol-zoom',
        '.ol-zoomslider',
        '.ol-rotate',
        '.ol-zoom-extent',
      ];

      const canvas = await html2canvas(viewport, {
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: Math.min(2, window.devicePixelRatio || 1),
        logging: false,
        removeContainer: true,
        allowTaint: false,
        windowWidth: viewport.clientWidth,
        windowHeight: viewport.clientHeight,
        // Forçar canvas às dimensões visíveis do viewport: o ol-overlays-container
        // não tem overflow:hidden, então elementos de overlay grandes (ex: callout wrappers)
        // inflam o scrollHeight e geram canvas maiores que o viewport, causando
        // página em branco extra no PDF.
        width: viewport.clientWidth,
        height: viewport.clientHeight,
        ignoreElements: (el: Element) => {
          try {
            // Permitir marcadores/overlays do usuário; ocultar apenas controles de UI
            return ignoreSelectors.some((sel) => (el as Element).matches(sel));
          } catch {
            return false;
          }
        },
      });

      const dataUrl = canvas.toDataURL('image/png', 0.95);
      return dataUrl && dataUrl.length > 1000 ? dataUrl : null;
    } catch (e) {
      console.warn('[html2canvas] Falha na captura:', e);
      return null;
    }
  }

  /**
   * Método de captura de emergência - mais simples e robusto
   */
  private async capturaEmergencia(): Promise<string | null> {
    return new Promise((resolve) => {
      console.log('[EMERGÊNCIA] Iniciando captura de emergência...');

      try {
        const map = this.mapaService.getMapa();
        if (!map) {
          resolve(null);
          return;
        }

        const mapTarget = map.getTarget();
        let mapElement: HTMLElement | null = null;

        if (typeof mapTarget === 'string') {
          mapElement = document.getElementById(mapTarget);
        } else if (mapTarget instanceof HTMLElement) {
          mapElement = mapTarget;
        }

        if (!mapElement) {
          resolve(null);
          return;
        }

        // Captura simples e direta
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(null);
          return;
        }

        // Fundo branco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Tentar capturar pelo menos um canvas visível
        const anyCanvas = mapElement.querySelector(
          'canvas',
        ) as HTMLCanvasElement;
        if (anyCanvas && anyCanvas.width > 0 && anyCanvas.height > 0) {
          try {
            // Configurar máxima qualidade de renderização
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(anyCanvas, 0, 0, canvas.width, canvas.height);
            console.log(
              '[EMERGÊNCIA] Captura bem-sucedida com canvas disponível',
            );
            resolve(canvas.toDataURL('image/png', 1.0)); // Máxima qualidade
            return;
          } catch (drawError) {
            console.warn('[EMERGÊNCIA] Erro ao desenhar canvas:', drawError);
          }
        }

        console.log('[EMERGÊNCIA] Nenhum canvas capturado, retornando null');
        resolve(null);
      } catch (error) {
        console.error('[EMERGÊNCIA] Erro na captura de emergência:', error);
        resolve(null);
      }
    });
  }

  private criarImagemPlaceholder(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }

    this.criarPlaceholderMapa(canvas, ctx);
    return canvas.toDataURL('image/png', 0.9);
  }
}
