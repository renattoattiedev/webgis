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
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import OlPoint from 'ol/geom/Point';
import { Style, Icon, Circle as CircleStyle, Fill, Stroke } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { Subject, takeUntil } from 'rxjs';

import { WindowBehavior } from 'src/app/shared/window/window-behavior';
import { MapaService } from 'src/app/services/mapa.service';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { GetComponenteNomeService } from 'src/app/services/api/get-componente-nome.service';
import { FetchContentOrganizationService } from 'src/app/services/api/fetch.content.organization.service';
import ImageWMS from 'ol/source/ImageWMS';

const PIN_LARANJA = '#FF9800';
const PIN_VERMELHO = '#F44336';

function criarEstiloPin(cor: string): Style {
  return new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({ color: cor }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
  });
}

@Component({
  selector: 'app-consulta-pitometria',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './consulta-pitometria.component.html',
  styleUrl: './consulta-pitometria.component.scss',
})
export class ConsultaPitometriaComponent
  extends WindowBehavior
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('draggableWindow')
  override draggableWindow!: ElementRef<HTMLElement>;
  @Output() fechado = new EventEmitter<void>();

  override defaultSize = { width: 310, height: 420 };
  override minimizedSize = { width: 240, height: 42 };

  form!: FormGroup;
  carregando = false;

  private nomeCamada = 'pitometria';
  private workspace = 'content';
  private temaIdAlvo: string | null = null;
  private grupoIdAlvo: string | null = null;
  private camadaIdAlvo: string | null = null;

  private pinsLayer!: VectorLayer<VectorSource>;
  private pinsSource = new VectorSource();
  private pinFeatureMap = new Map<string, Feature>();
  private codSimpSelecionado: string | null = null;

  private clickListener: ((e: any) => void) | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    protected override cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private mapaService: MapaService,
    private conteudoService: ConteudoService,
    private getComponenteNomeService: GetComponenteNomeService,
    private fetchContentOrganizationService: FetchContentOrganizationService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
  ) {
    super(cdr);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.form = this.fb.group({
      codSimp: [''],
      matricula: [''],
      numeroOs: [''],
      dataInicio: [''],
      dataFim: [''],
    });

    this.getComponenteNomeService.getComponenteByNome('pitometria').subscribe({
      next: (componente) => {
        const alvo = componente?.configuracao?.camada_alvo;
        if (alvo) {
          this.nomeCamada = alvo.nomeCamada ?? 'pitometria';
          this.workspace = alvo.workspace ?? 'content';
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
      },
    });

    // Escuta seleção de linha no attribute-table para destacar pin
    this.conteudoService.dwLinhaSelcionada$
      .pipe(takeUntil(this.destroy$))
      .subscribe((codPonto) => {
        this.destacarPin(codPonto);
      });
  }

  ngAfterViewInit(): void {
    this.positionTopRight();
    this.initWindowBehaviorLifecycle();
    this.inicializarPinsLayer();
    const map = this.mapaService.getMapa();
    if (map) {
      this.clickListener = (e: any) => this.onMapClick(e);
      map.on('singleclick', this.clickListener);
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroy$.next();
    this.destroy$.complete();
    this.removerListeners();
    this.limparPins();
    const map = this.mapaService.getMapa();
    if (map && this.pinsLayer) {
      map.removeLayer(this.pinsLayer);
    }
  }

  // ─── Formulário ────────────────────────────────────────────────────────────

  get consultarDesabilitado(): boolean {
    const v = this.form.value;
    return (
      !v.codSimp && !v.matricula && !v.numeroOs && !v.dataInicio && !v.dataFim
    );
  }

  consultar(): void {
    if (this.consultarDesabilitado || this.carregando) return;
    this.carregando = true;
    this.cdr.detectChanges();

    // A consulta de pitometria dependia das rotas DW (/pitometria-dw), que
    // foram removidas do backend. Mantém o componente renderizando estado vazio.
    this.carregando = false;
    this.snackBar.open(
      'Consulta de pitometria (DW) indisponível no momento.',
      'OK',
      { duration: 3000 },
    );
    this.cdr.detectChanges();
  }

  limpar(): void {
    this.form.reset({
      codSimp: '',
      matricula: '',
      numeroOs: '',
      dataInicio: '',
      dataFim: '',
    });
    this.limparPins();
    this.cdr.detectChanges();
  }

  fechar(): void {
    this.limparPins();
    this.fechado.emit();
  }

  // ─── Mapa: click para preencher CodSIMP ────────────────────────────────────

  private onMapClick(e: any): void {
    const coordinate = e.coordinate as [number, number];
    const url = this.getFeatureInfoUrl(coordinate);
    if (!url) return;

    this.http.get<any>(url).subscribe({
      next: (resp) => {
        const features = resp?.features ?? [];
        if (features.length > 0) {
          const props = features[0].properties ?? {};
          const cod =
            props['COD_SIMP'] ??
            props['cod_simp'] ??
            props['CodPontoMedicao'] ??
            null;
          if (cod) {
            this.form.patchValue({ codSimp: cod });
            this.cdr.detectChanges();
          }
        }
      },
    });
  }

  private getFeatureInfoUrl(coordinate: [number, number]): string | undefined {
    const map = this.mapaService.getMapa();
    if (!map) return undefined;
    const source = this.obterFonteWMS();
    if (!source) return undefined;
    const view = map.getView();
    return (
      source.getFeatureInfoUrl(
        coordinate,
        view.getResolution()!,
        view.getProjection(),
        {
          INFO_FORMAT: 'application/json',
          FEATURE_COUNT: 1,
          BUFFER: 12,
        },
      ) ?? undefined
    );
  }

  private obterFonteWMS(): ImageWMS | null {
    const map = this.mapaService.getMapa();
    if (!map) return null;
    const target = `${this.workspace}:${this.nomeCamada}`.toLowerCase();

    const todasCamadas: any[] = [];
    const visit = (l: any) => {
      const sub = l?.getLayers?.()?.getArray?.();
      if (Array.isArray(sub)) {
        sub.forEach(visit);
        return;
      }
      todasCamadas.push(l);
    };
    map.getLayers().getArray().forEach(visit);

    const layer = todasCamadas.find((l: any) => {
      const params = l?.getSource?.()?.getParams?.();
      const layersParam: string = params?.LAYERS ?? '';
      return layersParam
        .toLowerCase()
        .split(',')
        .map((x: string) => x.trim())
        .includes(target);
    });
    const source = layer?.getSource?.();
    return source instanceof ImageWMS ? source : null;
  }

  // ─── Pins OL ───────────────────────────────────────────────────────────────

  private inicializarPinsLayer(): void {
    const map = this.mapaService.getMapa();
    if (!map) return;

    this.pinsLayer = new VectorLayer({
      source: this.pinsSource,
      zIndex: 200,
      style: criarEstiloPin(PIN_LARANJA),
    });
    map.addLayer(this.pinsLayer);
  }

  private plotarPins(medicoes: any[]): void {
    const map = this.mapaService.getMapa();
    if (!map) return;

    // Garante que a layer existe e está no mapa (caso ngAfterViewInit tenha falhado)
    if (!this.pinsLayer) {
      this.inicializarPinsLayer();
    }
    if (
      this.pinsLayer &&
      !map.getLayers().getArray().includes(this.pinsLayer)
    ) {
      map.addLayer(this.pinsLayer);
    }

    this.pinsSource.clear();
    this.pinFeatureMap.clear();

    const pontosVistos = new Map<string, boolean>();

    for (const m of medicoes) {
      if (!m.codPontoMedicao || pontosVistos.has(m.codPontoMedicao)) continue;
      if (m.longitude == null || m.latitude == null) continue;

      pontosVistos.set(m.codPontoMedicao, true);

      const feature = new Feature({
        geometry: new OlPoint(fromLonLat([m.longitude, m.latitude])),
        codPontoMedicao: m.codPontoMedicao,
      });
      feature.setStyle(criarEstiloPin(PIN_LARANJA));
      this.pinsSource.addFeature(feature);
      this.pinFeatureMap.set(m.codPontoMedicao, feature);
    }

    this.zoomParaPins(map);
  }

  private zoomParaPins(map: any): void {
    const extent = this.pinsSource.getExtent();
    if (!extent || extent.some((v) => !isFinite(v))) return;

    const [minX, minY, maxX, maxY] = extent;
    const isPontoUnico = minX === maxX && minY === maxY;

    if (isPontoUnico) {
      map.getView().animate({ center: [minX, minY], zoom: 17, duration: 800 });
    } else {
      map
        .getView()
        .fit(extent, { duration: 800, maxZoom: 17, padding: [60, 60, 60, 60] });
    }
  }

  private destacarPin(codPonto: string | null): void {
    for (const [cod, feature] of this.pinFeatureMap) {
      feature.setStyle(
        criarEstiloPin(cod === codPonto ? PIN_VERMELHO : PIN_LARANJA),
      );
    }
    this.codSimpSelecionado = codPonto;
  }

  private limparPins(): void {
    this.pinsSource.clear();
    this.pinFeatureMap.clear();
    this.codSimpSelecionado = null;
  }

  // ─── Attribute-table ───────────────────────────────────────────────────────

  private publicarNaTabelaAtributos(medicoes: any[]): void {
    const rows = medicoes.map((m) => ({
      ...m,
      geometry:
        m.longitude != null && m.latitude != null
          ? {
              type: 'Point',
              coordinates: fromLonLat([m.longitude, m.latitude]),
            }
          : null,
    }));
    const colunas = rows.length
      ? Object.keys(rows[0]).filter((k) => k !== 'geometry')
      : [];
    this.conteudoService.adicionarAbaDw(
      'consulta-pitometria',
      rows,
      colunas,
    );
  }

  private removerListeners(): void {
    const map = this.mapaService.getMapa();
    if (!map) return;
    if (this.clickListener) {
      map.un('singleclick', this.clickListener);
      this.clickListener = null;
    }
  }
}
