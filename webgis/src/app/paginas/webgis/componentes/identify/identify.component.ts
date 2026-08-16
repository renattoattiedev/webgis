import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { Feature, MapBrowserEvent, Overlay } from 'ol';
import { toLonLat, transform } from 'ol/proj';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { MapaService } from 'src/app/services/mapa.service';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Geometry, MultiLineString, Point, Polygon } from 'ol/geom';
import { toStringHDMS } from 'ol/coordinate';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';

interface TooltipsMap {
  [key: string]: Overlay;
}
@Component({
  selector: 'app-identify',
  templateUrl: './identify.component.html',
  styleUrls: ['./identify.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatPaginatorModule,
    MatListModule,
    CommonModule,
    MatIconModule,
    MatTableModule,
    MatMenuModule,
  ],
})
export class IdentifyComponent implements AfterViewInit, OnDestroy {
  @ViewChild('popup', { static: false }) popupElement?: ElementRef;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  posX!: number;
  posY!: number;
  listaDeObjetos: any[] = [];
  objetosPorPagina = 1;
  dados = [];
  menuAberto = false;
  layersAdded: any[] = [];
  tooltips = {} as TooltipsMap;
  zoomChangeListenerKey: any;
  private identifyEnabledSub: any;
  private lastCoordinate: [number, number] | null = null;

  constructor(
    public dialog: MatDialogModule,
    public conteudoService: ConteudoService,
    private mapaService: MapaService,
  ) {
    proj4.defs(
      'EPSG:31984',
      '+proj=utm +zone=24 +south +datum=WGS84 +units=m +no_defs',
    );
    register(proj4);
  }

  ngAfterViewInit(): void {
    this.mapaService.getMapaObservable().subscribe((mapa) => {
      const popup = this.popupElement?.nativeElement;
      const updatePopupPosition = () => {
        if (this.lastCoordinate && popup.style.display === 'block') {
          this.applySmartPosition(popup, this.lastCoordinate);
        }
      };

      mapa.on('click', async (evento) => {
        // Respeita toggle global de identify
        if (!this.mapaService.getIdentifyEnabled()) {
          // quando identify está desabilitado, fechar qualquer popup e não processar
          this.fecharPopup();
          this.removeAddedLayers();
          return;
        }
        this.removeAddedLayers();
        this.lastCoordinate = evento.coordinate as [number, number];
        this.identifyFeature(evento);
      });

      mapa.on('pointerdrag', async () => {
        updatePopupPosition();
      });

      mapa.on('moveend', () => {
        updatePopupPosition();
      });

      window.addEventListener('resize', () => {
        const popup = this.popupElement?.nativeElement;
        popup.style.display = 'none';
      });

      // Se identify for desabilitado por outros componentes, fechar popup e limpar layers
      this.identifyEnabledSub = this.mapaService.identifyEnabled$.subscribe(
        (enabled) => {
          if (!enabled) {
            this.fecharPopup();
            this.removeAddedLayers();
          }
        },
      );
    });
  }

  ngOnDestroy(): void {
    if (this.identifyEnabledSub) {
      this.identifyEnabledSub.unsubscribe();
    }
  }

  async identifyFeature(event: MapBrowserEvent<any>) {
    this.listaDeObjetos = [];
    this.posX = event.coordinate[0];
    this.posY = event.coordinate[1];
    const coordinate3857 = event.coordinate;
    const coordinate4326: [number, number] = transform(
      coordinate3857,
      'EPSG:3857',
      'EPSG:31984',
    ) as [number, number];

    const zoom = this.mapaService.getMapa()?.getView().getZoom() || 0;
    const buffer = this.getBuffer(zoom);

    for (const objeto of this.conteudoService.dadosAdicionais) {
      try {
        if (objeto.ativo === true && objeto.popup === true) {
          const criterioComBuffer = `${coordinate4326.join(',')};${buffer}`;

          if (objeto.tipoConteudo === 'mapa') {
            const dados = await Promise.all(
              objeto.camadas.map(async (camada: any) => {
                return this.conteudoService
                  .getWFSLayerData(
                    'camada',
                    `content:${camada.nomeCamada}`,
                    camada.atributos ?? [],
                    'coordenadas',
                    criterioComBuffer,
                  )
                  .toPromise();
              }),
            );
            dados.forEach((camada) => {
              if (camada.length > 0) {
                this.processarCamada(camada[0]);
              }
            });
          } else {
            const dados = await this.conteudoService
              .getWFSLayerData(
                objeto.tipoConteudo,
                objeto.nomeConteudo,
                objeto.atributos ?? [],
                'coordenadas',
                criterioComBuffer,
              )
              .toPromise();
            console.log(dados);

            if (dados.length > 0) this.processarCamada(dados[0]);
          }
        }
      } catch (error: any) {
        console.error('Erro ao buscar os dados:', error);
      }
    }

    if (this.listaDeObjetos.length > 0) {
      const popup = this.popupElement?.nativeElement;
      popup.style.display = 'block';
      if (this.paginator) this.paginator.firstPage();
      this.highlightCurrentFeature();
      // Defer positioning so Angular renders the content first (offsetHeight accurate)
      const coord = event.coordinate as [number, number];
      setTimeout(() => this.applySmartPosition(popup, coord), 0);
    } else {
      this.fecharPopup();
    }
  }

