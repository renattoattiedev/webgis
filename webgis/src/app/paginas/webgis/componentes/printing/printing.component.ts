import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MapaService } from 'src/app/services/mapa.service';
import { Map } from 'ol';
import { Observable, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Camadas } from 'src/app/models/camadas.model';

export interface LayerEvent {
  camada?: Camadas;
  camadas?: Camadas[];
  action: 'add' | 'remove';
}

@Component({
  selector: 'app-printing',
  templateUrl: './printing.component.html',
  styleUrls: ['./printing.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
})
export class PrintingComponent implements OnInit, OnDestroy {
  private map$!: Observable<Map>;
  private mapSubscription!: Subscription;

  format: 'pdf' | 'png' = 'pdf';
  orientation: 'landscape' | 'portrait' = 'landscape';
  legendUrls: { url: string; title: string }[] = [];
  @Output() layerAdded = new EventEmitter<LayerEvent>();

  constructor(
    private mapaService: MapaService,
    private conteudoService: ConteudoService,
  ) {}

  ngOnInit(): void {
    this.layerAdded.subscribe((event: LayerEvent) => {
      if (event.action === 'add') {
        if (event.camadas) {
          this.receiveLayers(event.camadas);
        } else if (event.camada) {
          this.receiveLayers([event.camada]);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
  }

  export(): void {
    this.map$ = this.mapaService.getMapaObservable();
    this.mapSubscription = this.map$.subscribe((map) => {
      if (map) {
        this.extractLegendUrls(map);
        this.captureMap(map, this.format, this.orientation);
      } else {
        console.error('Mapa não encontrado.');
      }
    });
  }

  extractLegendUrls(map: Map): void {
    this.legendUrls = [];
    const visibleLayers = map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer instanceof ImageLayer &&
          layer.getVisible() &&
          layer.getSource() instanceof ImageWMS,
      ) as ImageLayer<ImageWMS>[];

    visibleLayers.forEach((layer, index) => {
      const source = layer.getSource();
      const resolution = map.getView().getResolution();
      const layerTitle = layer.get('titulo');

      if (source && resolution && layerTitle) {
        const legendUrl = source.getLegendUrl(resolution, {
          LAYER: source.getParams().LAYERS,
          FORMAT: 'image/png',
          STYLE: source.getParams().STYLES || '',
        });

        if (legendUrl) {
          this.legendUrls.push({
            url: legendUrl,
            title: layerTitle,
          });
        }
      }
    });
  }

  private async loadAndDrawLegends(
    context: CanvasRenderingContext2D | null,
    canvas: HTMLCanvasElement,
    scaleFactor: number,
  ): Promise<void> {
    if (!context || this.legendUrls.length === 0) {
      return;
    }

    let yPosition = canvas.height - 100 * scaleFactor;
    const rightMargin = canvas.width - 20 * scaleFactor;

    context.font = `bold ${4 * scaleFactor}px Arial`;
    context.textBaseline = 'bottom';
    context.textAlign = 'right';
    context.fillStyle = 'black';

    for (let i = 0; i < this.legendUrls.length; i++) {
      const legend = this.legendUrls[i];

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          const maxWidth = 25 * scaleFactor;
          const maxHeight = 10 * scaleFactor;

          let width = img.width;
          let height = img.height;
          const ratio = Math.min(maxWidth / width, maxHeight / height);

          width *= ratio;
          height *= ratio;

          context.fillText(legend.title, rightMargin, yPosition);

          yPosition += 4 * scaleFactor;

          context.drawImage(
            img,
            rightMargin - width - 10 * scaleFactor,
            yPosition,
            width,
            height,
          );

          yPosition += height + 10 * scaleFactor;

          resolve();
        };

        img.onerror = () => {
          console.error(`Erro ao carregar legenda: ${legend.title}`);
          yPosition += 10 * scaleFactor;
          resolve();
        };

        img.src = legend.url;
      });
    }
  }

  private captureMap(
    map: Map,
    format: string,
    orientation: 'landscape' | 'portrait',
  ): void {
    const dims = {
      a4: [297, 210],
    };

    const exportOptions = {
      useCORS: true,
      ignoreElements: (element: any) => {
        const className = element.className;
        if (typeof className === 'string') {
          return (
            className.includes('ol-control') &&
            !className.includes('ol-scale') &&
            (!className.includes('ol-attribution') ||
              !className.includes('ol-uncollapsible'))
          );
        }
        return false;
      },
    };

    const dim = dims['a4'];
    const width = orientation === 'landscape' ? dim[0] : dim[1];
    const height = orientation === 'landscape' ? dim[1] : dim[0];

    const originalSize = {
      width: map.getTargetElement().style.width,
      height: map.getTargetElement().style.height,
    };
    const originalResolution = map.getView().getResolution();

    const scaleFactor = 4;

    map.getTargetElement().style.width = `${width * scaleFactor}px`;
    map.getTargetElement().style.height = `${height * scaleFactor}px`;
    map.updateSize();

    map.once('rendercomplete', () => {
      html2canvas(map.getViewport(), exportOptions).then((canvas) => {
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = canvas.width;
        scaledCanvas.height = canvas.height;
        const scaledContext = scaledCanvas.getContext('2d');
        scaledContext?.drawImage(canvas, 0, 0);

        const windRose = new Image();
        windRose.src = 'assets/imagens/rosa_dos_ventos.png';
        windRose.onload = () => {
          const windRoseWidth = 30 * scaleFactor;
          const windRoseHeight = 30 * scaleFactor;

          scaledContext?.drawImage(
            windRose,
            10 * scaleFactor,
            scaledCanvas.height - windRoseHeight - 10 * scaleFactor,
            windRoseWidth,
            windRoseHeight,
          );

          this.loadAndDrawLegends(scaledContext, scaledCanvas, scaleFactor)
            .then(() => {
              this.saveCanvas(scaledCanvas, format, orientation, width, height);
            })
            .finally(() => {
              map.getTargetElement().style.width = originalSize.width;
              map.getTargetElement().style.height = originalSize.height;
              map.updateSize();
              map.getView().setResolution(originalResolution);
            });
        };
      });
    });
  }

  private saveCanvas(
    canvas: HTMLCanvasElement,
    format: string,
    orientation: 'landscape' | 'portrait',
    width: number,
    height: number,
  ) {
    if (format === 'pdf') {
      const pdfOrientation =
        orientation === 'landscape' ? 'landscape' : 'portrait';
      const pdf = new jsPDF(pdfOrientation, undefined, 'a4');
      pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, width, height);
      pdf.save('map.pdf');
    } else if (format === 'png') {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'map.png';
      link.click();
    }
  }

  receiveLayers(layers: any[]): void {
    this.legendUrls = [];
    for (const layer of layers) {
      if (layer.nomeCamada) {
        const legendUrl = this.generateLegendUrl(layer);
        if (legendUrl) {
          this.legendUrls.push({
            url: legendUrl,
            title: layer.tituloCamada,
          });
        }
      }
    }
  }

  private generateLegendUrl(layer: Camadas): string | null {
    let layerKey: string;

    if ('fonteDadosCamadaRaster' in layer && layer.fonteDadosCamadaRaster) {
      layerKey = `content:${layer.nomeCamada}_${layer.fonteDadosCamadaRaster}`;
    } else {
      layerKey = `content:${layer.nomeCamada}`;
    }

    const source = this.getSourceForLayer(layerKey);
    if (source && source instanceof ImageWMS) {
      const resolution = this.mapaService.getMapa()?.getView().getResolution();
      return source.getLegendUrl(resolution) ?? null;
    }
    return null;
  }

  private getSourceForLayer(layerKey: string): ImageWMS | null {
    const layers = this.mapaService.getMapa()?.getLayers().getArray();
    const matchingLayer = layers?.find((l) => {
      if (l instanceof ImageLayer) {
        const source = l.getSource();
        return source instanceof ImageWMS && l.get('id') === layerKey;
      }
      return false;
    });

    if (matchingLayer && matchingLayer instanceof ImageLayer) {
      const source = matchingLayer.getSource();
      if (source instanceof ImageWMS) {
        return source;
      }
    }

    return null;
  }

  clearLegend(): void {
    this.legendUrls = [];
  }
}
