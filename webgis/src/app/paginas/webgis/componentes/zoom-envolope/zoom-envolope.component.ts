import { Component } from '@angular/core';
import { Draw, Modify } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { MapaService } from 'src/app/services/mapa.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'app-zoom-envolope',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './zoom-envolope.component.html',
  styleUrl: './zoom-envolope.component.scss',
})
export class ZoomEnvolopeComponent {
  drawInteraction!: Draw;
  modifyInteraction!: Modify;
  vectorSource: VectorSource = new VectorSource();
  vectorLayer: VectorLayer<VectorSource> = new VectorLayer({
    source: this.vectorSource,
  });

  isDrawing: boolean = false;

  constructor(public mapService: MapaService) {}

  activateDrawInteraction(): void {
    this.isDrawing = true;
    this.drawInteraction = new Draw({
      source: this.vectorSource,
      type: 'Circle',
      geometryFunction: createBox(),
    });

    const map = this.mapService.getMapa();
    if (!map) {
      console.error('Mapa não inicializado.');
      return;
    }

    map.addInteraction(this.drawInteraction);

    this.drawInteraction.on('drawend', (event) => {
      map.removeInteraction(this.drawInteraction);
      const geometry = event.feature.getGeometry();
      if (geometry) {
        const extent = geometry.getExtent();
        map.getView().fit(extent, { duration: 1000 });
      }
      map.removeInteraction(this.drawInteraction);
      this.isDrawing = false;
    });
  }
}