  processarCamada(camada: any) {
    if (
      camada.data &&
      camada.data.features &&
      camada.data.features.length > 0
    ) {
      camada.data.features.forEach(
        (objDados: { properties: any; geometry: any }) => {
          const propriedadesOrdenadas = this.getPropriedadesOrdenadas(
            camada.layerName,
            objDados.properties,
          );

          const camadaMeta = this.conteudoService.dadosAdicionais.find(
            (c) =>
              c.nomeConteudo === camada.layerName ||
              c.nomeConteudo === camada.layerName.replace(/^content:/, ''),
          );

          const objIdentify = {
            tituloLayer: camadaMeta?.tituloConteudo || camada.layerName,
            geometry: objDados.geometry,
            propriedadesOrdenadas: propriedadesOrdenadas,
          };

          this.listaDeObjetos.push(objIdentify);
        },
      );
    }
  }

  private getPropriedadesOrdenadas(
    layerName: string,
    properties: { [key: string]: any },
  ): Array<{ key: string; value: any }> {
    // Obtém metadados da camada
    const camadaMeta = this.conteudoService.dadosAdicionais.find(
      (camada) => camada.nomeConteudo === layerName,
    );

    if (!camadaMeta || !Array.isArray(camadaMeta.atributos)) {
      // Fallback: sem metadados, mantém ordem original das chaves sem ordenar
      return Object.entries(properties).map(([key, value]) => ({
        key: this.conteudoService.translateAttributeNameToLabel(layerName, key),
        value,
      }));
    }

    const ordenados = camadaMeta.atributos
      .filter((a: any) => a && a.visivel === true)
      .sort(
        (a: any, b: any) =>
          (a.ordemRenderizacao ?? 0) - (b.ordemRenderizacao ?? 0),
      );

    const resultado: Array<{ key: string; value: any }> = [];
    for (const attr of ordenados) {
      const nome = attr.nomeAtributo;
      if (nome in properties) {
        resultado.push({
          key: this.conteudoService.translateAttributeNameToLabel(
            layerName,
            nome,
          ),
          value: properties[nome],
        });
      }
    }
    return resultado;
  }

