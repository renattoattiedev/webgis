import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Grupos } from 'src/app/models/grupo.model';
import { NiveisCompartilhamento } from 'src/app/models/niveis.compartilhamento';
import { Tema } from 'src/app/models/temas.model';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { FetchNivelCompartilhamentoService } from 'src/app/services/api/fetch.nivel.compartilhamento.service';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { GruposService } from 'src/app/services/api/grupos.service';
import { UpdateCamadaService } from 'src/app/services/api/update.camada.service';

@Component({
  selector: 'app-edit-camada-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './edit-camada-raster-dialog.component.html',
  styleUrls: ['./edit-camada-raster-dialog.component.scss'],
})
export class EditCamadaRasterDialogComponent implements OnInit {
  temas: Tema[] = [];
  gruposCamadas: Grupos[] = [];
  niveisCompartilhamento: NiveisCompartilhamento[] = [];
  camadaForm!: FormGroup;
  gruposAdicionaisSelecionados: string[] =
    this.data.camada.gruposAdicionaisIds ?? [];
  private gruposAdicionaisIniciais: string[] = [
    ...this.gruposAdicionaisSelecionados,
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditCamadaRasterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fetchTemasService: FetchTemasService,
    public fetchGrupoCamadasService: FetchGrupoTemaService,
    public fetchNivelCompartilhamentoService: FetchNivelCompartilhamentoService,
    private updateCamadasService: UpdateCamadaService,
    private gruposService: GruposService,
    private snackBar: MatSnackBar,
  ) {
    this.camadaForm = this.fb.group({
      nivelCompartilhamento: [
        this.data.camada.nivelCompartilhamentoId,
        [Validators.required],
      ],
      tema: [this.data.camada.temaId, [Validators.required]],
      grupo: [this.data.camada.grupoCamada, [Validators.required]],
      titulo_camada: [this.data.camada.tituloCamada, [Validators.required]],
      descricao_camada: [
        this.data.camada.descricaoCamada,
        [Validators.required, Validators.minLength(10)],
      ],
      metadados: [this.data.camada.linkMetadados],
      termos_uso: [this.data.camada.termosDeUso],
      tags: [this.data.camada.tags],
    });
  }

  ngOnInit() {
    this.fetchTemas();
    this.fetchNiveisCompartilhamento();
    this.fetchGruposCamadasPorTema(this.data.camada.temaId);
  }

  fetchNiveisCompartilhamento(): void {
    this.fetchNivelCompartilhamentoService.getNiveis().subscribe(
      (niveisCompartilhamento: NiveisCompartilhamento[]) => {
        this.niveisCompartilhamento = niveisCompartilhamento;
      },
      (error) => {
        console.error('Erro ao buscar Niveis de Compartilhamento', error);
      },
    );
  }

  fetchTemas(): void {
    this.fetchTemasService.getTemas().subscribe(
      (temas: Tema[]) => {
        this.temas = temas;
      },
      (error) => {
        console.error('Erro ao buscar temas', error);
      },
    );
  }

  fetchGruposCamadasPorTema(idTema: string): void {
    this.fetchGrupoCamadasService.getGrupo(idTema).subscribe(
      (grupos: Grupos[]) => {
        this.gruposCamadas = grupos;
      },
      (error) => {
        console.error(
          'Erro ao buscar grupos de camadas para o tema',
          idTema,
          error,
        );
      },
    );
  }

  onSubmit() {
    if (this.camadaForm.valid) {
      this.updateCamadasService.updateCamadaRaster(this.data.camada).subscribe({
        next: (response) => {
          console.log('Camada Raster atualizada com sucesso!', response);
          this.salvarGruposAdicionais();
        },
        error: (error) => {
          console.error('Erro ao atualizar a camada Raster', error);
          this.snackBar.open(
            `❌ ${error?.message || 'Erro ao atualizar a camada raster'}`,
            'Fechar',
            { duration: 5000 },
          );
        },
      });
    } else {
      this.camadaForm.markAllAsTouched();
    }
  }

  private salvarGruposAdicionais(): void {
    const selecionadosValidos = this.gruposAdicionaisSelecionados.filter(
      (id) => id !== this.data.camada.grupoCamada,
    );

    const adicionados = selecionadosValidos.filter(
      (id) => !this.gruposAdicionaisIniciais.includes(id),
    );
    const removidos = this.gruposAdicionaisIniciais.filter(
      (id) => !selecionadosValidos.includes(id),
    );

    const chamadas = [
      ...adicionados.map((id) =>
        this.gruposService.adicionarItem(id, 'raster', this.data.camada.id),
      ),
      ...removidos.map((id) =>
        this.gruposService.removerItem(id, 'raster', this.data.camada.id),
      ),
    ];

    if (chamadas.length === 0) {
      this.dialogRef.close(true);
      return;
    }

    forkJoin(chamadas).subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        console.error(
          'Erro ao atualizar grupos adicionais da camada raster',
          error,
        );
        this.snackBar.open(
          '❌ Camada Raster salva, mas houve erro ao atualizar grupos adicionais',
          'Fechar',
          { duration: 4000 },
        );
        this.dialogRef.close(true);
      },
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
