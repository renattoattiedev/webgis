import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MAT_CHECKBOX_DEFAULT_OPTIONS,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { Subject, takeUntil } from 'rxjs';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import OlPoint from 'ol/geom/Point';
import { Draw } from 'ol/interaction';
import { Style, Circle as CircleStyle, Fill, Stroke, Icon } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';

import { WindowBehavior } from 'src/app/shared/window/window-behavior';
import { MapaService } from 'src/app/services/mapa.service';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { GetComponenteNomeService } from 'src/app/services/api/get-componente-nome.service';
import { FetchContentOrganizationService } from 'src/app/services/api/fetch.content.organization.service';
import { MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS } from '@angular/material/slide-toggle';

interface CamadaEspacialItem {
  camadaId: string;
  label: string;
  nomeCamada: string;
  workspace: string;
  temaId: string;
  grupoId: string;
  campo: string;
  campoLabel: string;
}

const ESTATISTICAS: { value: string; label: string }[] = [
  { value: 'pressaoMinima', label: 'Mínima' },
  { value: 'pressaoMedia', label: 'Média' },
  { value: 'pressaoMaxima', label: 'Máxima' },
  { value: 'amplitude', label: 'Amplitude' },
  { value: 'piezometrica', label: 'Cota Piezométrica Máxima' },
  { value: 'cotaMedidor', label: 'Cota' },
];

const CORES_LEGENDA: { value: string; label: string; hex: string }[] = [
  { value: 'preto', label: 'Preto', hex: '#111111' },
  { value: 'branco', label: 'Branco', hex: '#FFFFFF' },
  { value: 'amarelo', label: 'Amarelo', hex: '#FFD600' },
  { value: 'azul', label: 'Teal', hex: '#268A97' },
  { value: 'verde', label: 'Verde', hex: '#2E7D32' },
  { value: 'vermelho', label: 'Vermelho', hex: '#D32F2F' },
];

function contrastTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
    ? '#111111'
    : '#ffffff';
}

function gerarSvgCallout(
  texto: string,
  bgColor: string,
  accentColor?: string,
): string {
  const W = 60,
    H = 22,
    R = 5,
    AH = 9;
  const fg = contrastTextColor(
    bgColor === 'rgba(255,255,255,0.95)' ? '#ffffff' : bgColor,
  );
  const stroke = accentColor
    ? `stroke="${accentColor}" stroke-width="1.5"`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + AH}">` +
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${R}" fill="${bgColor}" ${stroke}/>` +
    `<polygon points="${W / 2 - 6},${H - 1} ${W / 2 + 6},${H - 1} ${W / 2},${H + AH - 1}" fill="${bgColor}"/>` +
    `<text x="${W / 2}" y="${H / 2 + 1}" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="'Courier New',monospace" font-size="11" font-weight="bold" fill="${fg}">${texto}</text>` +
    `</svg>`
  );
}

// Escala fixa de classificação (0–55 em passos de 5)
const BREAKPOINTS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const N_CLASSES = BREAKPOINTS.length + 1; // 13 faixas

function corParaValor(valor: number): string {
  for (let i = 0; i < BREAKPOINTS.length; i++) {
    if (valor <= BREAKPOINTS[i]) return interpolarCor(i / (N_CLASSES - 1));
  }
  return interpolarCor(1); // > 55
}

function gerarLegendaFixa(): { cor: string; label: string }[] {
  return [
    ...BREAKPOINTS.map((bp, i) => ({
      cor: interpolarCor(i / (N_CLASSES - 1)),
      label: `valor <= ${bp}`,
    })),
    {
      cor: interpolarCor(1),
      label: `valor > ${BREAKPOINTS[BREAKPOINTS.length - 1]}`,
    },
  ];
}

function interpolarCor(t: number): string {
  const stops = [
    [0, 0, 255],
    [0, 200, 255],
    [0, 200, 0],
    [255, 220, 0],
    [255, 30, 0],
  ];
  const idx = t * (stops.length - 1);
  const i = Math.min(Math.floor(idx), stops.length - 2);
  const f = idx - i;
  const a = stops[i],
    b = stops[i + 1];
  const r = Math.round(a[0] + (b[0] - a[0]) * f);
  const g = Math.round(a[1] + (b[1] - a[1]) * f);
  const bl = Math.round(a[2] + (b[2] - a[2]) * f);
  return `rgb(${r},${g},${bl})`;
}

