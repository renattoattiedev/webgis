import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, of, Subscription } from 'rxjs';

import { FetchContentOrganizationService } from '../../services/api/fetch.content.organization.service';
import { FetchIndicadoresService } from '../../services/api/fetch.indicadores.service';
import { GetAcessosCamada } from '../../services/api/get.acessos.camada.service';
import { GetAcessosCamadaRaster } from '../../services/api/get.acessos.camada.raster.service';
import { GetAcessosMapa } from '../../services/api/get.acessos.mapa.service';
import { ThumbnailCacheService } from '../../services/thumbnail-cache.service';
import { Camadas } from '../../models/camadas.model';
import { CamadasRaster } from '../../models/camadas.raster.model';
import { Mapas } from '../../models/mapas.model';
import { CamadaComOrdem, CamadaRasterComOrdem } from '../../models/mapas.model';

/* ─── Tipos locais ────────────────────────────────────────────────────────── */
export interface FormatoChip {
  rotulo: string;
  estilo: 'download' | 'metadados' | 'servico';
}

export type TipoDado = 'vetorial' | 'raster' | 'mapa';

export interface ItemCatalogo {
  id: string;
  tipo: TipoDado;
  nomeCamada: string; // nome técnico para WMS (sem prefixo workspace)
  fonteDadosCamadaRaster?: string; // sufixo extra para camadas raster
  titulo: string;
  descricao: string;
  grupoId: string;
  grupoNome: string;
  temaId: string;
  temaNome: string;
  tags: string | null;
  linkMetadados: string | null;
  boundingBox: string | null; // JSON {minx,miny,maxx,maxy} em EPSG:31983
  atualizadoRaw: string;
  atualizadoFmt: string;
  acessos: number;
  formatos: FormatoChip[];
  camadas?: CamadaComOrdem[];
  camadasRaster?: CamadaRasterComOrdem[];
  mapa?: Mapas;
  thumbnailUrl?: string;
}

export interface IndicadorDados {
  valor: string;
  label: string;
}

interface TematicaFiltro {
  id: string;
  nome: string;
  total: number;
  grupos: { id: string; nome: string; total: number }[];
  aberta: boolean;
}

