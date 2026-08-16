import { CommonModule } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-del-content-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './del-content-dialog.component.html',
  styleUrl: './del-content-dialog.component.scss',
})
export class DelContentDialogComponent {
  temErro: boolean = false;
  mensagemErro: string = '';
  componentesAssociados: any[] = [];
  isBasemap: boolean = false;
  basemapNome: string = '';

  constructor(
    public dialogRef: MatDialogRef<DelContentDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any,
  ) {
    if (data?.erro) {
      this.temErro = true;
      this.processarErro(data.erro);
    }
    if (data?.isBasemap) {
      this.isBasemap = true;
      this.basemapNome = data.basemapNome ?? '';
    }
  }

  processarErro(erro: any): void {
    console.log('Erro recebido no dialog:', erro);

    // Extrai dados do erro HTTP
    let errorData = null;

    if (erro?.error) {
      errorData = erro.error;
    } else if (erro?.response) {
      errorData = erro.response;
    } else {
      errorData = erro;
    }

    console.log('Dados do erro extraídos:', errorData);

    // Se veio do backend com estrutura específica
    if (errorData?.error === 'CAMADA_ASSOCIADA_A_COMPONENTES') {
      this.componentesAssociados = errorData?.data?.componentes || [];
      this.construirMensagemErroComponentes(errorData?.message);
    } else if (errorData?.message) {
      this.mensagemErro = errorData.message;
    } else if (typeof erro === 'string') {
      this.mensagemErro = erro;
    } else if (erro?.message) {
      this.mensagemErro = erro.message;
    } else {
      this.mensagemErro = 'Erro ao deletar. Tente novamente mais tarde.';
    }
  }

  construirMensagemErroComponentes(messageDoBackend?: string): void {
    if (this.componentesAssociados.length > 0) {
      const nomes = this.componentesAssociados.map((c) => c.nome).join(', ');

      // Usa mensagem do backend ou cria uma customizada
      if (messageDoBackend) {
        this.mensagemErro = messageDoBackend;
      } else {
        this.mensagemErro = `Esta camada está associada ao(s) seguinte(s) componente(s): ${nomes}. `;
      }

      // Adiciona instrução de desassociação
      this.mensagemErro +=
        '\n\nPara deletar esta camada, você precisa primeiro desassociá-la deste(s) componente(s).';
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
