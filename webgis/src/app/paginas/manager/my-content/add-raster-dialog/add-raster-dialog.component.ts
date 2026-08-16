import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { NiveisCompartilhamento } from 'src/app/models/niveis.compartilhamento';
import { Tema } from 'src/app/models/temas.model';
import { Grupos } from 'src/app/models/grupo.model';
import { RasterTreeNode } from 'src/app/models/raster-tree-node.model';

import { FetchNivelCompartilhamentoService } from 'src/app/services/api/fetch.nivel.compartilhamento.service';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { CreateCamadasService } from 'src/app/services/api/create.camadas.service';
import { RasterFilesTreeService } from 'src/app/services/api/raster-files-tree.service';
import { RasterPublicationManagerService } from 'src/app/services/api/raster-publication-manager.service';
import { GruposService } from 'src/app/services/api/grupos.service';
import { GetUserPerfilService } from 'src/app/services/api/get.user.perfil.service';
import { ConfirmDialogComponent } from './confirm-save-dialog.component';

interface TreeNodeView extends RasterTreeNode {
  children?: TreeNodeView[];
  loaded?: boolean;
  expanded?: boolean;
  loading?: boolean;
}

@Component({
  selector: 'app-add-raster-dialog',
  templateUrl: './add-raster-dialog.component.html',
  styleUrls: ['./add-raster-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class AddRasterDialogComponent implements OnInit {
  camadaForm!: FormGroup;
  niveisCompartilhamento: NiveisCompartilhamento[] = [];
  temas: Tema[] = [];
  gruposCamadas: Grupos[] = [];

  treeRoots: TreeNodeView[] = [];
  selectedNode: TreeNodeView | null = null;
  searchTerm = '';
  rootLoading = false;
  rootError: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddRasterDialogComponent>,
    public dialog: MatDialog,
    public fetchNivelCompartilhamentoService: FetchNivelCompartilhamentoService,
    public fetchTemasService: FetchTemasService,
    public fetchGrupoCamadasService: FetchGrupoTemaService,
    private fb: FormBuilder,
    private createCamadasService: CreateCamadasService,
    private rasterFilesTree: RasterFilesTreeService,
    private rasterPublicationManager: RasterPublicationManagerService,
    private cdr: ChangeDetectorRef,
    private gruposService: GruposService,
    private getUserPerfilService: GetUserPerfilService,
    private snackBar: MatSnackBar,
  ) {
    this.camadaForm = this.fb.group({
      nivelCompartilhamento: ['', [Validators.required]],
      tema: ['', [Validators.required]],
      grupo: ['', [Validators.required]],
      titulo_camada: ['', [Validators.required]],
      descricao_camada: ['', [Validators.required, Validators.minLength(10)]],
      metadados: [''],
      termos_uso: [''],
      tags: [''],
    });
  }

  ngOnInit(): void {
    this.loadRoot();
    this.fetchTemas();
    this.fetchNiveisCompartilhamento();
  }

  private loadRoot(): void {
    this.rootLoading = true;
    this.rootError = null;
    this.rasterFilesTree.getTree('').subscribe({
      next: (items) => {
        this.treeRoots = items.map((i) => this.toView(i));
        this.rootLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.rootError =
          err?.error?.message ||
          'Não foi possível acessar o repositório raster.';
        this.rootLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  retryRoot(): void {
    this.loadRoot();
  }

  private toView(n: RasterTreeNode): TreeNodeView {
    return { ...n, loaded: false, expanded: false, loading: false };
  }

  toggleNode(node: TreeNodeView): void {
    if (node.type !== 'dir') return;
    if (node.expanded) {
      node.expanded = false;
      return;
    }
    if (node.loaded) {
      node.expanded = true;
      return;
    }
    node.loading = true;
    this.rasterFilesTree.getTree(node.relativePath).subscribe({
      next: (items) => {
        node.children = items.map((i) => this.toView(i));
        node.loaded = true;
        node.expanded = true;
        node.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        node.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  selectNode(node: TreeNodeView): void {
    if (node.type !== 'file') return;
    this.selectedNode = node;
  }

  isVisible(node: TreeNodeView): boolean {
    if (!this.searchTerm) return true;
    const term = this.searchTerm.toLowerCase();
    if (node.name.toLowerCase().includes(term)) return true;
    return (node.children ?? []).some((c) => this.isVisible(c));
  }

  formatSize(bytes?: number): string {
    if (bytes == null) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  fetchTemas(): void {
    this.fetchTemasService.getTemas().subscribe({
      next: (temas: Tema[]) => {
        this.temas = temas;
      },
      error: (e) => console.error('Erro ao buscar temas', e),
    });
  }

  fetchGruposCamadasPorTema(idTema: string): void {
    this.fetchGrupoCamadasService.getGrupo(idTema).subscribe({
      next: (grupos: Grupos[]) => {
        this.getUserPerfilService.getCurrentUser().subscribe({
          next: (user) => {
            if (user.perfil === 'Admin') {
              this.gruposCamadas = grupos;
              return;
            }
            this.gruposService.filtrarGruposPorMembership(grupos).subscribe({
              next: (gruposFiltrados) => (this.gruposCamadas = gruposFiltrados),
              error: () => (this.gruposCamadas = grupos),
            });
          },
          error: () => (this.gruposCamadas = grupos),
        });
      },
      error: (e) => console.error('Erro ao buscar grupos', idTema, e),
    });
  }

  fetchNiveisCompartilhamento(): void {
    this.fetchNivelCompartilhamentoService.getNiveis().subscribe({
      next: (niveis: NiveisCompartilhamento[]) => {
        this.niveisCompartilhamento = niveis;
      },
      error: (e) =>
        console.error('Erro ao buscar níveis de compartilhamento', e),
    });
  }

  onSubmit(): void {
    if (this.camadaForm.invalid || !this.selectedNode) {
      this.camadaForm.markAllAsTouched();
      return;
    }

    if (this.selectedNode.alreadyPublished) {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Confirmação',
          message:
            'Já existe uma camada publicada para este arquivo. Deseja sobrescrever? A camada mantém seus vínculos e o arquivo é republicado no GeoServer.',
          confirmText: 'Sim, sobrescrever',
          cancelText: 'Cancelar',
        },
      });
      ref.afterClosed().subscribe((ok) => {
        if (ok) this.submit(true);
      });
    } else {
      this.submit(false);
    }
  }

  private submit(overwrite: boolean): void {
    const f = this.camadaForm.value;

    const payload = {
      tituloCamada: f.titulo_camada,
      descricaoCamada: f.descricao_camada,
      nivelCompartilhamentoId: f.nivelCompartilhamento,
      grupoCamada: f.grupo,
      linkMetadados: f.metadados,
      termosDeUso: f.termos_uso,
      tags: f.tags,
    };

    const request$ =
      overwrite && this.selectedNode?.camadaId
        ? this.createCamadasService.republicarCamadaRaster(
            this.selectedNode.camadaId,
            payload,
          )
        : this.createCamadasService.createCamadaRaster({
            relativePath: this.selectedNode!.relativePath,
            ...payload,
          });

    request$.subscribe({
      next: ({ camadaId }) => {
        this.rasterPublicationManager.startPolling(camadaId);
        this.dialogRef.close({
          camadaId,
          relativePath: this.selectedNode!.relativePath,
          nome: this.selectedNode!.name.replace(/\.tif$/i, ''),
        });
      },
      error: (error) => {
        console.error('❌ Erro ao publicar raster:', error);
        this.snackBar.open(
          `❌ ${error?.error?.message ?? 'Erro ao publicar a camada raster'}`,
          'Fechar',
          { duration: 6000 },
        );
      },
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