  applySmartPosition(popup: HTMLElement, coordinate: [number, number]): void {
    const mapa = this.mapaService.getMapa();
    if (!mapa) return;

    const pixel = mapa.getPixelFromCoordinate(coordinate);
    const mapSize = mapa.getSize();
    if (!pixel || !mapSize) return;

    const [mapW, mapH] = mapSize;
    const [cx, cy] = pixel;

    const BW = popup.offsetWidth || 360;
    const BH = popup.offsetHeight || 220;

    const GAP = 16;
    const H_EDGE = mapW * 0.27;
    const V_EDGE = mapH * 0.3;

    popup.classList.remove(
      'arrow-top',
      'arrow-bottom',
      'arrow-left',
      'arrow-right',
    );

    let bLeft: number, bTop: number;
    let arrowX: number | null = null;
    let arrowY: number | null = null;
    let side: string;

    if (cy < V_EDGE) {
      // Near top → balloon below click, arrow points up
      side = 'arrow-top';
      bLeft = Math.max(6, Math.min(cx - BW / 2, mapW - BW - 6));
      bTop = Math.min(cy + GAP, mapH - BH - 6);
      arrowX = cx - bLeft;
    } else if (cy > mapH - V_EDGE) {
      // Near bottom → balloon above click, arrow points down
      side = 'arrow-bottom';
      bLeft = Math.max(6, Math.min(cx - BW / 2, mapW - BW - 6));
      bTop = Math.max(6, cy - GAP - BH);
      arrowX = cx - bLeft;
    } else if (cx < H_EDGE) {
      // Near left edge → balloon to the right, arrow points left
      side = 'arrow-left';
      bLeft = cx + GAP;
      bTop = Math.max(6, Math.min(cy - BH / 2, mapH - BH - 6));
      arrowY = cy - bTop;
    } else if (cx > mapW - H_EDGE) {
      // Near right edge → balloon to the left, arrow points right
      side = 'arrow-right';
      bLeft = Math.max(6, cx - GAP - BW);
      bTop = Math.max(6, Math.min(cy - BH / 2, mapH - BH - 6));
      arrowY = cy - bTop;
    } else {
      // Center → balloon above click by default, arrow points down
      side = 'arrow-bottom';
      bLeft = Math.max(6, Math.min(cx - BW / 2, mapW - BW - 6));
      bTop = Math.max(6, cy - GAP - BH);
      arrowX = cx - bLeft;
    }

    popup.classList.add(side);
    popup.style.position = 'absolute';
    popup.style.left = `${bLeft}px`;
    popup.style.top = `${bTop}px`;

    if (arrowX !== null) {
      const clamped = Math.max(20, Math.min(arrowX, BW - 20));
      popup.style.setProperty('--arrow-x', `${clamped}px`);
    }
    if (arrowY !== null) {
      const clamped = Math.max(20, Math.min(arrowY, BH - 20));
      popup.style.setProperty('--arrow-y', `${clamped}px`);
    }
  }

