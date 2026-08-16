import { NgFor, CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Tema } from 'src/app/models/temas.model';
import { User } from 'src/app/models/users.model';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { FetchUsuariosService } from 'src/app/services/api/fetch.usuarios.service';
import { GruposService } from 'src/app/services/api/grupos.service';
import { UpdateGrupoService } from 'src/app/services/api/update.grupo.service';
import { GrupoAvatarBadgeComponent } from 'src/app/shared/grupo-avatar-badge/grupo-avatar-badge.component';

@Component({
  selector: 'app-edit-grupo-dialog',
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
    MatSnackBarModule,
    NgFor,
    GrupoAvatarBadgeComponent,
  ],
  templateUrl: './edit-grupo-dialog.component.html',
  styleUrl: './edit-grupo-dialog.component.scss',
})
export class EditGrupoDialogComponent implements OnInit {
  temas: Tema[] = [];
  usuarios: User[] = [];
  donoId?: string;
  private donoOriginalId?: string;
  salvando = false;
  siglaEditadaManualmente = true; // ao editar, a sigla ja existe — nao re-sugerir sozinha

  constructor(
    public dialogRef: MatDialogRef<EditGrupoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private updateGrupoCamadaService: UpdateGrupoService,
    private fetchTemasService: FetchTemasService,
    private fetchUsuariosService: FetchUsuariosService,
    private gruposService: GruposService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.fetchTemas();
    this.fetchUsuarios();
    this.carregarDono();
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

  carregarDono(): void {
    if (this.data?.grupoCamada?.donoId) {
      this.donoOriginalId = this.data.grupoCamada.donoId;
      this.donoId = this.data.grupoCamada.donoId;
      return;
    }

    const grupoId = this.data?.grupoCamada?.id;
    if (!grupoId) {
      return;
    }

    this.gruposService.getGrupo(grupoId).subscribe({
      next: (resposta) => {
        this.donoOriginalId = resposta.grupo.donoId;
        this.donoId = resposta.grupo.donoId;
      },
      error: (error) => {
        console.error('Erro ao buscar dono do grupo', error);
      },
    });
  }

  submitPacote() {
    this.salvando = true;
    this.updateGrupoCamadaService.updateGrupo(this.data.grupoCamada).subscribe({
      next: () => {
        if (this.donoId && this.donoId !== this.donoOriginalId) {
          this.gruposService
            .updateConfig(this.data.grupoCamada.id, { donoId: this.donoId })
            .subscribe({
              next: () => {
                this.salvando = false;
                this.dialogRef.close(true);
              },
              error: (error) => {
                console.error('Erro ao atualizar dono do grupo', error);
                this.salvando = false;
                this.snackBar.open(
                  '❌ Erro ao atualizar dono do grupo',
                  'Fechar',
                  {
                    duration: 4000,
                  },
                );
              },
            });
        } else {
          this.salvando = false;
          this.dialogRef.close(true);
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar o grupo', error);
        this.salvando = false;
        this.snackBar.open(
          error?.error?.message || '❌ Erro ao atualizar o grupo',
          'Fechar',
          { duration: 4000 },
        );
      },
    });
  }

  onSiglaChange(): void {
    this.data.grupoCamada.grupoSigla = this.data.grupoCamada.grupoSigla
      .toUpperCase()
      .slice(0, 2);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
