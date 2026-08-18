import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { catchError, of } from 'rxjs';
import { Grupos } from 'src/app/models/grupo.model';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { AddGrupoDialogComponent } from './add-grupo-dialog/add-grupo-dialog.component';
import { EditGrupoDialogComponent } from './edit-grupo-dialog/edit-grupo-dialog.component';
import { DelGrupoDialogComponent } from './del-grupo-dialog/del-grupo-dialog.component';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';

@Component({
  selector: 'app-grupos',
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
  templateUrl: './grupos.component.html',
  styleUrl: './grupos.component.scss',
})
export class GruposComponent implements OnInit {
  isSidenavOpened = false;
  dataSourceGrupoCamadas = new MatTableDataSource<Grupos>();

  displayedColumns: string[] = [
    'grupoNome',
    'temaNome',
    'criadoEm',
    'nomeUsrCriacao',
    'updatedAt',
    'nomeUsrAlteracao',
    'acao',
  ];

  // ─── Mobile (3C) — lista de cards ───────────────────────────────────────
  mobileVisibleCount = 10;
  mobileExpandedDetails = new Set<string>();
  mobileSortSheetOpen = false;
  mobileSortKey: 'titulo' | 'inclusao' | 'alteracao' | null = null;

  constructor(
    public dialog: MatDialog,
    private fetchGrupoCamadasService: FetchGrupoTemaService,
  ) {}

  ngOnInit(): void {
    this.fetchGrupos();
  }

  toggleSidenav() {
    this.isSidenavOpened = !this.isSidenavOpened;
  }

  fetchGrupos() {
    this.fetchGrupoCamadasService
      .getAllGrupos()
      .pipe(
        catchError((error: any) => {
          console.error('Erro ao buscar Grupos:', error);
          return of([]);
        }),
      )
      .subscribe((grupos: Grupos[]) => {
        this.dataSourceGrupoCamadas.data = grupos;
      });
  }

  aplicarFiltroNome(event: Event) {
    const filtroValor = (event.target as HTMLInputElement).value;
    this.dataSourceGrupoCamadas.filter = filtroValor.trim().toLowerCase();
  }

  get mobileRows(): Grupos[] {
    return this.dataSourceGrupoCamadas.filteredData.slice(0, this.mobileVisibleCount);
  }

  get mobileLoadMoreStep(): number {
    return Math.min(10, this.dataSourceGrupoCamadas.filteredData.length - this.mobileVisibleCount);
  }

  loadMoreMobile(): void {
    this.mobileVisibleCount += 10;
  }

  toggleMobileDetails(id: string): void {
    if (this.mobileExpandedDetails.has(id)) {
      this.mobileExpandedDetails.delete(id);
    } else {
      this.mobileExpandedDetails.add(id);
    }
  }

  isMobileDetailsOpen(id: string): boolean {
    return this.mobileExpandedDetails.has(id);
  }

  toggleSortSheet(): void {
    this.mobileSortSheetOpen = !this.mobileSortSheetOpen;
  }

  closeSortSheet(): void {
    this.mobileSortSheetOpen = false;
  }

  applyMobileSort(key: 'titulo' | 'inclusao' | 'alteracao'): void {
    this.mobileSortKey = key;
    const data = [...this.dataSourceGrupoCamadas.data];
    data.sort((a, b) => {
      if (key === 'titulo') return a.grupoNome.localeCompare(b.grupoNome);
      if (key === 'inclusao')
        return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    });
    this.dataSourceGrupoCamadas.data = data;
    this.mobileSortSheetOpen = false;
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddGrupoDialogComponent, {});

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        //teste
      }
      this.fetchGrupos();
    });
  }

  openEditDialog(grupoCamada: Grupos): void {
    const dialogRef = this.dialog.open(EditGrupoDialogComponent, {
      data: { grupoCamada: grupoCamada },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        //teste
      }
      this.fetchGrupos();
    });
  }

  openDeleteDialog(grupoId: string): void {
    const dialogRef = this.dialog.open(DelGrupoDialogComponent, {
      data: grupoId,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dialog.open(InfoDialogComponent, {
          data: { mensagem: result.mensagem },
        });
      }
      this.fetchGrupos();
    });
  }
}
