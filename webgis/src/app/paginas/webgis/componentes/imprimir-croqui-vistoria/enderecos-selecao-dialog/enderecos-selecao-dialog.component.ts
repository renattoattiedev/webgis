import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { debounceTime } from 'rxjs';

import { CroquiEndereco } from 'src/app/models/croqui-endereco.model';

export interface EnderecosSelecaoData {
  registros: CroquiEndereco[];
  preSelecionados?: CroquiEndereco[];
}

@Component({
  selector: 'app-enderecos-selecao-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    DragDropModule,
  ],
  templateUrl: './enderecos-selecao-dialog.component.html',
  styleUrls: ['./enderecos-selecao-dialog.component.scss'],
})
export class EnderecosSelecaoDialogComponent {
  displayedColumns: string[] = [
    'select',
    'matricula',
    'hd',
    'nome',
    'numero',
    'bairro',
  ];
  registros: CroquiEndereco[] = [];
  filtered: CroquiEndereco[] = [];
  selecionados = new Set<string>();
  searchControl = new FormControl('');

  constructor(
    private dialogRef: MatDialogRef<EnderecosSelecaoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EnderecosSelecaoData,
  ) {
    this.registros = data.registros || [];
    this.filtered = this.registros;
    (data.preSelecionados || []).forEach((r) => {
      const key = String(r.matriculaImovel ?? '');
      if (key) this.selecionados.add(key);
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(200))
      .subscribe((term) => {
        const t = (term ?? '').toString().toLowerCase().trim();
        if (!t) {
          this.filtered = this.registros;
          return;
        }
        this.filtered = this.registros.filter(
          (r) =>
            (r.nomeClienteInterno ?? '').toLowerCase().includes(t) ||
            String(r.matriculaImovel ?? '')
              .toLowerCase()
              .includes(t) ||
            (r.bairro ?? '').toLowerCase().includes(t) ||
            (r.logradouro ?? '').toLowerCase().includes(t) ||
            (r.siglaLogradouro ?? '').toLowerCase().includes(t) ||
            String(r.numeroEndereco ?? '')
              .toLowerCase()
              .includes(t),
        );
      });
  }

  getMatricula(r: CroquiEndereco) {
    return r.matriculaImovel ?? '';
  }
  getHd(r: CroquiEndereco) {
    return r.dv ?? '';
  }
  getNome(r: CroquiEndereco) {
    return r.nomeClienteInterno ?? '';
  }
  getLogradouro(r: CroquiEndereco) {
    const sigla = r.siglaLogradouro ? String(r.siglaLogradouro).trim() : '';
    const log = r.logradouro ? String(r.logradouro).trim() : '';
    return `${sigla} ${log}`.trim();
  }
  getNumero(r: CroquiEndereco) {
    return r.numeroEndereco ?? '';
  }
  getBairro(r: CroquiEndereco) {
    return r.bairro ?? '';
  }

  isSelecionado(r: CroquiEndereco) {
    return this.selecionados.has(String(this.getMatricula(r)));
  }
  toggle(r: CroquiEndereco) {
    const key = String(this.getMatricula(r));
    if (this.selecionados.has(key)) this.selecionados.delete(key);
    else this.selecionados.add(key);
  }
  todosSelecionados() {
    return (
      this.filtered.length > 0 &&
      this.filtered.every((r) => this.isSelecionado(r))
    );
  }
  selecionarTodos() {
    if (this.todosSelecionados()) {
      this.filtered.forEach((r) =>
        this.selecionados.delete(String(this.getMatricula(r))),
      );
    } else {
      this.filtered.forEach((r) =>
        this.selecionados.add(String(this.getMatricula(r))),
      );
    }
  }

  confirmar() {
    const selecionados = this.registros.filter((r) => this.isSelecionado(r));
    this.dialogRef.close(selecionados);
  }
  cancelar() {
    this.dialogRef.close([]);
  }
}
