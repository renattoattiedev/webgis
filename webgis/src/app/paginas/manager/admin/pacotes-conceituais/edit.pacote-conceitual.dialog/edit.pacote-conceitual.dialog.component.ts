import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { UpdatePacoteConceitualService } from 'src/app/services/api/update.pacote.conceitual.service';
import { FetchPacotesConceituaisService } from 'src/app/services/api/fetch.pacotes.conceituais.service';
import {
  PacoteForEdit,
  ConnectionData,
} from 'src/app/models/pacotes-conceituais.model';

@Component({
  selector: 'app-edit.pacote-conceitual.dialog',
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
    MatSlideToggleModule, // 🆕
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './edit.pacote-conceitual.dialog.component.html',
  styleUrl: './edit.pacote-conceitual.dialog.component.scss',
})
export class EditPacoteConceitualDialogComponent implements OnInit {
  isAdmin = false;
  isLoading = true;
  isSubmitting = false;
  showPassword = false;
  showOriginalData = false;
  hasDataChanged = false;
  connectionTestResult: 'none' | 'testing' | 'success' | 'error' = 'none';

  pacoteData: PacoteForEdit | null = null;
  originalData: ConnectionData | null = null;

  editForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditPacoteConceitualDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      id: string;
      nome: string;
      pacoteConceitual: { id: string; [key: string]: any };
    },
    private updatePacoteConceitual: UpdatePacoteConceitualService,
    private fetchPacotesService: FetchPacotesConceituaisService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // ✅ Corrigir para acessar o objeto dentro de pacoteConceitual
    console.log('🔄 Dados recebidos no diálogo:', this.data);
    console.log('🔄 Pacote conceitual:', this.data?.pacoteConceitual);

    if (!this.data?.pacoteConceitual?.id) {
      console.error('❌ ID do pacote não fornecido');
      this.snackBar.open('❌ ID do pacote não fornecido', 'Fechar', {
        duration: 3000,
      });
      this.dialogRef.close();
      return;
    }

    console.log('🔄 Iniciando edição do pacote:', this.data.pacoteConceitual);
    this.loadPacoteForEdit();
  }

  initForm(): void {
    this.editForm = this.fb.group({
      nomePacoteConceitual: [
        '',
        [Validators.required, Validators.pattern('^[a-z0-9_]+$')],
      ],
      tituloPacoteConceitual: ['', [Validators.required]],
      host: ['', [Validators.required]],
      port: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      database: ['', [Validators.required]],
      schema: ['', [Validators.required]],
      user: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    this.editForm.valueChanges.subscribe(() => {
      this.hasDataChanged = true;
    });
  }

  async loadPacoteForEdit(): Promise<void> {
    // ✅ Usar this.data.pacoteConceitual.id
    const pacoteId = this.data.pacoteConceitual.id;

    if (!pacoteId) {
      console.error('❌ ID do pacote não fornecido');
      this.snackBar.open('❌ ID do pacote não fornecido', 'Fechar', {
        duration: 3000,
      });
      this.dialogRef.close();
      return;
    }

    try {
      console.log(`🔍 Buscando pacote para edição - ID: ${pacoteId}`);

      const isAdmin = await this.fetchPacotesService.isUserAdmin().toPromise();
      this.isAdmin = isAdmin ?? false;

      if (!isAdmin) {
        this.snackBar.open(
          '🚫 Apenas administradores podem editar pacotes conceituais',
          'Fechar',
          { duration: 5000 },
        );
        this.dialogRef.close();
        return;
      }

      // ✅ Usar o ID correto
      const pacoteResult = await this.fetchPacotesService
        .getPacoteForEdit(pacoteId)
        .toPromise();
      this.pacoteData = pacoteResult ?? null;

      if (!this.pacoteData) {
        throw new Error('Pacote não encontrado');
      }

      this.editForm.patchValue({
        nomePacoteConceitual: this.pacoteData.nome,
        tituloPacoteConceitual: this.pacoteData.titulo,
        host: this.pacoteData.connectionData.host,
        port: this.pacoteData.connectionData.port,
        database: this.pacoteData.connectionData.database,
        schema: this.pacoteData.connectionData.schema,
        user: this.pacoteData.connectionData.user,
        password: this.pacoteData.connectionData.password,
      });

      this.originalData = { ...this.pacoteData.connectionData };
      this.hasDataChanged = false;
      this.isLoading = false;

      console.log(
        `🔐 Admin ${this.data.id} acessou dados para edição do pacote ${this.pacoteData.nome}`,
      );

      this.snackBar.open(
        `🔐 Editando pacote "${this.pacoteData.nome}" - Dados sensíveis carregados`,
        'OK',
        { duration: 3000 },
      );
    } catch (error: any) {
      console.error('❌ Erro ao carregar pacote para edição:', error);
      this.isLoading = false;

      let errorMessage = '❌ Erro ao carregar dados do pacote';
      if (error.status === 403) {
        errorMessage = '🚫 Acesso negado - Apenas administradores';
      } else if (error.status === 404) {
        errorMessage = '📦 Pacote não encontrado';
      }

      this.snackBar.open(errorMessage, 'Fechar', { duration: 5000 });
      this.dialogRef.close();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleOriginalData(): void {
    this.showOriginalData = !this.showOriginalData;
  }

  resetToOriginal(): void {
    if (this.originalData && this.pacoteData) {
      const confirmReset = confirm(
        '⚠️ Deseja restaurar os dados originais? Todas as alterações serão perdidas.',
      );

      if (confirmReset) {
        this.editForm.patchValue({
          nomePacoteConceitual: this.pacoteData.nome,
          tituloPacoteConceitual: this.pacoteData.titulo,
          host: this.originalData.host,
          port: this.originalData.port,
          database: this.originalData.database,
          schema: this.originalData.schema,
          user: this.originalData.user,
          password: this.originalData.password,
        });

        this.hasDataChanged = false;
        this.connectionTestResult = 'none';
        this.snackBar.open(
          '🔄 Dados restaurados para o estado original',
          'OK',
          { duration: 3000 },
        );
      }
    }
  }

  submitPacote(): void {
    if (!this.isAdmin) {
      this.snackBar.open('🚫 Acesso negado', 'Fechar', { duration: 3000 });
      return;
    }

    if (!this.editForm.valid) {
      this.editForm.markAllAsTouched();
      this.snackBar.open('⚠️ Preencha todos os campos corretamente', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    if (!this.hasDataChanged) {
      this.snackBar.open('ℹ️ Nenhuma alteração detectada', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    // ✅ Remover confirmação - apenas submeter
    this.isSubmitting = true;

    const formData = this.editForm.value;
    const updateData = {
      id: this.data.pacoteConceitual.id, // ✅ Corrigir para usar o ID correto
      ...formData,
    };

    console.log(
      `🔐 Admin atualizando pacote conceitual: ${formData.nomePacoteConceitual} em ${new Date()}`,
    );

    this.updatePacoteConceitual.updatePacoteConceitual(updateData).subscribe({
      next: (response) => {
        console.log('✅ Pacote conceitual atualizado com sucesso:', response);
        this.snackBar.open(
          `✅ Pacote "${formData.nomePacoteConceitual}" atualizado com sucesso!`,
          'OK',
          { duration: 3000 },
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('❌ Erro ao atualizar pacote conceitual:', error);
        this.isSubmitting = false;

        let errorMessage = '❌ Erro ao atualizar pacote conceitual';
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
    if (this.hasDataChanged) {
      const confirmExit = confirm(
        '⚠️ Existem alterações não salvas. Deseja realmente sair?',
      );
      if (!confirmExit) {
        return;
      }
    }

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
