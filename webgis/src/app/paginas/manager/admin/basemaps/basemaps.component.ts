import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, of } from 'rxjs';
import { Basemap, BasemapUpsertRequest } from 'src/app/models/basemap.model';
import { FetchBasemapsService } from 'src/app/services/api/fetch.basemaps.service';
import { BasemapService } from 'src/app/services/basemap.service';
import { UpdateBasemapService } from 'src/app/services/api/update.basemap.service';
import { ThumbnailCacheService } from 'src/app/services/thumbnail-cache.service';
import { AddBasemapDialogComponent } from './add-basemap-dialog/add-basemap-dialog.component';
import { DelBasemapDialogComponent } from './del-basemap-dialog/del-basemap-dialog.component';

@Component({
  selector: 'app-basemaps',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatSlideToggleModule,
  ],
  providers: [
    {
      provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
      useValue: {
        color: '#4DA9E7',
      },
    },
  ],
  templateUrl: './basemaps.component.html',
  styleUrl: './basemaps.component.scss',
})
export class BasemapsComponent implements OnInit {
  isSidenavOpened = false;
  dataSourceBasemaps = new MatTableDataSource<Basemap>();
  thumbnailUrls: Map<string, string> = new Map();
  locallyDeletedBasemapIds = new Set<string>();

  displayedColumns: string[] = [
    'thumbnail',
    'name',
    'order',
    'isDefault',
    'isActive',
    'createdAt',
    'updatedAt',
    'acao',
  ];

  constructor(
    public dialog: MatDialog,
    private fetchBasemapsService: FetchBasemapsService,
    private updateBasemapService: UpdateBasemapService,
    private basemapService: BasemapService,
    private snackBar: MatSnackBar,
    private thumbnailCacheService: ThumbnailCacheService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dataSourceBasemaps.filterPredicate = (
      data: Basemap,
      filter: string,
    ): boolean => data.name.toLowerCase().includes(filter);

    this.fetchBasemaps();
  }

  toggleSidenav() {
    this.isSidenavOpened = !this.isSidenavOpened;
  }

  aplicarFiltroNome(event: Event) {
    const filtroValor = (event.target as HTMLInputElement).value;
    this.dataSourceBasemaps.filter = filtroValor.trim().toLowerCase();
  }

