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
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Overlay from 'ol/Overlay';
import ImageWMS from 'ol/source/ImageWMS';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import OlPoint from 'ol/geom/Point';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';
import { HttpClient } from '@angular/common/http';

import { WindowBehavior } from 'src/app/shared/window/window-behavior';
import { MapaService } from 'src/app/services/mapa.service';
import { PitometriaService } from 'src/app/services/api/pitometria.service';
import { GetComponenteNomeService } from 'src/app/services/api/get-componente-nome.service';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { FetchContentOrganizationService } from 'src/app/services/api/fetch.content.organization.service';
import {
  PitometriaContagem,
  TipoPitometria,
} from 'src/app/models/pitometria.model';
import { Componente } from 'src/app/models/componente.model';

type PopupModo = 'cadastro' | 'edicao';

/**
 * Modo mover:
 *  'off'            → inativo
 *  'select_feature' → aguardando clique em um ponto existente para selecioná-lo
 *  'select_position'→ ponto selecionado, aguardando clique no destino
 */
type MoverEstado = 'off' | 'select_feature' | 'select_position';

@Component({
  selector: 'app-pitometria-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './pitometria-card.component.html',
  styleUrl: './pitometria-card.component.scss',
})
export class PitometriaCardComponent
  extends WindowBehavior
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('draggableWindow')
  override draggableWindow!: ElementRef<HTMLElement>;
  @ViewChild('pitometriaPopup') pitometriaPopupEl!: ElementRef<HTMLElement>;
  @ViewChild('hoverTooltip') hoverTooltipEl!: ElementRef<HTMLElement>;

  @Output() fechado = new EventEmitter<void>();

  override defaultSize = { width: 280, height: 260 };
  override minimizedSize = { width: 220, height: 42 };

  componente: Componente | null = null;
  nomeCamada = 'pitometria';
  workspace = 'content';

  tipoSelecionado: TipoPitometria | null = null;
  contagem: PitometriaContagem = { total: 0, totalVazao: 0, totalPressao: 0 };

  // Popup cadastro/edição
  popupVisivel = false;
  popupModo: PopupModo = 'cadastro';
  popupCarregando = false;
  form = { codigoSimp: '', matricula: '', tipo: 'VAZAO' as TipoPitometria };
  formErros = { codigoSimp: false, matricula: false };
  featureIdEditando: string | null = null;
  confirmarExclusao = false;

  // Modo mover
  moverEstado: MoverEstado = 'off';
  featureIdMovendo: string | null = null;
  moverCarregando = false;

  // Hover
  hoverFeature: any = null;

  // OL
  private formOverlay!: Overlay;
  private hoverOverlay!: Overlay;
  private highlightLayer!: VectorLayer<VectorSource>;
  private highlightSource = new VectorSource();
  private clickListener: ((e: any) => void) | null = null;
  private pointerMoveListener: ((e: any) => void) | null = null;
  private hoverTimer: any = null;
  private readonly REFRESH_DELAY_MS = 800;
  private temaIdAlvo: string | null = null;
  private grupoIdAlvo: string | null = null;
  private camadaIdAlvo: string | null = null;

  constructor(
    protected override cdr: ChangeDetectorRef,
    private mapaService: MapaService,
    private pitometriaService: PitometriaService,
    private getComponenteNomeService: GetComponenteNomeService,
    private conteudoService: ConteudoService,
    private fetchContentOrganizationService: FetchContentOrganizationService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
  ) {
    super(cdr);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.mapaService.setIdentifyEnabled(false);
    this.getComponenteNomeService.getComponenteByNome('pitometria').subscribe({
      next: (componente) => {
        this.componente = componente;
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
        this.carregarContagem();
      },
      error: () => {
        this.carregarContagem();
      },
    });
  }

  ngAfterViewInit(): void {
    this.positionTopRight();
    this.initWindowBehaviorLifecycle();
    this.inicializarOverlays();
    this.inicializarHighlightLayer();
    const map = this.mapaService.getMapa();
    if (map) this.ativarListeners(map);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.mapaService.setIdentifyEnabled(true);
    clearTimeout(this.hoverTimer);
    this.removerListeners();
    const map = this.mapaService.getMapa();
    if (map) {
      if (this.formOverlay) map.removeOverlay(this.formOverlay);
      if (this.hoverOverlay) map.removeOverlay(this.hoverOverlay);
      if (this.highlightLayer) map.removeLayer(this.highlightLayer);
      map.getTargetElement().style.cursor = '';
    }
  }

  // ─── Contagem ──────────────────────────────────────────────────────────────

  private carregarContagem(): void {
    this.pitometriaService.fetchPitometrias().subscribe({
      next: (res) => {
        this.contagem = {
          total: res.total,
          totalVazao: res.totalVazao,
          totalPressao: res.totalPressao,
        };
        this.cdr.detectChanges();
      },
    });
  }

  private agendarRefreshWMS(): void {
    if (!this.temaIdAlvo || !this.grupoIdAlvo || !this.camadaIdAlvo) {
      console.warn(
        '[Pitometria] IDs de contexto ausentes — refresh WMS ignorado',
      );
      return;
    }
    // Remove a camada para zerar o estado interno do ImageWMS source
    this.conteudoService.emitirToggleCamadaComContexto(
      this.temaIdAlvo,
      this.grupoIdAlvo,
      this.camadaIdAlvo,
      false,
    );
    // Re-adiciona com um novo ImageWMS source após o delay — garante renderização
    // correta na escala atual e em qualquer zoom subsequente
    setTimeout(() => {
      this.conteudoService.emitirToggleCamadaComContexto(
        this.temaIdAlvo!,
        this.grupoIdAlvo!,
        this.camadaIdAlvo!,
        true,
      );
    }, this.REFRESH_DELAY_MS);
  }

  // ─── Tipo ──────────────────────────────────────────────────────────────────

  selecionarTipo(tipo: TipoPitometria): void {
    if (this.moverEstado !== 'off') return; // não muda tipo enquanto move
    this.tipoSelecionado = this.tipoSelecionado === tipo ? null : tipo;
    this.atualizarCursor();
    this.cdr.detectChanges();
  }

  // ─── OL setup ──────────────────────────────────────────────────────────────

  private inicializarOverlays(): void {
    const map = this.mapaService.getMapa();
    if (!map) return;

    this.formOverlay = new Overlay({
      element: this.pitometriaPopupEl.nativeElement,
      autoPan: { animation: { duration: 250 } },
      positioning: 'bottom-center',
      stopEvent: true,
    });
    map.addOverlay(this.formOverlay);

    this.hoverOverlay = new Overlay({
      element: this.hoverTooltipEl.nativeElement,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -14],
    });
    map.addOverlay(this.hoverOverlay);
  }

  private inicializarHighlightLayer(): void {
    const map = this.mapaService.getMapa();
    if (!map) return;

    this.highlightLayer = new VectorLayer({
      source: this.highlightSource,
      zIndex: 101,
      style: (_feature, resolution) => {
        const radius = this.calcularRaioCirculo(resolution, 11, 18);
        return new Style({
          image: new CircleStyle({
            radius,
            fill: new Fill({ color: 'rgba(255,255,255,0.1)' }),
            stroke: new Stroke({ color: '#fff176', width: 3 }),
          }),
        });
      },
    });
    map.addLayer(this.highlightLayer);
  }

  /**
   * Calcula o raio do círculo em pixels de forma responsiva à resolução do mapa.
   * Em zooms próximos (cidade) usa o raio mínimo; em zooms afastados (estado/região)
   * o raio cresce progressivamente para manter visibilidade.
   */
  private calcularRaioCirculo(
    resolution: number,
    minRadius: number,
    maxRadius: number,
  ): number {
    const logMinRes = Math.log2(10); // ~zoom 15 (cidade)
    const logMaxRes = Math.log2(5000); // ~zoom 7 (estado/região)
    const logRes = Math.log2(Math.max(resolution, 1));
    const t = Math.max(
      0,
      Math.min(1, (logRes - logMinRes) / (logMaxRes - logMinRes)),
    );
    return Math.round(minRadius + t * (maxRadius - minRadius));
  }

  // ─── Listeners ─────────────────────────────────────────────────────────────

  private ativarListeners(map: any): void {
    this.clickListener = (e: any) => this.onMapClick(e);
    map.on('click', this.clickListener);

    this.pointerMoveListener = (e: any) => this.onPointerMove(e);
    map.on('pointermove', this.pointerMoveListener);
  }

  private removerListeners(): void {
    const map = this.mapaService.getMapa();
    if (!map) return;
    if (this.clickListener) {
      map.un('click', this.clickListener);
      this.clickListener = null;
    }
    if (this.pointerMoveListener) {
      map.un('pointermove', this.pointerMoveListener);
      this.pointerMoveListener = null;
    }
  }

  private atualizarCursor(): void {
    const map = this.mapaService.getMapa();
    if (!map) return;
    const el = map.getTargetElement();
    if (this.moverEstado === 'select_feature') {
      el.style.cursor = 'pointer';
    } else if (this.moverEstado === 'select_position') {
      el.style.cursor = 'crosshair';
    } else if (this.tipoSelecionado) {
      el.style.cursor = 'crosshair';
    } else if (this.hoverFeature) {
      el.style.cursor = 'pointer';
    } else {
      el.style.cursor = '';
    }
  }

  // ─── Hover ─────────────────────────────────────────────────────────────────

  private onPointerMove(e: any): void {
    // Não detecta hover quando popup aberto ou aguardando posição de destino
    if (this.popupVisivel || this.moverEstado === 'select_position') return;

    clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => this.detectarHover(e.coordinate), 150);
  }

  private detectarHover(coordinate: [number, number]): void {
    const map = this.mapaService.getMapa();
    if (!map) return;

    const url = this.getFeatureInfoUrl(coordinate);
    if (!url) {
      this.limparHover();
      return;
    }

    this.http.get<any>(url).subscribe({
      next: (resp) => {
        const features = resp?.features ?? [];
        if (features.length > 0) {
          this.definirHover(features[0]);
        } else {
          this.limparHover();
        }
      },
      error: () => this.limparHover(),
    });
  }

  private definirHover(feature: any): void {
    this.hoverFeature = feature;
    const coords = feature.geometry?.coordinates;
    this.highlightSource.clear();
    if (coords) {
      this.highlightSource.addFeature(new Feature(new OlPoint(coords)));
      // Só mostra tooltip no modo normal (não durante modo mover)
      if (this.moverEstado === 'off') {
        this.hoverOverlay.setPosition(coords);
      }
    }
    this.atualizarCursor();
    this.cdr.detectChanges();
  }

  private limparHover(): void {
    this.hoverFeature = null;
    this.highlightSource.clear();
    this.hoverOverlay.setPosition(undefined);
    this.atualizarCursor();
    this.cdr.detectChanges();
  }

  // ─── Click no mapa ─────────────────────────────────────────────────────────

  private onMapClick(e: any): void {
    const coordinate = e.coordinate as [number, number];
    const map = this.mapaService.getMapa();
    if (!map) return;

    // Estado mover — passo 2: confirma posição de destino
    if (this.moverEstado === 'select_position') {
      this.confirmarMovimento(coordinate);
      return;
    }

    // Estado mover — passo 1: seleciona o ponto a mover
    if (this.moverEstado === 'select_feature') {
      // Reutiliza hover se disponível (evita round-trip)
      if (this.hoverFeature) {
        this.selecionarFeatureParaMover(this.hoverFeature);
      } else {
        this.buscarFeatureParaMover(coordinate);
      }
      return;
    }

    // Modo normal: editar ponto existente ou cadastrar novo
    const url = this.getFeatureInfoUrl(coordinate);
    if (!url) {
      if (this.tipoSelecionado) this.abrirPopupCadastro(coordinate);
      return;
    }

    this.http.get<any>(url).subscribe({
      next: (resp) => {
        const features = resp?.features ?? [];
        if (features.length > 0) {
          const f = features[0];
          // Extrai o UUID do fid raiz (ex: "TP_PITOMETRIA.uuid") e injeta nas props
          const fid: string = f.id ?? '';
          const uuid = fid.includes('.')
            ? fid.split('.').slice(1).join('.')
            : fid;
          const props = { ...f.properties, COD_PITOMETRIA_ID: uuid };
          this.abrirPopupEdicao(props, coordinate);
        } else if (this.tipoSelecionado) {
          this.abrirPopupCadastro(coordinate);
        }
      },
      error: () => {
        if (this.tipoSelecionado) this.abrirPopupCadastro(coordinate);
      },
    });
  }

  // ─── Modo mover ────────────────────────────────────────────────────────────

  ativarModoMover(): void {
    this.fecharPopup();
    this.tipoSelecionado = null;
    this.moverEstado = 'select_feature';
    this.hoverOverlay.setPosition(undefined);
    this.highlightSource.clear();
    this.hoverFeature = null;
    this.atualizarCursor();
    this.cdr.detectChanges();
  }

  cancelarMover(): void {
    this.moverEstado = 'off';
    this.featureIdMovendo = null;
    this.moverCarregando = false;
    this.hoverFeature = null;
    this.highlightSource.clear();
    this.hoverOverlay.setPosition(undefined);
    this.atualizarCursor();
    this.cdr.detectChanges();
  }

  private selecionarFeatureParaMover(feature: any): void {
    const props = feature.properties ?? feature;
    // GeoServer retorna o PK no campo "id" raiz do GeoJSON (ex: "TP_PITOMETRIA.uuid-aqui")
    // As properties não incluem a PK — precisamos extrair do fid e remover o prefixo da tabela
    const fid: string = feature.id ?? props.COD_PITOMETRIA_ID ?? '';
    const id = fid.includes('.')
      ? fid.split('.').slice(1).join('.')
      : fid || null;
    if (!id) {
      this.snackBar.open('Não foi possível identificar o ponto', 'OK', {
        duration: 2000,
      });
      return;
    }
    this.featureIdMovendo = id;
    this.moverEstado = 'select_position';
    this.atualizarCursor();
    this.cdr.detectChanges();
  }

  private buscarFeatureParaMover(coordinate: [number, number]): void {
    const url = this.getFeatureInfoUrl(coordinate);
    if (!url) {
      this.snackBar.open('Clique sobre um ponto existente', 'OK', {
        duration: 2000,
      });
      return;
    }

    this.moverCarregando = true;
    this.cdr.detectChanges();

    this.http.get<any>(url).subscribe({
      next: (resp) => {
        this.moverCarregando = false;
        console.log('[Pitometria] GetFeatureInfo resposta (mover):', resp);
        const features = resp?.features ?? [];
        if (features.length > 0) {
          this.selecionarFeatureParaMover(features[0]);
        } else {
          this.snackBar.open(
            'Nenhum ponto encontrado — clique mais próximo do centro do ponto',
            'OK',
            { duration: 3000 },
          );
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('[Pitometria] Erro GetFeatureInfo (mover):', err);
        this.moverCarregando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private confirmarMovimento(novaCoord: [number, number]): void {
    if (!this.featureIdMovendo) return;
    this.moverCarregando = true;
    this.cdr.detectChanges();

    this.pitometriaService
      .updateGeometria(this.featureIdMovendo, novaCoord[0], novaCoord[1])
      .subscribe({
        next: () => {
          this.snackBar.open('Ponto movido com sucesso', 'OK', {
            duration: 3000,
          });
          this.cancelarMover();
          this.agendarRefreshWMS();
        },
        error: () => {
          this.snackBar.open('Erro ao mover ponto', 'OK', { duration: 3000 });
          this.moverCarregando = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ─── Popup ─────────────────────────────────────────────────────────────────

  private abrirPopupCadastro(coordinate: [number, number]): void {
    this.popupModo = 'cadastro';
    this.form = {
      codigoSimp: '',
      matricula: '',
      tipo: this.tipoSelecionado ?? 'VAZAO',
    };
    this.formErros = { codigoSimp: false, matricula: false };
    this.featureIdEditando = null;
    this.confirmarExclusao = false;
    this.formOverlay.setPosition(coordinate);
    this.popupVisivel = true;
    this.cdr.detectChanges();
  }

  private abrirPopupEdicao(feature: any, coordinate: [number, number]): void {
    this.popupModo = 'edicao';
    this.featureIdEditando = feature.id ?? feature.COD_PITOMETRIA_ID ?? null;
    this.form = {
      codigoSimp: feature.COD_SIMP ?? feature.cod_simp ?? '',
      matricula: feature.MATRICULA ?? feature.matricula ?? '',
      tipo: feature.TIPO ?? feature.tipo ?? 'VAZAO',
    };
    this.formErros = { codigoSimp: false, matricula: false };
    this.confirmarExclusao = false;
    this.formOverlay.setPosition(coordinate);
    this.popupVisivel = true;
    this.cdr.detectChanges();
  }

  fecharPopup(): void {
    clearTimeout(this.hoverTimer);
    this.popupVisivel = false;
    this.formOverlay.setPosition(undefined);
    this.confirmarExclusao = false;
    this.limparHover();
    this.atualizarCursor();
    this.cdr.detectChanges();
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  private validarForm(): boolean {
    this.formErros.codigoSimp = !this.form.codigoSimp.trim();
    this.formErros.matricula = !this.form.matricula.trim();
    return !this.formErros.codigoSimp && !this.formErros.matricula;
  }

  salvar(): void {
    if (!this.validarForm()) return;
    this.popupCarregando = true;

    if (this.popupModo === 'cadastro') {
      const coord = this.formOverlay.getPosition() as [number, number];
      this.pitometriaService
        .createPitometria({
          codigoSimp: this.form.codigoSimp,
          matricula: this.form.matricula,
          tipo: this.form.tipo,
          longitude: coord[0],
          latitude: coord[1],
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Medição cadastrada com sucesso', 'OK', {
              duration: 3000,
            });
            this.popupCarregando = false;
            this.fecharPopup();
            this.agendarRefreshWMS();
            this.carregarContagem();
          },
          error: () => {
            this.snackBar.open('Erro ao cadastrar medição', 'OK', {
              duration: 3000,
            });
            this.popupCarregando = false;
            this.cdr.detectChanges();
          },
        });
    } else if (this.featureIdEditando) {
      this.pitometriaService
        .updatePitometria(this.featureIdEditando, {
          codigoSimp: this.form.codigoSimp,
          matricula: this.form.matricula,
          tipo: this.form.tipo,
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Medição atualizada com sucesso', 'OK', {
              duration: 3000,
            });
            this.popupCarregando = false;
            this.fecharPopup();
            this.agendarRefreshWMS();
          },
          error: () => {
            this.snackBar.open('Erro ao atualizar medição', 'OK', {
              duration: 3000,
            });
            this.popupCarregando = false;
            this.cdr.detectChanges();
          },
        });
    }
  }

  excluir(): void {
    if (!this.confirmarExclusao) {
      this.confirmarExclusao = true;
      this.cdr.detectChanges();
      return;
    }
    if (!this.featureIdEditando) return;
    this.popupCarregando = true;
    this.pitometriaService.deletePitometria(this.featureIdEditando).subscribe({
      next: () => {
        this.snackBar.open('Medição excluída', 'OK', { duration: 3000 });
        this.popupCarregando = false;
        this.limparHover();
        this.fecharPopup();
        this.agendarRefreshWMS();
        this.carregarContagem();
      },
      error: () => {
        this.snackBar.open('Erro ao excluir medição', 'OK', { duration: 3000 });
        this.popupCarregando = false;
        this.cdr.detectChanges();
      },
    });
  }

  cancelarExclusao(): void {
    this.confirmarExclusao = false;
    this.cdr.detectChanges();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private getFeatureInfoUrl(coordinate: [number, number]): string | undefined {
    const map = this.mapaService.getMapa();
    if (!map) return undefined;
    const source = this.obterFonteWMSPitometriaAtiva();
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

  private obterFonteWMSPitometriaAtiva(): ImageWMS | null {
    const map = this.mapaService.getMapa();
    if (!map) return null;

    const layerIdEsperado = `content:${this.nomeCamada}`.toLowerCase();
    const target = `${this.workspace}:${this.nomeCamada}`.toLowerCase();

    const todasCamadas: any[] = [];
    const visit = (layerOrGroup: any) => {
      const groupLayers = layerOrGroup?.getLayers?.()?.getArray?.();
      if (Array.isArray(groupLayers)) {
        groupLayers.forEach(visit);
        return;
      }
      todasCamadas.push(layerOrGroup);
    };
    map.getLayers().getArray().forEach(visit);

    const candidatos = todasCamadas.filter((layer: any) => {
      const params = layer?.getSource?.()?.getParams?.();
      const layersParam = params?.LAYERS;
      const layerIds =
        typeof layersParam === 'string'
          ? layersParam.split(',').map((x: string) => x.trim().toLowerCase())
          : [];
      const byParams = layerIds.includes(target);
      const byId =
        String(layer?.get?.('id') ?? '').toLowerCase() === 'pitometria_layer';
      return byParams || byId;
    });

    const preferidaPorId = candidatos.find(
      (l: any) =>
        String(l?.get?.('id') ?? '').toLowerCase() === layerIdEsperado,
    );
    if (preferidaPorId) {
      const src = preferidaPorId?.getSource?.();
      if (src instanceof ImageWMS) return src;
    }

    const layer =
      candidatos.find((l: any) => l?.getVisible?.() !== false) ?? candidatos[0];
    const source = layer?.getSource?.();
    return source instanceof ImageWMS ? source : null;
  }
}
