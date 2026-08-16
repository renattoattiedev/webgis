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
  RelatorioInventarioData,
} from '../../services/relatorio.service';

@Component({
  selector: 'app-relatorio-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorio-inventario.component.html',
  styleUrl: './relatorio-inventario.component.scss',
})
export class RelatorioInventarioComponent implements OnInit, OnDestroy {
  @ViewChild('donutEl') donutEl!: ElementRef;
  @ViewChild('barHEl') barHEl!: ElementRef;

  loading = true;
  data: RelatorioInventarioData | null = null;

  statusFiltro = '';

  private donutChart?: ApexCharts;
  private barHChart?: ApexCharts;

  sortCol: 'nome' | 'grupo' | 'tema' | 'totalAtributos' = 'nome';
  sortDir: 'asc' | 'desc' = 'asc';
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
    this.donutChart?.destroy();
    this.barHChart?.destroy();
  }

  private renderCharts(d: RelatorioInventarioData) {
    this.donutChart?.destroy();
    this.barHChart?.destroy();

    if (this.donutEl) {
      this.donutChart = new ApexCharts(this.donutEl.nativeElement, {
        series: d.porTema.map((t) => t.total),
        chart: { type: 'donut', height: 220 },
        labels: d.porTema.map((t) => t.tema),
        colors: [
          '#01499B',
          '#2e7d32',
          '#b45309',
          '#7c3aed',
          '#0891b2',
          '#d97706',
        ],
        legend: { position: 'bottom', fontSize: '10px' },
        dataLabels: { style: { fontSize: '10px' } },
      });
      this.donutChart.render();
    }

    if (this.barHEl) {
      this.barHChart = new ApexCharts(this.barHEl.nativeElement, {
        series: [{ name: 'Camadas', data: d.porNivel.map((n) => n.total) }],
        chart: { type: 'bar', height: 180, toolbar: { show: false } },
        colors: ['#01499B'],
        plotOptions: { bar: { horizontal: true, borderRadius: 3 } },
        dataLabels: { enabled: false },
        xaxis: {
          categories: d.porNivel.map((n) => n.nivel),
          labels: { style: { fontSize: '10px' } },
        },
        yaxis: { labels: { style: { fontSize: '10px' } } },
        grid: { borderColor: '#f3f4f6' },
      });
      this.barHChart.render();
    }
  }

  carregar() {
    this.loading = true;
    const ativo =
      this.statusFiltro === 'true'
        ? true
        : this.statusFiltro === 'false'
          ? false
          : undefined;
    this.relatorioService.fetchInventario(undefined, ativo).subscribe({
      next: (d) => {
        this.data = d;
        this.loading = false;
        setTimeout(() => this.renderCharts(d));
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get tabelaSorted() {
    if (!this.data) return [];
    return [...this.data.tabela].sort((a, b) => {
      const va = a[this.sortCol];
      const vb = b[this.sortCol];
      if (typeof va === 'number' && typeof vb === 'number')
        return this.sortDir === 'asc' ? va - vb : vb - va;
      return this.sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }

  get tabelaPaginada() {
    const start = (this.page - 1) * this.pageSize;
    return this.tabelaSorted.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.max(
      1,
      Math.ceil((this.data?.tabela.length ?? 0) / this.pageSize),
    );
  }

  sort(col: typeof this.sortCol) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  downloadCSV() {
    if (!this.data) return;
    const headers = [
      'Nome',
      'Título',
      'Grupo',
      'Tema',
      'Compartilhamento',
      'Atributos',
      'Ativa',
      'Criada em',
    ];
    const rows = this.tabelaSorted.map((r) => [
      r.nome,
      r.titulo,
      r.grupo,
      r.tema,
      r.compartilhamento,
      r.totalAtributos,
      r.ativa ? 'Sim' : 'Não',
      new Date(r.criadaEm).toLocaleDateString('pt-BR'),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-inventario.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
