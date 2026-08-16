import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Camadas } from 'src/app/models/camadas.model';
import { Grupos } from 'src/app/models/grupo.model';
import { NiveisCompartilhamento } from 'src/app/models/niveis.compartilhamento';
import { Tema } from 'src/app/models/temas.model';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { FetchNivelCompartilhamentoService } from 'src/app/services/api/fetch.nivel.compartilhamento.service';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import {
  CamadaComOrdem,
  CamadaRasterComOrdem,
  Mapas,
} from 'src/app/models/mapas.model';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';
import { MatIconModule } from '@angular/material/icon';
import { GruposService } from 'src/app/services/api/grupos.service';
import { GetUserPerfilService } from 'src/app/services/api/get.user.perfil.service';

@Component({
  selector: 'app-save-mapa',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatDialogModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './save-mapa.component.html',
  styleUrls: ['./save-mapa.component.scss'],
})
export class SaveMapaComponent implements OnInit {
  @Input() isVisible = false;
  @Input() camadas: CamadaComOrdem[] = [];
  @Input() camadasRaster: CamadaRasterComOrdem[] = [];

  mapa: Mapas;

  @Output() onSave = new EventEmitter<Mapas>();
  @Output() onCancel = new EventEmitter<void>();

  niveisCompartilhamento: NiveisCompartilhamento[] = [];
  temas: Tema[] = [];
  gruposCamadas: Grupos[] = [];
  mapaForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public fetchNivelCompartilhamentoService: FetchNivelCompartilhamentoService,
    public fetchTemasService: FetchTemasService,
    public fetchGrupoCamadasService: FetchGrupoTemaService,
    public dialogRef: MatDialogRef<SaveMapaComponent>,
    private gruposService: GruposService,
    private getUserPerfilService: GetUserPerfilService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      mapa: Mapas;
      camadas: CamadaComOrdem[];
      camadasRaster: CamadaRasterComOrdem[];
    },
  ) {
    this.mapa = data.mapa || {
      id: '',
      nomeMapa: '',
      tituloMapa: '',
      descricaoMapa: '',
      escalaMapa: '',
      nivelCompartilhamento: '',
      nivelCompartilhamentoMapa: '',
      grupoMapa: '',
      grupoMapaNome: '',
      camadas: data.camadas || [],
      camadasRaster: data.camadasRaster || [],
      temaId: '',
      temaMapaNome: '',
      favorito: false,
      updatedAt: new Date(),
      criadoEm: new Date(),
      usrCriacao: '',
    };
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
    this.mapaForm = this.fb.group({
      nomeMapa: [this.mapa.nomeMapa],
      tituloMapa: [this.mapa.tituloMapa],
      descricaoMapa: [this.mapa.descricaoMapa],
      nivelCompartilhamentoMapa: [this.mapa.nivelCompartilhamentoMapa],
      temaMapa: [this.mapa.temaId],
      grupoMapa: [this.mapa.grupoMapa],
    });

    this.fetchTemas();
    this.fetchNiveisCompartilhamento();
    this.mapa.camadas = this.data.camadas;
    this.mapa.camadasRaster = this.data.camadasRaster;
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
        this.getUserPerfilService.getCurrentUser().subscribe({
          next: (user) => {
            if (user.perfil === 'Admin') {
              this.gruposCamadas = grupos;
              return;
            }
            this.gruposService.filtrarGruposPorMembership(grupos).subscribe({
              next: (gruposFiltrados) => (this.gruposCamadas = gruposFiltrados),
              error: () => (this.gruposCamadas = grupos),
            });
          },
          error: () => (this.gruposCamadas = grupos),
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

  onSubmit() {
    if (this.mapaForm.valid) {
      const mapaSalvo = {
        ...this.mapaForm.value,
        criadoEm: this.mapa.criadoEm || new Date(),
        updatedAt: new Date(),
        camadas: this.mapa.camadas,
        camadasRaster: this.mapa.camadasRaster,
        temaId: this.mapaForm.get('temaMapa')?.value,
      };

      this.onSave.emit(mapaSalvo);
      this.dialogRef.close(mapaSalvo);
    } else {
      this.mapaForm.markAllAsTouched();
    }
  }

  cancel() {
    this.onCancel.emit();
    this.dialogRef.close();
  }
  onClose(): void {
    this.onCancel.emit();
    this.dialogRef.close();
  }
}
