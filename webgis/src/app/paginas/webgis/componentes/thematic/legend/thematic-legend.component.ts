import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ThematicLegendModel } from '../thematic-style.types';

@Component({
  selector: 'app-thematic-legend',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './thematic-legend.component.html',
  styleUrl: './thematic-legend.component.scss',
})
export class ThematicLegendComponent {
  @Input({ required: true }) model!: ThematicLegendModel;
}
