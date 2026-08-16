import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelatorioUsoComponent } from './componentes/relatorio-uso/relatorio-uso.component';
import { RelatorioInventarioComponent } from './componentes/relatorio-inventario/relatorio-inventario.component';
import { RelatorioUsuariosComponent } from './componentes/relatorio-usuarios/relatorio-usuarios.component';

export type RelatorioSecao = 'uso' | 'inventario' | 'usuarios';

@Component({
  selector: 'app-relatorio-page',
  standalone: true,
  imports: [
    CommonModule,
    RelatorioUsoComponent,
    RelatorioInventarioComponent,
    RelatorioUsuariosComponent,
  ],
  templateUrl: './relatorio-page.component.html',
  styleUrl: './relatorio-page.component.scss',
})
export class RelatorioPageComponent {
  secaoAtiva: RelatorioSecao = 'uso';
  collapsed = false;

  mudarSecao(secao: RelatorioSecao) {
    this.secaoAtiva = secao;
  }

  exportarCSV() {
    window.dispatchEvent(new CustomEvent('relatorio-exportar-csv'));
  }

  exportarPDF() {
    window.print();
  }
}