  fetchBasemaps() {
    this.fetchBasemapsService
      .getBasemaps()
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar basemaps:', error);
          return of([]);
        }),
      )
      .subscribe((basemaps: Basemap[]) => {
        const visibleBasemaps = basemaps.filter(
          (basemap) => !this.locallyDeletedBasemapIds.has(basemap.id),
        );

        this.dataSourceBasemaps.data = visibleBasemaps;
        this.syncThumbnailCache(visibleBasemaps);
        visibleBasemaps.forEach((basemap) => {
          if (basemap.thumbnail && !this.thumbnailUrls.has(basemap.thumbnail)) {
            this.thumbnailCacheService
              .getThumbnail(basemap.thumbnail)
              .subscribe({
                next: (cachedUrl) => {
                  this.thumbnailUrls.set(basemap.thumbnail, cachedUrl);
                  this.cdr.detectChanges();
                },
                error: () => {
                  this.thumbnailUrls.set(
                    basemap.thumbnail,
                    'assets/imagens/logo.png',
                  );
                },
              });
          }
        });
      });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddBasemapDialogComponent, {
      width: '720px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('✅ Basemap criado com sucesso!', 'OK', {
          duration: 3000,
        });
      }
      this.fetchBasemaps();
    });
  }

  openDeleteDialog(basemap: Basemap): void {
    const dialogRef = this.dialog.open(DelBasemapDialogComponent, {
      width: '520px',
      data: { basemap },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeBasemapFromTable(basemap);
        this.snackBar.open('✅ Basemap excluído com sucesso!', 'OK', {
          duration: 3000,
        });
      }
      this.fetchBasemaps();
    });
  }

  onToggleActive(basemap: Basemap, event: MatSlideToggleChange): void {
    const previousValue = basemap.isActive;
    const nextValue = event.checked;

    if (previousValue === nextValue) {
      return;
    }

    basemap.isActive = nextValue;
    this.persistBasemapUpdate(
      basemap,
      { isActive: nextValue },
      () => {
        basemap.isActive = previousValue;
      },
      nextValue
        ? '✅ Basemap ativado com sucesso!'
        : '✅ Basemap desativado com sucesso!',
    );
  }

  onToggleDefault(basemap: Basemap, event: MatSlideToggleChange): void {
    const nextValue = event.checked;
    const snapshot = this.dataSourceBasemaps.data.map((item) => ({
      id: item.id,
      isDefault: item.isDefault,
    }));

    this.dataSourceBasemaps.data.forEach((item) => {
      item.isDefault =
        item.id === basemap.id ? nextValue : nextValue ? false : item.isDefault;
    });
    this.cdr.detectChanges();

    const changedBasemaps = this.dataSourceBasemaps.data.filter((item) => {
      const previous = snapshot.find((state) => state.id === item.id);
      return previous ? previous.isDefault !== item.isDefault : false;
    });

    if (changedBasemaps.length === 0) {
      return;
    }

    forkJoin(
      changedBasemaps.map((item) =>
        this.updateBasemapService.updateBasemap(this.buildUpdatePayload(item)),
      ),
    ).subscribe({
      next: () => {
        this.snackBar.open('✅ Basemap padrão atualizado com sucesso!', 'OK', {
          duration: 3000,
        });
        this.basemapService.notifyBasemapsChanged();
        this.fetchBasemaps();
      },
      error: () => {
        snapshot.forEach((state) => {
          const target = this.dataSourceBasemaps.data.find(
            (item) => item.id === state.id,
          );
          if (target) {
            target.isDefault = state.isDefault;
          }
        });
        this.cdr.detectChanges();
        this.snackBar.open(
          '❌ Não foi possível atualizar basemap padrão.',
          'OK',
          { duration: 4000 },
        );
      },
    });
  }

  onOrderEdit(basemap: Basemap, event: Event): void {
    const input = event.target as HTMLInputElement;
    const previousOrder = Number(basemap.order ?? 0);
    const nextOrder = Number(input.value);

    if (!Number.isInteger(nextOrder) || nextOrder < 0) {
      input.value = String(previousOrder);
      this.snackBar.open(
        '❌ Informe uma ordem válida (inteiro maior ou igual a 0).',
        'OK',
        {
          duration: 3500,
        },
      );
      return;
    }

    if (nextOrder === previousOrder) {
      input.value = String(previousOrder);
      return;
    }

    basemap.order = nextOrder;
    this.persistBasemapUpdate(
      basemap,
      { order: nextOrder },
      () => {
        basemap.order = previousOrder;
        input.value = String(previousOrder);
      },
      '✅ Ordem do basemap atualizada com sucesso!',
    );
  }

  private persistBasemapUpdate(
    basemap: Basemap,
    partial: Partial<BasemapUpsertRequest>,
    onErrorRollback: () => void,
    successMessage: string,
  ): void {
    this.updateBasemapService
      .updateBasemap({
        ...this.buildUpdatePayload(basemap),
        ...partial,
      })
      .subscribe({
        next: () => {
          this.snackBar.open(successMessage, 'OK', { duration: 3000 });
          this.basemapService.notifyBasemapsChanged();
          this.fetchBasemaps();
        },
        error: () => {
          onErrorRollback();
          this.cdr.detectChanges();
          this.snackBar.open('❌ Não foi possível atualizar o basemap.', 'OK', {
            duration: 4000,
          });
        },
      });
  }

  private buildUpdatePayload(basemap: Basemap): BasemapUpsertRequest {
    return {
      id: basemap.id,
      name: basemap.name,
      thumbnail: basemap.thumbnail,
      source: basemap.source,
      wmsParams: basemap.wmsParams,
      order: Number(basemap.order ?? 0),
      isDefault: basemap.isDefault,
      isActive: basemap.isActive,
    };
  }

  private removeBasemapFromTable(basemap: Basemap): void {
    this.locallyDeletedBasemapIds.add(basemap.id);
    this.dataSourceBasemaps.data = this.dataSourceBasemaps.data.filter(
      (item) => item.id !== basemap.id,
    );
    if (basemap.thumbnail) {
      this.thumbnailUrls.delete(basemap.thumbnail);
      this.thumbnailCacheService.clearCacheForUrl(basemap.thumbnail);
    }
    this.cdr.detectChanges();
  }

  private syncThumbnailCache(basemaps: Basemap[]): void {
    const activeThumbnails = new Set(
      basemaps.map((basemap) => basemap.thumbnail).filter(Boolean),
    );
    Array.from(this.thumbnailUrls.keys()).forEach((thumbnail) => {
      if (!activeThumbnails.has(thumbnail)) {
        this.thumbnailUrls.delete(thumbnail);
      }
    });
  }
}
