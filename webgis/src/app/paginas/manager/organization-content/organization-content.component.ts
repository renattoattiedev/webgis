import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Camadas } from 'src/app/models/camadas.model';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GetAcessosCamada } from 'src/app/services/api/get.acessos.camada.service';
import { Observable, catchError, of } from 'rxjs';
import { FavoriteContentService } from 'src/app/services/api/favorite.content.service';
import { DetailsComponent } from './details/details.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Tema } from 'src/app/models/temas.model';
import { Grupos } from 'src/app/models/grupo.model';
import { FormsModule } from '@angular/forms';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { FetchContentOrganizationService } from 'src/app/services/api/fetch.content.organization.service';
import { Mapas } from 'src/app/models/mapas.model';
import { GetAcessosMapa } from 'src/app/services/api/get.acessos.mapa.service';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';
import { GetAcessosCamadaRaster } from 'src/app/services/api/get.acessos.camada.raster.service';
import { ThumbnailCacheService } from 'src/app/services/thumbnail-cache.service';
import { GrupoAvatarBadgeComponent } from 'src/app/shared/grupo-avatar-badge/grupo-avatar-badge.component';
@Component({
  selector: 'app-organization-content',
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    MatTooltip,
    MatSidenavModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    DetailsComponent,
    MatChipsModule,
    MatDatepickerModule,
    GrupoAvatarBadgeComponent,
    FormsModule,
  ],
  templateUrl: './organization-content.component.html',
  styleUrl: './organization-content.component.scss',
})
export class OrganizationContentComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private readonly THUMBNAIL_WIDTH = 800;
  private readonly THUMBNAIL_HEIGHT = 600;

  allContent: any[] = [];
  filteredContent: any[] = [];
  cols: number = 4;
  isLeftSidenavOpened = true;
  isRightSidenavOpened = false;
  acessosPorCamada: { [id: string]: number } = {};
  selectedContent: Camadas | CamadasRaster | Mapas | null = null;
  dataSourceTema: Tema[] = [];
  dataSourceGrupos: Grupos[] = [];
  isFavoriteFilterActive: boolean = false;
  minVisualizacoes: number | null = 0;
  maxVisualizacoes: number | null = null;
  dataInicio: Date | null = null;
  dataFim: Date | null = null;
  selectedTemaIds: Set<string> = new Set<string>();
  selectedGrupoIds: Set<string> = new Set<string>();
  urlWms: string | undefined;
  selectedContentType: string | null = null;
  thumbnailUrls: Map<string, string> = new Map();
  loading: Map<string, boolean> = new Map();
  thumbnailErrors: Map<string, boolean> = new Map();

  // Performance optimization properties
  private intersectionObserver!: IntersectionObserver;
  private loadingQueue: string[] = [];
  private activeRequests = 0;
  private readonly MAX_CONCURRENT_REQUESTS = 4;
  private loadedItems = new Set<string>();
  private scrollTimeout: any;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private fetchContentOrganizationService: FetchContentOrganizationService,
    private getAcessosCamada: GetAcessosCamada,
    private getAcessosCamadaRaster: GetAcessosCamadaRaster,
    private getAcessosMapa: GetAcessosMapa,
    private favoriteContentService: FavoriteContentService,
    private fetchTemasService: FetchTemasService,
    private fetchGruposService: FetchGrupoTemaService,
    private changeDetectorRef: ChangeDetectorRef,
    private thumbnailCacheService: ThumbnailCacheService,
  ) {
    proj4.defs(
      'EPSG:31983',
      '+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs',
    );
    register(proj4);
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isLeftSidenavOpened = window.innerWidth > 1024;
    }
    this.loadContent();
    this.setupGrid();
    this.fetchTemas();
    this.fetchGruposPorTema();
    this.setupIntersectionObserver();
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    // Cleanup any pending requests
    this.loadingQueue = [];
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    // Remove scroll listener
    window.removeEventListener('scroll', this.onScroll);
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  ngAfterViewInit(): void {
    // Start observing thumbnail containers after view is ready
    setTimeout(() => {
      this.observeThumbnailContainers();
    }, 1000);
  }

  loadAcessos(id: string, contentType: string): void {
    this.getAcessos(id, contentType)
      .pipe(catchError(() => of({ acessos: 0 })))
      .subscribe((result) => {
        this.acessosPorCamada[id] = result.acessos;
        this.changeDetectorRef.detectChanges();
      });
  }

  getAcessos(
    contentId: string,
    contentType: string,
  ): Observable<{ acessos: number }> {
    if (contentType === 'mapa') {
      return this.getAcessosMapa
        .getAcessosMapa(contentId)
        .pipe(catchError(() => of({ acessos: 0 })));
    } else if (contentType === 'vetorial') {
      return this.getAcessosCamada
        .getAcessosCamada(contentId)
        .pipe(catchError(() => of({ acessos: 0 })));
    } else if (contentType === 'raster') {
      return this.getAcessosCamadaRaster
        .getAcessosCamadaRaster(contentId)
        .pipe(catchError(() => of({ acessos: 0 })));
    }
    return of({ acessos: 0 });
  }

  setupGrid(): void {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .subscribe(() => {
        let sidebarWidth = 0;
        if (this.isLeftSidenavOpened) {
          sidebarWidth += 400;
        }
        if (this.isRightSidenavOpened) {
          sidebarWidth += 600;
        }

        const availableWidth = window.innerWidth - sidebarWidth;
        const cardWidth = 300;
        const gutterSize = 20;

        this.cols = Math.floor(
          (availableWidth + gutterSize) / (cardWidth + gutterSize),
        );
        if (this.cols < 1) this.cols = 1;
      });
  }

  loadContent(): void {
    this.fetchContentOrganizationService
      .getContentOrganization()
      .subscribe(
        (response: {
          camadas: Camadas[];
          camadasRaster: CamadasRaster[];
          mapas: Mapas[];
        }) => {
          this.loadedItems.clear();
          this.allContent = [
            ...response.camadas,
            ...response.camadasRaster,
            ...response.mapas,
          ];
          this.filteredContent = [...this.allContent];

          response.camadas.forEach((camada) => {
            this.loadAcessos(camada.id, 'vetorial');
          });
          response.camadasRaster.forEach((camada) => {
            this.loadAcessos(camada.id, 'raster');
          });
          response.mapas.forEach((mapa) => {
            this.loadAcessos(mapa.id, 'mapa');
          });

          // Auto-load thumbnails after content is loaded
          setTimeout(() => {
            this.autoLoadVisibleThumbnails();
          }, 1000);
        },
      );
  }

  private getThumbnailDimensions(boundingBox?: string): {
    bbox: string;
    width: number;
    height: number;
  } {
    let bbox = '315476.5,7691027.0,390465.375,7895713.0';
    const width = this.THUMBNAIL_WIDTH;
    const height = this.THUMBNAIL_HEIGHT;

    if (boundingBox) {
      try {
        const bboxObj = JSON.parse(boundingBox);
        let minx = Number(bboxObj.minx);
        let miny = Number(bboxObj.miny);
        let maxx = Number(bboxObj.maxx);
        let maxy = Number(bboxObj.maxy);

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
      } catch (error) {
        console.error('Failed to parse bounding box:', error);
      }
    }

    return { bbox, width, height };
  }

  private getCompositeLayersParam(compositeMap: Mapas): string {
    const allLayers = [
      ...(compositeMap.camadas || []),
      ...(compositeMap.camadasRaster || []),
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

  private getThumbnailUrl(item: any): string {
    try {
      if ('nomeMapa' in item) {
        return this.getThumbnail(
          undefined,
          item.boundingBoxMapa,
          undefined,
          item,
        );
      }

      return this.getThumbnail(
        item.nomeCamada,
        item.boundingBox,
        item.fonteDadosCamadaRaster,
      );
    } catch (error) {
      console.warn(
        `Error generating thumbnail URL for item:`,
        item.nomeCamada || item.nomeMapa,
        error,
      );
      return ''; // Return empty string on error
    }
  }

  getThumbnail(
    layerName?: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    compositeMap?: Mapas,
  ): string {
    if (compositeMap) {
      const { bbox, width, height } = this.getThumbnailDimensions(boundingBox);
      const layersString = this.getCompositeLayersParam(compositeMap);
      return `/geoserver-proxy/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${layersString}&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:31983&styles=&format=image/png&transparent=true`;
    }

    if (!layerName) {
      return '';
    }

    let fullLayerName = `content:${layerName}`;
    if (fonteDadosCamadaRaster) {
      fullLayerName += `_${fonteDadosCamadaRaster}`;

      // Raster thumbnails look better through GeoServer's reflector because it
      // auto-fits the published coverage instead of depending on our stored bbox.
      return `/geoserver-proxy/content/wms/reflect?layers=${encodeURIComponent(fullLayerName)}&format=image/png&width=${this.THUMBNAIL_WIDTH}&height=${this.THUMBNAIL_HEIGHT}`;
    }

    const { bbox, width, height } = this.getThumbnailDimensions(boundingBox);
    return `/geoserver-proxy/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${fullLayerName}&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:31983&styles=&format=image/png&transparent=true`;
  }
  toggleLeftSidenav() {
    this.isLeftSidenavOpened = !this.isLeftSidenavOpened;
    this.setupGrid();
  }

  toggleRightSidenav(content: Camadas | CamadasRaster | Mapas) {
    const isSameContent = this.selectedContent?.id === content.id;
    this.selectedContent = content;
    this.isRightSidenavOpened = isSameContent
      ? !this.isRightSidenavOpened
      : true;
    this.setupGrid();
  }

  aplicarFiltroNome(event: Event): void {
    const filtroValor = (event.target as HTMLInputElement).value.toLowerCase();
    if (!this.allContent) return;

    this.filteredContent = this.allContent.filter((item) => {
      if ('nomeCamada' in item) {
        return item.nomeCamada.toLowerCase().includes(filtroValor);
      }
      if ('nomeMapa' in item) {
        return item.nomeMapa.toLowerCase().includes(filtroValor);
      }
      return false;
    });

    this.changeDetectorRef.detectChanges();
  }

  toggleFavoriteCamada(layer: Camadas) {
    if (layer.favorito === true) {
      this.favoriteContentService
        .favoriteContent(layer.id, 'camada', 'desmarcar')
        .subscribe(() => {
          this.loadContent();
        });
    } else {
      this.favoriteContentService
        .favoriteContent(layer.id, 'camada', 'marcar')
        .subscribe(() => {
          this.loadContent();
        });
    }
  }

  toggleFavoriteRaster(raster: Camadas) {
    if (raster.favorito === true) {
      this.favoriteContentService
        .favoriteContent(raster.id, 'raster', 'desmarcar')
        .subscribe(() => {
          this.loadContent();
        });
    } else {
      this.favoriteContentService
        .favoriteContent(raster.id, 'raster', 'marcar')
        .subscribe(() => {
          this.loadContent();
        });
    }
  }

  toggleFavoriteMapa(mapa: Mapas) {
    if (mapa.favorito === true) {
      this.favoriteContentService
        .favoriteContent(mapa.id, 'mapa', 'desmarcar')
        .subscribe(() => {
          this.loadContent();
        });
    } else {
      this.favoriteContentService
        .favoriteContent(mapa.id, 'mapa', 'marcar')
        .subscribe(() => {
          this.loadContent();
        });
    }
  }

  fetchTemas() {
    this.fetchTemasService.getTemas().subscribe(
      (temas) => {
        for (const tema of temas) {
          this.dataSourceTema.push(tema);
        }
      },
      (error) => {
        console.error(error);
      },
    );
  }

  fetchGruposPorTema() {
    this.dataSourceGrupos = [];
    if (this.selectedTemaIds.size > 0) {
      Array.from(this.selectedTemaIds).forEach((temaId) => {
        this.fetchGruposService.getGrupo(temaId).subscribe(
          (response) => {
            this.dataSourceGrupos = [...this.dataSourceGrupos, ...response];
            this.changeDetectorRef.detectChanges();
          },
          (error) => console.error('Error fetching groups:', error),
        );
      });
    } else {
      this.fetchAllGroups();
    }
  }

  fetchAllGroups() {
    this.fetchGruposService.getGrupo().subscribe(
      (response) => {
        this.dataSourceGrupos = response;
        this.changeDetectorRef.detectChanges();
      },
      (error) => console.error('Error fetching all groups:', error),
    );
  }

  closeSidenav(): void {
    this.isRightSidenavOpened = false;
    this.setupGrid();
  }

  clearFilter() {
    this.selectedTemaIds.clear();
    this.selectedGrupoIds.clear();
    this.fetchGruposPorTema();
    this.isFavoriteFilterActive = false;
    this.minVisualizacoes = 0;
    this.maxVisualizacoes = null;
    this.dataInicio = null;
    this.dataFim = null;
    if (this.allContent) {
      this.filteredContent = [...this.allContent];
    }
  }

  toggleFavoriteFilter() {
    this.isFavoriteFilterActive = !this.isFavoriteFilterActive;
    this.applyFilter();
  }

  filtrarPorVisualizacoes() {
    this.applyFilter();
  }

  applyFilter() {
    if (!this.allContent) {
      this.filteredContent = [];
      return;
    }

    this.filteredContent = this.allContent.filter((item) => {
      const updatedAt = new Date(item.updatedAt);

      const inicioDia = this.dataInicio ? new Date(this.dataInicio) : null;
      if (inicioDia) {
        inicioDia.setHours(0, 0, 0, 0);
      }

      const fimDia = this.dataFim ? new Date(this.dataFim) : null;
      if (fimDia) {
        fimDia.setHours(23, 59, 59, 999);
      }

      const meetsDate =
        (inicioDia ? updatedAt >= inicioDia : true) &&
        (fimDia ? updatedAt <= fimDia : true);

      const meetsFavorite = !this.isFavoriteFilterActive || item.favorito;

      const meetsTema =
        this.selectedTemaIds.size === 0 ||
        this.selectedTemaIds.has(item.temaId);

      const meetsGrupo =
        this.selectedGrupoIds.size === 0 ||
        (item.grupos ?? []).some((g: { id: string }) =>
          this.selectedGrupoIds.has(g.id),
        );

      const isMinEmpty =
        this.minVisualizacoes === null || this.minVisualizacoes === undefined;
      const isMaxEmpty =
        this.maxVisualizacoes === null || this.maxVisualizacoes === undefined;

      if (isMinEmpty && isMaxEmpty) {
        return true;
      }

      const min: number = isMinEmpty ? 0 : this.minVisualizacoes ?? 0;
      const max: number = isMaxEmpty
        ? Number.POSITIVE_INFINITY
        : this.maxVisualizacoes ?? Number.POSITIVE_INFINITY;

      const visualizacoes = this.acessosPorCamada[item.id] || 0;
      const meetsVisualizacoes = visualizacoes >= min && visualizacoes <= max;

      const meetsContentType =
        !this.selectedContentType ||
        (this.selectedContentType === item.tipo && 'nomeCamada' in item) ||
        (this.selectedContentType === 'mapa' && 'nomeMapa' in item);

      return (
        meetsDate &&
        meetsFavorite &&
        meetsTema &&
        meetsGrupo &&
        meetsVisualizacoes &&
        meetsContentType
      );
    });

    this.changeDetectorRef.detectChanges();

    // Auto-load thumbnails after content changes
    setTimeout(() => {
      this.autoLoadVisibleThumbnails();
    }, 500);
  }

  toggleTemaFilter(temaId: string) {
    this.selectedTemaIds.clear();
    this.selectedGrupoIds.clear();
    const wasSelected = this.selectedTemaIds.has(temaId);

    if (!wasSelected) {
      this.selectedTemaIds.add(temaId);
    }

    this.fetchGruposPorTema();

    this.applyFilter();
  }

  toggleGrupoFilter(grupoId: string) {
    this.selectedGrupoIds.clear();
    const wasSelected = this.selectedGrupoIds.has(grupoId);
    if (wasSelected) {
      this.selectedGrupoIds.delete(grupoId);
    } else {
      this.selectedGrupoIds.add(grupoId);
    }

    this.applyFilter();
  }

  onGrupoBadgeClick(grupoId: string): void {
    if (!this.selectedGrupoIds.has(grupoId)) {
      this.selectedTemaIds.clear();
      this.fetchGruposPorTema();
    }
    this.toggleGrupoFilter(grupoId);
  }

  clearTemaFilters() {
    this.selectedTemaIds.clear();
    this.selectedGrupoIds.clear();
    this.fetchGruposPorTema();
    this.applyFilter();
  }

  clearGrupoFilters() {
    this.selectedGrupoIds.clear();
    this.fetchGruposPorTema();
    this.applyFilter();
  }

  toggleFilterByContentType(contentType: string) {
    if (this.selectedContentType === contentType) {
      this.selectedContentType = null;
    } else {
      this.selectedContentType = contentType;
    }
    this.applyFilter();
  }

  clearContentTypeFilter() {
    this.selectedContentType = null;
    this.applyFilter();
  }

  reloadThumbnail(item: Camadas | CamadasRaster | Mapas): void {
    const imageUrl = this.getThumbnailUrl(item);
    this.loading.set(imageUrl, true);
    this.thumbnailErrors.delete(imageUrl); // Clear previous error

    this.thumbnailCacheService.reloadThumbnail(imageUrl).subscribe(
      (cachedUrl) => {
        this.thumbnailUrls.set(imageUrl, cachedUrl);
        this.loading.set(imageUrl, false);
        this.changeDetectorRef.detectChanges();
      },
      (error) => {
        console.error('Error reloading thumbnail:', error);
        this.loading.set(imageUrl, false);
        this.thumbnailErrors.set(imageUrl, true);
      },
    );
  }

  // Recarrega todos os thumbnails
  reloadAllThumbnails(): void {
    this.thumbnailCacheService.clearAllCache();
    this.thumbnailUrls.clear();
    this.loading.clear();

    // Recarrega todos os thumbnails
    this.allContent
      .filter(
        (item) => item.nomeCamada || (item.camadas && item.camadas.length > 0),
      )
      .forEach((item) => {
        const imageUrl = this.getThumbnailUrl(item);
        this.loading.set(imageUrl, true);

        this.thumbnailCacheService.getThumbnail(imageUrl).subscribe(
          (cachedUrl) => {
            this.thumbnailUrls.set(imageUrl, cachedUrl);
            this.loading.set(imageUrl, false);
            this.changeDetectorRef.detectChanges();
          },
          (error) => {
            console.error('Error reloading thumbnail:', error);
            this.loading.set(imageUrl, false);
          },
        );
      });
  }

  // Recarrega um thumbnail de mapa composto específico
  reloadCompositeMapThumbnail(mapa: Mapas): void {
    // Limpa o cache existente para este mapa
    const imageUrl = this.getThumbnailUrl(mapa);

    // Limpa todos os caches relacionados
    this.thumbnailUrls.delete(imageUrl);
    this.loading.delete(imageUrl);
    this.thumbnailErrors.delete(imageUrl); // Clear previous error
    this.thumbnailCacheService.clearCacheForUrl(imageUrl);

    // Força recarga
    this.loading.set(imageUrl, true);
    this.thumbnailCacheService.getThumbnail(imageUrl).subscribe(
      (cachedUrl) => {
        this.thumbnailUrls.set(imageUrl, cachedUrl);
        this.loading.set(imageUrl, false);
        this.changeDetectorRef.detectChanges();
      },
      (error) => {
        console.error('Erro ao recarregar thumbnail:', error);
        this.loading.set(imageUrl, false);
        this.thumbnailErrors.set(imageUrl, true);
      },
    );
  }

  // Performance optimization methods

  private setupIntersectionObserver(): void {
    if (!window.IntersectionObserver) {
      // Fallback: load first visible thumbnails immediately
      console.warn(
        'Intersection Observer not supported. Loading first few thumbnails.',
      );
      this.loadFirstThumbnails();
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const itemId = element.getAttribute('data-item-id');
            if (itemId && !this.loadedItems.has(itemId)) {
              this.loadedItems.add(itemId);
              this.loadThumbnailForItem(itemId);
              this.intersectionObserver.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '100px 0px', // Start loading 100px before becoming visible
        threshold: 0.1,
      },
    );
  }

  private loadFirstThumbnails(): void {
    // Fallback: load first 8 thumbnails immediately if Intersection Observer not supported
    this.allContent.slice(0, 8).forEach((item) => {
      const itemId = this.getItemId(item);
      if (!this.loadedItems.has(itemId)) {
        this.loadedItems.add(itemId);
        this.loadThumbnailForItem(itemId);
      }
    });
  }

  private loadThumbnailForItem(itemId: string): void {
    try {
      const item = this.allContent.find(
        (content) => this.getItemId(content) === itemId,
      );
      if (item) {
        const thumbnailUrl = this.getThumbnailUrl(item);
        if (thumbnailUrl) {
          this.queueThumbnailLoad(thumbnailUrl);
        } else {
          console.warn(
            `No thumbnail URL for item: ${item.nomeCamada || item.nomeMapa}`,
          );
        }
      } else {
        console.warn(`Item with id ${itemId} not found in allContent`);
      }
    } catch (error) {
      console.warn(`Error in loadThumbnailForItem for ${itemId}:`, error);
      // Don't stop the process, just log and continue
    }
  }

  observeThumbnail(element: HTMLElement, itemId: string): void {
    if (this.intersectionObserver && element) {
      element.setAttribute('data-item-id', itemId);
      this.intersectionObserver.observe(element);
    }
  }

  private startObservingThumbnails(): void {
    if (!this.intersectionObserver) return;

    // Find all thumbnail containers and start observing them
    const thumbnailContainers = document.querySelectorAll(
      '.thumbnail-container[data-item-id]',
    );

    thumbnailContainers.forEach((element) => {
      const itemId = element.getAttribute('data-item-id');
      if (itemId && !this.loadedItems.has(itemId)) {
        this.intersectionObserver.observe(element);
      }
    });
  }

  private observeThumbnailContainers(): void {
    // Use the existing method to start observing
    this.startObservingThumbnails();
  }

  private setupScrollListener(): void {
    // Throttled scroll listener as backup for intersection observer
    const onScrollThrottled = () => {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      this.scrollTimeout = setTimeout(() => {
        this.onScroll();
      }, 100); // Throttle to 100ms
    };

    window.addEventListener('scroll', onScrollThrottled, { passive: true });
  }

  private onScroll = (): void => {
    // Backup method: check if any unloaded thumbnails are now visible
    if (!this.intersectionObserver) {
      this.checkVisibleThumbnails();
    }
  };

  private checkVisibleThumbnails(): void {
    const thumbnailContainers = document.querySelectorAll(
      '.thumbnail-container[data-item-id]',
    );
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;

    thumbnailContainers.forEach((element) => {
      const itemId = element.getAttribute('data-item-id');
      if (itemId && !this.loadedItems.has(itemId)) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollTop;
        const elementBottom = elementTop + rect.height;

        // Check if element is within viewport + 200px margin
        if (
          elementTop < scrollTop + viewportHeight + 200 &&
          elementBottom > scrollTop - 200
        ) {
          this.loadedItems.add(itemId);
          this.loadThumbnailForItem(itemId);
        }
      }
    });
  }

  private autoLoadVisibleThumbnails(): void {
    // Modified approach: don't load automatically, let intersection observer handle it
    // Just ensure intersection observer is set up
    setTimeout(() => {
      this.startObservingThumbnails();
    }, 500);
  }

  loadAllThumbnails(): void {
    // Load all visible thumbnails at once
    this.filteredContent.forEach((item, index) => {
      try {
        const itemId = this.getItemId(item);
        if (!this.loadedItems.has(itemId)) {
          this.loadedItems.add(itemId);

          setTimeout(() => {
            try {
              this.loadThumbnailForItem(itemId);
            } catch (error) {
              console.warn(
                `Error loading thumbnail for item ${index}, continuing...`,
                error,
              );
            }
          }, index * 100); // Stagger loading
        }
      } catch (error) {
        console.warn(`Error processing item ${index}, skipping...`, error);
      }
    });
  }

  private queueThumbnailLoad(imageUrl: string): void {
    try {
      if (this.thumbnailUrls.has(imageUrl) || this.loading.get(imageUrl)) {
        return; // Already loaded or loading
      }

      this.loading.set(imageUrl, true);
      this.loadingQueue.push(imageUrl);
      this.processQueue();
    } catch (error) {
      console.warn('Error queueing thumbnail load:', error);
    }
  }

  private startThumbnailLoad(imageUrl: string): void {
    this.activeRequests++;

    this.thumbnailCacheService.getThumbnail(imageUrl).subscribe({
      next: (cachedUrl: string) => {
        this.thumbnailUrls.set(imageUrl, cachedUrl);
        this.loading.set(imageUrl, false);
        this.activeRequests--;
        this.changeDetectorRef.detectChanges();
        this.processQueue();
      },
      error: (error: any) => {
        console.warn('Failed to load thumbnail, continuing with next:', error);
        this.loading.set(imageUrl, false);
        this.thumbnailErrors.set(imageUrl, true);
        this.activeRequests--;
        // Continue processing queue even on error
        this.processQueue();
      },
    });
  }

  private processQueue(): void {
    try {
      while (
        this.loadingQueue.length > 0 &&
        this.activeRequests < this.MAX_CONCURRENT_REQUESTS
      ) {
        const nextUrl = this.loadingQueue.shift();
        if (nextUrl) {
          try {
            this.startThumbnailLoad(nextUrl);
          } catch (error) {
            console.warn(
              `Error starting thumbnail load for ${nextUrl}, trying next:`,
              error,
            );
            // Continue with next URL in queue
            continue;
          }
        }
      }
    } catch (error) {
      console.warn('Error processing thumbnail queue:', error);
      // Don't stop the entire process
    }
  }

  getItemId(item: any): string {
    if ('nomeMapa' in item) {
      return `${item.id}|${item.nomeMapa}|${item.boundingBoxMapa || ''}|${this.getCompositeLayersParam(item)}`;
    }

    return `${item.id}|${item.nomeCamada || ''}|${item.boundingBox || ''}|${item.fonteDadosCamadaRaster || ''}`;
  }

  // Optimized thumbnail getter that doesn't immediately load
  getThumbnailUrlOptimized(item: any): string {
    const imageUrl = this.getThumbnailUrl(item);
    // Return cached URL if available
    return this.thumbnailUrls.get(imageUrl) || '';
  }

  // Check if thumbnail is loading
  isThumbnailLoading(item: any): boolean {
    const imageUrl = this.getThumbnailUrl(item);
    return this.loading.get(imageUrl) || false;
  }

  onImageLoad(item: any): void {
    const imageUrl = this.getThumbnailUrl(item);
    this.loading.set(imageUrl, false);
  }

  onImageError(item: any): void {
    const imageUrl = this.getThumbnailUrl(item);
    this.loading.set(imageUrl, false);
    this.thumbnailErrors.set(imageUrl, true);
    console.warn(
      'Image failed to load, but continuing with others:',
      item.nomeCamada || item.nomeMapa,
    );
    // Don't stop the process, just mark as failed and continue
  }

  // Check if thumbnail has error
  hasThumbnailError(item: any): boolean {
    const imageUrl = this.getThumbnailUrl(item);
    return this.thumbnailErrors.get(imageUrl) || false;
  }

  // TrackBy function for better ngFor performance
  trackByItemId = (index: number, item: any): string => {
    return this.getItemId(item);
  };
}
