import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ThematicLayerService } from '../layer/thematic-layer.service';
import { ThematicLegendComponent } from './thematic-legend.component';

@Component({
  selector: 'app-thematic-legend-overlay',
  standalone: true,
  imports: [CommonModule, ThematicLegendComponent],
  template: `
    <div class="thematic-legend-dock" *ngIf="(legends$ | async) as legends">
      <ng-container *ngIf="legends.length">
        <app-thematic-legend
          *ngFor="let model of legends"
          [model]="model"
        ></app-thematic-legend>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .thematic-legend-dock {
        position: absolute;
        top: 16px;
        right: 16px;
        z-index: 1100;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: calc(100% - 90px);
        overflow-y: auto;
        padding: 12px 14px;
        width: 240px;
        background: rgba(255, 255, 255, 0.94);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.8);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
        pointer-events: auto;
      }
    `,
  ],
})
export class ThematicLegendOverlayComponent {
  readonly legends$ = this.thematicLayerService.legends$;

  constructor(private thematicLayerService: ThematicLayerService) {}
}
