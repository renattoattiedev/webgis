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
  RelatorioUsoData,
} from '../../services/relatorio.service';

@Component({
  selector: 'app-relatorio-uso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorio-uso.component.html',
  styleUrl: './relatorio-uso.component.scss',
})
export class RelatorioUsoComponent implements OnInit, OnDestroy {
  @ViewChild('barChartEl') barChartEl!: ElementRef;

  loading = true;
  data: RelatorioUsoData | null = null;

  preset = '30';
  dataInicio = '';
  dataFim = '';

  private barChart?: ApexCharts;

  sortCol: 'nome' | 'grupo' | 'tema' | 'acessos' | 'favoritos' = 'acessos';
  sortDir: 'asc' | 'desc' = 'desc';
  page = 1;
  pageSize = 10;

  private csvListener = () => this.downloadCSV();

  constructor(private relatorioService: RelatorioService) {}

  ngOnInit() {
    this.setPreset('30');
    window.addEventListener('relatorio-exportar-csv', this.csvListener);
  }

  ngOnDestroy() {
    window.removeEventListener('relatorio-exportar-csv', this.csvListener);
    this.barChart?.destroy();
  }

  private renderCharts(d: RelatorioUsoData) {
    this.barChart?.destroy();
    if (!this.barChartEl) return;
    this.barChart = new ApexCharts(this.barChartEl.nativeElement, {
      series: [{ name: 'Acessos', data: d.acessosPorDia.map((p) => p.total) }],
      chart: {
        type: 'bar',
        height: 200,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      colors: ['#1b5e20'],
      plotOptions: { bar: { borderRadius: 3 } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: d.acessosPorDia.map((p) => p.data.slice(5)),
        labels: { style: { fontSize: '10px' } },
      },
      yaxis: { labels: { style: { fontSize: '10px' } } },
      grid: { borderColor: '#f3f4f6' },
    });
    this.barChart.render();
  }

  setPreset(days: string) {
    this.preset = days;
    const fim = new Date();
    const inicio = new Date(fim.getTime() - Number(days) * 24 * 60 * 60 * 1000);
    this.dataFim = fim.toISOString().split('T')[0];
    this.dataInicio = inicio.toISOString().split('T')[0];
    this.carregar();
  }

  onDateChange() {
    this.preset = 'custom';
    this.carregar();
  }

  carregar() {
    this.loading = true;
    this.relatorioService.fetchUso(this.dataInicio, this.dataFim).subscribe({
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

  get variacao(): number {
    if (!this.data || this.data.kpis.totalAcessosAnterior === 0) return 0;
    return Math.round(
      ((this.data.kpis.totalAcessos - this.data.kpis.totalAcessosAnterior) /
        this.data.kpis.totalAcessosAnterior) *
        100,
    );
  }

  get tabelaSorted() {
    if (!this.data) return [];
    return [...this.data.tabela].sort((a, b) => {
      const va = a[this.sortCol];
      const vb = b[this.sortCol];
      if (typeof va === 'number' && typeof vb === 'number') {
        return this.sortDir === 'asc' ? va - vb : vb - va;
      }
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
      this.sortDir = 'desc';
    }
    this.page = 1;
  }

  downloadCSV() {
    if (!this.data) return;
    const headers = ['Camada', 'Grupo', 'Tema', 'Acessos', 'Favoritos'];
    const rows = this.tabelaSorted.map((r) => [
      r.nome,
      r.grupo,
      r.tema,
      r.acessos,
      r.favoritos,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-uso-${this.dataInicio}-${this.dataFim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