function criarEstiloPin(
  corPin: string,
  valor: number | null = null,
  corBadge: string | null = null,
  destaque = false,
): Style | Style[] {
  const radius = destaque ? 11 : 8;
  const pinStyle = new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color: corPin }),
      stroke: new Stroke({ color: '#fff', width: destaque ? 3 : 2.5 }),
    }),
  });

  if (valor === null) return pinStyle;

  const texto = Number.isInteger(valor)
    ? String(valor)
    : (valor as number).toFixed(1);
  const bgColor = corBadge ?? 'rgba(255,255,255,0.95)';
  const accentColor = corBadge ? undefined : corPin;
  const svg = gerarSvgCallout(texto, bgColor, accentColor);

  const calloutStyle = new Style({
    image: new Icon({
      src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      anchor: [0.5, 1.0],
      anchorXUnits: 'fraction' as any,
      anchorYUnits: 'fraction' as any,
      displacement: [0, radius + 2],
    }),
  });

  return [pinStyle, calloutStyle];
}

@Component({
  selector: 'app-consulta-espacial-pitometria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  providers: [
    {
      provide: MAT_CHECKBOX_DEFAULT_OPTIONS,
      useValue: {
        color: '#2e7d32',
      },
    },
  ],
  templateUrl: './consulta-espacial-pitometria.component.html',
  styleUrl: './consulta-espacial-pitometria.component.scss',
})
export class ConsultaEspacialPitometriaComponent
  extends WindowBehavior
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('draggableWindow')
  override draggableWindow!: ElementRef<HTMLElement>;
  @Output() fechado = new EventEmitter<void>();

  override defaultSize = { width: 380, height: 560 };
  override minimizedSize = { width: 260, height: 42 };

  // ── Camada alvo (pitometria) ─────────────────────────────────────────────
  private camadaIdAlvo: string | null = null;
  private temaIdAlvo: string | null = null;
  private grupoIdAlvo: string | null = null;

  // ── Modo de seleção ──────────────────────────────────────────────────────
  modoSelecao: 'desenho' | 'camada' = 'desenho';
  camadaEspacialSelecionadaId: string | null = null;
  camadasEspaciais: CamadaEspacialItem[] = [];
  valoresDisponiveis: string[] = [];
  valorCamadaSelecionado: string | null = null;
  carregandoValores = false;
  carregandoPoligono = false;

  // ── Filtros ──────────────────────────────────────────────────────────────
  dataInicio = '';
  dataFim = '';
  medicaoPressao = true;
  medicaoVazao = true;
  incluirOcorrencia = true;

  readonly FONTES_DADOS = [
    'RunForrestGISSIMS',
    'Planilha',
    'Sem Cálculo',
    'CCO',
    'Hidrovision',
  ] as const;
  fontesDadosSelecionadas = new Set<string>(this.FONTES_DADOS);

  // ── Legenda ──────────────────────────────────────────────────────────────
  readonly estatisticas = ESTATISTICAS;
  readonly coresLegenda = CORES_LEGENDA;
  estatisticaSelecionada: string = 'pressaoMedia';
  corLegendaSelecionada = ''; // vazio = usar rampa; valor = cor fixa para todos os pins
  legendaItens: { cor: string; label: string }[] = [];

  // ── Estado ───────────────────────────────────────────────────────────────
  carregando = false;
  temResultados = false;
  private ultimasMedicoes: any[] = [];
  ultimoPoligono: object | null = null;

  // ── OL layers ────────────────────────────────────────────────────────────
  private drawSource = new VectorSource();
  private drawLayer!: VectorLayer<VectorSource>;
  private drawInteraction: Draw | null = null;
  private pinsSource = new VectorSource();
  private pinsLayer!: VectorLayer<VectorSource>;
  private pinColorMap = new Map<string, string>();

  private destroy$ = new Subject<void>();

  constructor(
    protected override cdr: ChangeDetectorRef,
    private mapaService: MapaService,
    private conteudoService: ConteudoService,
    private getComponenteNomeService: GetComponenteNomeService,
    private fetchContentOrganizationService: FetchContentOrganizationService,
    private snackBar: MatSnackBar,
  ) {
    super(cdr);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.getComponenteNomeService.getComponenteByNome('pitometria').subscribe({
      next: (componente) => {
        this.camadasEspaciais =
          componente?.configuracao?.camadas_espaciais ?? [];

        // Aplica camada alvo (igual consulta-pitometria)
        const alvo = componente?.configuracao?.camada_alvo;
        if (alvo) {
          this.camadaIdAlvo = alvo.camada ?? null;
          this.temaIdAlvo = alvo.tema ?? null;
          this.grupoIdAlvo = alvo.grupo ?? null;

          if (this.camadaIdAlvo) {
            if (this.temaIdAlvo && this.grupoIdAlvo) {
              this.conteudoService.emitirAtivacaoCamadaComContexto(
                this.temaIdAlvo,
                this.grupoIdAlvo,
                this.camadaIdAlvo,
              );
            } else {
              this.fetchContentOrganizationService
                .getContentOrganization()
                .subscribe({
                  next: (res) => {
                    const camada = res.camadas.find(
                      (c) => c.id === this.camadaIdAlvo,
                    );
                    if (
                      camada?.temaId &&
                      camada?.grupoCamada &&
                      this.camadaIdAlvo
                    ) {
                      this.temaIdAlvo = camada.temaId;
                      this.grupoIdAlvo = camada.grupoCamada;
                      this.conteudoService.emitirAtivacaoCamadaComContexto(
                        this.temaIdAlvo,
                        this.grupoIdAlvo,
                        this.camadaIdAlvo,
                      );
                    }
                  },
                });
            }
          }
        }

        this.cdr.detectChanges();
      },
    });

    this.conteudoService.dwLinhaSelcionada$
      .pipe(takeUntil(this.destroy$))
      .subscribe((codPonto) => this.destacarPin(codPonto));
  }

  ngAfterViewInit(): void {
    this.positionTopRight();
    this.initWindowBehaviorLifecycle();
    const map = this.mapaService.getMapa();
    if (!map) return;

    this.drawLayer = new VectorLayer({
      source: this.drawSource,
      zIndex: 900,
      style: new Style({
        stroke: new Stroke({ color: '#268A97', width: 2, lineDash: [8, 6] }),
        fill: new Fill({ color: 'rgba(38,138,151,0.1)' }),
      }),
    } as any);

    this.pinsLayer = new VectorLayer({
      source: this.pinsSource,
      zIndex: 200,
    } as any);

    map.addLayer(this.drawLayer);
    map.addLayer(this.pinsLayer);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroy$.next();
    this.destroy$.complete();
    this.desativarDesenho();
    this.limparPins();
    const map = this.mapaService.getMapa();
    if (map) {
      if (this.drawLayer) map.removeLayer(this.drawLayer);
      if (this.pinsLayer) map.removeLayer(this.pinsLayer);
    }
    this.conteudoService.removerAbaDw('consulta-espacial-pitometria');
  }

  // ── Modo ─────────────────────────────────────────────────────────────────

  setModo(modo: 'desenho' | 'camada'): void {
    this.modoSelecao = modo;
    this.desativarDesenho();
    this.drawSource.clear();
    this.valorCamadaSelecionado = null;
    this.valoresDisponiveis = [];
    this.camadaEspacialSelecionadaId = null;
    this.ultimoPoligono = null;
  }

  // ── Desenho livre ─────────────────────────────────────────────────────────

  iniciarDesenho(tipo: 'poligono' | 'livre'): void {
    this.desativarDesenho();
    this.drawSource.clear();
    this.ultimoPoligono = null;

    const map = this.mapaService.getMapa();
    if (!map) return;

    // Re-add layers if they were removed by map layer management (adicionarConteudoSeNaoExistir
    // clears all layers and only restores basemap + WMS layers, dropping VectorLayers)
    if (!map.getLayers().getArray().includes(this.drawLayer)) {
      map.addLayer(this.drawLayer);
    }
    if (!map.getLayers().getArray().includes(this.pinsLayer)) {
      map.addLayer(this.pinsLayer);
    }

    this.drawInteraction = new Draw({
      source: this.drawSource,
      type: 'Polygon',
      freehand: tipo === 'livre',
      style: new Style({
        stroke: new Stroke({ color: '#268A97', width: 2 }),
        fill: new Fill({ color: 'rgba(38,138,151,0.15)' }),
      }),
    } as any);

    this.drawInteraction.on('drawend', (evt: any) => {
      this.desativarDesenho();
      const geomClone = evt.feature.getGeometry().clone();
      geomClone.transform('EPSG:3857', 'EPSG:4326');
      this.ultimoPoligono = new GeoJSON().writeGeometryObject(geomClone);
      // Re-add drawLayer if removed mid-draw (same layer management issue)
      if (!map.getLayers().getArray().includes(this.drawLayer)) {
        map.addLayer(this.drawLayer);
      }
      this.cdr.detectChanges();
    });

    map.addInteraction(this.drawInteraction);
    this.cdr.detectChanges();
  }

  private desativarDesenho(): void {
    const map = this.mapaService.getMapa();
    if (map && this.drawInteraction) {
      map.removeInteraction(this.drawInteraction);
      this.drawInteraction = null;
    }
  }

  // ── Seleção por camada ────────────────────────────────────────────────────

  onCamadaChange(camadaId: string | null): void {
    this.camadaEspacialSelecionadaId = camadaId;
    this.valorCamadaSelecionado = null;
    this.valoresDisponiveis = [];
    this.ultimoPoligono = null;
    this.drawSource.clear();

    const camada = this.camadasEspaciais.find((c) => c.camadaId === camadaId);
    if (!camada?.campo) {
      this.cdr.detectChanges();
      return;
    }

    const camadaAtual = camadaId;
    this.carregandoValores = true;
    this.cdr.detectChanges();

    this.conteudoService
      .getWFSLayerData('camada', `${camada.workspace}:${camada.nomeCamada}`, [
        { nomeAtributo: camada.campo } as any,
      ])
      .subscribe({
        next: (res: any) => {
          if (this.camadaEspacialSelecionadaId !== camadaAtual) return;
          const features = Array.isArray(res)
            ? res[0]?.data?.features
            : res?.features ?? [];
          this.valoresDisponiveis = [
            ...new Set<string>(
              (features as any[])
                .map((f: any) => f.properties?.[camada.campo])
                .filter((v: any) => v != null && v !== ''),
            ),
          ].sort();
          this.carregandoValores = false;
          if (!this.valoresDisponiveis.length) {
            this.snackBar.open(
              'Nenhum valor encontrado para esta camada.',
              'OK',
              { duration: 3000 },
            );
          }
          this.cdr.detectChanges();
        },
        error: () => {
          if (this.camadaEspacialSelecionadaId !== camadaAtual) return;
          this.carregandoValores = false;
          this.snackBar.open('Erro ao buscar dados da camada.', 'OK', {
            duration: 3000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  onValorChange(valor: string): void {
    this.valorCamadaSelecionado = valor;
    this.ultimoPoligono = null;
    this.drawSource.clear();

    const camada = this.camadasEspaciais.find(
      (c) => c.camadaId === this.camadaEspacialSelecionadaId,
    );
    if (!camada?.campo) return;

    const valorEscapado = valor.replace(/'/g, "''");
    this.carregandoPoligono = true;
    this.cdr.detectChanges();

    this.conteudoService
      .getWFSLayerData(
        'camada',
        `${camada.workspace}:${camada.nomeCamada}`,
        [],
        'expressao',
        `${camada.campo} = '${valorEscapado}'`,
      )
      .subscribe({
        next: (res: any) => {
          this.carregandoPoligono = false;
          const features = Array.isArray(res)
            ? res[0]?.data?.features
            : res?.features ?? [];
          const geomRaw = features?.[0]?.geometry;
          if (!geomRaw) {
            this.snackBar.open(
              'Geometria não disponível para este valor.',
              'OK',
              { duration: 3000 },
            );
            this.cdr.detectChanges();
            return;
          }
          const olGeom = new GeoJSON().readGeometry(geomRaw, {
            dataProjection: 'EPSG:3857',
            featureProjection: 'EPSG:4326',
          });
          this.ultimoPoligono = new GeoJSON().writeGeometryObject(olGeom);
          const feature = new Feature({
            geometry: new GeoJSON().readGeometry(this.ultimoPoligono as any, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }),
          });
          const map = this.mapaService.getMapa();
          if (map && !map.getLayers().getArray().includes(this.drawLayer)) {
            map.addLayer(this.drawLayer);
          }
          this.drawSource.addFeature(feature);
          this.cdr.detectChanges();
        },
        error: () => {
          this.carregandoPoligono = false;
          this.snackBar.open('Erro ao buscar geometria da camada.', 'OK', {
            duration: 3000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  // ── Consultar (plota pins) ────────────────────────────────────────────────

  consultar(): void {
    if (!this.ultimoPoligono) {
      this.snackBar.open('Primeiro selecione uma área no mapa.', 'OK', {
        duration: 3000,
      });
      return;
    }
    if (this.carregando) return;
    this.carregando = true;
    this.cdr.detectChanges();

    // A consulta espacial dependia das rotas DW (/pitometria-dw/spatial), que
    // foram removidas do backend. Mantém o componente renderizando estado vazio.
    this.carregando = false;
    this.temResultados = false;
    this.snackBar.open(
      'Consulta espacial de pitometria (DW) indisponível no momento.',
      'OK',
      { duration: 3000 },
    );
    this.cdr.detectChanges();
  }

  // ── Mostrar Resultados (attribute-table) ──────────────────────────────────

  mostrarResultados(): void {
    if (!this.ultimasMedicoes.length) return;
    this.publicarNaTabelaAtributos(this.ultimasMedicoes);
  }

  limpar(): void {
    this.desativarDesenho();
    this.drawSource.clear();
    this.limparPins();
    this.ultimasMedicoes = [];
    this.ultimoPoligono = null;
    this.valorCamadaSelecionado = null;
    this.valoresDisponiveis = [];
    this.temResultados = false;
    this.legendaItens = [];
    this.cdr.detectChanges();
  }

  fechar(): void {
    this.limpar();
    this.fechado.emit();
  }

  // ── Pins ─────────────────────────────────────────────────────────────────

  private plotarPins(medicoes: any[]): void {
    const map = this.mapaService.getMapa();
    if (!map) return;
    if (!map.getLayers().getArray().includes(this.pinsLayer))
      map.addLayer(this.pinsLayer);

    this.pinsSource.clear();
    this.pinColorMap.clear();

    const corBadge =
      CORES_LEGENDA.find((c) => c.value === this.corLegendaSelecionada)?.hex ??
      null;

    // Agrega por ponto (média dos valores da estatística selecionada)
    const pontoAgg = new Map<
      string,
      { vals: number[]; lon: number; lat: number }
    >();
    for (const m of medicoes) {
      if (!m.codPontoMedicao || m.longitude == null || m.latitude == null)
        continue;
      const val = m[this.estatisticaSelecionada] as number | null;
      if (val == null) continue;
      if (!pontoAgg.has(m.codPontoMedicao)) {
        pontoAgg.set(m.codPontoMedicao, {
          vals: [],
          lon: m.longitude,
          lat: m.latitude,
        });
      }
      pontoAgg.get(m.codPontoMedicao)!.vals.push(val);
    }

    const pontoMedia = new Map<string, number>();
    for (const [cod, { vals }] of pontoAgg) {
      pontoMedia.set(cod, vals.reduce((a, b) => a + b, 0) / vals.length);
    }

    // Legenda sempre fixa (0–55 em passos de 5), independente dos dados
    this.legendaItens = pontoAgg.size > 0 ? gerarLegendaFixa() : [];

    for (const [cod, { lon, lat }] of pontoAgg) {
      // Cor do pin pela classificação fixa
      const corPin = corParaValor(pontoMedia.get(cod)!);
      const valor = pontoMedia.get(cod) ?? null;
      this.pinColorMap.set(cod, corPin);
      const feature = new Feature({
        geometry: new OlPoint(fromLonLat([lon, lat])),
        codPontoMedicao: cod,
        valorEstatistica: valor,
      });
      feature.setStyle(criarEstiloPin(corPin, valor, corBadge) as any);
      this.pinsSource.addFeature(feature);
    }

    this.zoomParaPins(map);
  }

  private zoomParaPins(map: any): void {
    const extent = this.pinsSource.getExtent();
    if (!extent || extent.some((v: number) => !isFinite(v))) return;
    const [minX, minY, maxX, maxY] = extent;
    if (minX === maxX && minY === maxY) {
      map.getView().animate({ center: [minX, minY], zoom: 17, duration: 800 });
    } else {
      map
        .getView()
        .fit(extent, { duration: 800, maxZoom: 17, padding: [60, 60, 60, 60] });
    }
  }

  private destacarPin(codPonto: string | null): void {
    const corBadge =
      CORES_LEGENDA.find((c) => c.value === this.corLegendaSelecionada)?.hex ??
      null;
    for (const feature of this.pinsSource.getFeatures()) {
      const cod = feature.get('codPontoMedicao') as string;
      const corPin = this.pinColorMap.get(cod) ?? '#268A97';
      const valor = (feature.get('valorEstatistica') as number | null) ?? null;
      feature.setStyle(
        criarEstiloPin(corPin, valor, corBadge, cod === codPonto) as any,
      );
    }
  }

  private limparPins(): void {
    this.pinsSource.clear();
    this.pinColorMap.clear();
  }

  // ── Attribute-table ───────────────────────────────────────────────────────

  private publicarNaTabelaAtributos(medicoes: any[]): void {
    const rows = medicoes.map((m) => ({
      'Cod. SIMP': m.codPontoMedicao,
      Cota: m.cotaMedidor,
      Mínima: m.pressaoMinima,
      Média: m.pressaoMedia,
      Máxima: m.pressaoMaxima,
      Amplitude: m.amplitude,
      Piezométrica: m.piezometrica,
      'Qtd Registros': m.qtdeRegistros,
      geometry:
        m.longitude != null && m.latitude != null
          ? {
              type: 'Point',
              coordinates: fromLonLat([m.longitude, m.latitude]),
            }
          : null,
    }));
    const colunas = [
      'Cod. SIMP',
      'Cota',
      'Mínima',
      'Média',
      'Máxima',
      'Amplitude',
      'Piezométrica',
      'Qtd Registros',
    ];
    this.conteudoService.adicionarAbaDw(
      'consulta-espacial-pitometria',
      rows,
      colunas,
    );
  }

  // ── Fonte de Dados ───────────────────────────────────────────────────────

  isFonteSelecionada(fonte: string): boolean {
    return this.fontesDadosSelecionadas.has(fonte);
  }

  toggleFonte(fonte: string): void {
    if (this.fontesDadosSelecionadas.has(fonte)) {
      this.fontesDadosSelecionadas.delete(fonte);
    } else {
      this.fontesDadosSelecionadas.add(fonte);
    }
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get camadaSelecionada(): CamadaEspacialItem | null {
    return (
      this.camadasEspaciais.find(
        (c) => c.camadaId === this.camadaEspacialSelecionadaId,
      ) ?? null
    );
  }

  get podeConsultar(): boolean {
    return !!this.ultimoPoligono && !this.carregando;
  }

  get corHexSelecionada(): string {
    if (!this.corLegendaSelecionada)
      return 'linear-gradient(to right, #0000ff, #00c8ff, #00c800, #ffdc00, #ff1e00)';
    return (
      CORES_LEGENDA.find((c) => c.value === this.corLegendaSelecionada)?.hex ??
      '#268A97'
    );
  }
}
