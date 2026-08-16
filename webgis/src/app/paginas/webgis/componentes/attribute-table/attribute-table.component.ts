import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MapaService } from 'src/app/services/mapa.service';
import { Feature as OlFeature } from 'ol';
import { Style, Stroke, Fill, Circle, Icon } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { transformExtent } from 'ol/proj';
import { MatDialog } from '@angular/material/dialog';
import { FilterDataComponent } from '../filter-data/filter-data.component';
import { AttributeTableSelectColumnsComponent } from '../attribute-table-select-columns/attribute-table-select-columns.component';
import { Subject, takeUntil } from 'rxjs';
import shpwrite from '@mapbox/shp-write';
import {
  FeatureCollection as GeoJSONFeatureCollection,
  Feature as GeoJSONFeature,
  Geometry as GeoJSONGeometry,
} from 'geojson';
interface MapData {
  mapName: string;
  layers: string[];
}
@Component({
  selector: 'app-attribute-table',
  templateUrl: './attribute-table.component.html',
  styleUrls: ['./attribute-table.component.scss'],

  standalone: true,
  imports: [
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    MatMenuModule,
    MatSnackBarModule,
    CommonModule,
    ScrollingModule,
  ],
})
export class AttributeTableComponent implements OnInit, OnDestroy {
  highlightLayer!: VectorLayer<VectorSource>;
  selectedRows = new Set<any>();
  displayedColumns: { [key: string]: string[] } = {};
  tableColumns: string[] = [];
  tabData: {
    [layer: string]: {
      columns: string[];
      dataSource: any[];
    };
  } = {};
  tabDataColumns: {
    [layer: string]: {
      allColumns: string[];
      selectedColumns: string[];
    };
  } = {};
  highlightedFeatures: { [layer: string]: OlFeature[] } = {};
  markerLayerAssociations: { [coordinateKey: string]: string } = {};
  highlightStyle = new Style({
    stroke: new Stroke({
      color: 'rgba(30, 144, 255, 0.8)',
      width: 4,
    }),
    fill: new Fill({
      color: 'rgba(30, 144, 255, 0.4)',
    }),
  });

