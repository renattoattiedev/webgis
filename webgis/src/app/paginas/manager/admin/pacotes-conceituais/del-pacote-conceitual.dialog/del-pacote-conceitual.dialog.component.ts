import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DeletePacoteConceitualService } from 'src/app/services/api/delete.pacote.conceitual.service';

interface DeleteError {
  status: number;
  error: {
    message: string;
    details?: {
      datastore: string;
      publishedLayers: string[];
      layerCount: number;
      action: string;
      reason: string;
    };
  };
}

@Component({
  selector: 'app-del-pacote-conceitual.dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './del-pacote-conceitual.dialog.component.html',
  styleUrl: './del-pacote-conceitual.dialog.component.scss',
})
export class DelPacoteConceitualDialogComponent implements OnInit {
  // Controles de estado
  isDeleting = false;
  deleteBlocked = false;
  hasPublishedLayers = false;
  publishedLayers: string[] = [];
  errorMessage = '';

  // Dados do pacote
  pacoteId: string;
  pacoteNome: string;

  constructor(
    public dialogRef: MatDialogRef<DelPacoteConceitualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string; nome: string },
    private deletePacoteConceitualService: DeletePacoteConceitualService,
    private snackBar: MatSnackBar,
  ) {
    // ✅ Debug dos dados recebidos
    console.log('🔍 Dados RAW recebidos no constructor:', data);
    console.log('🔍 Tipo dos dados:', typeof data);
    console.log('🔍 Keys dos dados:', Object.keys(data || {}));

    // ✅ Acessar diretamente as propriedades
    this.pacoteId = data?.id;
    this.pacoteNome = data?.nome;

    console.log(`🔍 Pacote ID atribuído: ${this.pacoteId}`);
    console.log(`🔍 Pacote Nome atribuído: ${this.pacoteNome}`);

    // ✅ Verificar se os dados foram atribuídos corretamente
    if (!this.pacoteId) {
      console.error('❌ ID do pacote não foi atribuído corretamente!');
      console.error('❌ Data original:', data);
      console.error('❌ data.id:', data?.id);
    }
  }

  ngOnInit(): void {
    console.log('🗑️ Iniciando diálogo de exclusão');
    console.log(`🔍 ID final: ${this.pacoteId}`);
    console.log(`🔍 Nome final: ${this.pacoteNome}`);

    // ✅ Validação no ngOnInit
    if (!this.pacoteId) {
      console.error('❌ ID ainda é undefined no ngOnInit');

      this.errorMessage = 'ID do pacote não foi fornecido';
      this.deleteBlocked = true;

      this.snackBar.open('❌ Erro: ID do pacote não foi fornecido', 'Fechar', {
        duration: 3000,
      });

      // Fechar o diálogo automaticamente
      setTimeout(() => {
        this.dialogRef.close({
          success: false,
          action: 'INVALID_DATA',
          message: 'ID do pacote não fornecido',
        });
      }, 2000);
    }
  }

  excluir(): void {
    // ✅ Debug final antes da exclusão
    console.log(`🗑️ Tentando excluir com ID: ${this.pacoteId}`);
    console.log(`🗑️ Tipo do ID: ${typeof this.pacoteId}`);

    if (!this.pacoteId || this.pacoteId === 'undefined') {
      console.error('❌ ID inválido para exclusão:', this.pacoteId);
      this.snackBar.open('❌ Erro: ID do pacote não é válido', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    if (this.isDeleting) {
      console.warn('⚠️ Exclusão já está em andamento');
      return;
    }

    this.isDeleting = true;
    this.deleteBlocked = false;
    this.errorMessage = '';

    console.log(
      `🗑️ Iniciando exclusão do pacote: ${this.pacoteNome} (ID: ${this.pacoteId})`,
    );

    this.deletePacoteConceitualService.delete(this.pacoteId).subscribe({
      next: (response: { message?: string; details?: any }) => {
        console.log('✅ Pacote excluído com sucesso:', response);

        this.snackBar.open(
          `✅ Pacote "${this.pacoteNome}" excluído com sucesso!`,
          'OK',
          { duration: 3000 },
        );

        // ✅ Garantir que retorna dados estruturados para refresh
        this.dialogRef.close({
          success: true,
          action: 'DELETE_SUCCESS',
          message: `Pacote "${this.pacoteNome}" excluído com sucesso`,
          deletedId: this.pacoteId, // ✅ Incluir ID do item excluído
          deletedName: this.pacoteNome,
        });
      },
      error: (error: any) => {
        console.error('❌ Erro ao excluir:', error);
        this.isDeleting = false;
        this.handleDeleteError(error);
      },
    });
  }

  // Tratamento específico de erros
  private handleDeleteError(error: DeleteError): void {
    if (error.status === 409) {
      // Conflito - Camadas publicadas
      this.handlePublishedLayersError(error);
    } else if (error.status === 403) {
      // Acesso negado
      this.handleForbiddenError();
    } else {
      // Outros erros
      this.handleGenericError(error);
    }
  }

  // Tratar erro de camadas publicadas
  private handlePublishedLayersError(error: DeleteError): void {
    this.deleteBlocked = true;
    this.hasPublishedLayers = true;

    if (error.error.details) {
      this.publishedLayers = error.error.details.publishedLayers || [];
      this.errorMessage = `O datastore possui ${error.error.details.layerCount} camada(s) publicada(s) no GeoServer.`;
    } else {
      this.errorMessage = 'O datastore possui camadas publicadas no GeoServer.';
    }

    console.warn(`🚫 Exclusão bloqueada: ${this.errorMessage}`);

    this.snackBar.open(
      `🚫 Não é possível excluir: O pacote "${this.pacoteNome}" possui camadas publicadas`,
      'Entendi',
      { duration: 5000 },
    );

    // Fechar o diálogo e retornar o estado bloqueado
    this.dialogRef.close({
      success: false,
      action: 'DELETE_BLOCKED',
      message: this.errorMessage,
      publishedLayers: this.publishedLayers,
    });
  }

  // Tratar erro de acesso negado
  private handleForbiddenError(): void {
    this.deleteBlocked = true;
    this.errorMessage =
      'Apenas administradores podem excluir pacotes conceituais.';

    console.warn('🚫 Acesso negado para exclusão');

    this.snackBar.open(
      '🚫 Acesso negado: Apenas administradores podem excluir pacotes',
      'Fechar',
      { duration: 5000 },
    );

    // Fechar automaticamente em caso de acesso negado
    this.dialogRef.close({
      success: false,
      action: 'ACCESS_DENIED',
      message: this.errorMessage,
    });
  }

  // Tratar outros erros
  private handleGenericError(error: DeleteError): void {
    this.deleteBlocked = true;
    this.errorMessage = error.error?.message || 'Erro interno do servidor';

    console.error('❌ Erro genérico:', this.errorMessage);

    this.snackBar.open(
      `❌ Erro ao excluir pacote: ${this.errorMessage}`,
      'Fechar',
      { duration: 5000 },
    );

    // Fechar o diálogo com erro
    this.dialogRef.close({
      success: false,
      action: 'DELETE_ERROR',
      message: this.errorMessage,
    });
  }

  onClose(): void {
    if (this.isDeleting) {
      // ✅ Removido o confirm() - apenas verificar se está deletando
      return; // Impedir fechar durante exclusão
    }

    this.dialogRef.close({
      success: false,
      action: 'CANCELLED',
      message: 'Exclusão cancelada pelo usuário',
    });
  }
}