  highlightCurrentFeature(): void {
    this.removeAddedLayers();
    const idx = this.paginator?.pageIndex ?? 0;
    const item = this.listaDeObjetos[idx];
    if (!item?.geometry) return;

    const geojson = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: item.geometry, properties: {} }],
    };
    this.addGeometryWithStyle(geojson, item.geometry.type);
  }

  fecharPopup(): void {
    const popup = this.popupElement?.nativeElement;
    if (popup) {
      popup.style.display = 'none';
    }
  }

  addGeometryWithStyle(dados: any, geometry_type: string) {
    let style;
    if (geometry_type === 'Point' || geometry_type === 'MultiPoint') {
      style = new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: '#ffffff' }),
          stroke: new Stroke({ color: '#01499B', width: 2.5 }),
        }),
      });
    } else if (
      geometry_type === 'LineString' ||
      geometry_type === 'MultiLineString'
    ) {
      style = new Style({
        stroke: new Stroke({ color: '#01499B', width: 4 }),
      });
    } else if (
      geometry_type === 'Polygon' ||
      geometry_type === 'MultiPolygon'
    ) {
      style = new Style({
        fill: new Fill({ color: 'rgba(1, 73, 155, 0.13)' }),
        stroke: new Stroke({ color: '#01499B', width: 3 }),
      });
    }

    const vectorSource = new VectorSource({
      features: new GeoJSON()
        .readFeatures(dados, {
          dataProjection: 'EPSG:31984',
          featureProjection: 'EPSG:3857',
        })
        .map((featureLike) => {
          if (!(featureLike instanceof Feature)) {
            const geometry = new Geometry();
            const newFeature = new Feature(geometry);
            return newFeature;
          }
          return featureLike;
        }),
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: style,
    });

    this.layersAdded.push(vectorLayer);

    this.mapaService.getMapa()?.addLayer(vectorLayer);
  }

  removeAddedLayers() {
    const mapa = this.mapaService.getMapa();
    if (mapa) {
      const layersToRemove = mapa
        .getLayers()
        .getArray()
        .filter((layer) => this.layersAdded.includes(layer));
      layersToRemove.forEach((layer) => {
        mapa.removeLayer(layer);
      });
      this.layersAdded = this.layersAdded.filter(
        (layer) => !layersToRemove.includes(layer),
      );
    }
  }

  getExtentFeature() {
    const currentPageItem = this.listaDeObjetos[this.paginator.pageIndex];

    if (currentPageItem && currentPageItem['geometry']) {
      let olGeometry: Geometry;
      const geometry = currentPageItem['geometry'];

      switch (geometry.type) {
        case 'Point':
        case 'MultiPoint':
          olGeometry = new Point(geometry.coordinates);
          break;
        case 'LineString':
        case 'MultiLineString':
          olGeometry = new MultiLineString(
            geometry.coordinates.map((line: any[]) =>
              line.map((coord) => coord),
            ),
          );
          break;
        case 'Polygon':
        case 'MultiPolygon':
          olGeometry = new Polygon(
            geometry.coordinates.map((ring: any[]) =>
              ring.map((coord) => coord),
            ),
          );
          break;
        default:
          console.error('Unsupported geometry type');
          return;
      }

      const extent = olGeometry.getExtent();
      this.mapaService
        .getMapa()
        ?.getView()
        .fit(extent, {
          duration: 1000,
          padding: [50, 50, 50, 50],
          maxZoom: 20,
        });
    }
  }

  addMarkerWithTooltip() {
    const currentPageItem = this.listaDeObjetos[this.paginator.pageIndex];

    if (currentPageItem && currentPageItem['geometry']) {
      const geometry = currentPageItem['geometry'];
      const layerName = currentPageItem.tituloLayer;

      const markerElement = document.createElement('div');
      markerElement.className = 'marker';
      markerElement.innerHTML =
        '<div class="marker"><img src="https://unpkg.com/leaflet@1.3.4/dist/images/marker-icon.png" style="border: 0px;" /></div>';

      const olCoordinates = this.conteudoService.calculateCentroid(geometry);
      const marker = new Overlay({
        position: olCoordinates,
        positioning: 'center-center',
        element: markerElement,
        stopEvent: false,
      });
      this.mapaService.getMapa()?.addOverlay(marker);

      const coordKey = olCoordinates.join(',');

      if (!this.tooltips[coordKey]) {
        const tooltipElement = document.createElement('div');
        tooltipElement.className = 'mk-tooltip mk-arrow-bottom';
        const lonLat = toLonLat(olCoordinates);
        const latDeg = lonLat[1];
        const lonDeg = lonLat[0];
        const coordenadas = `${Math.abs(latDeg).toFixed(6)}°${latDeg >= 0 ? 'N' : 'S'}, ${Math.abs(lonDeg).toFixed(6)}°${lonDeg >= 0 ? 'E' : 'W'}`;
        const latLon = `${latDeg.toFixed(6)}, ${lonDeg.toFixed(6)}`;

        const copyIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
        const checkIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;

        tooltipElement.innerHTML = `
          <div class="mk-arrow"></div>
          <div class="mk-header">
            <div class="mk-header-left">
              <svg class="mk-pin-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span class="mk-title">${layerName}</span>
            </div>
            <button class="mk-close" title="Fechar">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div class="mk-body">
            <div class="mk-row">
              <span class="mk-label">Coordenadas</span>
              <span class="mk-value mk-value--mono">${coordenadas}</span>
              <button class="mk-copy" data-copy="${coordenadas}" title="Copiar coordenadas">${copyIcon}</button>
            </div>
            <div class="mk-row mk-row--alt">
              <span class="mk-label">Lat / Long</span>
              <span class="mk-value mk-value--mono">${latLon}</span>
              <button class="mk-copy" data-copy="${latLon}" title="Copiar Lat/Long">${copyIcon}</button>
            </div>
          </div>
          <div class="mk-footer">
            <button class="mk-remove" title="Remover marcador">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              Remover marcador
            </button>
          </div>
        `;

        tooltipElement
          ?.querySelector('.mk-close')
          ?.addEventListener('click', () => {
            tooltipElement.style.display = 'none';
          });

        tooltipElement
          ?.querySelector('.mk-remove')
          ?.addEventListener('click', () => {
            this.mapaService.getMapa()?.removeOverlay(marker);
            tooltipElement.style.display = 'none';
            delete this.tooltips[coordKey];
          });

        tooltipElement
          .querySelectorAll<HTMLButtonElement>('.mk-copy')
          .forEach((btn) => {
            btn.addEventListener('click', () => {
              const value = btn.dataset['copy'] ?? '';
              navigator.clipboard.writeText(value).then(() => {
                btn.innerHTML = checkIcon;
                btn.classList.add('mk-copy--done');
                setTimeout(() => {
                  btn.innerHTML = copyIcon;
                  btn.classList.remove('mk-copy--done');
                }, 1500);
              });
            });
          });

        const tooltip = new Overlay({
          element: tooltipElement,
          offset: [0, -12],
          positioning: 'bottom-center',
        });
        this.mapaService.getMapa()?.addOverlay(tooltip);
        this.tooltips[coordKey] = tooltip;
      }

      markerElement.addEventListener('click', () => {
        const tooltipOverlay = this.tooltips[coordKey];
        if (tooltipOverlay) {
          tooltipOverlay.setPosition(olCoordinates);
          const tooltipEl = tooltipOverlay.getElement() as HTMLElement;
          if (tooltipEl) {
            tooltipEl.style.display = 'block';
            this.applyMarkerTooltipPosition(
              tooltipEl,
              tooltipOverlay,
              olCoordinates,
            );
          }
        }
      });
    }
  }

  private applyMarkerTooltipPosition(
    el: HTMLElement,
    overlay: Overlay,
    coordinate: number[],
  ): void {
    const mapa = this.mapaService.getMapa();
    if (!mapa) return;
    const pixel = mapa.getPixelFromCoordinate(coordinate);
    const mapSize = mapa.getSize();
    if (!pixel || !mapSize) return;

    const [mapW, mapH] = mapSize;
    const [cx, cy] = pixel;
    const GAP = 14;
    const H_EDGE = mapW * 0.27;
    const V_EDGE = mapH * 0.3;

    el.classList.remove(
      'mk-arrow-top',
      'mk-arrow-bottom',
      'mk-arrow-left',
      'mk-arrow-right',
    );

    let arrowClass: string;
    let positioning: any;
    let offset: [number, number];

    if (cy < V_EDGE) {
      // Near top → balloon below marker, arrow points up
      arrowClass = 'mk-arrow-top';
      positioning = 'top-center';
      offset = [0, GAP];
    } else if (cy > mapH - V_EDGE) {
      // Near bottom → balloon above marker, arrow points down
      arrowClass = 'mk-arrow-bottom';
      positioning = 'bottom-center';
      offset = [0, -GAP];
    } else if (cx < H_EDGE) {
      // Near left edge → balloon to the right, arrow points left
      arrowClass = 'mk-arrow-left';
      positioning = 'center-left';
      offset = [GAP, 0];
    } else if (cx > mapW - H_EDGE) {
      // Near right edge → balloon to the left, arrow points right
      arrowClass = 'mk-arrow-right';
      positioning = 'center-right';
      offset = [-GAP, 0];
    } else {
      // Default → balloon above marker, arrow points down
      arrowClass = 'mk-arrow-bottom';
      positioning = 'bottom-center';
      offset = [0, -GAP];
    }

    el.classList.add(arrowClass);
    overlay.setPositioning(positioning);
    overlay.setOffset(offset);
  }

  onPageChange(event: PageEvent) {
    this.paginator.pageIndex = event.pageIndex;
    this.highlightCurrentFeature();
  }

  toggleMenu() {
    this.menuAberto = !this.menuAberto;
  }

  getBuffer(scaleOrZoom: number) {
    if (Math.round(scaleOrZoom) <= 10) {
      return 800;
    } else if (Math.round(scaleOrZoom) === 11) {
      return 400;
    } else if (Math.round(scaleOrZoom) === 12) {
      return 200;
    } else if (Math.round(scaleOrZoom) === 13) {
      return 100;
    } else if (Math.round(scaleOrZoom) === 14) {
      return 50;
    } else if (Math.round(scaleOrZoom) === 15) {
      return 30;
    } else if (Math.round(scaleOrZoom) === 16) {
      return 20;
    } else if (Math.round(scaleOrZoom) === 17) {
      return 10;
    } else if (Math.round(scaleOrZoom) === 18) {
      return 5;
    } else if (Math.round(scaleOrZoom) === 19) {
      return 2;
    } else {
      return 1;
    }
  }
}
