import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GruposService } from 'src/app/services/api/grupos.service';
import { GrupoOverview } from 'src/app/models/grupo-membros.model';
import { GrupoDetalheComponent } from './grupo-detalhe.component';
import { GrupoAvatarBadgeComponent } from 'src/app/shared/grupo-avatar-badge/grupo-avatar-badge.component';

interface TemaAgrupado {
  id: string;
  nome: string;
  qtd: number;
}

@Component({
  selector: 'app-grupos-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    MatSnackBarModule,
    GrupoDetalheComponent,
    GrupoAvatarBadgeComponent,
  ],
  templateUrl: './grupos-page.component.html',
  styleUrl: './grupos-page.component.scss',
})
export class GruposPageComponent implements OnInit {
  grupos: GrupoOverview[] = [];
  carregando = true;
  filtroNome = '';
  temaSelecionadoId = '';
  grupoAbertoId: string | null = null;

  constructor(
    private gruposService: GruposService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.gruposService.fetchOverview().subscribe({
      next: (res) => {
        this.grupos = res.grupos;
        this.carregando = false;
      },
      error: () => {
        this.grupos = [];
        this.carregando = false;
      },
    });
  }

  get temas(): TemaAgrupado[] {
    const mapa = new Map<string, TemaAgrupado>();
    for (const g of this.grupos) {
      const atual = mapa.get(g.temaId);
      if (atual) {
        atual.qtd++;
      } else {
        mapa.set(g.temaId, { id: g.temaId, nome: g.temaNome, qtd: 1 });
      }
    }
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  get gruposFiltrados(): GrupoOverview[] {
    const termo = this.filtroNome.trim().toLowerCase();
    return this.grupos.filter(
      (g) =>
        (!this.temaSelecionadoId || g.temaId === this.temaSelecionadoId) &&
        (!termo || g.nome.toLowerCase().includes(termo)),
    );
  }

  selecionarTema(temaId: string): void {
    this.temaSelecionadoId = temaId;
  }

  abrirGrupo(grupo: GrupoOverview): void {
    this.grupoAbertoId = grupo.id;
  }

  voltarDaPagina(): void {
    this.grupoAbertoId = null;
    this.carregar();
  }

  participar(grupo: GrupoOverview, event: Event): void {
    event.stopPropagation();
    this.gruposService.participar(grupo.id).subscribe({
      next: () => {
        this.snackBar.open('✔ Você entrou no grupo', 'Fechar', {
          duration: 3000,
        });
        this.carregar();
      },
      error: (error) => {
        console.error('❌ Erro ao participar do grupo:', error);
        this.snackBar.open('❌ Erro ao enviar participação', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  solicitar(grupo: GrupoOverview, event: Event): void {
    event.stopPropagation();
    this.gruposService.solicitarParticipacao(grupo.id).subscribe({
      next: () => {
        this.snackBar.open('✔ Solicitação enviada', 'Fechar', {
          duration: 3000,
        });
        this.carregar();
      },
      error: (error) => {
        console.error('❌ Erro ao solicitar participação:', error);
        this.snackBar.open('❌ Erro ao enviar participação', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  labelVisibilidade(v: GrupoOverview['visibilidade']): string {
    return {
      membros: 'Apenas membros',
      organizacao: 'Organização',
      publico: 'Público',
    }[v];
  }

  labelItens(grupo: GrupoOverview): string {
    return grupo.qtdItensVisiveis === grupo.qtdItens
      ? `${grupo.qtdItens} itens`
      : `${grupo.qtdItensVisiveis} de ${grupo.qtdItens} itens`;
  }
}
