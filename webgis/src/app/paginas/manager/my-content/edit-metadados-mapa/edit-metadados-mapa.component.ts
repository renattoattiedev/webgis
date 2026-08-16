import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { FetchNivelCompartilhamentoService } from 'src/app/services/api/fetch.nivel.compartilhamento.service';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { NiveisCompartilhamento } from 'src/app/models/niveis.compartilhamento';
import { Grupos } from 'src/app/models/grupo.model';
import { Tema } from 'src/app/models/temas.model';
import { Mapas } from 'src/app/models/mapas.model';
import { SaveMapasService } from 'src/app/services/api/save.mapas.service';
import { GruposService } from 'src/app/services/api/grupos.service';
import { GetUserPerfilService } from 'src/app/services/api/get.user.perfil.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-metadados-mapa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './edit-metadados-mapa.component.html',
  styleUrls: ['./edit-metadados-mapa.component.scss'],
})
export class EditMetadadosMapaComponent implements OnInit {
  @Output() onSave = new EventEmitter<Mapas>();
  @Output() onCancel = new EventEmitter<void>();

  mapaForm!: FormGroup;
  niveisCompartilhamento: NiveisCompartilhamento[] = [];
  temas: Tema[] = [];
  gruposCamadas: Grupos[] = [];
  mapa: Mapas;
  gruposAdicionaisSelecionados: string[] = [];
  private gruposAdicionaisIniciais: string[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditMetadadosMapaComponent>,
    private fetchTemasService: FetchTemasService,
    private fetchNivelCompartilhamentoService: FetchNivelCompartilhamentoService,
    private fetchGrupoTemaService: FetchGrupoTemaService,
    private saveMapasService: SaveMapasService,
    private gruposService: GruposService,
    private getUserPerfilService: GetUserPerfilService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { mapa: Mapas; camadas: [] },
  ) {
    this.mapa = data.mapa;
    this.gruposAdicionaisSelecionados = [
      ...(this.mapa.gruposAdicionaisIds ?? []),
    ];
    this.gruposAdicionaisIniciais = [...this.gruposAdicionaisSelecionados];
    this.mapaForm = this.fb.group({
      nomeMapa: ['', [Validators.required]],
      tituloMapa: ['', [Validators.required]],
      descricaoMapa: ['', [Validators.required, Validators.minLength(10)]],
      nivelCompartilhamentoMapa: ['', [Validators.required]],
      temaMapa: ['', [Validators.required]],
      grupoMapa: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.fetchTemas();
    this.fetchNiveisCompartilhamento();

    if (this.mapa.temaId) {
      this.fetchGruposCamadasPorTema(this.mapa.temaId);
    }
  }

  initializeForm() {
    this.mapaForm = this.fb.group({
      nomeMapa: [this.mapa.nomeMapa, Validators.required],
      tituloMapa: [this.mapa.tituloMapa, Validators.required],
      descricaoMapa: [this.mapa.descricaoMapa],
      nivelCompartilhamentoMapa: [this.mapa.nivelCompartilhamentoMapa],
      temaMapa: [this.mapa.temaId],
      grupoMapa: [
        {
          value: this.mapa.grupoMapa,
          disabled: this.gruposCamadas.length === 0,
        },
      ],
    });

    this.mapaForm.get('temaMapa')?.valueChanges.subscribe((idTema) => {
      this.fetchGruposCamadasPorTema(idTema);
      this.updateGrupoMapaDisabledState();
    });
  }

  fetchNiveisCompartilhamento(): void {
    this.fetchNivelCompartilhamentoService.getNiveis().subscribe(
      (niveis) => {
        this.niveisCompartilhamento = niveis;
      },
      (error) => {
        console.error('Erro ao buscar Níveis de Compartilhamento', error);
      },
    );
  }

  fetchTemas(): void {
    this.fetchTemasService.getTemas().subscribe(
      (temas) => {
        this.temas = temas;
      },
      (error) => {
        console.error('Erro ao buscar temas', error);
      },
    );
  }

  fetchGruposCamadasPorTema(idTema: string): void {
    this.fetchGrupoTemaService.getGrupo(idTema).subscribe(
      (grupos) => {
        this.getUserPerfilService.getCurrentUser().subscribe({
          next: (user) => {
            if (user.perfil === 'Admin') {
              this.gruposCamadas = grupos;
              this.updateGrupoMapaDisabledState();
              return;
            }
            this.gruposService.filtrarGruposPorMembership(grupos).subscribe({
              next: (gruposFiltrados) => {
                this.gruposCamadas = gruposFiltrados;
                this.updateGrupoMapaDisabledState();
              },
              error: () => {
                this.gruposCamadas = grupos;
                this.updateGrupoMapaDisabledState();
              },
            });
          },
          error: () => {
            this.gruposCamadas = grupos;
            this.updateGrupoMapaDisabledState();
          },
        });
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

  updateGrupoMapaDisabledState() {
    const grupoMapaControl = this.mapaForm.get('grupoMapa');
    if (this.gruposCamadas.length === 0) {
      grupoMapaControl?.disable();
    } else {
      grupoMapaControl?.enable();
    }
  }

  onSubmit() {
    if (this.mapaForm.valid) {
      if (this.mapaForm.valid) {
        const mapaSalvo = {
          ...this.mapa,
          ...this.mapaForm.value,
          updatedAt: new Date(),
        };

        this.saveMapasService.saveMapa(mapaSalvo).subscribe(
          (response) => {
            console.log('Mapa salvo com sucesso:', response);
            this.onSave.emit(mapaSalvo);
            this.salvarGruposAdicionais(mapaSalvo);
          },
          (error) => {
            console.error('Erro ao salvar o mapa:', error);
            this.snackBar.open(
              `❌ ${error?.message || 'Erro ao salvar o mapa'}`,
              'Fechar',
              { duration: 5000 },
            );
          },
        );
      }
    } else {
      this.mapaForm.markAllAsTouched();
    }
  }

  private salvarGruposAdicionais(mapaSalvo: Mapas): void {
    const selecionadosValidos = this.gruposAdicionaisSelecionados.filter(
      (id) => id !== this.mapa.grupoMapa,
    );

    const adicionados = selecionadosValidos.filter(
      (id) => !this.gruposAdicionaisIniciais.includes(id),
    );
    const removidos = this.gruposAdicionaisIniciais.filter(
      (id) => !selecionadosValidos.includes(id),
    );

    const chamadas = [
      ...adicionados.map((id) =>
        this.gruposService.adicionarItem(id, 'mapa', this.mapa.id),
      ),
      ...removidos.map((id) =>
        this.gruposService.removerItem(id, 'mapa', this.mapa.id),
      ),
    ];

    if (chamadas.length === 0) {
      this.dialogRef.close(mapaSalvo);
      return;
    }

    forkJoin(chamadas).subscribe({
      next: () => this.dialogRef.close(mapaSalvo),
      error: (error) => {
        console.error('Erro ao atualizar grupos adicionais do mapa', error);
        const motivo = error?.error?.message;
        this.snackBar.open(
          `❌ Mapa salvo, mas houve erro ao atualizar grupos adicionais${motivo ? ': ' + motivo : ''}`,
          'Fechar',
          { duration: 5000 },
        );
        this.dialogRef.close(mapaSalvo);
      },
    });
  }

  onClose(): void {
    this.onCancel.emit();
    this.dialogRef.close();
  }
}
