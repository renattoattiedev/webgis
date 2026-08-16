import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { CreatePacoteConceitualService } from 'src/app/services/api/create.pacote.conceitual.service';
import { FetchPacotesConceituaisService } from 'src/app/services/api/fetch.pacotes.conceituais.service';
import { PacotesConceituais } from 'src/app/models/pacotes-conceituais.model';

@Component({
  selector: 'app-add.pacote-conceitual.dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule, // 🆕
    MatProgressSpinnerModule, // 🆕
    MatTooltipModule, // 🆕
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add.pacote-conceitual.dialog.component.html',
  styleUrl: './add.pacote-conceitual.dialog.component.scss',
})
export class AddPacoteConceitualDialogComponent implements OnInit {
  isAdmin = false;
  isLoading = false;
  isSubmitting = false;
  showPassword = false;
  connectionTestResult: 'none' | 'testing' | 'success' | 'error' = 'none';

  pacoteConceitual: PacotesConceituais = {
    nomePacoteConceitual: '',
    tituloPacoteConceitual: '',
    host: '',
    port: '5432',
    database: '',
    schema: '',
    user: '',
    password: '',
    id: '',
    criadoEm: '',
    usuarioCriacao: '',
    nomeUsrCriacao: '',
    updatedAt: '',
    usuarioUltimaAlteracao: '',
    nomeUsrAlteracao: '',
    validadoGeoserver: false,
    canEdit: false,
    hasSensitiveData: true,
    canAccessConnectionData: false,
    accessDenied: false,
  };

  constructor(
    public dialogRef: MatDialogRef<AddPacoteConceitualDialogComponent>,
    private createPacoteConceitualService: CreatePacoteConceitualService,
    private fetchPacotesService: FetchPacotesConceituaisService, // 🆕
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.checkAdminPermissions();
  }

  checkAdminPermissions(): void {
    this.isLoading = true;

    this.fetchPacotesService.isUserAdmin().subscribe({
      next: (isAdmin) => {
        this.isAdmin = isAdmin;
        this.isLoading = false;

        console.log(isAdmin);

        if (!isAdmin) {
          this.snackBar.open(
            '🚫 Apenas administradores podem criar pacotes conceituais',
            'Fechar',
            { duration: 5000 },
          );
          setTimeout(() => {
            this.dialogRef.close();
          }, 2000);
        } else {
          this.snackBar.open(
            '🔐 Modo administrador ativado - Criação de pacote conceitual',
            'OK',
            { duration: 3000 },
          );
        }
      },
      error: () => {
        this.isAdmin = false;
        this.isLoading = false;
        this.snackBar.open('❌ Erro ao verificar permissões', 'Fechar', {
          duration: 5000,
        });
        this.dialogRef.close();
      },
    });
  }

  isValidConnectionData(): boolean {
    return !!(
      this.pacoteConceitual.host &&
      this.pacoteConceitual.port &&
      this.pacoteConceitual.database &&
      this.pacoteConceitual.user &&
      this.pacoteConceitual.password
    );
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  submitPacote(form: NgForm) {
    if (!this.isAdmin) {
      this.snackBar.open('🚫 Acesso negado', 'Fechar', { duration: 3000 });
      return;
    }

    if (!form.valid) {
      Object.keys(form.controls).forEach((key) => {
        form.controls[key].markAsTouched();
      });
      this.snackBar.open('⚠️ Preencha todos os campos obrigatórios', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    // ✅ Removido o confirm() - criar diretamente
    this.isSubmitting = true;

    console.log(
      `🔐 Admin criando pacote conceitual: ${this.pacoteConceitual.nomePacoteConceitual} em ${new Date()}`,
    );

    this.createPacoteConceitualService
      .createPacoteConceitual(this.pacoteConceitual)
      .subscribe({
        next: (response) => {
          console.log('✅ Pacote conceitual criado com sucesso:', response);
          this.snackBar.open(
            `✅ Pacote "${this.pacoteConceitual.nomePacoteConceitual}" criado com sucesso!`,
            'OK',
            { duration: 3000 },
          );
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('❌ Erro ao criar pacote conceitual:', error);
          this.isSubmitting = false;

          let errorMessage = '❌ Erro ao criar pacote conceitual';
          if (error.status === 403) {
            errorMessage = '🚫 Acesso negado - Apenas administradores';
          } else if (error.status === 409) {
            errorMessage = '⚠️ Já existe um pacote com este nome';
          } else if (error.error?.message) {
            errorMessage = `❌ ${error.error.message}`;
          }

          this.snackBar.open(errorMessage, 'Fechar', { duration: 5000 });
        },
      });
  }

  onClose(): void {
    if (this.isSubmitting) {
      const confirmExit = confirm(
        '⚠️ Operação em andamento. Deseja realmente sair?',
      );
      if (!confirmExit) {
        return;
      }
    }
    this.dialogRef.close();
  }
}
