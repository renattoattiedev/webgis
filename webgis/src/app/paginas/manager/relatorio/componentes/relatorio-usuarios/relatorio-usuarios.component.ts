import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import ApexCharts from 'apexcharts';
import {
  RelatorioService,
  RelatorioUsuariosData,
  UsuarioTabela,
} from '../../services/relatorio.service';

@Component({
  selector: 'app-relatorio-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorio-usuarios.component.html',
  styleUrl: './relatorio-usuarios.component.scss',
})
export class RelatorioUsuariosComponent implements OnInit, OnDestroy {
  @ViewChild('pizzaEl') pizzaEl!: ElementRef;

  loading = true;
  data: RelatorioUsuariosData | null = null;

  perfilFiltro = '';
  statusFiltro = '';
  busca = '';

  sortCol: keyof Pick<
    UsuarioTabela,
    | 'nome'
    | 'email'
    | 'perfil'
    | 'logins'
    | 'camadas'
    | 'mapas'
    | 'raster'
    | 'favoritos'
    | 'ultimoAcesso'
    | 'ultimaAtividade'
  > = 'ultimaAtividade';
  sortDir: 'asc' | 'desc' = 'desc';

  private pizzaChart?: ApexCharts;

  page = 1;
  pageSize = 10;

  private csvListener = () => this.downloadCSV();

  constructor(private relatorioService: RelatorioService) {}

  ngOnInit() {
    window.addEventListener('relatorio-exportar-csv', this.csvListener);
    this.carregar();
  }

  ngOnDestroy() {
    window.removeEventListener('relatorio-exportar-csv', this.csvListener);
    this.pizzaChart?.destroy();
  }

  private renderChart(d: RelatorioUsuariosData) {
    this.pizzaChart?.destroy();
    if (!this.pizzaEl) return;
    this.pizzaChart = new ApexCharts(this.pizzaEl.nativeElement, {
      series: d.porPerfil.map((p) => p.total),
      chart: { type: 'donut', height: 240 },
      labels: d.porPerfil.map((p) => p.perfil),
      colors: ['#268A97', '#1D707C', '#b45309', '#7c3aed'],
      legend: { position: 'bottom', fontSize: '11px' },
      dataLabels: { style: { fontSize: '10px' } },
    });
    this.pizzaChart.render();
  }

  carregar() {
    this.loading = true;
    const dias = this.statusFiltro === 'inativo' ? 30 : undefined;
    this.relatorioService
      .fetchUsuarios(this.perfilFiltro || undefined, dias)
      .subscribe({
        next: (d) => {
          this.data = d;
          this.loading = false;
          setTimeout(() => this.renderChart(d));
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  get tabelaFiltrada() {
    if (!this.data) return [];
    const busca = this.busca.toLowerCase();
    let rows = this.data.tabela;
    if (busca) {
      rows = rows.filter(
        (r) =>
          r.nome.toLowerCase().includes(busca) ||
          r.email.toLowerCase().includes(busca),
      );
    }
    if (this.statusFiltro === 'ativo') rows = rows.filter((r) => r.ativo);
    if (this.statusFiltro === 'inativo') rows = rows.filter((r) => !r.ativo);

    return [...rows].sort((a, b) => {
      const va = a[this.sortCol];
      const vb = b[this.sortCol];
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return this.sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va);
      const sb = String(vb);
      return this.sortDir === 'asc'
        ? sa.localeCompare(sb)
        : sb.localeCompare(sa);
    });
  }

  get tabelaPaginada() {
    const start = (this.page - 1) * this.pageSize;
    return this.tabelaFiltrada.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.tabelaFiltrada.length / this.pageSize));
  }

  sort(col: typeof this.sortCol) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'desc';
    }
    this.page = 1;
  }

  sortIcon(col: typeof this.sortCol): string {
    if (this.sortCol !== col) return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  downloadCSV() {
    if (!this.data) return;
    const headers = [
      'Nome',
      'Email',
      'Perfil',
      'Logins',
      'Último login',
      'Última atividade',
      'Camadas',
      'Mapas',
      'Raster',
      'Favoritos',
      'Status',
    ];
    const rows = this.tabelaFiltrada.map((r) => [
      r.nome,
      r.email,
      r.perfil,
      r.logins,
      r.ultimoAcesso
        ? new Date(r.ultimoAcesso).toLocaleDateString('pt-BR')
        : 'Nunca',
      r.ultimaAtividade
        ? new Date(r.ultimaAtividade).toLocaleDateString('pt-BR')
        : 'Nunca',
      r.camadas,
      r.mapas,
      r.raster,
      r.favoritos,
      r.ativo ? 'Ativo' : 'Inativo',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
