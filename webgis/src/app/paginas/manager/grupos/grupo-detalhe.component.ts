import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { GruposService } from 'src/app/services/api/grupos.service';
import { DeleteGrupoService } from 'src/app/services/api/delete.grupo.service';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { Tema } from 'src/app/models/temas.model';
import {
  GrupoConfigPayload,
  GrupoDetalheInfo,
  GrupoMembroView,
  GrupoOverview,
  ItemConteudoGrupo,
  UsuarioDisponivel,
} from 'src/app/models/grupo-membros.model';
import { ChangeOwnerDialogComponent } from '../my-content/change-owner-dialog/change-owner-dialog.component';
import { EditCamadaDialogComponent } from '../my-content/edit-camada-dialog/edit-camada-dialog.component';
import { EditCamadaRasterDialogComponent } from '../my-content/edit-camada-raster-dialog/edit-camada-raster-dialog.component';
import { EditAtributosCamadaDialogComponent } from '../my-content/edit-atributos-camada-dialog/edit-atributos-camada-dialog.component';
import { EditMetadadosMapaComponent } from '../my-content/edit-metadados-mapa/edit-metadados-mapa.component';
import { UpdateCamadaOwnerService } from 'src/app/services/api/update.camada.owner.service';
import { UpdateMapaOwnerService } from 'src/app/services/api/update.mapa.owner.service';
import { GetUserPerfilService } from 'src/app/services/api/get.user.perfil.service';
import { ThumbnailCacheService } from 'src/app/services/thumbnail-cache.service';
import { DetailsComponent } from '../organization-content/details/details.component';
import { AdicionarItemGrupoDialogComponent } from './adicionar-item-grupo-dialog/adicionar-item-grupo-dialog.component';

type AbaGrupo = 'conteudo' | 'membros' | 'config';

