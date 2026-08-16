import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ConfigImprimirCroquiComponent } from './config-imprimir-croqui/config-imprimir-croqui.component';
import { ConfigPitometriaComponent } from './config-pitometria/config-pitometria.component';
import { FetchComponenteService } from 'src/app/services/api/fetch-componente.service';
import { Componente } from 'src/app/models/componente.model';

@Component({
  selector: 'app-componentes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatGridListModule,
    ConfigImprimirCroquiComponent,
    ConfigPitometriaComponent,
  ],
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.scss',
})
export class ComponentesComponent implements OnInit {
  showImprimirCroquiConfig = false;
  showPitometriaConfig = false;
  componentes: Componente[] = [];
  selectedComponente: Componente | null = null;
  @Input() habilitado = true;

  constructor(private fetchComponenteService: FetchComponenteService) {}

  ngOnInit(): void {
    this.fetchComponenteService.getComponentes().subscribe({
      next: (componentes) => (this.componentes = componentes),
      error: (err) => console.error('Erro ao buscar componentes:', err),
    });
  }

  onConfigurar(componenteId: string): void {
    const componente = this.componentes.find((c) => c.id === componenteId);
    if (!componente) return;

    this.fecharConfig();

    const nome = componente.nome?.toLowerCase() ?? '';
    if (nome.includes('imprimir')) {
      this.selectedComponente = componente;
      this.showImprimirCroquiConfig = true;
    } else if (nome.includes('pitometria')) {
      this.selectedComponente = componente;
      this.showPitometriaConfig = true;
    }
  }

  fecharConfig(): void {
    this.showImprimirCroquiConfig = false;
    this.showPitometriaConfig = false;
    this.selectedComponente = null;
  }
}
