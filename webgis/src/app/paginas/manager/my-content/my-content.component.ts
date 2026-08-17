import { GetAcessosCamadaRaster } from './../../../services/api/get.acessos.camada.raster.service';
import { MapaService } from 'src/app/services/mapa.service';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FetchFoldersService } from 'src/app/services/api/fetch.folders.service';
import { Folder } from 'src/app/models/folders.camadas.model';
import { catchError } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { Tema } from 'src/app/models/temas.model';
import { MatDialog } from '@angular/material/dialog';
import { AddFolderDialogComponent } from './add-folder-dialog/add-folder-dialog.component';
import { CreateFolderService } from 'src/app/services/api/create.folder.service';
import { DeleteFolderService } from 'src/app/services/api/delete.folder.service';
import { DelFolderDialogComponent } from './del-folder-dialog/del-folder-dialog.component';
import { FormsModule } from '@angular/forms';
import { UpdateFolderService } from 'src/app/services/api/update.folder.service';
import { FetchFoldersContentService } from 'src/app/services/api/fetch.folders.content.service';
import { Camadas } from 'src/app/models/camadas.model';
import { Mapas } from 'src/app/models/mapas.model';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ChangeFolderDialogComponent } from './change-folder-dialog/change-folder-dialog.component';
import { ChangeFolderContentService } from 'src/app/services/api/change.folder.content.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FetchContentUsuarioService } from 'src/app/services/api/fetch.content.usuario.service';
import { ChangeOwnerDialogComponent } from './change-owner-dialog/change-owner-dialog.component';
import { UpdateCamadaOwnerService } from 'src/app/services/api/update.camada.owner.service';
import { DeleteCamadaService } from 'src/app/services/api/delete.camada.service';
import { DelContentDialogComponent } from './del-content-dialog/del-content-dialog.component';
import { EditCamadaDialogComponent } from './edit-camada-dialog/edit-camada-dialog.component';
import { EditAtributosCamadaDialogComponent } from './edit-atributos-camada-dialog/edit-atributos-camada-dialog.component';
import { ActivateCamadaService } from 'src/app/services/api/activate.camada.service';
import { FavoriteContentService } from 'src/app/services/api/favorite.content.service';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { Grupos } from 'src/app/models/grupo.model';
import { CommonModule } from '@angular/common';
import { GetAcessosCamada } from 'src/app/services/api/get.acessos.camada.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AddCamadaDialogComponent } from './add-camada-dialog/add-camada-dialog.component';
import { ContentComponent } from '../content/content.component';
import { AssociateCamadasMapaService } from 'src/app/services/associate.camadas.mapa.service';
import { ManagerMapasService } from 'src/app/services/manager.mapas.service';
import { UpdateMapaOwnerService } from 'src/app/services/api/update.mapa.owner.service';
import { GetAcessosMapa } from 'src/app/services/api/get.acessos.mapa.service';
import { DeleteMapaService } from 'src/app/services/api/delete.mapa.service';
import { FetchBasemapsService } from 'src/app/services/api/fetch.basemaps.service';
import { DeleteBasemapService } from 'src/app/services/api/delete.basemap.service';
import { CreateBasemapService } from 'src/app/services/api/create.basemap.service';
import { Basemap, BasemapUpsertRequest } from 'src/app/models/basemap.model';
import { BasemapService } from 'src/app/services/basemap.service';
import { EditMetadadosMapaComponent } from './edit-metadados-mapa/edit-metadados-mapa.component';
import { AddRasterDialogComponent } from './add-raster-dialog/add-raster-dialog.component';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';
import { RasterPublicationManagerService } from 'src/app/services/api/raster-publication-manager.service';
import { GetConfigService } from 'src/app/services/get.config.service';
import { EditCamadaRasterDialogComponent } from './edit-camada-raster-dialog/edit-camada-raster-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UpdateCamadaService } from 'src/app/services/api/update.camada.service';
import { ThumbnailCacheService } from 'src/app/services/thumbnail-cache.service';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { GrupoAvatarBadgeComponent } from 'src/app/shared/grupo-avatar-badge/grupo-avatar-badge.component';
import { ConfirmDialogComponent } from './add-camada-dialog/confirm-save-dialog.component';

