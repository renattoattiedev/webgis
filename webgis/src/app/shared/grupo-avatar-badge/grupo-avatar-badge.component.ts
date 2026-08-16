import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GrupoItem } from 'src/app/models/grupo-item.model';

const PALETA_CORES = [
  '#4DA9E7',
  '#7C4DFF',
  '#22A06B',
  '#E8604C',
  '#D9A62E',
  '#0EA5A5',
  '#9C6ADE',
  '#5B6B85',
];

@Component({
  selector: 'app-grupo-avatar-badge',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './grupo-avatar-badge.component.html',
  styleUrls: ['./grupo-avatar-badge.component.scss'],
})
export class GrupoAvatarBadgeComponent {
  @Input() grupos: GrupoItem[] = [];
  @Input() max = 3;
  @Output() grupoClick = new EventEmitter<string>();

  get visiveis(): GrupoItem[] {
    return this.grupos.slice(0, this.max);
  }

  get restantes(): GrupoItem[] {
    return this.grupos.slice(this.max);
  }

  get restantesTooltip(): string {
    return this.restantes.length
      ? this.restantes.length +
          ' outro(s): ' +
          this.restantes.map((g) => g.nome).join(', ')
      : '';
  }

  corDoGrupo(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const indice = Math.abs(hash) % PALETA_CORES.length;
    return PALETA_CORES[indice];
  }

  onCircleClick(id: string): void {
    this.grupoClick.emit(id);
  }
}
