import { Component, Input } from '@angular/core';
import BaseLayer from 'ol/layer/Base';
import ImageLayer from 'ol/layer/Image';
import { NgFor } from '@angular/common';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-layer-opacity',
  templateUrl: './layer-opacity.component.html',
  styleUrls: ['./layer-opacity.component.scss'],
  standalone: true,
  imports: [MatSliderModule],
})
export class LayerOpacityComponent {
  @Input() camada: BaseLayer | BaseLayer[] | null = null;

  ajustarOpacidade(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const opacidade = 1 - parseFloat(inputElement.value);

    if (!this.camada || isNaN(opacidade)) {
      return;
    }

    if (Array.isArray(this.camada)) {
      this.camada.forEach((layer) => {
        if (layer instanceof ImageLayer) {
          layer.setOpacity(opacidade);
        }
      });
    } else {
      this.camada.setOpacity(opacidade);
    }
  }

  formatLabel(value: number): string {
    const invertedValue = 1 - value;
    return `${(invertedValue * 100).toFixed(0)}%`;
  }

  getCurrentOpacity(): number {
    if (!this.camada) {
      return 1;
    }

    if (Array.isArray(this.camada)) {
      return this.camada[0]?.getOpacity() ?? 1;
    }

    return this.camada.getOpacity();
  }
}