@Component({
  selector: 'app-my-content',
  standalone: true,
  templateUrl: './my-content.component.html',
  styleUrls: ['./my-content.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatTabsModule,
    MatSidenavModule,
    MatListModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltip,
    MatMenuModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    GrupoAvatarBadgeComponent,
  ],
  providers: [
    {
      provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
      useValue: {
        color: '#2e7d32',
      },
    },
  ],
})
export class MyContentComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'carregamentoDefault',
    'titulo',
    'contentType',
    'nivelCompartilhamento',
    'temaGrupo',
    'usrCriacao',
    'acessos',
    'updatedAt',
    'status',
    'acao',
    'favorite',
  ];
  dataSourceFolder: Folder[] = [];
  dataSourceTema: Tema[] = [];
  dataSourceContent = new MatTableDataSource<any>();

  selectedFolder: Folder | null = null;
  isEditingFolder: boolean = false;
  clickedIndex: number = -1;
  folderAtive: Folder | null = null;
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  isSidenavOpened = true;
  selectedTema: string | null = null;
  selectedGrupo: string | null = null;
  dataSourceGrupos: Grupos[] = [];
  isFavoriteFilterActive: boolean = false;
  acessosPorConteudo: { [id: string]: number } = {};
  minVisualizacoes: number | null = 0;
  maxVisualizacoes: number | null = null;
  dataInicio: Date | null = null;
  dataFim: Date | null = null;
  allContent: any[] = [];
  selectedFolderCamadas: Camadas[] = [];
  selectedContentType: string | null = null;
  @Output() mapaSalvo = new EventEmitter<Mapas>();
  thumbnailUrls: Map<string, string> = new Map();
  loading: Map<string, boolean> = new Map();
  rasterProgressMap: Map<
    string,
    {
      progress: number;
      status: string;
      interrupted: boolean;
      seedStatus?: string;
      seedProgress?: number;
    }
  > = new Map();
  private sseConnections: Map<string, EventSource> = new Map();

  constructor(
    private fetchFoldersService: FetchFoldersService,
    private fetchContentUserService: FetchContentUsuarioService,
    private fetchFoldersCamadasService: FetchFoldersContentService,
    private fetchTemasService: FetchTemasService,
    private fetchGruposService: FetchGrupoTemaService,
    private createFoldersService: CreateFolderService,
    private deleteFoldersService: DeleteFolderService,
    private updateFoldersService: UpdateFolderService,
    private changeFolderService: ChangeFolderContentService,
    private updateCamadaOwnerService: UpdateCamadaOwnerService,
    private deleteCamadaService: DeleteCamadaService,
    private activateCamadaService: ActivateCamadaService,
    private favoriteContentService: FavoriteContentService,
    public dialog: MatDialog,
    private getAcessosCamada: GetAcessosCamada,
    private getAcessosCamadaRaster: GetAcessosCamadaRaster,
    private getAcessosMapa: GetAcessosMapa,
    private contentComponent: ContentComponent,
    private associateCamadasMapaService: AssociateCamadasMapaService,
    private managerMapasService: ManagerMapasService,
    private updateMapaOwnerService: UpdateMapaOwnerService,
    private deleteMapaService: DeleteMapaService,
    private fetchBasemapsService: FetchBasemapsService,
    private deleteBasemapService: DeleteBasemapService,
    private createBasemapService: CreateBasemapService,
    private basemapService: BasemapService,
    private mapaService: MapaService,
    private snackBar: MatSnackBar,
    private thumbnailCacheService: ThumbnailCacheService,
    private cdr: ChangeDetectorRef,
    private updateCamadaService: UpdateCamadaService,
    private rasterPublicationManager: RasterPublicationManagerService,
    private getConfigService: GetConfigService,
  ) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.isSidenavOpened = window.innerWidth > 1024;
    }
    this.fetchContent();
    this.fetchFolders();
    this.fetchTemas();
    this.fetchGruposPorTema();
  }

  onToggleCarregamentoDefault(item: any, checked: boolean) {
    const prev = item.carregamentoDefault;
    item.carregamentoDefault = checked;

    // Determine type and call appropriate service
    // Mapas: sem serviço de update genérico no projeto – desabilitado no template
    if (item.tituloMapa) {
      // Should not happen due to [disabled], but guard anyway
      item.carregamentoDefault = prev;
      return;
    }

    const isRaster = item.tipo === 'raster' && item.tituloCamada;
    const isVetorial = item.tipo === 'vetorial' && item.tituloCamada;

    const req$ = isRaster
      ? this.updateCamadaService.updateCamadaRaster({ ...item })
      : isVetorial
        ? this.updateCamadaService.updateCamada({ ...item })
        : of(null);

    req$.subscribe({
      next: () => {
        this.snackBar.open('Carregamento padrão atualizado', '', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snackbar-success'],
        });
        // Atualiza tabela para refletir backend
        this.fetchContent();
      },
      error: () => {
        item.carregamentoDefault = prev; // rollback
        this.snackBar.open('Falha ao atualizar carregamento padrão', '', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snackbar-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }

  ngAfterViewInit() {
    this.dataSourceContent.paginator = this.paginator;
  }

  toggleSidenav() {
    this.isSidenavOpened = !this.isSidenavOpened;
  }

  selectFolder(folder: any, index: number) {
    this.selectedFolder = folder;
    this.clickedIndex = index;
    this.fetchFoldersContent(folder.id);
    this.folderAtive = folder;
  }

  editFolder(folder: Folder): void {
    this.selectedFolder = folder;
    this.isEditingFolder = true;
  }

  saveFolder(folder: any) {
    this.isEditingFolder = false;
    this.updateFolder(folder);
  }

  cancelEditing() {
    this.isEditingFolder = false;
  }

  fetchContent() {
    this.selectedFolder = null;
    forkJoin({
      content: this.fetchContentUserService.getAllContent().pipe(
        catchError((error) => {
          console.error('Erro ao buscar conteúdo:', error);
          return of({ camadas: [], camadasRaster: [], mapas: [] });
        }),
      ),
      basemaps: this.fetchBasemapsService.getBasemaps().pipe(
        catchError((error) => {
          console.error('Erro ao buscar basemaps:', error);
          return of([] as Basemap[]);
        }),
      ),
    }).subscribe(({ content, basemaps }) => {
      const mergedContent = [
        ...content.camadas,
        ...content.camadasRaster,
        ...content.mapas,
      ];

      this.allContent = this.marcarMapasQueSaoBasemap(mergedContent, basemaps);
      this.dataSourceContent.data = this.allContent;

      this.allContent.forEach((item) => {
        this.loadAcessos(
          item.id,
          item.tituloCamada
            ? item.tipo === 'vetorial'
              ? 'camada'
              : 'raster'
            : 'mapa',
        );
      });

      // Observe SSE progress for raster items still publishing
      content.camadasRaster.forEach((raster: CamadasRaster) => {
        if (raster.status === 'publishing') {
          this.watchRasterProgress(raster.id, raster.status);
        }
        // Resume status polling for layers whose GWC seed is still in progress
        if (raster.seedStatus === 'seeding') {
          this.rasterPublicationManager.startPolling(raster.id);
        }
      });
    });
  }

  fetchFolders() {
    this.fetchFoldersService
      .getFolders()
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar pastas:', error);
          return of({ folders: [] });
        }),
      )
      .subscribe((response) => {
        this.dataSourceFolder = response.folders;
      });
  }

  fetchFoldersContent(folderId: string) {
    forkJoin({
      folderContent: this.fetchFoldersCamadasService
        .getFoldersContent(folderId)
        .pipe(
          catchError((error) => {
            console.error('Erro ao buscar conteúdo das pastas:', error);
            return of({ camadas: [], camadasRaster: [], mapas: [] });
          }),
        ),
      basemaps: this.fetchBasemapsService.getBasemaps().pipe(
        catchError((error) => {
          console.error('Erro ao buscar basemaps:', error);
          return of([] as Basemap[]);
        }),
      ),
    }).subscribe(({ folderContent, basemaps }) => {
      const allContent = [
        ...folderContent.camadas,
        ...folderContent.camadasRaster,
        ...folderContent.mapas,
      ];

      const allContentWithBasemap = this.marcarMapasQueSaoBasemap(
        allContent,
        basemaps,
      );

      this.dataSourceContent.data = allContentWithBasemap;
      this.allContent = allContentWithBasemap;
      this.selectedFolderCamadas = folderContent.camadas;
      this.applyFilters();
    });
  }

  private marcarMapasQueSaoBasemap(items: any[], basemaps: Basemap[]): any[] {
    const layersJaCadastradas = new Set(
      basemaps
        .map((b) => (b.wmsParams?.['LAYERS'] as string) ?? '')
        .filter(Boolean),
    );

    return items.map((item) => {
      if (!item?.tituloMapa || !item?.nomeMapa) {
        return item;
      }

      return {
        ...item,
        isBasemap: layersJaCadastradas.has(`content:${item.nomeMapa}`),
      };
    });
  }

  fetchTemas() {
    this.fetchTemasService.getTemas().subscribe(
      (temas) => {
        for (const tema of temas) {
          this.dataSourceTema.push(tema);
        }
      },
      (error) => {
        console.error(error);
      },
    );
  }

  deleteFolder(folderId: string) {
    this.deleteFoldersService.deleteFolder(folderId).subscribe(() => {
      this.fetchFolders();
    });
  }

  updateFolder(folder: Folder) {
    this.updateFoldersService.updateFolder(folder).subscribe(() => {
      this.fetchFolders();
    });
  }

  openAddFolderDialog(): void {
    const dialogRef = this.dialog.open(AddFolderDialogComponent, {
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const folder: Folder = {
          descricao: result,
        };

        this.createFoldersService.createFolder(folder).subscribe(() => {
          this.fetchContent();
          this.fetchFolders();
        });
      }
    });
  }

  openDeleteFolderConfirmDialog(): void {
    const dialogRef = this.dialog.open(DelFolderDialogComponent, {
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.selectedFolder) {
        this.deleteFolder(this.selectedFolder.id as string);
      }
    });
  }

  openChangeFolderDialog(idContent: string, contentType: string): void {
    const dialogRef = this.dialog.open(ChangeFolderDialogComponent, {
      width: '450px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.changeFolderService
          .changeFolderContent(
            contentType,
            idContent,
            result.id,
            this.folderAtive?.id as string,
          )
          .subscribe(() => {
            const folder = this.dataSourceFolder.find(
              (f) => f.id === result.id,
            );
            if (folder) {
              const index = this.dataSourceFolder.indexOf(folder);
              this.selectFolder(folder, index);
            }
          });
      }
    });
  }

  openChangeOwnerDialog(
    idContent: string,
    content: string,
    usrCriacao: string,
  ): void {
    const dialogRef = this.dialog.open(ChangeOwnerDialogComponent, {
      width: '450px',
      data: { usrCriacao: usrCriacao },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (content === 'mapa') {
          this.updateMapaOwnerService
            .changeMapaOwner(idContent, result.id)
            .subscribe(() => {
              this.fetchContent();
            });
        } else if (content === 'vetorial') {
          this.updateCamadaOwnerService
            .changeCamadaOwner(idContent, result.id)
            .subscribe(() => {
              this.fetchContent();
            });
        } else if (content === 'raster') {
          this.updateCamadaOwnerService
            .changeRasterOwner(idContent, result.id)
            .subscribe(() => {
              this.fetchContent();
            });
        }
      }
    });
  }

  aplicarFiltroNome(event: Event) {
    const filtroValor = (event.target as HTMLInputElement).value;
    this.dataSourceContent.filter = filtroValor.trim().toLowerCase();
  }

  openDeleteContentConfirmDialog(item: any, contentType: string): void {
    const idContent: string = item.id;

    if (contentType === 'mapa') {
      this.fetchBasemapsService.getBasemaps().subscribe({
        next: (basemaps: Basemap[]) => {
          const linkedBasemap = this.findLinkedBasemapByMapa(item, basemaps);
          this.abrirDialogConfirmacaoDelete(
            idContent,
            contentType,
            linkedBasemap ?? null,
          );
        },
        error: () => {
          // Se falhar ao buscar basemaps, abre o dialog sem aviso de basemap
          this.abrirDialogConfirmacaoDelete(idContent, contentType, null);
        },
      });
    } else {
      this.abrirDialogConfirmacaoDelete(idContent, contentType, null);
    }
  }

  private abrirDialogConfirmacaoDelete(
    idContent: string,
    contentType: string,
    linkedBasemap: Basemap | null,
  ): void {
    const dialogRef = this.dialog.open(DelContentDialogComponent, {
      width: '450px',
      data: linkedBasemap
        ? { isBasemap: true, basemapNome: linkedBasemap.name }
        : undefined,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (contentType === 'mapa') {
          this.deleteMapaService.deleteMapa(idContent).subscribe(
            () => {
              this.mapaService.requestClearMap();
              this.fetchContent();
              this.managerMapasService.clearMapa();
              if (linkedBasemap) {
                this.deleteBasemapService.delete(linkedBasemap.id).subscribe();
              }
            },
            (error) => {
              this.mostrarDialogErroDelecao(error);
            },
          );
        } else if (contentType === 'vetorial') {
          this.deleteCamadaService.deleteCamada(idContent).subscribe(
            () => {
              this.fetchContent();
            },
            (error) => {
              this.mostrarDialogErroDelecao(error);
            },
          );
        } else if (contentType === 'raster') {
          this.deleteCamadaService.deleteCamadaRaster(idContent).subscribe(
            () => {
              this.fetchContent();
            },
            (error) => {
              this.mostrarDialogErroDelecao(error);
            },
          );
        }
      }
    });
  }

  openGenerateBasemapDialog(mapa: Mapas): void {
    this.fetchBasemapsService.getBasemaps().subscribe({
      next: (basemaps: Basemap[]) => {
        const linkedBasemap = this.findLinkedBasemapByMapa(mapa, basemaps);

        if (linkedBasemap) {
          this.snackBar.open(
            'Este mapa já está cadastrado como basemap.',
            'OK',
            {
              duration: 3000,
            },
          );
          return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '420px',
          data: {
            title: 'Gerar Basemap',
            message:
              'Deseja prosseguir com a geração automática do basemap para este mapa?',
            cancelText: 'Não',
            confirmText: 'Sim',
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (!result) {
            return;
          }

          const payload = this.buildBasemapPayloadFromMapa(mapa);

          this.createBasemapService.createBasemap(payload).subscribe({
            next: () => {
              (mapa as any).isBasemap = true;
              this.dataSourceContent.data = [...this.dataSourceContent.data];
              this.basemapService.notifyBasemapsChanged();
              this.snackBar.open('✅ Basemap gerado com sucesso!', 'OK', {
                duration: 3000,
              });
            },
            error: () => {
              this.snackBar.open('Erro ao gerar basemap.', 'OK', {
                duration: 3000,
              });
            },
          });
        });
      },
      error: () => {
        this.snackBar.open('Erro ao validar basemaps existentes.', 'OK', {
          duration: 3000,
        });
      },
    });
  }

  private buildBasemapPayloadFromMapa(mapa: Mapas): BasemapUpsertRequest {
    const nomeMapa = mapa.nomeMapa;

    return {
      name: mapa.tituloMapa || nomeMapa,
      thumbnail: `/geoserver-proxy/wms?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=&TRANSPARENT=false&LAYERS=content:${nomeMapa}&TILED=true&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&BBOX=-4478751.235341618,-2295251.0853472725,-4478674.798313333,-2295174.6483189873`,
      source: '/geoserver-proxy/wms',
      wmsParams: {
        LAYERS: `content:${nomeMapa}`,
        FORMAT: 'image/png',
        TILED: true,
      },
      order: 0,
      isDefault: false,
      isActive: true,
    };
  }

  private findLinkedBasemapByMapa(
    mapa: Pick<Mapas, 'nomeMapa'>,
    basemaps: Basemap[],
  ): Basemap | undefined {
    return basemaps.find(
      (b) => (b.wmsParams?.['LAYERS'] as string) === `content:${mapa.nomeMapa}`,
    );
  }

  private mostrarDialogErroDelecao(erro: any): void {
    const dialogRef = this.dialog.open(DelContentDialogComponent, {
      width: '500px',
      data: { erro: erro },
    });
  }

  openEditCamadaDialog(camada: Camadas): void {
    const dialogRef = this.dialog.open(EditCamadaDialogComponent, {
      width: '800px',
      data: { camada: camada },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchContent();
      }
    });
  }

  openEditCamadaRasterDialog(camada: Camadas): void {
    const dialogRef = this.dialog.open(EditCamadaRasterDialogComponent, {
      width: '800px',
      data: { camada: camada },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchContent();
      }
    });
  }

  openEditAtributosCamadaDialog(camada: Camadas): void {
    const dialogRef = this.dialog.open(EditAtributosCamadaDialogComponent, {
      width: '1000px',
      data: { camada: camada },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchContent();
      }
    });
  }

  activateCamada(camadaId: string, tipo: string) {
    this.activateCamadaService
      .activateCamada(camadaId, tipo, 'activate')
      .subscribe(() => {
        this.fetchContent();
      });
  }
  deactivateCamada(camadaId: string, tipo: string) {
    this.activateCamadaService
      .activateCamada(camadaId, tipo, 'deactivate')
      .subscribe(() => {
        this.fetchContent();
      });
  }

  toggleFavoriteCamada(camada: Camadas) {
    if (camada.favorito === true) {
      this.favoriteContentService
        .favoriteContent(camada.id, 'vetorial', 'desmarcar')
        .subscribe(() => {
          this.fetchContent();
        });
    } else {
      this.favoriteContentService
        .favoriteContent(camada.id, 'vetorial', 'marcar')
        .subscribe(() => {
          this.fetchContent();
        });
    }
  }

  toggleFavoriteRaster(raster: Camadas) {
    if (raster.favorito === true) {
      this.favoriteContentService
        .favoriteContent(raster.id, 'raster', 'desmarcar')
        .subscribe(() => {
          this.fetchContent();
        });
    } else {
      this.favoriteContentService
        .favoriteContent(raster.id, 'raster', 'marcar')
        .subscribe(() => {
          this.fetchContent();
        });
    }
  }

  toggleFavoriteMapa(mapa: Mapas) {
    if (mapa.favorito === true) {
      this.favoriteContentService
        .favoriteContent(mapa.id, 'mapa', 'desmarcar')
        .subscribe(() => {
          this.fetchContent();
        });
    } else {
      this.favoriteContentService
        .favoriteContent(mapa.id, 'mapa', 'marcar')
        .subscribe(() => {
          this.fetchContent();
        });
    }
  }

  clearFilter() {
    this.selectedTema = null;
    this.selectedGrupo = null;
    this.isFavoriteFilterActive = false;
    this.minVisualizacoes = 0;
    this.maxVisualizacoes = null;
    this.dataInicio = null;
    this.dataFim = null;
    this.applyFilters();
  }

  fetchGruposPorTema(temaId?: string) {
    this.fetchGruposService.getGrupo(temaId).subscribe(
      (grupoCamadasTema) => {
        this.dataSourceGrupos = grupoCamadasTema;
      },
      (error) => {
        console.error('Erro ao buscar grupos:', error);
      },
    );
  }

  toggleFilterByContentType(contentType: string) {
    if (this.selectedContentType === contentType) {
      this.selectedContentType = null;
    } else {
      this.selectedContentType = contentType;
    }
    this.applyFilters();
  }

  clearContentTypeFilter() {
    this.selectedContentType = null;
    this.applyFilters();
  }

  toggleFilterByTema(temaId: string) {
    if (this.selectedTema === temaId) {
      this.selectedTema = null;
      this.fetchGruposPorTema();
    } else {
      this.selectedTema = temaId;
      this.fetchGruposPorTema(temaId);
    }
    this.applyFilters();
  }

  toggleFilterByGrupo(grupoId: string) {
    if (this.selectedGrupo === grupoId) {
      this.selectedGrupo = null;
    } else {
      this.selectedGrupo = grupoId;
    }
    this.applyFilters();
  }

  onGrupoBadgeClick(grupoId: string): void {
    if (this.selectedGrupo !== grupoId) {
      this.selectedTema = null;
      this.fetchGruposPorTema();
    }
    this.toggleFilterByGrupo(grupoId);
  }

  toggleFavoriteFilter() {
    this.isFavoriteFilterActive = !this.isFavoriteFilterActive;

    if (this.isFavoriteFilterActive) {
      this.dataSourceContent.filterPredicate = (camada: Camadas) =>
        camada.favorito === true;
    } else {
      this.dataSourceContent.filterPredicate = () => true;
    }

    this.dataSourceContent.filter = Math.random().toString();
  }

  getAcessos(
    contentId: string,
    contentType: string,
  ): Observable<{ acessos: number }> {
    if (contentType === 'mapa') {
      return this.getAcessosMapa
        .getAcessosMapa(contentId)
        .pipe(catchError(() => of({ acessos: 0 })));
    } else if (contentType === 'camada') {
      return this.getAcessosCamada
        .getAcessosCamada(contentId)
        .pipe(catchError(() => of({ acessos: 0 })));
    } else if (contentType === 'raster') {
      return this.getAcessosCamadaRaster
        .getAcessosCamadaRaster(contentId)
        .pipe(catchError(() => of({ acessos: 0 })));
    }
    return of({ acessos: 0 });
  }

  loadAcessos(contentId: string, contentType: string): void {
    this.getAcessos(contentId, contentType).subscribe((acessos) => {
      this.acessosPorConteudo[contentId] = acessos.acessos;
    });
  }

  filtrarPorVisualizacoes() {
    this.dataSourceContent.filterPredicate = (item: Camadas | Mapas) => {
      const visualizacoes = this.acessosPorConteudo[item.id] || 0;

      const isMinEmpty =
        this.minVisualizacoes === null || this.minVisualizacoes === undefined;
      const isMaxEmpty =
        this.maxVisualizacoes === null || this.maxVisualizacoes === undefined;

      if (isMinEmpty && isMaxEmpty) {
        return true;
      }

      const min: number = isMinEmpty ? 0 : this.minVisualizacoes ?? 0;
      const max: number = isMaxEmpty
        ? Number.POSITIVE_INFINITY
        : this.maxVisualizacoes ?? Number.POSITIVE_INFINITY;

      return visualizacoes >= min && visualizacoes <= max;
    };

    this.dataSourceContent.filter = Math.random().toString();
  }
  filtrarPorData() {
    this.dataSourceContent.filterPredicate = (
      item: Camadas | CamadasRaster | Mapas,
    ) => {
      const dataModificacao = new Date(item.updatedAt);

      const inicioDia = this.dataInicio ? new Date(this.dataInicio) : null;
      if (inicioDia) {
        inicioDia.setHours(0, 0, 0, 0);
      }

      const fimDia = this.dataFim ? new Date(this.dataFim) : null;
      if (fimDia) {
        fimDia.setHours(23, 59, 59, 999);
      }

      const inicioValido =
        (inicioDia ? dataModificacao >= inicioDia : true) &&
        (fimDia ? dataModificacao <= fimDia : true);

      return inicioValido;
    };

    this.dataSourceContent.filter = Math.random().toString();
  }

  applyFilters() {
    let filteredData = this.allContent;

    if (this.selectedContentType) {
      filteredData = filteredData.filter((item) => {
        if (
          this.selectedContentType === 'vetorial' ||
          this.selectedContentType === 'raster'
        ) {
          return item.tipo === this.selectedContentType;
        } else if (this.selectedContentType === 'mapa') {
          return item.tituloMapa;
        }
        return true;
      });
    }

    if (this.selectedTema) {
      filteredData = filteredData.filter(
        (camada: { temaId: string | null }) =>
          camada.temaId === this.selectedTema,
      );
    }

    if (this.selectedGrupo) {
      filteredData = filteredData.filter(
        (item: { grupos?: { id: string }[] }) =>
          (item.grupos ?? []).some((g) => g.id === this.selectedGrupo),
      );
    }

    if (this.isFavoriteFilterActive) {
      filteredData = filteredData.filter(
        (camada: { favorito: any }) => camada.favorito,
      );
    }
    this.dataSourceContent.data = filteredData;
  }

  clearTemaFilters() {
    this.selectedTema = null;
    this.fetchGruposPorTema();
    this.applyFilters();
  }

  clearGrupoFilters() {
    this.selectedGrupo = null;
    this.fetchGruposPorTema();
    this.applyFilters();
  }
  openAddCamadaDialog() {
    const dialogRef = this.dialog.open(AddCamadaDialogComponent, {
      width: '800px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Camada salva com sucesso!', '', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snackbar-success'],
        });
        this.fetchContent();
        this.fetchFolders();
        this.fetchTemas();
        this.fetchGruposPorTema();
      } else if (result === false) {
        this.snackBar.open(
          'Houve um erro ao tentar salvar a camada vetorial!',
          '',
          {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snackbar-error'],
          },
        );
      } else {
        console.log('Usuário cancelou a operação.');
      }
    });
  }

  addLayerToMap(camada: Camadas) {
    this.associateCamadasMapaService.addCamada(camada);
    this.contentComponent.selectTab(2);
  }

  addLayerToMapRaster(camada: CamadasRaster) {
    this.associateCamadasMapaService.addCamadaRaster(camada);
    this.contentComponent.selectTab(2);
  }

  openEditMapaDialog(mapa: Mapas): void {
    this.associateCamadasMapaService.clearCamadas();
    this.managerMapasService.setMapa(mapa);
    const camadas = mapa.camadas;
    const camadasRaster = mapa.camadasRaster;
    camadas.forEach((camada) => {
      this.associateCamadasMapaService.addCamada(camada);
    });
    camadasRaster.forEach((camada) => {
      this.associateCamadasMapaService.addCamadaRaster(camada);
    });
    this.contentComponent.selectTab(2);
  }

  openEditMetadadosMapaDialog(mapa: Mapas): void {
    const dialogRef = this.dialog.open(EditMetadadosMapaComponent, {
      width: '400px',
      data: {
        mapa: mapa,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Mapa salvo com sucesso!', '', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snackbar-success'],
        });
        this.fetchContent();
        this.fetchFolders();
        this.fetchTemas();
        this.fetchGruposPorTema();
      } else {
        this.snackBar.open('Houve um erro ao tentar salvar o mapa!', '', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snackbar-error'],
        });
      }
    });
  }
  openMapAction(): void {
    this.associateCamadasMapaService.clearCamadas();
    this.contentComponent.selectTab(2);
  }

  openAddRasterDialog(): void {
    const dialogRef = this.dialog.open(AddRasterDialogComponent, {
      width: '1120px',
      maxWidth: 'calc(100vw - 32px)',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.camadaId) {
        this.snackBar.open('Camada Raster salva! Upload em andamento...', '', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snackbar-success'],
        });
        // Inicia monitoramento imediato — antes do fetchContent completar
        this.watchRasterProgress(result.camadaId, 'publishing');
        // Preenche o filtro de busca com o nome da camada
        this.dataSourceContent.filter = result.nome.trim().toLowerCase();
        this.fetchContent();
        this.fetchFolders();
        this.fetchTemas();
        this.fetchGruposPorTema();
      } else if (result === false) {
        this.snackBar.open(
          'Houve um erro ao tentar salvar a camada raster!',
          '',
          {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['snackbar-error'],
          },
        );
      } else {
        console.log('Usuário cancelou a operação.');
      }
    });
  }

  getThumbnail(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
  ): string {
    let fullLayerName = `content:${layerName}`;
    if (fonteDadosCamadaRaster) {
      fullLayerName += `_${fonteDadosCamadaRaster}`;
    }

    let bbox = '315476.5,7691027.0,390465.375,7895713.0';
    let width = 768;
    let height = 768;

    if (boundingBox) {
      try {
        const bboxObj = JSON.parse(boundingBox);
        const { minx, miny, maxx, maxy } = bboxObj;
        bbox = `${minx},${miny},${maxx},${maxy}`;

        const bboxWidth = maxx - minx;
        const bboxHeight = maxy - miny;
        const aspectRatio = bboxWidth / bboxHeight;

        if (aspectRatio > 1) {
          width = 768;
          height = Math.round(width / aspectRatio);
        } else {
          height = 768;
          width = Math.round(height * aspectRatio);
        }
      } catch (error) {
        console.error('Failed to parse bounding box:', error);
      }
    }

    const imageUrl = `/geoserver-proxy/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${fullLayerName}&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:31983&styles=&format=image/png`;

    if (!this.thumbnailUrls.has(imageUrl)) {
      this.loading.set(imageUrl, true);
      this.thumbnailCacheService.getThumbnail(imageUrl).subscribe(
        (cachedUrl) => {
          this.thumbnailUrls.set(imageUrl, cachedUrl);
          this.loading.set(imageUrl, false);
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error loading thumbnail:', error);
          this.loading.set(imageUrl, false);
        },
      );
    }

    return this.thumbnailUrls.get(imageUrl) || '';
  }

  rebuildAllThumbnailCaches(): void {
    this.thumbnailCacheService.clearAllCache();

    this.allContent.forEach((item) => {
      if (item.tituloCamada) {
        const imageUrl = this.getThumbnail(
          item.nomeCamada,
          item.boundingBox,
          item.fonteDadosCamadaRaster,
        );

        this.thumbnailCacheService.getThumbnail(imageUrl).subscribe(
          (cachedUrl) => {
            console.log(`Cache reconstruído para ${item.tituloCamada}`);
          },
          (error) => {
            console.error(
              `Erro ao reconstruir cache para ${item.tituloCamada}:`,
              error,
            );
          },
        );
      } else if (item.tituloMapa) {
        const camadas = [
          ...(item.camadas || []),
          ...(item.camadasRaster || []),
        ];

        camadas.forEach((camada) => {
          const layerUrl = this.getThumbnail(
            camada.nomeCamada,
            item.boundingBoxMapa,
            'fonteDadosCamadaRaster' in camada
              ? camada.fonteDadosCamadaRaster
              : undefined,
          );

          this.thumbnailCacheService.getThumbnail(layerUrl).subscribe(
            (cachedUrl) => {
              console.log(
                `Cache reconstruído para camada ${camada.nomeCamada} do mapa ${item.tituloMapa}`,
              );
            },
            (error: any) => {
              console.error(
                `Erro ao reconstruir cache para camada ${camada.nomeCamada} do mapa ${item.tituloMapa}:`,
                error,
              );
            },
          );
        });
      }
    });

    this.snackBar.open('Reconstrução do cache de thumbnails iniciada!', '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-success'],
    });
  }

  getRasterStatus(item: any): string {
    const prog = this.rasterProgressMap.get(item.id);
    if (prog) {
      if (prog.interrupted) {
        // Can resume only if chunks are still on the server (progress < 100)
        return prog.progress < 100 ? 'interrupted' : 'error';
      }
      return prog.status;
    }
    // Fall back to backend status
    const backendStatus = item.status ?? 'published';
    // 'publishing' with no local tracking = interrupted publication = error
    if (backendStatus === 'publishing') return 'error';
    return backendStatus;
  }

  getRasterProgress(item: any): number {
    const prog = this.rasterProgressMap.get(item.id);
    return prog?.progress ?? item.uploadProgress ?? 0;
  }

  getRasterSeedStatus(item: any): string {
    const prog = this.rasterProgressMap.get(item.id);
    return prog?.seedStatus ?? item.seedStatus ?? 'idle';
  }

  getRasterSeedProgress(item: any): number {
    const prog = this.rasterProgressMap.get(item.id);
    return prog?.seedProgress ?? item.seedProgress ?? 0;
  }

  watchRasterProgress(camadaId: string, initialStatus: string): void {
    if (this.sseConnections.has(camadaId)) return;

    const isLocallyActive = this.rasterPublicationManager.isPolling(camadaId);
    const interrupted = !isLocallyActive && initialStatus === 'publishing';

    this.rasterProgressMap.set(camadaId, {
      progress: 0,
      status: initialStatus,
      interrupted,
    });

    const url = this.getConfigService.getUrl(
      `upload-raster/progress/${camadaId}`,
    );
    const es = new EventSource(url);
    this.sseConnections.set(camadaId, es);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        progress: number;
        status: string;
      };
      const current = this.rasterProgressMap.get(camadaId);
      this.rasterProgressMap.set(camadaId, {
        ...data,
        interrupted: current?.interrupted ?? false,
      });
      this.cdr.detectChanges();

      if (data.status === 'published' || data.status === 'error') {
        es.close();
        this.sseConnections.delete(camadaId);
        const item = this.allContent.find((c) => c.id === camadaId);
        if (item) {
          item.status = data.status;
          item.uploadProgress = data.progress;
        }
        this.cdr.detectChanges();
      }
    };

    es.onerror = () => {
      es.close();
      this.sseConnections.delete(camadaId);
    };

    // Watch local progress from RasterPublicationManagerService (clears interrupted flag when active)
    this.rasterPublicationManager.getState$(camadaId).subscribe((state) => {
      if (state.status !== 'unknown') {
        this.rasterProgressMap.set(camadaId, {
          progress: state.progress,
          status: state.status,
          interrupted: false,
          seedStatus: state.seedStatus,
          seedProgress: state.seedProgress,
        });
        this.cdr.detectChanges();
      }
    });
  }

  restartRasterUpload(camadaId: string): void {
    // Reset local state
    this.rasterProgressMap.set(camadaId, {
      progress: 0,
      status: 'publishing',
      interrupted: false,
    });
    // Reconnect SSE if needed
    if (!this.sseConnections.has(camadaId)) {
      this.watchRasterProgress(camadaId, 'publishing');
    }
    this.rasterPublicationManager.startPolling(camadaId);
  }

  resumeRasterUpload(camadaId: string): void {
    const current = this.rasterProgressMap.get(camadaId);
    if (current) {
      this.rasterProgressMap.set(camadaId, { ...current, interrupted: false });
    }
    if (!this.sseConnections.has(camadaId)) {
      this.watchRasterProgress(camadaId, 'publishing');
    }
    this.rasterPublicationManager.startPolling(camadaId);
  }
}