interface FiltroTipo {
  id: TipoDado;
  rotulo: string;
  total: number;
  ativo: boolean;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const FMT_VETORIAL: FormatoChip[] = [
  { rotulo: 'SHP', estilo: 'download' },
  { rotulo: 'CSV', estilo: 'download' },
  { rotulo: 'KML', estilo: 'download' },
  { rotulo: 'GeoJSON', estilo: 'download' },
  { rotulo: 'WFS', estilo: 'servico' },
  { rotulo: 'WMS', estilo: 'servico' },
];
const FMT_RASTER: FormatoChip[] = [
  { rotulo: 'GeoTIFF', estilo: 'download' },
  { rotulo: 'WMS', estilo: 'servico' },
];
const FMT_MAPA: FormatoChip[] = [
  { rotulo: 'WMS', estilo: 'servico' },
  { rotulo: 'PDF', estilo: 'download' },
];

function formatos(tipo: TipoDado): FormatoChip[] {
  return tipo === 'vetorial'
    ? FMT_VETORIAL
    : tipo === 'raster'
      ? FMT_RASTER
      : FMT_MAPA;
}

function fmtData(raw: string | Date | null | undefined): string {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

const DEFAULT_BBOX = '315476.5,7691027.0,390465.375,7895713.0';
const THUMB_WIDTH = 800;
const THUMB_HEIGHT = 600;
const GS_BASE = '/geoserver-proxy/content';

function getThumbnailDimensions(
  bboxJson: string | null,
  width: number = THUMB_WIDTH,
  height: number = THUMB_HEIGHT,
): { bbox: string; w: number; h: number } {
  let bbox = DEFAULT_BBOX;

  if (bboxJson) {
    try {
      const b = JSON.parse(bboxJson);
      let minx = Number(b.minx);
      let miny = Number(b.miny);
      let maxx = Number(b.maxx);
      let maxy = Number(b.maxy);

      const bboxWidth = maxx - minx;
      const bboxHeight = maxy - miny;

      if (bboxWidth > 0 && bboxHeight > 0) {
        const targetAspectRatio = width / height;
        const bboxAspectRatio = bboxWidth / bboxHeight;

        if (bboxAspectRatio > targetAspectRatio) {
          const adjustedHeight = bboxWidth / targetAspectRatio;
          const padding = (adjustedHeight - bboxHeight) / 2;
          miny -= padding;
          maxy += padding;
        } else {
          const adjustedWidth = bboxHeight * targetAspectRatio;
          const padding = (adjustedWidth - bboxWidth) / 2;
          minx -= padding;
          maxx += padding;
        }

        bbox = `${minx},${miny},${maxx},${maxy}`;
      }
    } catch {
      /* usa defaults */
    }
  }

  return { bbox, w: width, h: height };
}

function buildRasterLayerName(item: ItemCatalogo): string {
  let layerName = item.nomeCamada;
  if (item.fonteDadosCamadaRaster)
    layerName += `_${item.fonteDadosCamadaRaster}`;
  return layerName;
}

function buildRasterCoverageId(item: ItemCatalogo): string {
  return `content__${buildRasterLayerName(item)}`;
}

function buildCompositeLayersParam(item: ItemCatalogo): string {
  const mapSource = item.mapa ?? item;
  const allLayers = [
    ...(mapSource.camadas || []),
    ...(mapSource.camadasRaster || []),
  ];

  return [...allLayers]
    .sort((a, b) => b.ordemRenderizacao - a.ordemRenderizacao)
    .map((layer) => {
      const baseName = `content:${layer.nomeCamada}`;
      if ('fonteDadosCamadaRaster' in layer && layer.fonteDadosCamadaRaster) {
        return `${baseName}_${layer.fonteDadosCamadaRaster}`;
      }
      return baseName;
    })
    .join(',');
}

function buildMapThumbnailUrl(mapa: Mapas): string {
  const allLayers = [...(mapa.camadas || []), ...(mapa.camadasRaster || [])];

  const layers = [...allLayers]
    .sort((a, b) => b.ordemRenderizacao - a.ordemRenderizacao)
    .map((layer) => {
      const baseName = `content:${layer.nomeCamada}`;
      if ('fonteDadosCamadaRaster' in layer && layer.fonteDadosCamadaRaster) {
        return `${baseName}_${layer.fonteDadosCamadaRaster}`;
      }
      return baseName;
    })
    .join(',');

  if (!layers) return '';

  const { bbox, w, h } = getThumbnailDimensions(mapa.boundingBoxMapa || null);
  return (
    `${GS_BASE}/wms?service=WMS&version=1.1.0&request=GetMap` +
    `&layers=${layers}&bbox=${bbox}&width=${w}&height=${h}` +
    `&srs=EPSG:31983&styles=&format=image/png&transparent=true`
  );
}

function thumbUrl(item: ItemCatalogo): string {
  if (item.tipo === 'raster') {
    let fullLayer = `content:${item.nomeCamada}`;
    if (item.fonteDadosCamadaRaster)
      fullLayer += `_${item.fonteDadosCamadaRaster}`;
    return `${GS_BASE}/wms/reflect?layers=${encodeURIComponent(fullLayer)}&format=image/png&width=${THUMB_WIDTH}&height=${THUMB_HEIGHT}`;
  }

  const { bbox, w, h } = getThumbnailDimensions(item.boundingBox);

  const fullLayer = `content:${item.nomeCamada}`;
  return (
    `${GS_BASE}/wms?service=WMS&version=1.1.0&request=GetMap` +
    `&layers=${fullLayer}&bbox=${bbox}&width=${w}&height=${h}` +
    `&srs=EPSG:31983&styles=&format=image/png&transparent=true`
  );
}

// Mesmos parâmetros que details.component usa via /content/ows
const OWS_FORMATS: Record<string, string> = {
  SHP: 'SHAPE-ZIP',
  CSV: 'csv',
  KML: 'application/vnd.google-earth.kml+xml',
  GeoJSON: 'application/json',
  GML: 'text/xml; subtype=gml/2.1.2',
};

const DOWNLOAD_EXTENSIONS: Record<string, string> = {
  SHP: 'zip',
  CSV: 'csv',
  KML: 'kml',
  GeoJSON: 'geojson',
  GML: 'gml',
  GeoTIFF: 'tif',
};

function normalizar(
  camadas: Camadas[],
  raster: CamadasRaster[],
  mapas: Mapas[],
): ItemCatalogo[] {
  const items: ItemCatalogo[] = [];

  for (const c of camadas) {
    if (!c.camadaAtiva) continue;
    items.push({
      id: c.id,
      tipo: 'vetorial',
      nomeCamada: c.nomeCamada,
      titulo: c.tituloCamada || c.nomeCamada,
      descricao: c.descricaoCamada || '',
      grupoId: c.grupoCamada,
      grupoNome: c.grupoCamadaNome || '',
      temaId: c.temaId || '',
      temaNome: c.temaCamadaNome || '',
      tags: c.tags || null,
      linkMetadados: c.linkMetadados || null,
      boundingBox: c.boundingBox || null,
      atualizadoRaw: c.updatedAt || c.criadoEm,
      atualizadoFmt: fmtData(c.updatedAt || c.criadoEm),
      acessos: 0,
      formatos: formatos('vetorial'),
    });
  }

  for (const c of raster) {
    if (!c.camadaAtiva) continue;
    items.push({
      id: c.id,
      tipo: 'raster',
      nomeCamada: c.nomeCamada,
      fonteDadosCamadaRaster: c.fonteDadosCamadaRaster || undefined,
      titulo: c.tituloCamada || c.nomeCamada,
      descricao: c.descricaoCamada || '',
      grupoId: c.grupoCamada,
      grupoNome: c.grupoCamadaNome || '',
      temaId: c.temaId || '',
      temaNome: c.temaCamadaNome || '',
      tags: c.tags || null,
      linkMetadados: c.linkMetadados || null,
      boundingBox: c.boundingBox || null,
      atualizadoRaw: c.updatedAt || c.criadoEm,
      atualizadoFmt: fmtData(c.updatedAt || c.criadoEm),
      acessos: 0,
      formatos: formatos('raster'),
    });
  }

  for (const m of mapas) {
    items.push({
      id: m.id,
      tipo: 'mapa',
      nomeCamada: m.nomeMapa,
      titulo: m.tituloMapa || m.nomeMapa,
      descricao: m.descricaoMapa || '',
      grupoId: m.grupoMapa,
      grupoNome: m.grupoMapaNome || '',
      temaId: m.temaId || '',
      temaNome: m.temaMapaNome || '',
      tags: null,
      linkMetadados: null,
      boundingBox: m.boundingBoxMapa || null,
      atualizadoRaw: m.updatedAt?.toString() || '',
      atualizadoFmt: fmtData(m.updatedAt),
      acessos: 0,
      formatos: formatos('mapa'),
      camadas: m.camadas || [],
      camadasRaster: m.camadasRaster || [],
      mapa: m,
      thumbnailUrl: buildMapThumbnailUrl(m),
    });
  }

  return items;
}

/* ─── Componente ──────────────────────────────────────────────────────────── */
@Component({
  selector: 'app-dados',
  templateUrl: './dados.component.html',
  styleUrls: ['./dados.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class DadosComponent implements OnInit, OnDestroy {
  carregando = true;
  erro = false;

  indicadores: IndicadorDados[] = [];

  private _todos: ItemCatalogo[] = [];

  tematicas: TematicaFiltro[] = [];
  tipos: FiltroTipo[] = [
    { id: 'vetorial', rotulo: 'Vetorial', total: 0, ativo: true },
    { id: 'raster', rotulo: 'Raster', total: 0, ativo: false },
    { id: 'mapa', rotulo: 'Mapas', total: 0, ativo: false },
  ];

  gruposSelecionados = new Set<string>();
  termoBusca = '';

  readonly ordenacoes = ['Mais recentes', 'Mais acessados', 'A → Z'];
  ordenacaoAtual = this.ordenacoes[0];
  ordenarAberto = false;

  readonly porPagina = 10;
  paginaAtual = 1;
  conjuntos: ItemCatalogo[] = []; // resultado filtrado + ordenado

  // ── Thumbnails ─────────────────────────────────────────────────────────
  private thumbnailUrls = new Map<string, string>();
  private thumbLoading = new Set<string>();
  private thumbErrors = new Set<string>();

  // ── Toast ──────────────────────────────────────────────────────────────
  toastMsg: string | null = null;
  toastTipo: 'ok' | 'info' | 'erro' = 'ok';
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;

  private subs: Subscription[] = [];

  constructor(
    private contentService: FetchContentOrganizationService,
    private indicadoresService: FetchIndicadoresService,
    private acessosCamada: GetAcessosCamada,
    private acessosRaster: GetAcessosCamadaRaster,
    private acessosMapa: GetAcessosMapa,
    private thumbnailCacheService: ThumbnailCacheService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const content$ = this.contentService
      .getContentOrganization()
      .pipe(
        catchError(() => of({ camadas: [], camadasRaster: [], mapas: [] })),
      );

    this.subs.push(
      forkJoin({
        content: content$,
        indicadores: this.indicadoresService.getIndicadores(),
      }).subscribe({
        next: ({ content, indicadores }) => {
          this.indicadores = [
            { valor: String(indicadores.temas), label: 'temas ativos' },
            { valor: String(indicadores.grupos), label: 'grupos de camadas' },
            {
              valor: String(indicadores.camadasVetoriais),
              label: 'camadas vetoriais',
            },
            {
              valor: String(indicadores.camadasRaster),
              label: 'camadas raster',
            },
            { valor: String(indicadores.mapas), label: 'mapas publicados' },
            {
              valor: String(indicadores.usuarios),
              label: 'usuários cadastrados',
            },
          ];

          this._todos = normalizar(
            content.camadas,
            content.camadasRaster,
            content.mapas,
          );
          this._construirFiltros();
          this._aplicarFiltros();
          this.carregando = false;
          this.cdr.detectChanges();

          // acessos assíncronos
          this._carregarAcessos();
        },
        error: () => {
          this.erro = true;
          this.carregando = false;
          this.cdr.detectChanges();
        },
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this._toastTimer) clearTimeout(this._toastTimer);
  }

  /* ── Filtros ─────────────────────────────────────────────────────────────── */
  private _construirFiltros(): void {
    this.tipos[0].total = this._todos.filter(
      (i) => i.tipo === 'vetorial',
    ).length;
    this.tipos[1].total = this._todos.filter((i) => i.tipo === 'raster').length;
    this.tipos[2].total = this._todos.filter((i) => i.tipo === 'mapa').length;

    const temaMap = new Map<
      string,
      { nome: string; grupos: Map<string, string> }
    >();
    for (const item of this._todos) {
      if (!item.temaId) continue;
      if (!temaMap.has(item.temaId)) {
        temaMap.set(item.temaId, { nome: item.temaNome, grupos: new Map() });
      }
      if (item.grupoId) {
        temaMap.get(item.temaId)!.grupos.set(item.grupoId, item.grupoNome);
      }
    }

    this.tematicas = Array.from(temaMap.entries())
      .map(
        ([id, t]): TematicaFiltro => ({
          id,
          nome: t.nome,
          aberta: false,
          total: this._todos.filter((i) => i.temaId === id).length,
          grupos: Array.from(t.grupos.entries())
            .map(([gid, gnome]) => ({
              id: gid,
              nome: gnome,
              total: this._todos.filter((i) => i.grupoId === gid).length,
            }))
            .sort((a, b) => a.nome.localeCompare(b.nome)),
        }),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  private _aplicarFiltros(): void {
    const tiposAtivos = new Set(
      this.tipos.filter((t) => t.ativo).map((t) => t.id),
    );
    const termo = this.termoBusca.toLowerCase().trim();

    let itens = this._todos.filter((i) => {
      if (!tiposAtivos.has(i.tipo)) return false;
      if (
        this.gruposSelecionados.size > 0 &&
        !this.gruposSelecionados.has(i.grupoId)
      )
        return false;
      if (
        termo &&
        !i.titulo.toLowerCase().includes(termo) &&
        !i.descricao.toLowerCase().includes(termo) &&
        !(i.tags ?? '').toLowerCase().includes(termo)
      )
        return false;
      return true;
    });

    itens = this._ordenar(itens);
    this.conjuntos = itens;
    this.paginaAtual = 1;
  }

  private _ordenar(itens: ItemCatalogo[]): ItemCatalogo[] {
    switch (this.ordenacaoAtual) {
      case 'Mais acessados':
        return [...itens].sort((a, b) => b.acessos - a.acessos);
      case 'A → Z':
        return [...itens].sort((a, b) => a.titulo.localeCompare(b.titulo));
      default:
        return [...itens].sort(
          (a, b) =>
            new Date(b.atualizadoRaw).getTime() -
            new Date(a.atualizadoRaw).getTime(),
        );
    }
  }

  /* ── Acessos (assíncrono) ───────────────────────────────────────────────── */
  private _carregarAcessos(): void {
    for (const item of this._todos) {
      const obs$ =
        item.tipo === 'vetorial'
          ? this.acessosCamada.getAcessosCamada(item.id)
          : item.tipo === 'raster'
            ? this.acessosRaster.getAcessosCamadaRaster(item.id)
            : this.acessosMapa.getAcessosMapa(item.id);

      this.subs.push(
        obs$
          .pipe(catchError(() => of({ acessos: 0 })))
          .subscribe(({ acessos }) => {
            item.acessos = acessos;
            this.cdr.detectChanges();
          }),
      );
    }
  }

  /* ── Thumbnails — URL direta via WMS (o browser carrega nativamente) ────── */
  private getThumbRequestUrl(item: ItemCatalogo): string {
    if (item.tipo === 'mapa') {
      return item.thumbnailUrl || '';
    }

    return thumbUrl(item);
  }

  getThumbWmsUrl(item: ItemCatalogo): string {
    const requestUrl = this.getThumbRequestUrl(item);
    if (!requestUrl) {
      return '';
    }

    const cachedUrl = this.thumbnailUrls.get(requestUrl);
    if (cachedUrl) {
      return cachedUrl;
    }

    if (
      !this.thumbLoading.has(requestUrl) &&
      !this.thumbErrors.has(requestUrl)
    ) {
      this.thumbLoading.add(requestUrl);
      this.thumbnailCacheService.getThumbnail(requestUrl).subscribe({
        next: (resolvedUrl) => {
          this.thumbnailUrls.set(requestUrl, resolvedUrl);
          this.thumbLoading.delete(requestUrl);
          this.cdr.detectChanges();
        },
        error: () => {
          this.thumbLoading.delete(requestUrl);
          this.thumbErrors.add(requestUrl);
          this.cdr.detectChanges();
        },
      });
    }

    return '';
  }

  private _getThumbErrorKey(item: ItemCatalogo): string {
    return this.getThumbRequestUrl(item) || item.id;
  }

  hasThumbError(item: ItemCatalogo): boolean {
    return this.thumbErrors.has(this._getThumbErrorKey(item));
  }

  onThumbError(item: ItemCatalogo): void {
    this.thumbErrors.add(this._getThumbErrorKey(item));
  }

  /* ── Interações ─────────────────────────────────────────────────────────── */
  toggleTematica(t: TematicaFiltro): void {
    t.aberta = !t.aberta;
  }

  isGrupoSelecionado(grupoId: string): boolean {
    return this.gruposSelecionados.has(grupoId);
  }

  toggleGrupo(grupoId: string): void {
    this.gruposSelecionados.has(grupoId)
      ? this.gruposSelecionados.delete(grupoId)
      : this.gruposSelecionados.add(grupoId);
    this._aplicarFiltros();
  }

  toggleTipo(tipo: FiltroTipo): void {
    tipo.ativo = !tipo.ativo;
    this._aplicarFiltros();
  }

  limparFiltros(): void {
    this.gruposSelecionados.clear();
    this.tipos.forEach((t, i) => (t.ativo = i === 0));
    this.termoBusca = '';
    this._aplicarFiltros();
  }

  buscar(): void {
    this._aplicarFiltros();
  }

  selecionarOrdenacao(o: string): void {
    this.ordenacaoAtual = o;
    this.ordenarAberto = false;
    this._aplicarFiltros();
  }

  irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaAtual = p;
  }

  /* ── Derivados ──────────────────────────────────────────────────────────── */
  get total(): number {
    return this.conjuntos.length;
  }
  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total / this.porPagina));
  }
  get inicioPagina(): number {
    return this.total === 0 ? 0 : (this.paginaAtual - 1) * this.porPagina + 1;
  }
  get fimPagina(): number {
    return Math.min(this.paginaAtual * this.porPagina, this.total);
  }

  get conjuntosPagina(): ItemCatalogo[] {
    return this.conjuntos.slice(
      (this.paginaAtual - 1) * this.porPagina,
      this.paginaAtual * this.porPagina,
    );
  }

  get filtrosAtivos(): boolean {
    return (
      this.gruposSelecionados.size > 0 ||
      this.tipos.some((t, i) => (i === 0 ? !t.ativo : t.ativo)) ||
      this.termoBusca.trim().length > 0
    );
  }

  get paginasVisiveis(): (number | '…')[] {
    const t = this.totalPaginas,
      p = this.paginaAtual;
    if (t <= 6) return Array.from({ length: t }, (_, i) => i + 1);
    if (p <= 3) return [1, 2, 3, 4, '…', t];
    if (p >= t - 2) return [1, '…', t - 3, t - 2, t - 1, t];
    return [1, '…', p - 1, p, p + 1, '…', t];
  }

  /* ── Downloads e serviços ────────────────────────────────────────────────── */
  onChipClick(item: ItemCatalogo, formato: FormatoChip): void {
    if (formato.estilo === 'servico') {
      this._abrirServico(item, formato.rotulo);
      return;
    }
    if (formato.estilo === 'download') {
      this._iniciarDownload(item, formato.rotulo);
    }
  }

  private async _iniciarDownload(
    item: ItemCatalogo,
    rotulo: string,
  ): Promise<void> {
    const url = this._buildDownloadUrl(item, rotulo);
    if (!url) {
      this._showToast(
        'Formato ainda não disponível para este tipo de dado.',
        'info',
      );
      return;
    }

    if (item.tipo === 'raster' && rotulo === 'GeoTIFF') {
      this._showToast(`Iniciando download ${rotulo}…`, 'ok');
      this._iniciarDownloadDireto(
        url,
        `${buildRasterLayerName(item)}.${DOWNLOAD_EXTENSIONS[rotulo] ?? 'tif'}`,
      );
      return;
    }

    this._showToast(`Iniciando download ${rotulo}…`, 'ok');

    try {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      if (!blob.size) throw new Error('Arquivo vazio');

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${item.tipo === 'raster' ? buildRasterLayerName(item) : item.nomeCamada}.${DOWNLOAD_EXTENSIONS[rotulo] ?? rotulo.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      this._showToast('Nao foi possivel concluir o download.', 'erro');
    }
  }

  private _iniciarDownloadDireto(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private _buildDownloadUrl(item: ItemCatalogo, rotulo: string): string | null {
    if (item.tipo === 'vetorial') {
      const fmt = OWS_FORMATS[rotulo];
      if (!fmt) return null;
      // Mesmo padrão do details.component: /content/ows, typeName (v1.0), SHAPE-ZIP
      return (
        `${GS_BASE}/ows?service=WFS&version=1.0.0&request=GetFeature` +
        `&typeName=content:${item.nomeCamada}&outputFormat=${encodeURIComponent(fmt)}`
      );
    }

    if (item.tipo === 'raster' && rotulo === 'GeoTIFF') {
      return (
        `${GS_BASE}/wcs?service=WCS&version=2.0.1&request=GetCoverage` +
        `&coverageId=${encodeURIComponent(buildRasterCoverageId(item))}` +
        `&format=${encodeURIComponent('image/tiff')}`
      );
    }

    return null;
  }

  private _abrirServico(item: ItemCatalogo, rotulo: string): void {
    let url: string;
    if (rotulo === 'WFS') {
      // Mesmo owsUrl do details.component — abre o GML da camada em nova aba
      url =
        `${GS_BASE}/ows?service=WFS&version=1.0.0&request=GetFeature` +
        `&typeName=content:${item.nomeCamada}&outputFormat=${encodeURIComponent('text/xml; subtype=gml/2.1.2')}`;
    } else {
      // WMS — GetCapabilities do workspace para uso em software GIS
      url = `${GS_BASE}/wms?service=WMS&version=1.3.0&request=GetCapabilities`;
    }
    window.open(url, '_blank', 'noopener');
  }

  private _showToast(msg: string, tipo: 'ok' | 'info' | 'erro' = 'ok'): void {
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this.toastMsg = msg;
    this.toastTipo = tipo;
    this.cdr.detectChanges();
    this._toastTimer = setTimeout(() => {
      this.toastMsg = null;
      this.cdr.detectChanges();
    }, 4000);
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
