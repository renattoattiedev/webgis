import { NgFor, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import { getRenderPixel } from 'ol/render';
import RenderEvent from 'ol/render/Event';
import { MapaService } from 'src/app/services/mapa.service';

@Component({
  selector: 'app-cortina-camadas',
  standalone: true,
  templateUrl: './cortina-camadas.component.html',
  styleUrls: ['./cortina-camadas.component.scss'],
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    FormsModule,
    NgIf,
    NgFor,
  ],
})
export class CortinaCamadasComponent implements OnInit, OnDestroy {
  @Input() availableLayers: ImageLayer<any>[] = [];
  @Input() swipeValue: number = 50;
  public layer1: string = '';
  public layer2: string = '';
  isSwipeEnabled = false;
  private swipeLayer: TileLayer<any> | null = null;
  @Output() layersChanged = new EventEmitter<{
    layer1: string;
    layer2: string;
  }>();

  constructor(private mapService: MapaService) {}
  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.removeSwipe();
  }

  loadAvailableLayers() {
    return (this.availableLayers = this.mapService.getAvailableLayers());
  }

  onSelectionChange(event: any, selectName: string) {
    const selectedValue = event.value;

    if (this.isSwipeEnabled) {
      this.removeSwipe();
    }

    if (selectName === 'layer1') {
      this.layer1 = selectedValue;
    } else if (selectName === 'layer2') {
      this.layer2 = selectedValue;
    }

    this.updateLayers();

    if (this.isSwipeEnabled) {
      this.setupSwipe();
    }
    this.layersChanged.emit({ layer1: this.layer1, layer2: this.layer2 });
  }

  toggleSwipe() {
    if (this.layer1 && this.layer2) {
      this.isSwipeEnabled = !this.isSwipeEnabled;
      if (this.isSwipeEnabled) {
        this.setupSwipe();
      } else {
        this.removeSwipe();
      }
    } else {
      console.warn(
        'Duas camadas devem ser selecionadas para habilitar o swipe.',
      );
    }
  }
  updateLayers() {
    const map = this.mapService.getMapa();
    if (!map) {
      console.error('Mapa não inicializado.');
      return;
    }

    const todasAsCamadas = map.getLayers().getArray();

    const layer1 = this.availableLayers.find(
      (l) => l.get('id') === this.layer1,
    );
    const layer2 = this.availableLayers.find(
      (l) => l.get('id') === this.layer2,
    );

    if (layer1 && layer2) {
      // Remover todas as camadas exceto a camada base
      while (todasAsCamadas.length > 1) {
        map.removeLayer(todasAsCamadas[todasAsCamadas.length - 1]);
      }

      const baseLayer = todasAsCamadas[0];

      // Garantir que a camada base esteja na posição correta
      if (baseLayer) {
        map.getLayers().setAt(0, baseLayer);
      }

      // Adicionar as novas camadas, verificando se já não estão no mapa
      if (!todasAsCamadas.includes(layer1)) {
        map.addLayer(layer1);
      }
      if (!todasAsCamadas.includes(layer2)) {
        map.addLayer(layer2);
      }

      this.swipeLayer = layer2 as unknown as TileLayer<any>;

      if (this.isSwipeEnabled) {
        this.setupSwipe();
      }
    } else {
      console.warn('Camadas selecionadas não foram encontradas.');
    }
  }

  setupSwipe() {
    const map = this.mapService.getMapa();
    if (!map) {
      console.error('Mapa não inicializado.');
      return;
    }
    if (this.swipeLayer) {
      this.swipeLayer.on('prerender', this.prerender);
      this.swipeLayer.on('postrender', this.postrender);
      map?.render();
    }
  }

  removeSwipe() {
    this.isSwipeEnabled = false;
    const map = this.mapService.getMapa();
    if (!map) {
      console.error('Mapa não inicializado.');
      return;
    }
    if (this.swipeLayer) {
      this.swipeLayer.un('prerender', this.prerender);
      this.swipeLayer.un('postrender', this.postrender);
      map?.render();
    }
  }

  updateSwipeValue(value: number) {
    const map = this.mapService.getMapa();
    if (!map) {
      console.error('Mapa não inicializado.');
      return;
    }
    this.swipeValue = value;
    map?.render();
  }

  private prerender = (event: RenderEvent) => {
    const map = this.mapService.getMapa();
    if (!map) {
      console.error('Mapa não inicializado.');
      return;
    }
    const ctx = event.context as CanvasRenderingContext2D;
    const mapSize = map?.getSize();
    if (!mapSize) {
      console.warn('Map size is undefined');
      return;
    }

    const width = mapSize[0] * (this.swipeValue / 100);
    const tl = getRenderPixel(event, [width, 0]);
    const tr = getRenderPixel(event, [mapSize[0], 0]);
    const bl = getRenderPixel(event, [width, mapSize[1]]);
    const br = getRenderPixel(event, mapSize);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(tr[0], tr[1]);
    ctx.closePath();
    ctx.clip();
  };

  private postrender = (event: RenderEvent) => {
    const ctx = event.context as CanvasRenderingContext2D;
    ctx.restore();
  };
}
