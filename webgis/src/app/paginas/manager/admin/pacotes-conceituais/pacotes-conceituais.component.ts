import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { FetchPacotesConceituaisService } from 'src/app/services/api/fetch.pacotes.conceituais.service';
import { catchError, of } from 'rxjs';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { EditPacoteConceitualDialogComponent } from './edit.pacote-conceitual.dialog/edit.pacote-conceitual.dialog.component';
import { PacotesConceituais } from 'src/app/models/pacotes-conceituais.model';
import { AddPacoteConceitualDialogComponent } from './add.pacote-conceitual.dialog/add.pacote-conceitual.dialog.component';
import { DelPacoteConceitualDialogComponent } from './del-pacote-conceitual.dialog/del-pacote-conceitual.dialog.component';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar'; // ✅ Importar MatSnackBar também

@Component({
  selector: 'app-pacotes-conceituais',
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
    MatSnackBarModule,
  ],
  templateUrl: './pacotes-conceituais.component.html',
  styleUrl: './pacotes-conceituais.component.scss',
})
export class PacotesConceituaisComponent implements OnInit {
  isSidenavOpened = false;
  dataSourcePacotesConceituais = new MatTableDataSource<PacotesConceituais>();

  displayedColumns: string[] = [
    'tituloPacoteConceitual',
    'nomePacoteConceitual',
    'criadoEm',
    'nomeUsrCriacao',
    'updatedAt',
    'nomeUsrAlteracao',
    'validadoGeoserver',
    'acao',
  ];

  // ─── Mobile (3C) — lista de cards ───────────────────────────────────────
  mobileVisibleCount = 10;
  mobileExpandedDetails = new Set<string>();
  mobileSortSheetOpen = false;
  mobileSortKey: 'titulo' | 'inclusao' | 'alteracao' | null = null;

  constructor(
    private fetchPacotesConceituaisService: FetchPacotesConceituaisService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef, // ✅ Adicionar
  ) {}

  ngOnInit(): void {
    this.fetchPacotesConceituais();
  }

  toggleSidenav() {
    this.isSidenavOpened = !this.isSidenavOpened;
  }

  aplicarFiltroNome(event: Event) {
    const filtroValor = (event.target as HTMLInputElement).value;
    this.dataSourcePacotesConceituais.filter = filtroValor.trim().toLowerCase();
  }

  get mobileRows(): PacotesConceituais[] {
    return this.dataSourcePacotesConceituais.filteredData.slice(0, this.mobileVisibleCount);
  }

  get mobileLoadMoreStep(): number {
    return Math.min(10, this.dataSourcePacotesConceituais.filteredData.length - this.mobileVisibleCount);
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
    const data = [...this.dataSourcePacotesConceituais.data];
    data.sort((a, b) => {
      if (key === 'titulo')
        return a.tituloPacoteConceitual.localeCompare(b.tituloPacoteConceitual);
      if (key === 'inclusao')
        return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    });
    this.dataSourcePacotesConceituais.data = data;
    this.mobileSortSheetOpen = false;
  }

