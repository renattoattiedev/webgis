import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { AddTemasDialogComponent } from './add-temas-dialog/add-temas-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { catchError, of } from 'rxjs';
import { Tema } from 'src/app/models/temas.model';
import { EditTemasDialogComponent } from './edit-temas-dialog/edit-temas-dialog.component';
import { DelTemasDialogComponent } from './del-temas-dialog/del-temas-dialog.component';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';

@Component({
  selector: 'app-temas',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltip,
    MatMenuModule,
    MatPaginatorModule,
    MatFormField,
    MatInputModule,
  ],
  templateUrl: './temas.component.html',
  styleUrl: './temas.component.scss',
})
export class TemasComponent implements OnInit {
  isSidenavOpened = false;
  dataSourceTema = new MatTableDataSource<Tema>();

  displayedColumns: string[] = [
    'tituloTema',
    'criadoEm',
    'nomeUsrCriacao',
    'updatedAt',
    'nomeUsrAlteracao',
    'acao',
  ];

  constructor(
    public dialog: MatDialog,
    private fetchTemasService: FetchTemasService,
  ) {}

  ngOnInit(): void {
    this.fetchTemas();
  }

  toggleSidenav() {
    this.isSidenavOpened = !this.isSidenavOpened;
  }

  fetchTemas() {
    this.fetchTemasService
      .getTemas()
      .pipe(
        catchError((error: any) => {
          console.error('Erro ao buscar Temas:', error);
          return of([]);
        }),
      )
      .subscribe((tema: Tema[]) => {
        this.dataSourceTema.data = tema;
      });
  }

  aplicarFiltroNome(event: Event) {
    const filtroValor = (event.target as HTMLInputElement).value;
    this.dataSourceTema.filter = filtroValor.trim().toLowerCase();
  }
  openAddDialog() {
    const dialogRef = this.dialog.open(AddTemasDialogComponent, {});

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        //teste
      }
      this.fetchTemas();
    });
  }

  openEditDialog(tema: Tema): void {
    const dialogRef = this.dialog.open(EditTemasDialogComponent, {
      data: { tema: tema },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        //teste
      }
      this.fetchTemas();
    });
  }

  openDeleteDialog(temaId: string): void {
    const dialogRef = this.dialog.open(DelTemasDialogComponent, {
      data: temaId,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dialog.open(InfoDialogComponent, {
          data: { mensagem: result.mensagem },
        });
      }
      this.fetchTemas();
    });
  }
}
