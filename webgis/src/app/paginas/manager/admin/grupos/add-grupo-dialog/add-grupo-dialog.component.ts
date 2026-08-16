import { CommonModule, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Grupos } from 'src/app/models/grupo.model';
import { Tema } from 'src/app/models/temas.model';
import { User } from 'src/app/models/users.model';
import { CreateGrupoService } from 'src/app/services/api/create.grupo.service';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { FetchUsuariosService } from 'src/app/services/api/fetch.usuarios.service';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { GrupoAvatarBadgeComponent } from 'src/app/shared/grupo-avatar-badge/grupo-avatar-badge.component';
import { gerarSiglaSugerida } from 'src/app/shared/grupo-sigla.util';

@Component({
  selector: 'app-add-grupo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    NgFor,
    GrupoAvatarBadgeComponent,
  ],
  templateUrl: './add-grupo-dialog.component.html',
  styleUrl: './add-grupo-dialog.component.scss',
})
export class AddGrupoDialogComponent implements OnInit {
  grupoCamadas: Grupos = {
    id: '',
    grupoNome: '',
    grupoSigla: '',
    grupoTema: '',
    criadoEm: '',
    nomeUsrCriacao: '',
    updatedAt: '',
    nomeUsrAlteracao: '',
    temaNome: '',
    visivel: false,
    camadas: [],
    camadasRaster: [],
    mapas: [],
  };

  temas: Tema[] = [];
  usuarios: User[] = [];
  donoId?: string;
  siglaEditadaManualmente = false;

  constructor(
    public dialogRef: MatDialogRef<AddGrupoDialogComponent>,
    private createGrupoCamadaService: CreateGrupoService,
    private fetchTemasService: FetchTemasService,
    private fetchUsuariosService: FetchUsuariosService,
    private fetchGrupoTemaService: FetchGrupoTemaService,
  ) {}

  ngOnInit(): void {
    this.fetchTemas();
    this.fetchUsuarios();
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

  fetchUsuarios(): void {
    this.fetchUsuariosService.getUsers().subscribe(
      (usuarios: User[]) => {
        this.usuarios = usuarios;
      },
      (error) => {
        console.error('Erro ao buscar usuários', error);
      },
    );
  }

  onNomeChange(): void {
    if (this.siglaEditadaManualmente) {
      return;
    }
    this.fetchGrupoTemaService.getAllGrupos().subscribe((grupos) => {
      const siglasExistentes = new Set(grupos.map((g) => g.grupoSigla));
      this.grupoCamadas.grupoSigla = gerarSiglaSugerida(
        this.grupoCamadas.grupoNome,
        siglasExistentes,
      );
    });
  }

  onSiglaChange(): void {
    this.siglaEditadaManualmente = true;
    this.grupoCamadas.grupoSigla = this.grupoCamadas.grupoSigla
      .toUpperCase()
      .slice(0, 2);
  }

  submitTema(form: NgForm) {
    if (form.valid) {
      const payload: Grupos = { ...this.grupoCamadas };
      if (this.donoId) {
        payload.donoId = this.donoId;
      }
      this.createGrupoCamadaService.createGrupo(payload).subscribe(() => {
        this.dialogRef.close();
      });
    }
  }
  onClose(): void {
    this.dialogRef.close();
  }
}