  // Método fetchPacotesConceituais com atualização forçada
  fetchPacotesConceituais() {
    console.log('🔄 === INICIANDO BUSCA DE PACOTES ===');
    console.log(
      '🔄 DataSource atual tem:',
      this.dataSourcePacotesConceituais.data.length,
      'pacotes',
    );

    // ✅ Criar um novo MatTableDataSource para forçar refresh completo
    const oldDataSource = this.dataSourcePacotesConceituais;
    this.dataSourcePacotesConceituais =
      new MatTableDataSource<PacotesConceituais>([]);
    this.cdr.detectChanges();

    this.fetchPacotesConceituaisService
      .getAllPacotes()
      .pipe(
        catchError((error) => {
          console.error('❌ Erro ao buscar Pacotes Conceituais:', error);
          // ✅ Restaurar dataSource em caso de erro
          this.dataSourcePacotesConceituais = oldDataSource;
          this.cdr.detectChanges();
          return of([]);
        }),
      )
      .subscribe((pacotesConceituais: PacotesConceituais[]) => {
        console.log(
          '✅ Pacotes recebidos do servidor:',
          pacotesConceituais.length,
        );
        console.log(
          '🔍 IDs recebidos:',
          pacotesConceituais.map((p) => `${p.id} - ${p.nomePacoteConceitual}`),
        );

        // ✅ Definir dados no novo dataSource
        this.dataSourcePacotesConceituais.data = pacotesConceituais;

        // ✅ Forçar múltiplas detecções de mudança
        this.cdr.markForCheck();
        this.cdr.detectChanges();

        // ✅ Aguardar um tick e forçar novamente
        setTimeout(() => {
          this.cdr.detectChanges();
          console.log(
            '✅ DataSource final tem:',
            this.dataSourcePacotesConceituais.data.length,
            'pacotes',
          );
          console.log('🔄 === ATUALIZAÇÃO COMPLETA ===');
        }, 50);
      });
  }

  openEditDialog(pacoteConceitual: PacotesConceituais): void {
    const dialogRef = this.dialog.open(EditPacoteConceitualDialogComponent, {
      width: '800px',
      height: '620px',
      data: { pacoteConceitual: pacoteConceitual },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // ✅ Adicionar feedback
        this.snackBar.open('✅ Pacote atualizado com sucesso!', 'OK', {
          duration: 3000,
        });
      }
      this.fetchPacotesConceituais();
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddPacoteConceitualDialogComponent, {
      width: '800px',
      height: '620px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // ✅ Adicionar feedback
        this.snackBar.open('✅ Pacote criado com sucesso!', 'OK', {
          duration: 3000,
        });
      }
      this.fetchPacotesConceituais();
    });
  }

  openDeleteDialog(pacoteConceitual: PacotesConceituais): void {
    // ✅ Debug para verificar os dados recebidos
    console.log('🔍 Pacote selecionado para exclusão:', pacoteConceitual);
    console.log('🔍 ID do pacote:', pacoteConceitual?.id);
    console.log('🔍 Nome do pacote:', pacoteConceitual?.nomePacoteConceitual);

    // ✅ Validação dos dados
    if (!pacoteConceitual) {
      console.error('❌ Pacote não fornecido');
      this.snackBar.open('❌ Erro: Dados do pacote não encontrados', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    if (!pacoteConceitual.id) {
      console.error('❌ ID do pacote não encontrado');
      this.snackBar.open('❌ Erro: ID do pacote não encontrado', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    // ✅ Verificar permissões (se existir a propriedade)
    if (
      pacoteConceitual.hasOwnProperty('canEdit') &&
      !pacoteConceitual.canEdit
    ) {
      this.snackBar.open(
        '🚫 Você não tem permissão para excluir este pacote',
        'Fechar',
        { duration: 3000 },
      );
      return;
    }

    const dialogRef = this.dialog.open(DelPacoteConceitualDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        id: pacoteConceitual.id,
        nome:
          pacoteConceitual.nomePacoteConceitual ||
          pacoteConceitual.tituloPacoteConceitual ||
          'Nome não informado',
      },
      disableClose: true,
    });

    console.log('🔍 Dados enviados para o diálogo:', {
      id: pacoteConceitual.id,
      nome: pacoteConceitual.nomePacoteConceitual,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('🔄 Diálogo fechado. Resultado:', result);

      // ✅ Aguardar mais tempo para garantir que o servidor processou
      setTimeout(() => {
        console.log('🔄 Iniciando refresh após exclusão...');
        this.fetchPacotesConceituais();
      }, 1000); // ✅ Aumentar para 1 segundo

      // Tratar mensagens de feedback
      if (result?.success) {
        console.log(`✅ Item ${result.deletedId} foi excluído com sucesso`);
        this.snackBar.open(
          result.message || 'Pacote excluído com sucesso!',
          'OK',
          { duration: 3000 },
        );
      }
    });
  }
}