@Component({
  selector: 'app-grupo-detalhe',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    DetailsComponent,
  ],
  templateUrl: './grupo-detalhe.component.html',
  styleUrl: './grupo-detalhe.component.scss',
})
export class GrupoDetalheComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) grupoId!: string;
  @Output() voltar = new EventEmitter<void>();

  grupo: GrupoDetalheInfo | null = null;
  membros: GrupoMembroView[] = [];
  pendentes: GrupoMembroView[] = [];
  conteudo: ItemConteudoGrupo[] = [];
  usuarios: UsuarioDisponivel[] = [];
  temas: Tema[] = [];
  grupos: GrupoOverview[] = [];

  abaAtiva: AbaGrupo = 'conteudo';
  carregando = true;
  salvandoConfig = false;
  novoMembroId = '';

  config: GrupoConfigPayload = {};

  excluindoGrupo = false;

  mostrarMoverItens = false;
  grupoDestinoMoverItens = '';
  movendoItens = false;

  isAdmin = false;

  private readonly THUMBNAIL_WIDTH = 800;
  private readonly THUMBNAIL_HEIGHT = 600;

  thumbnailUrls: Map<string, string> = new Map();
  loading: Map<string, boolean> = new Map();
  thumbnailErrors: Map<string, boolean> = new Map();

  selectedContent: ItemConteudoGrupo | null = null;
  isRightSidenavOpened = false;

  private intersectionObserver!: IntersectionObserver;
  private loadingQueue: string[] = [];
  private activeRequests = 0;
  private readonly MAX_CONCURRENT_REQUESTS = 4;
  private loadedItems = new Set<string>();

  constructor(
    private gruposService: GruposService,
    private deleteGrupoService: DeleteGrupoService,
    private snackBar: MatSnackBar,
    private fetchTemasService: FetchTemasService,
    private dialog: MatDialog,
    private updateCamadaOwnerService: UpdateCamadaOwnerService,
    private updateMapaOwnerService: UpdateMapaOwnerService,
    private getUserPerfilService: GetUserPerfilService,
    private thumbnailCacheService: ThumbnailCacheService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.carregarTudo();
    this.fetchTemasService.getTemas().subscribe({
      next: (temas) => (this.temas = temas),
      error: (error) => console.error('❌ Erro ao carregar temas:', error),
    });
    this.gruposService.fetchOverview().subscribe({
      next: (res) => (this.grupos = res.grupos),
      error: (error) => console.error('❌ Erro ao carregar grupos:', error),
    });
    this.getUserPerfilService.getCurrentUser().subscribe({
      next: (user) => (this.isAdmin = user.perfil === 'Admin'),
      error: (error) =>
        console.error('❌ Erro ao carregar usuário atual:', error),
    });
    this.setupIntersectionObserver();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.observeThumbnailContainers();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.loadingQueue = [];
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  carregarTudo(): void {
    this.carregando = true;
    this.gruposService.getGrupo(this.grupoId).subscribe({
      next: (res) => {
        this.grupo = res.grupo;
        this.membros = res.membros;
        this.pendentes = res.pendentes;
        this.config = {
          visibilidade: res.grupo.visibilidade,
          politicaParticipacao: res.grupo.politicaParticipacao,
          membrosContribuem: res.grupo.membrosContribuem,
          donoId: res.grupo.donoId,
          nome: res.grupo.nome,
          temaId: res.grupo.temaId,
        };
        this.carregando = false;
        if (!res.grupo.podeGerenciar && this.abaAtiva === 'config') {
          this.abaAtiva = 'conteudo';
        }
        if (res.grupo.podeGerenciar) {
          this.carregarUsuarios();
        }
      },
      error: (error) => {
        console.error('❌ Erro ao carregar grupo:', error);
        this.carregando = false;
        this.voltar.emit();
      },
    });

    this.gruposService.fetchConteudoGrupo(this.grupoId).subscribe({
      next: (res) => {
        this.conteudo = [
          ...res.camadas.map((c: any) => ({ ...c, tipo: 'vetorial' as const })),
          ...res.camadasRaster.map((c: any) => ({
            ...c,
            tipo: 'raster' as const,
          })),
          ...res.mapas.map((m: any) => ({ ...m, tipo: 'mapa' as const })),
        ];
        setTimeout(() => this.observeThumbnailContainers(), 500);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar conteúdo do grupo:', error);
      },
    });
  }

  carregarUsuarios(): void {
    this.gruposService.fetchUsuariosDisponiveis().subscribe({
      next: (res) => (this.usuarios = res.usuarios),
      error: (error) => console.error('❌ Erro ao carregar usuários:', error),
    });
  }

  get usuariosDisponiveis(): UsuarioDisponivel[] {
    const jaNoGrupo = new Set([
      ...this.membros.map((m) => m.userId),
      ...this.pendentes.map((m) => m.userId),
      this.grupo?.donoId ?? '',
    ]);
    return this.usuarios.filter((u) => !jaNoGrupo.has(u.id));
  }

  get membrosParaTransferenciaDono(): GrupoMembroView[] {
    return this.membros.filter((m) => m.userId !== this.grupo?.donoId);
  }

  selecionarAba(aba: AbaGrupo): void {
    this.abaAtiva = aba;
  }

  adicionarMembro(): void {
    if (!this.novoMembroId) return;
    this.gruposService.addMembro(this.grupoId, this.novoMembroId).subscribe({
      next: () => {
        this.snackBar.open('✔ Membro adicionado', 'Fechar', {
          duration: 3000,
        });
        this.novoMembroId = '';
        this.carregarTudo();
      },
      error: (error) => {
        console.error('❌ Erro ao adicionar membro:', error);
        this.snackBar.open('❌ Erro ao adicionar membro', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  removerMembro(membro: GrupoMembroView): void {
    this.gruposService.removeMembro(this.grupoId, membro.userId).subscribe({
      next: () => {
        this.snackBar.open('✔ Membro removido', 'Fechar', { duration: 3000 });
        this.carregarTudo();
      },
      error: (error) => {
        console.error('❌ Erro ao remover membro:', error);
        this.snackBar.open('❌ Erro ao remover membro', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  responder(pendente: GrupoMembroView, aprovar: boolean): void {
    this.gruposService
      .responderSolicitacao(this.grupoId, pendente.userId, aprovar)
      .subscribe({
        next: () => {
          this.snackBar.open(
            aprovar ? '✔ Solicitação aprovada' : '✔ Solicitação recusada',
            'Fechar',
            { duration: 3000 },
          );
          this.carregarTudo();
        },
        error: (error) => {
          console.error('❌ Erro ao responder solicitação:', error);
          this.snackBar.open('❌ Erro ao responder solicitação', 'Fechar', {
            duration: 4000,
          });
        },
      });
  }

  participar(): void {
    this.gruposService.participar(this.grupoId).subscribe({
      next: () => {
        this.snackBar.open('✔ Você entrou no grupo', 'Fechar', {
          duration: 3000,
        });
        this.carregarTudo();
      },
      error: (error) => {
        console.error('❌ Erro ao participar do grupo:', error);
        this.snackBar.open('❌ Erro ao entrar no grupo', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  solicitar(): void {
    this.gruposService.solicitarParticipacao(this.grupoId).subscribe({
      next: () => {
        this.snackBar.open('✔ Solicitação enviada', 'Fechar', {
          duration: 3000,
        });
        this.carregarTudo();
      },
      error: (error) => {
        console.error('❌ Erro ao solicitar participação:', error);
        this.snackBar.open('❌ Erro ao enviar solicitação', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  sairDoGrupo(): void {
    this.gruposService.sair(this.grupoId).subscribe({
      next: () => {
        this.snackBar.open('✔ Você saiu do grupo', 'Fechar', {
          duration: 3000,
        });
        this.voltar.emit();
      },
      error: (error) => {
        console.error('❌ Erro ao sair do grupo:', error);
        this.snackBar.open('❌ Erro ao sair do grupo', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  excluirGrupo(): void {
    if (!this.grupo) return;

    if (this.grupo.qtdItens > 0) {
      this.mostrarMoverItens = true;
      return;
    }

    this.confirmarExclusao();
  }

  private confirmarExclusao(): void {
    if (!this.grupo) return;
    const confirmado = confirm(
      `Excluir o grupo "${this.grupo.nome}"? Essa ação não pode ser desfeita.`,
    );
    if (!confirmado) return;

    this.excluindoGrupo = true;
    this.deleteGrupoService.delete(this.grupoId).subscribe({
      next: () => {
        this.excluindoGrupo = false;
        this.snackBar.open('✔ Grupo excluído', 'Fechar', { duration: 3000 });
        this.voltar.emit();
      },
      error: (error) => {
        console.error('❌ Erro ao excluir grupo:', error);
        this.excluindoGrupo = false;
        this.snackBar.open('❌ Erro ao excluir grupo', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  moverItensEExcluir(): void {
    if (!this.grupoDestinoMoverItens) return;
    this.movendoItens = true;
    this.gruposService
      .moverItens(this.grupoId, this.grupoDestinoMoverItens)
      .subscribe({
        next: () => {
          this.movendoItens = false;
          this.mostrarMoverItens = false;
          this.snackBar.open('✔ Itens movidos', 'Fechar', { duration: 3000 });
          this.carregarTudo();
          this.confirmarExclusao();
        },
        error: (error) => {
          console.error('❌ Erro ao mover itens:', error);
          this.movendoItens = false;
          this.snackBar.open('❌ Erro ao mover itens', 'Fechar', {
            duration: 4000,
          });
        },
      });
  }

  cancelarMoverItens(): void {
    this.mostrarMoverItens = false;
    this.grupoDestinoMoverItens = '';
  }

  salvarConfig(): void {
    this.salvandoConfig = true;
    this.gruposService.updateConfig(this.grupoId, this.config).subscribe({
      next: () => {
        this.salvandoConfig = false;
        this.snackBar.open('✔ Configurações salvas', 'Fechar', {
          duration: 3000,
        });
        this.carregarTudo();
      },
      error: (error) => {
        console.error('❌ Erro ao salvar configurações:', error);
        this.salvandoConfig = false;
        this.snackBar.open('❌ Erro ao salvar configurações', 'Fechar', {
          duration: 4000,
        });
      },
    });
  }

  iniciais(nome: string): string {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('');
  }

  nomeItem(item: ItemConteudoGrupo): string {
    return (
      item.tituloCamada ||
      item.tituloMapa ||
      item.nomeCamada ||
      item.nomeMapa ||
      ''
    );
  }

  private recarregarConteudo(): void {
    this.gruposService.fetchConteudoGrupo(this.grupoId).subscribe({
      next: (res) => {
        this.conteudo = [
          ...res.camadas.map((c: any) => ({ ...c, tipo: 'vetorial' as const })),
          ...res.camadasRaster.map((c: any) => ({
            ...c,
            tipo: 'raster' as const,
          })),
          ...res.mapas.map((m: any) => ({ ...m, tipo: 'mapa' as const })),
        ];
        setTimeout(() => this.observeThumbnailContainers(), 500);
      },
      error: (error) => console.error('❌ Erro ao recarregar conteúdo:', error),
    });
  }

  get podeAdicionarItens(): boolean {
    return (
      this.isAdmin ||
      this.grupo?.membership === 'dono' ||
      (this.grupo?.membership === 'membro' && !!this.grupo?.membrosContribuem)
    );
  }

  private tipoBackend(item: ItemConteudoGrupo): 'camada' | 'raster' | 'mapa' {
    if (item.tipo === 'vetorial') return 'camada';
    if (item.tipo === 'raster') return 'raster';
    return 'mapa';
  }

  podeDesvincular(item: ItemConteudoGrupo): boolean {
    return !item.vinculoPrimario && this.podeAdicionarItens;
  }

  removerItemDoGrupo(item: ItemConteudoGrupo): void {
    this.gruposService
      .removerItem(this.grupoId, this.tipoBackend(item), item.id)
      .subscribe({
        next: () => {
          this.snackBar.open('✔ Item removido deste grupo', 'Fechar', {
            duration: 3000,
          });
          this.recarregarConteudo();
        },
        error: (error) => {
          console.error('❌ Erro ao remover item do grupo:', error);
          this.snackBar.open('❌ Erro ao remover item do grupo', 'Fechar', {
            duration: 4000,
          });
        },
      });
  }

  abrirAdicionarItemDialog(): void {
    const dialogRef = this.dialog.open(AdicionarItemGrupoDialogComponent, {
      width: '520px',
      data: { grupoId: this.grupoId },
    });
    dialogRef
      .afterClosed()
      .subscribe(
        (
          result:
            | { tipo: 'camada' | 'raster' | 'mapa'; itemId: string }
            | undefined,
        ) => {
          if (!result) return;
          this.gruposService
            .adicionarItem(this.grupoId, result.tipo, result.itemId)
            .subscribe({
              next: () => {
                this.snackBar.open('✔ Item adicionado ao grupo', 'Fechar', {
                  duration: 3000,
                });
                this.recarregarConteudo();
              },
              error: (error) => {
                console.error('❌ Erro ao adicionar item ao grupo:', error);
                this.snackBar.open(
                  '❌ Erro ao adicionar item ao grupo',
                  'Fechar',
                  { duration: 4000 },
                );
              },
            });
        },
      );
  }

  openChangeOwnerDialog(item: ItemConteudoGrupo): void {
    const dialogRef = this.dialog.open(ChangeOwnerDialogComponent, {
      width: '450px',
      data: { usrCriacao: item.usrCriacao },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      if (item.tipo === 'mapa') {
        this.updateMapaOwnerService
          .changeMapaOwner(item.id, result.id)
          .subscribe(() => this.recarregarConteudo());
      } else if (item.tipo === 'vetorial') {
        this.updateCamadaOwnerService
          .changeCamadaOwner(item.id, result.id)
          .subscribe(() => this.recarregarConteudo());
      } else {
        this.updateCamadaOwnerService
          .changeRasterOwner(item.id, result.id)
          .subscribe(() => this.recarregarConteudo());
      }
    });
  }

  openEditCamadaDialog(item: ItemConteudoGrupo): void {
    const dialogRef = this.dialog.open(EditCamadaDialogComponent, {
      width: '800px',
      data: { camada: item },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.recarregarConteudo();
    });
  }

  openEditCamadaRasterDialog(item: ItemConteudoGrupo): void {
    const dialogRef = this.dialog.open(EditCamadaRasterDialogComponent, {
      width: '800px',
      data: { camada: item },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.recarregarConteudo();
    });
  }

  openEditAtributosCamadaDialog(item: ItemConteudoGrupo): void {
    const dialogRef = this.dialog.open(EditAtributosCamadaDialogComponent, {
      width: '1000px',
      data: { camada: item },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.recarregarConteudo();
    });
  }

  openEditMetadadosMapaDialog(item: ItemConteudoGrupo): void {
    const dialogRef = this.dialog.open(EditMetadadosMapaComponent, {
      width: '400px',
      data: { mapa: item as any },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.recarregarConteudo();
    });
  }

  labelItens(grupo: GrupoDetalheInfo): string {
    return grupo.qtdItensVisiveis === grupo.qtdItens
      ? `${grupo.qtdItens} itens`
      : `${grupo.qtdItensVisiveis} de ${grupo.qtdItens} itens`;
  }

  get gruposDestinoMoverItens(): GrupoOverview[] {
    if (!this.grupo) return [];
    return this.grupos.filter(
      (g) =>
        g.temaId === this.grupo!.temaId &&
        g.id !== this.grupo!.id &&
        (this.isAdmin || g.membership === 'dono' || g.membership === 'membro'),
    );
  }

  get temaAtualAusenteDaLista(): boolean {
    return !!this.grupo && !this.temas.some((t) => t.id === this.grupo!.temaId);
  }

  private getThumbnailDimensions(boundingBox?: string): {
    bbox: string;
    width: number;
    height: number;
  } {
    let bbox = '315476.5,7691027.0,390465.375,7895713.0';
    const width = this.THUMBNAIL_WIDTH;
    const height = this.THUMBNAIL_HEIGHT;

    if (boundingBox) {
      try {
        const bboxObj = JSON.parse(boundingBox);
        let minx = Number(bboxObj.minx);
        let miny = Number(bboxObj.miny);
        let maxx = Number(bboxObj.maxx);
        let maxy = Number(bboxObj.maxy);

        const bboxWidth = maxx - minx;
        const bboxHeight = maxy - miny;

        if (bboxWidth > 0 && bboxHeight > 0) {
          const targetAspectRatio = width / height;
          const bboxAspectRatio = bboxWidth / bboxHeight;

          if (bboxAspectRatio > targetAspectRatio) {
            const adjustedHeight = bboxWidth / targetAspectRatio;
            const padding = (adjustedHeight - bboxHeight) / 2;
            miny -= padding;
            maxy += padding;
          } else {
            const adjustedWidth = bboxHeight * targetAspectRatio;
            const padding = (adjustedWidth - bboxWidth) / 2;
            minx -= padding;
            maxx += padding;
          }

          bbox = `${minx},${miny},${maxx},${maxy}`;
        }
      } catch (error) {
        console.error('Failed to parse bounding box:', error);
      }
    }

    return { bbox, width, height };
  }

  private getCompositeLayersParam(compositeMap: ItemConteudoGrupo): string {
    const allLayers = [
      ...((compositeMap as any).camadas || []),
      ...((compositeMap as any).camadasRaster || []),
    ];

    return [...allLayers]
      .sort((a, b) => (b.ordemRenderizacao ?? 0) - (a.ordemRenderizacao ?? 0))
      .map((layer) => {
        const baseName = `content:${layer.nomeCamada}`;
        if ('fonteDadosCamadaRaster' in layer && layer.fonteDadosCamadaRaster) {
          return `${baseName}_${layer.fonteDadosCamadaRaster}`;
        }
        return baseName;
      })
      .join(',');
  }

  private getThumbnailUrl(item: ItemConteudoGrupo): string {
    try {
      if (item.tipo === 'mapa') {
        return this.getThumbnail(
          undefined,
          (item as any).boundingBoxMapa,
          undefined,
          item,
        );
      }

      return this.getThumbnail(
        (item as any).nomeCamada,
        (item as any).boundingBox,
        (item as any).fonteDadosCamadaRaster,
      );
    } catch (error) {
      console.warn(`Error generating thumbnail URL for item:`, item.id, error);
      return '';
    }
  }

  getThumbnail(
    layerName?: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    compositeMap?: ItemConteudoGrupo,
  ): string {
    if (compositeMap) {
      const { bbox, width, height } = this.getThumbnailDimensions(boundingBox);
      const layersString = this.getCompositeLayersParam(compositeMap);
      return `/geoserver-proxy/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${layersString}&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:31984&styles=&format=image/png&transparent=true`;
    }

    if (!layerName) {
      return '';
    }

    let fullLayerName = `content:${layerName}`;
    if (fonteDadosCamadaRaster) {
      fullLayerName += `_${fonteDadosCamadaRaster}`;
      return `/geoserver-proxy/content/wms/reflect?layers=${encodeURIComponent(fullLayerName)}&format=image/png&width=${this.THUMBNAIL_WIDTH}&height=${this.THUMBNAIL_HEIGHT}`;
    }

    const { bbox, width, height } = this.getThumbnailDimensions(boundingBox);
    return `/geoserver-proxy/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${fullLayerName}&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:31984&styles=&format=image/png&transparent=true`;
  }

  getItemId(item: ItemConteudoGrupo): string {
    if (item.tipo === 'mapa') {
      return `${item.id}|${item.nomeMapa || ''}|${(item as any).boundingBoxMapa || ''}|${this.getCompositeLayersParam(item)}`;
    }
    return `${item.id}|${item.nomeCamada || ''}|${(item as any).boundingBox || ''}|${(item as any).fonteDadosCamadaRaster || ''}`;
  }

  trackByItemId = (index: number, item: ItemConteudoGrupo): string => {
    return this.getItemId(item);
  };

  private setupIntersectionObserver(): void {
    if (!window.IntersectionObserver) {
      console.warn(
        'Intersection Observer not supported. Loading first few thumbnails.',
      );
      this.loadFirstThumbnails();
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const itemId = element.getAttribute('data-item-id');
            if (itemId && !this.loadedItems.has(itemId)) {
              this.loadedItems.add(itemId);
              this.loadThumbnailForItem(itemId);
              this.intersectionObserver.unobserve(element);
            }
          }
        });
      },
      { rootMargin: '100px 0px', threshold: 0.1 },
    );
  }

  private loadFirstThumbnails(): void {
    this.conteudo.slice(0, 8).forEach((item) => {
      const itemId = this.getItemId(item);
      if (!this.loadedItems.has(itemId)) {
        this.loadedItems.add(itemId);
        this.loadThumbnailForItem(itemId);
      }
    });
  }

  private loadThumbnailForItem(itemId: string): void {
    try {
      const item = this.conteudo.find((c) => this.getItemId(c) === itemId);
      if (item) {
        const thumbnailUrl = this.getThumbnailUrl(item);
        if (thumbnailUrl) {
          this.queueThumbnailLoad(thumbnailUrl);
        }
      }
    } catch (error) {
      console.warn(`Error in loadThumbnailForItem for ${itemId}:`, error);
    }
  }

  private startObservingThumbnails(): void {
    if (!this.intersectionObserver) return;
    const thumbnailContainers = document.querySelectorAll(
      '.gd-thumb[data-item-id]',
    );
    thumbnailContainers.forEach((element) => {
      const itemId = element.getAttribute('data-item-id');
      if (itemId && !this.loadedItems.has(itemId)) {
        this.intersectionObserver.observe(element);
      }
    });
  }

  private observeThumbnailContainers(): void {
    this.startObservingThumbnails();
  }

  private queueThumbnailLoad(imageUrl: string): void {
    try {
      if (this.thumbnailUrls.has(imageUrl) || this.loading.get(imageUrl)) {
        return;
      }
      this.loading.set(imageUrl, true);
      this.loadingQueue.push(imageUrl);
      this.processQueue();
    } catch (error) {
      console.warn('Error queueing thumbnail load:', error);
    }
  }

  private startThumbnailLoad(imageUrl: string): void {
    this.activeRequests++;
    this.thumbnailCacheService.getThumbnail(imageUrl).subscribe({
      next: (cachedUrl: string) => {
        this.thumbnailUrls.set(imageUrl, cachedUrl);
        this.loading.set(imageUrl, false);
        this.activeRequests--;
        this.changeDetectorRef.detectChanges();
        this.processQueue();
      },
      error: (error: any) => {
        console.warn('Failed to load thumbnail, continuing with next:', error);
        this.loading.set(imageUrl, false);
        this.thumbnailErrors.set(imageUrl, true);
        this.activeRequests--;
        this.processQueue();
      },
    });
  }

  private processQueue(): void {
    try {
      while (
        this.loadingQueue.length > 0 &&
        this.activeRequests < this.MAX_CONCURRENT_REQUESTS
      ) {
        const nextUrl = this.loadingQueue.shift();
        if (nextUrl) {
          try {
            this.startThumbnailLoad(nextUrl);
          } catch (error) {
            console.warn(
              `Error starting thumbnail load for ${nextUrl}, trying next:`,
              error,
            );
            continue;
          }
        }
      }
    } catch (error) {
      console.warn('Error processing thumbnail queue:', error);
    }
  }

  getThumbnailUrlOptimized(item: ItemConteudoGrupo): string {
    const imageUrl = this.getThumbnailUrl(item);
    return this.thumbnailUrls.get(imageUrl) || '';
  }

  isThumbnailLoading(item: ItemConteudoGrupo): boolean {
    const imageUrl = this.getThumbnailUrl(item);
    return this.loading.get(imageUrl) || false;
  }

  onImageLoad(item: ItemConteudoGrupo): void {
    const imageUrl = this.getThumbnailUrl(item);
    this.loading.set(imageUrl, false);
  }

  onImageError(item: ItemConteudoGrupo): void {
    const imageUrl = this.getThumbnailUrl(item);
    this.loading.set(imageUrl, false);
    this.thumbnailErrors.set(imageUrl, true);
  }

  hasThumbnailError(item: ItemConteudoGrupo): boolean {
    const imageUrl = this.getThumbnailUrl(item);
    return this.thumbnailErrors.get(imageUrl) || false;
  }

  reloadThumbnail(item: ItemConteudoGrupo): void {
    const imageUrl = this.getThumbnailUrl(item);
    this.loading.set(imageUrl, true);
    this.thumbnailErrors.delete(imageUrl);

    this.thumbnailCacheService.reloadThumbnail(imageUrl).subscribe({
      next: (cachedUrl) => {
        this.thumbnailUrls.set(imageUrl, cachedUrl);
        this.loading.set(imageUrl, false);
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error reloading thumbnail:', error);
        this.loading.set(imageUrl, false);
        this.thumbnailErrors.set(imageUrl, true);
      },
    });
  }

  reloadCompositeMapThumbnail(item: ItemConteudoGrupo): void {
    const imageUrl = this.getThumbnailUrl(item);
    this.thumbnailUrls.delete(imageUrl);
    this.loading.delete(imageUrl);
    this.thumbnailErrors.delete(imageUrl);
    this.thumbnailCacheService.clearCacheForUrl(imageUrl);

    this.loading.set(imageUrl, true);
    this.thumbnailCacheService.getThumbnail(imageUrl).subscribe({
      next: (cachedUrl) => {
        this.thumbnailUrls.set(imageUrl, cachedUrl);
        this.loading.set(imageUrl, false);
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao recarregar thumbnail:', error);
        this.loading.set(imageUrl, false);
        this.thumbnailErrors.set(imageUrl, true);
      },
    });
  }

  toggleRightSidenav(item: ItemConteudoGrupo): void {
    const isSameContent = this.selectedContent?.id === item.id;
    this.selectedContent = item;
    this.isRightSidenavOpened = isSameContent
      ? !this.isRightSidenavOpened
      : true;
  }

  closeSidenav(): void {
    this.isRightSidenavOpened = false;
  }
}