  highlightStylePoint = new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({ color: 'rgba(30, 144, 255, 0.8)' }),
      stroke: new Stroke({ color: '#00A0E6', width: 4 }),
    }),
    stroke: new Stroke({ color: '#00A0E6', width: 4 }),
    fill: new Fill({ color: 'rgba(30, 144, 255, 0.4)' }),
  });
  markers = new Map();
  markerState = new Map();
  showOnlySelected: { [nome: string]: boolean } = {};
  mapData: { [key: string]: MapData } = {};
  private destroy$ = new Subject<void>();
  constructor(
    public dialog: MatDialog,
    public mapaService: MapaService,
    public conteudoService: ConteudoService,
    public cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private el: ElementRef,
    private snackBar: MatSnackBar,
  ) {
    this.highlightLayer = new VectorLayer({
      source: new VectorSource(),
      style: this.highlightStyle,
    });
    this.conteudoService.setHighlightLayer(this.highlightLayer);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.conteudoService.onTableDataChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((layerName: string) => {
        const abaDw = this.conteudoService.abasDw.find(
          (a) => a.nome === layerName,
        );
        if (abaDw) {
          this.inicializarTabelaDw(abaDw.nome, abaDw.dados, abaDw.colunas);
        } else {
          this.inicializarTabela(layerName);
        }

        this.cdr.detectChanges();
        this.renderer.setProperty(this.el.nativeElement, 'hidden', false);

        if (!this.conteudoService.attributeTableisExpanded) {
          this.conteudoService.attributeTableisExpanded = true;
          this.conteudoService.toggle();
        }
      });
  }

  inicializarTabelaDw(nome: string, dados: any[], colunas: string[]): void {
    const columns = ['menu', ...colunas, 'geometry'];
    this.tabDataColumns[nome] = {
      allColumns: columns,
      selectedColumns: columns,
    };
    this.tabData[nome] = { columns, dataSource: dados };
    this.cdr.detectChanges();
  }

  selecionarLinhaDw(row: any): void {
    this.conteudoService.dwLinhaSelcionada$.next(row?.codPontoMedicao ?? null);
  }

  inicializarTabela(layerName: string) {
    const dados = this.conteudoService.listaDadosTabela.getValue();
    const camada = dados.find((c) => c.camadaNome === layerName);

    if (camada && camada.features && camada.features.length > 0) {
      // Determina colunas na ordem de renderização salva
      const rawKeys = Object.keys(camada.features[0]);
      const orderedNames = this.getOrderedVisibleAttributeNames(layerName);
      let filteredKeys: string[] = [];

      if (orderedNames.length > 0) {
        // Usa ordem persistida e garante que a coluna exista nos dados
        filteredKeys = orderedNames.filter((k) => rawKeys.includes(k));
      } else {
        // Fallback: respeita visibilidade sem ordenar
        const isSingleLayer = layerName.startsWith('content:');
        const visibleSet = isSingleLayer
          ? this.conteudoService.getVisibleAttributeNames(layerName)
          : this.conteudoService.getVisibleAttributeNamesForSubLayer(layerName);
        filteredKeys = rawKeys.filter((k) => {
          if (k === 'geometry') return false;
          return !visibleSet || visibleSet.has(k);
        });
      }

      const columns = ['menu', ...filteredKeys, 'geometry'];

      if (!this.tabDataColumns[layerName]) {
        this.tabDataColumns[layerName] = {
          allColumns: columns,
          selectedColumns: columns,
        };
      } else {
        // Atualiza colunas existentes para refletir visibilidade atual
        this.tabDataColumns[layerName].allColumns = columns;
        const prevSelected =
          this.tabDataColumns[layerName].selectedColumns || [];
        const nextSelected = prevSelected.filter((c) => columns.includes(c));
        this.tabDataColumns[layerName].selectedColumns =
          nextSelected.length > 0 ? nextSelected : columns;
      }

      this.tabData[layerName] = {
        columns: this.tabDataColumns[layerName].selectedColumns,
        dataSource: camada.features,
      };

      if (layerName.startsWith('content:')) {
        const mapName = this.getMapName(layerName);
        const layerShortName = this.getLayerName(layerName);

        if (!this.mapData[mapName]) {
          this.mapData[mapName] = { mapName, layers: [] };
        }

        if (!this.mapData[mapName].layers.includes(layerShortName)) {
          this.mapData[mapName].layers.push(layerShortName);
        }
      }

      this.cdr.detectChanges();
    } else {
      console.warn('Sem features ou camada inválida');
    }
  }

  private getOrderedVisibleAttributeNames(layerName: string): string[] {
    let attrs: any[] | null = null;
    // Camada simples (conteúdo vetorial)
    const singleLayerMeta = this.conteudoService.dadosAdicionais.find(
      (c) => c?.nomeConteudo === layerName && Array.isArray(c?.atributos),
    );
    if (singleLayerMeta) {
      attrs = singleLayerMeta.atributos as any[];
    } else {
      // Subcamada dentro de mapa: procurar em dadosAdicionaisFiltro e dadosAdicionais
      for (const conteudo of this.conteudoService.dadosAdicionaisFiltro) {
        if (
          conteudo?.tipoConteudo === 'mapa' &&
          Array.isArray(conteudo.camadas)
        ) {
          const sub = conteudo.camadas.find(
            (s: any) => s?.nomeCamada === layerName,
          );
          if (sub && Array.isArray(sub.atributos)) {
            attrs = sub.atributos as any[];
            break;
          }
        }
      }
      if (!attrs) {
        for (const conteudo of this.conteudoService.dadosAdicionais) {
          if (
            conteudo?.tipoConteudo === 'mapa' &&
            Array.isArray(conteudo.camadas)
          ) {
            const sub = conteudo.camadas.find(
              (s: any) => s?.nomeCamada === layerName,
            );
            if (sub && Array.isArray(sub.atributos)) {
              attrs = sub.atributos as any[];
              break;
            }
          }
        }
      }
    }

    if (!attrs) return [];
    return attrs
      .filter((a: any) => a && a.visivel === true)
      .sort(
        (a: any, b: any) =>
          (a.ordemRenderizacao ?? 0) - (b.ordemRenderizacao ?? 0),
      )
      .map((a: any) => a.nomeAtributo)
      .filter((n: string) => !!n);
  }

  getDataSource(nome: string): any[] {
    if (!this.tabData || !this.tabData[nome]) {
      return [];
    }

    const result = this.tabData[nome].dataSource || [];

    return result;
  }

  isMapLayer(layerName: string): boolean {
    return layerName.startsWith('content:') && layerName.includes('_');
  }

  getMapName(layerName: string): string {
    if (layerName.startsWith('content:')) {
      const parts = layerName.replace('content:', '').split('_');
      const mapName = parts.slice(0, -1).join('_');
      return mapName;
    }
    return layerName.split(':')[0];
  }

  getLayerName(fullLayerName: string): string {
    if (fullLayerName.startsWith('content:')) {
      const parts = fullLayerName.replace('content:', '').split('_');
      const layerName = parts[parts.length - 1];
      return layerName;
    }
    return fullLayerName.split(':').pop() || fullLayerName;
  }

  recarregarTabela(layer: string) {
    this.clearObjects(layer);
    delete this.tabData[layer];

    this.conteudoService
      .carregarTabelaDados(layer, [])
      .then(() => {
        this.inicializarTabela(layer);
      })
      .catch((error) => {
        console.error('❌ Erro ao carregar dados:', error);
      });

    this.showOnlySelected[layer] = false;
  }

  mostrarTabelaAtributos() {
    this.conteudoService.attributeTableisExpanded =
      !this.conteudoService.attributeTableisExpanded;

    this.conteudoService.toggle();
  }

  removeTableAttributes(layer: string, tipoConteudo: string) {
    if (tipoConteudo === 'mapa') {
      this.conteudoService.dadosAdicionais =
        this.conteudoService.dadosAdicionais.map((dado) => {
          if (dado.camadas) {
            dado.camadas = dado.camadas.map((subCamada) => {
              if (subCamada.nomeCamada === layer) {
                subCamada.tableAttribute = false;
              }
              return subCamada;
            });
            dado.tableAttribute = dado.camadas.some(
              (subCamada) => subCamada.tableAttribute,
            );
          }
          return dado;
        });
    } else if (tipoConteudo === 'camada') {
      this.conteudoService.dadosAdicionais =
        this.conteudoService.dadosAdicionais.map((dado) => {
          if (dado.nomeConteudo === layer) {
            dado.tableAttribute = false;
          }
          return dado;
        });
    }
    this.conteudoService.emitTableAttributesUpdated();
    this.cdr.detectChanges();
  }

  clearObjects(layer: string) {
    this.clearSelectionAndHighlights(layer);

    this.removeMarkersFromLayer(layer);

    this.selectedRows = new Set(
      [...this.selectedRows].filter((item) => item.nome !== layer),
    );

    if (this.tabData[layer]) {
      delete this.tabData[layer];
    }

    if (this.tabDataColumns[layer]) {
      delete this.tabDataColumns[layer];
    }

    if (this.mapData[layer]) {
      delete this.mapData[layer];
    }
  }

  isSubLayerAttributeVisible(dado: any, layerName: string): boolean {
    if (dado.camadas && Array.isArray(dado.camadas)) {
      const subLayer = dado.camadas.find(
        (camada: { nomeCamada: string }) => camada.nomeCamada === layerName,
      );
      return subLayer ? subLayer.tableAttribute : false;
    }
    return false;
  }

  isRowSelected(row: any, nome: string): boolean {
    return [...this.selectedRows].some(
      (item) => item.row === row && item.nome === nome,
    );
  }

  toggleRowSelection(row: any, nome: string) {
    const itemToToggle = { row, nome };
    const found = [...this.selectedRows].find(
      (selectedItem) => selectedItem.row === row && selectedItem.nome === nome,
    );
    if (found) {
      this.selectedRows.delete(found);
    } else {
      this.selectedRows.add(itemToToggle);
    }
  }

  applyHighlight(geometry: any, layerName: string) {
    const format = new GeoJSON();

    try {
      const map = this.mapaService.getMapa();
      if (!map) {
        return;
      }
      const feature = format.readFeature(geometry, {
        dataProjection: 'EPSG:3857',
        featureProjection: map.getView().getProjection(),
      });

      if (feature instanceof OlFeature) {
        const geometryType = feature.getGeometry()?.getType();

        if (geometryType === 'Point') {
          feature.setStyle(this.highlightStylePoint);
        } else {
          feature.setStyle(this.highlightStyle);
        }

        if (!this.highlightedFeatures[layerName]) {
          this.highlightedFeatures[layerName] = [];
        }
        this.highlightedFeatures[layerName].push(feature);

        this.highlightLayer.getSource()?.addFeature(feature);

        if (!map.getLayers().getArray().includes(this.highlightLayer)) {
          map.addLayer(this.highlightLayer);
        }
      } else {
        console.error('O objeto lido não é uma Feature válida do OpenLayers');
      }
    } catch (error) {
      console.error('Erro ao ler a geometria GeoJSON:', error);
    }
  }

  removeHighlight(geometry: any) {
    const format = new GeoJSON();
    try {
      const map = this.mapaService.getMapa();
      if (!map) {
        return;
      }
      const featureToRemove = format.readFeature(geometry, {
        dataProjection: 'EPSG:3857',
        featureProjection: map.getView().getProjection(),
      });

      if (
        featureToRemove instanceof OlFeature &&
        featureToRemove.getGeometry()
      ) {
        const source = this.highlightLayer.getSource();
        if (source) {
          const features = source.getFeatures();
          const geometryToRemove = featureToRemove.getGeometry();
          const geometryToRemoveStr = geometryToRemove
            ? format.writeGeometry(geometryToRemove)
            : null;

          features.forEach((feature) => {
            const existingGeometry = feature.getGeometry();
            if (existingGeometry) {
              const existingGeometryStr =
                format.writeGeometry(existingGeometry);
              if (existingGeometryStr === geometryToRemoveStr) {
                source.removeFeature(feature);
              }
            }
          });
        } else {
          console.error('A camada de highlight não possui uma fonte válida');
        }
      } else {
        console.error('O objeto lido não é uma Feature válida do OpenLayers');
      }
    } catch (error) {
      console.error('Erro ao ler a geometria GeoJSON:', error);
    }
  }

  zoomToGeometry(geometry: any) {
    const format = new GeoJSON();
    try {
      const map = this.mapaService.getMapa();
      if (!map) {
        return;
      }
      const feature = format.readFeature(geometry, {
        dataProjection: 'EPSG:3857',
        featureProjection: map.getView().getProjection(),
      });

      if (feature instanceof OlFeature) {
        const extent = feature.getGeometry()?.getExtent();
        if (extent) {
          map.getView().fit(extent, {
            duration: 1000,
            maxZoom: 18,
          });
        }
      } else {
        console.error('O objeto lido não é uma Feature válida do OpenLayers');
      }
    } catch (error) {
      console.error('Erro ao ler a geometria GeoJSON:', error);
    }
  }
  addRemoveMarkerToGeometry(geometry: any, layerName: string) {
    const format = new GeoJSON();
    try {
      const coordinates = this.conteudoService.calculateCentroid(geometry);
      const coordinateKey = JSON.stringify(coordinates);
      const map = this.mapaService.getMapa();
      if (!map) {
        return;
      }

      if (this.markers.has(coordinateKey)) {
        const existingLayer = this.markers.get(coordinateKey);
        if (existingLayer && this.markerState.get(coordinateKey)) {
          existingLayer.getSource().clear();
          map.removeLayer(existingLayer);
          this.markerState.set(coordinateKey, false);
        }
        this.markers.delete(coordinateKey);
        return;
      }

      const geoJSONFeature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coordinates,
        },
        properties: {},
      };

      const feature = format.readFeature(geoJSONFeature, {
        dataProjection: 'EPSG:3857',
        featureProjection: map.getView().getProjection(),
      });

      if (feature instanceof OlFeature) {
        const customIcon = new Icon({
          anchor: [0.5, 1],
          src: 'https://unpkg.com/leaflet@1.3.4/dist/images/marker-icon.png',
        });

        feature.setStyle(
          new Style({
            image: customIcon,
          }),
        );

        const markerLayer = new VectorLayer({
          source: new VectorSource({
            features: [feature],
          }),
        });

        map.addLayer(markerLayer);
        this.markers.set(coordinateKey, markerLayer);
        this.markerState.set(coordinateKey, true);

        this.markerLayerAssociations[coordinateKey] = layerName;
      } else {
        console.error('O objeto lido não é uma Feature válida do OpenLayers');
      }
    } catch (error) {
      console.error('Erro ao ler a geometria GeoJSON:', error);
    }
  }

  isMarkerAdded(geometry: any): boolean {
    return this.markerState.get(JSON.stringify(geometry)) || false;
  }

  clearSelectionAndHighlights(layer: string) {
    this.selectedRows.forEach((row) => {
      if (this.tabData[layer]?.dataSource.includes(row)) {
        this.selectedRows.delete(row);
      }
    });

    const highlightSource = this.highlightLayer.getSource();
    if (highlightSource) {
      const featuresToRemove = this.highlightedFeatures[layer] || [];

      featuresToRemove.forEach((feature) => {
        highlightSource.removeFeature(feature);
      });
    }
  }

  removeMarkersFromLayer(layerName: string) {
    const map = this.mapaService.getMapa();
    if (!map) {
      return;
    }
    for (const [coordinateKey, associatedLayer] of Object.entries(
      this.markerLayerAssociations,
    )) {
      if (associatedLayer === layerName) {
        if (this.markers.has(coordinateKey)) {
          const existingLayer = this.markers.get(coordinateKey);
          if (existingLayer && this.markerState.get(coordinateKey)) {
            existingLayer.getSource().clear();
            map.removeLayer(existingLayer);
          }
          this.markers.delete(coordinateKey);
          this.markerState.delete(coordinateKey);
        }
      }
    }
  }

  createFeatureFromData(featureData: any) {
    const format = new GeoJSON();
    const map = this.mapaService.getMapa();
    if (!map) {
      return null;
    }

    try {
      const feature = format.readFeature(featureData, {
        dataProjection: 'EPSG:4326',
        featureProjection: map.getView().getProjection(),
      });

      return feature;
    } catch (error) {
      return null;
    }
  }
  async filterMapExtent(layerName: string) {
    const map = this.mapaService.getMapa();
    if (map) {
      const view = map.getView();
      const extent = view.calculateExtent(map.getSize());
      const extent4326: [number, number, number, number] = transformExtent(
        extent,
        'EPSG:3857',
        'EPSG:4326',
      ) as [number, number, number, number];

      const objLayer = this.conteudoService.dadosAdicionais.find(
        (objeto) => objeto.nomeConteudo === layerName,
      );

      if (extent4326 && extent4326.length === 4) {
        this.clearObjects(layerName);
        delete this.tabData[layerName];

        setTimeout(() => {
          this.conteudoService
            .carregarTabelaDados(
              layerName,
              objLayer?.atributos ?? [],
              'extensao',
              extent4326.join(','),
            )
            .then(() => {
              this.inicializarTabela(layerName);
            });
        }, 100);
      } else {
        console.error('A extensão calculada não é válida:', extent);
      }
    } else {
      console.error('Não foi possível obter o mapa do MapaService');
    }
  }

  toggleShowSelected(nome: string) {
    const currentState = this.showOnlySelected[nome] || false;
    this.showOnlySelected[nome] = !currentState;
  }

  atualizarExibicaoTabela(layerName: string): void {
    const selectedColumns =
      this.tabDataColumns[layerName]?.selectedColumns ?? [];
    this.displayedColumns[layerName] = selectedColumns;
  }

  filterDataDialog(layerName: string): void {
    const dialogRef = this.dialog.open(FilterDataComponent, {
      width: '800px',
      height: '700px',
      data: { nomeCamada: layerName },
    });

    dialogRef.afterClosed().subscribe((resultadoExpressao) => {
      if (resultadoExpressao !== undefined) {
        setTimeout(() => {
          const objLayer = this.conteudoService.dadosAdicionais.find(
            (objeto) => objeto.nomeConteudo === layerName,
          );
          this.conteudoService
            .carregarTabelaDados(
              layerName,
              objLayer?.atributos ?? [],
              'expressao',
              resultadoExpressao,
            )
            .then(() => {
              this.inicializarTabela(layerName);
            });
        }, 100);
      } else {
      }
    });
  }

  openColumnSelector(layerName: string): void {
    const allColumns = this.tabDataColumns[layerName]?.allColumns ?? [];
    let selectedColumns = this.tabDataColumns[layerName]?.selectedColumns ??
      this.tabData[layerName]?.columns ?? [...allColumns];

    if (selectedColumns.length === 0) {
      selectedColumns = [...allColumns];
    }

    const dialogRef = this.dialog.open(AttributeTableSelectColumnsComponent, {
      width: '400px',
      height: '300px',
      data: {
        layerName: layerName,
        columns: allColumns,
        selectedColumns: selectedColumns,
      },
    });

    dialogRef.afterClosed().subscribe((newSelectedColumns) => {
      if (newSelectedColumns) {
        if (!this.tabDataColumns[layerName]) {
          this.tabDataColumns[layerName] = {
            allColumns: [],
            selectedColumns: [],
          };
        }
        if (
          !newSelectedColumns.includes('menu') &&
          !newSelectedColumns.includes('geometry')
        ) {
          newSelectedColumns = ['menu', ...newSelectedColumns, 'geometry'];
        }
        this.tabDataColumns[layerName].selectedColumns = newSelectedColumns;

        if (this.tabData[layerName]) {
          this.tabData[layerName].columns = newSelectedColumns;
        }

        this.atualizarExibicaoTabela(layerName);
      }
    });
  }
  exportToCsv(
    layerName: string,
    filename: string,
    rows: Record<string, any>[],
  ): void {
    if (!rows || !rows.length) {
      return;
    }

    const separator = ',';
    const originalKeys = Object.keys(rows[0]);
    const translatedKeys = originalKeys.map((k) =>
      this.conteudoService.translateAttributeNameToLabel(layerName, k),
    );
    const csvContent =
      translatedKeys.join(separator) +
      '\n' +
      rows
        .map((row) => {
          return originalKeys
            .map((originalKey) => {
              let cell: any =
                row[originalKey] === null || row[originalKey] === undefined
                  ? ''
                  : row[originalKey];
              cell =
                cell instanceof Date
                  ? cell.toLocaleString()
                  : typeof cell === 'string'
                    ? cell.replace(/"/g, '""')
                    : cell.toString();
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if ((navigator as any).msSaveBlob) {
      (navigator as any).msSaveBlob(blob, filename);
    } else {
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  createDataArrayForExport(layer: string): object[] {
    if (!this.tabData[layer]) {
      return [];
    }

    const { dataSource, columns } = this.tabData[layer];

    return dataSource.map((feature) => {
      const exportObject: { [key: string]: any } = {};
      columns.forEach((col) => {
        if (col === 'menu' || col === 'geometry') {
          return;
        }
        exportObject[col] = feature[col] ?? '';
      });
      return exportObject;
    });
  }

  exportTableData(layer: string): void {
    const yourDataArray = this.createDataArrayForExport(layer);
    this.exportToCsv(layer, `${layer}-data.csv`, yourDataArray);
  }

  async exportShapeFile(layer: string): Promise<void> {
    const columns = this.getExportColumns(layer);
    const collection = this.buildFeatureCollection(layer, columns);

    if (!collection || !collection.features.length) {
      this.snackBar.open('Nenhum dado disponível para exportar.', 'Fechar', {
        duration: 4000,
      });
      return;
    }

    const shapefileCollection = this.prepareCollectionForShapefile(
      collection,
      columns,
    );

    try {
      const zipped = await shpwrite.zip(shapefileCollection, {
        compression: 'DEFLATE',
        outputType: 'blob',
      });
      const blob =
        zipped instanceof Blob
          ? zipped
          : new Blob([this.normalizeZipOutput(zipped)], {
              type: 'application/zip',
            });
      const filename = this.buildExportFilename(layer, 'zip');
      this.triggerBlobDownload(blob, filename);

      this.snackBar.open('Shapefile exportado com sucesso.', 'Fechar', {
        duration: 4000,
      });
    } catch (error) {
      console.error('Erro ao gerar Shapefile:', error);
      this.snackBar.open('Não foi possível exportar o Shapefile.', 'Fechar', {
        duration: 5000,
      });
    }
  }

  exportGeoJson(layer: string): void {
    const columns = this.getExportColumns(layer);
    const collection = this.buildFeatureCollection(layer, columns);

    if (!collection || !collection.features.length) {
      this.snackBar.open('Nenhum dado disponível para exportar.', 'Fechar', {
        duration: 4000,
      });
      return;
    }

    const filename = this.buildExportFilename(layer, 'geojson');
    const blob = new Blob([JSON.stringify(collection, null, 2)], {
      type: 'application/geo+json',
    });

    this.triggerBlobDownload(blob, filename);
    this.snackBar.open('GeoJSON exportado com sucesso.', 'Fechar', {
      duration: 4000,
    });
  }

  exportKml(layer: string): void {
    const columns = this.getExportColumns(layer);
    const collection = this.buildFeatureCollection(layer, columns);

    if (!collection || !collection.features.length) {
      this.snackBar.open('Nenhum dado disponível para exportar.', 'Fechar', {
        duration: 4000,
      });
      return;
    }

    try {
      const kml = this.convertCollectionToKml(collection, columns, layer);
      const filename = this.buildExportFilename(layer, 'kml');
      const blob = new Blob([kml], {
        type: 'application/vnd.google-earth.kml+xml',
      });
      this.triggerBlobDownload(blob, filename);

      this.snackBar.open('KML exportado com sucesso.', 'Fechar', {
        duration: 4000,
      });
    } catch (error) {
      console.error('Erro ao gerar KML:', error);
      this.snackBar.open('Não foi possível exportar o KML.', 'Fechar', {
        duration: 5000,
      });
    }
  }

  private getExportColumns(layer: string): string[] {
    const selected =
      this.tabDataColumns[layer]?.selectedColumns ??
      this.tabData[layer]?.columns ??
      [];
    return selected.filter(
      (column) => column !== 'menu' && column !== 'geometry',
    );
  }

  private getExportRows(layer: string): any[] {
    const dataSource = this.tabData[layer]?.dataSource ?? [];
    if (!dataSource.length) {
      return [];
    }

    if (!this.showOnlySelected[layer]) {
      return dataSource;
    }

    const selectedRows = this.getSelectedRowsForLayer(layer);
    if (!selectedRows.length) {
      return [];
    }

    return dataSource.filter((row) => selectedRows.includes(row));
  }

  private getSelectedRowsForLayer(layer: string): any[] {
    return [...this.selectedRows]
      .filter((item) => item.nome === layer)
      .map((item) => item.row);
  }

  private buildFeatureCollection(
    layer: string,
    columns: string[],
  ): GeoJSONFeatureCollection | null {
    const rows = this.getExportRows(layer);
    if (!rows.length) {
      return null;
    }

    const map = this.mapaService.getMapa();
    const mapProjection = map?.getView().getProjection().getCode();
    const projections = this.getCandidateProjections(mapProjection);
    const format = new GeoJSON();

    const features: GeoJSONFeature[] = rows
      .map((row) => {
        const geometry = row.geometry;
        if (!geometry) {
          return null;
        }

        const geometry4326 = this.transformGeometryTo4326(
          geometry,
          projections,
          format,
        );
        if (!geometry4326) {
          return null;
        }

        const properties: Record<string, any> = {};
        columns.forEach((column) => {
          properties[column] = row[column] ?? '';
        });

        return {
          type: 'Feature',
          geometry: geometry4326,
          properties,
        } as GeoJSONFeature;
      })
      .filter((feature): feature is GeoJSONFeature => feature !== null);

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  private getCandidateProjections(mapProjection?: string): string[] {
    const defaults = ['EPSG:31984', 'EPSG:3857', 'EPSG:4326'];
    const projections = mapProjection ? [mapProjection, ...defaults] : defaults;
    return [...new Set(projections)];
  }

  private transformGeometryTo4326(
    geometry: any,
    projections: string[],
    format: GeoJSON,
  ): GeoJSONGeometry | null {
    for (const source of projections) {
      try {
        const rawFeature = format.readFeature(
          {
            type: 'Feature',
            geometry,
            properties: {},
          },
          {
            dataProjection: source,
            featureProjection: 'EPSG:4326',
          },
        );

        if (!(rawFeature instanceof OlFeature)) {
          continue;
        }

        const result = format.writeFeatureObject(rawFeature, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:4326',
        });

        if (result.geometry) {
          return result.geometry as GeoJSONGeometry;
        }
      } catch {
        // tenta próxima projeção
      }
    }

    console.warn('Não foi possível transformar a geometria para EPSG:4326.');
    return null;
  }

  private prepareCollectionForShapefile(
    collection: GeoJSONFeatureCollection,
    columns: string[],
  ): GeoJSONFeatureCollection {
    const fieldMap = this.buildShapefileFieldMap(columns);

    const features = collection.features.map((feature) => {
      const mappedProperties: Record<string, any> = {};
      columns.forEach((column) => {
        const shapefileField = fieldMap[column];
        mappedProperties[shapefileField] = feature.properties?.[column] ?? '';
      });

      return {
        type: 'Feature',
        geometry: feature.geometry,
        properties: mappedProperties,
      } as GeoJSONFeature;
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  private normalizeZipOutput(
    zipped: string | ArrayBuffer | ArrayBufferView,
  ): BlobPart {
    if (typeof zipped === 'string') {
      return zipped;
    }

    if (zipped instanceof ArrayBuffer) {
      return zipped;
    }

    if (ArrayBuffer.isView(zipped)) {
      const view = zipped as ArrayBufferView;
      const buffer = view.buffer;

      if (buffer instanceof ArrayBuffer) {
        const start = view.byteOffset;
        const end = start + view.byteLength;
        return buffer.slice(start, end);
      }

      const copy = new Uint8Array(view.byteLength);
      copy.set(new Uint8Array(buffer, view.byteOffset, view.byteLength));
      return copy.buffer;
    }

    throw new Error('Unsupported zip output type');
  }

  private buildShapefileFieldMap(columns: string[]): Record<string, string> {
    const used = new Set<string>();
    const map: Record<string, string> = {};

    columns.forEach((column) => {
      let candidate = this.normalizeShapefileField(column);
      let suffix = 1;

      while (used.has(candidate)) {
        const base = candidate.slice(
          0,
          Math.max(0, 10 - suffix.toString().length),
        );
        candidate = `${base}${suffix}`.slice(0, 10);
        suffix++;
      }

      used.add(candidate);
      map[column] = candidate;
    });

    return map;
  }

  private normalizeShapefileField(column: string): string {
    let normalized = column
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase();

    if (!normalized) {
      normalized = 'FIELD';
    }

    if (/^[0-9]/.test(normalized)) {
      normalized = `F_${normalized}`;
    }

    if (normalized.length > 10) {
      normalized = normalized.slice(0, 10);
    }

    return normalized;
  }

  private convertCollectionToKml(
    collection: GeoJSONFeatureCollection,
    columns: string[],
    layer: string,
  ): string {
    const layerName = this.getLayerName(layer) || 'Layer';
    const placemarks = collection.features.flatMap((feature, index) =>
      this.buildPlacemark(feature, columns, layerName, index + 1),
    );

    const documentContent = placemarks.join('\n');

    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<kml xmlns="http://www.opengis.net/kml/2.2">\n` +
      `  <Document>\n` +
      `    <name>${this.escapeXml(layerName)}</name>\n` +
      documentContent +
      `\n  </Document>\n` +
      `</kml>`
    );
  }

  private buildPlacemark(
    feature: GeoJSONFeature,
    columns: string[],
    layerName: string,
    index: number,
  ): string[] {
    const properties = feature.properties || {};
    const nameCandidate = columns.find((column) => {
      const value = properties[column];
      return value !== undefined && value !== null && value !== '';
    });

    const baseName = nameCandidate
      ? String(properties[nameCandidate])
      : `${layerName} ${index}`;
    const extendedData = this.buildExtendedData(properties, columns);
    const geometries = this.geometryToKmlSegments(feature.geometry);

    return geometries.map((geometryTag, partIndex) => {
      const suffix = geometries.length > 1 ? ` (${partIndex + 1})` : '';
      return (
        `    <Placemark>\n` +
        `      <name>${this.escapeXml(baseName + suffix)}</name>\n` +
        extendedData +
        geometryTag +
        `\n    </Placemark>`
      );
    });
  }

  private buildExtendedData(
    properties: Record<string, any>,
    columns: string[],
  ): string {
    if (!columns.length) {
      return '';
    }

    const data = columns
      .map((column) => {
        const value = properties[column] ?? '';
        return `      <Data name="${this.escapeXml(column)}"><value>${this.escapeXml(String(value))}</value></Data>`;
      })
      .join('\n');

    return `      <ExtendedData>\n${data}\n      </ExtendedData>\n`;
  }

  private geometryToKmlSegments(
    geometry: GeoJSONGeometry | null | undefined,
  ): string[] {
    if (!geometry) {
      return [];
    }

    switch (geometry.type) {
      case 'Point':
        return [this.buildPointTag(geometry.coordinates)];
      case 'MultiPoint':
        return geometry.coordinates.map((coord) => this.buildPointTag(coord));
      case 'LineString':
        return [this.buildLineStringTag(geometry.coordinates)];
      case 'MultiLineString':
        return geometry.coordinates.map((coords) =>
          this.buildLineStringTag(coords),
        );
      case 'Polygon':
        return [this.buildPolygonTag(geometry.coordinates)];
      case 'MultiPolygon':
        return geometry.coordinates.map((polygon) =>
          this.buildPolygonTag(polygon),
        );
      case 'GeometryCollection':
        return geometry.geometries.flatMap((child) =>
          this.geometryToKmlSegments(child),
        );
      default:
        return [];
    }
  }

  private buildPointTag(coordinates: number[]): string {
    return `      <Point><coordinates>${this.formatCoordinate(coordinates)}</coordinates></Point>`;
  }

  private buildLineStringTag(coordinates: number[][]): string {
    return `      <LineString><coordinates>${this.formatCoordinateList(coordinates)}</coordinates></LineString>`;
  }

  private buildPolygonTag(coordinates: number[][][]): string {
    if (!coordinates.length) {
      return '      <Polygon />';
    }

    const [outer, ...inners] = coordinates;
    const outerTag = `        <outerBoundaryIs><LinearRing><coordinates>${this.formatCoordinateList(outer)}</coordinates></LinearRing></outerBoundaryIs>`;
    const innerTags = inners
      .map(
        (inner) =>
          `        <innerBoundaryIs><LinearRing><coordinates>${this.formatCoordinateList(inner)}</coordinates></LinearRing></innerBoundaryIs>`,
      )
      .join('\n');

    return `      <Polygon>\n${outerTag}${innerTags ? `\n${innerTags}` : ''}\n      </Polygon>`;
  }

  private formatCoordinateList(coordinates: number[][]): string {
    return coordinates.map((coord) => this.formatCoordinate(coord)).join(' ');
  }

  private formatCoordinate(coordinate: number[]): string {
    const [lon, lat, alt] = coordinate;
    const lonStr = this.formatNumber(lon);
    const latStr = this.formatNumber(lat);

    if (coordinate.length > 2 && alt !== undefined) {
      return `${lonStr},${latStr},${this.formatNumber(alt)}`;
    }

    return `${lonStr},${latStr}`;
  }

  private formatNumber(value: number): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '0';
    }
    return value.toFixed(6);
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private buildExportFilename(layer: string, extension: string): string {
    const base = this.getLayerName(layer) || 'export';
    const sanitized = base.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'export';
    return `${sanitized}.${extension}`;
  }

  private triggerBlobDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  }
}
