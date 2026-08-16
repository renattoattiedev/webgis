import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { GruposService } from 'src/app/services/api/grupos.service';
import { ItemDisponivelGrupo } from 'src/app/models/grupo-membros.model';

type TipoItemGrupo = 'camada' | 'raster' | 'mapa';

interface OpcaoItem extends ItemDisponivelGrupo {
  tipo: TipoItemGrupo;
}

@Component({
  selector: 'app-adicionar-item-grupo-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule],
  templateUrl: './adicionar-item-grupo-dialog.component.html',
  styleUrls: ['./adicionar-item-grupo-dialog.component.scss'],
})
export class AdicionarItemGrupoDialogComponent implements OnInit {
  carregando = true;
  erro = false;
  busca = '';
  itens: OpcaoItem[] = [];

  constructor(
    public dialogRef: MatDialogRef<AdicionarItemGrupoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { grupoId: string },
    private gruposService: GruposService,
  ) {}

  ngOnInit(): void {
    this.gruposService.fetchItensDisponiveis(this.data.grupoId).subscribe({
      next: (res) => {
        this.itens = [
          ...res.camadas.map((i) => ({ ...i, tipo: 'camada' as const })),
          ...res.camadasRaster.map((i) => ({ ...i, tipo: 'raster' as const })),
          ...res.mapas.map((i) => ({ ...i, tipo: 'mapa' as const })),
        ];
        this.carregando = false;
      },
      error: (error) => {
        console.error('❌ Erro ao buscar itens disponíveis:', error);
        this.erro = true;
        this.carregando = false;
      },
    });
  }

  get itensFiltrados(): OpcaoItem[] {
    const termo = this.busca.trim().toLowerCase();
    if (!termo) return this.itens;
    return this.itens.filter(
      (i) =>
        i.titulo.toLowerCase().includes(termo) ||
        i.nome.toLowerCase().includes(termo),
    );
  }

  selecionar(item: OpcaoItem): void {
    this.dialogRef.close({ tipo: item.tipo, itemId: item.id });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
