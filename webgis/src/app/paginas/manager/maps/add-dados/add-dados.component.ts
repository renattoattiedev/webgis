import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Output,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Camadas } from 'src/app/models/camadas.model';
import { FetchContentUsuarioService } from 'src/app/services/api/fetch.content.usuario.service';
import { FetchConfigsService } from 'src/app/services/api/fetch.configs.service';
import { AssociateCamadasMapaService } from 'src/app/services/associate.camadas.mapa.service';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { FetchContentOrganizationService } from 'src/app/services/api/fetch.content.organization.service';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';
import { Subscription } from 'rxjs';

export interface LayerEvent {
  camada: Camadas | CamadasRaster;
  action: 'add' | 'remove';
}

@Component({
  selector: 'app-add-dados',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
  ],
  templateUrl: './add-dados.component.html',
  styleUrls: ['./add-dados.component.scss'],
})
export class AddDadosComponent implements OnInit, OnDestroy {
  @Output() layerAdded = new EventEmitter<LayerEvent>();

  meuConteudo: (Camadas | CamadasRaster)[] = [];
  meuConteudoRaster: (Camadas | CamadasRaster)[] = [];
  minhaOrganizacao: (Camadas | CamadasRaster)[] = [];
  minhaOrganizacaoRaster: (Camadas | CamadasRaster)[] = [];
  urlWms: string | undefined;
  addedLayers = new Set<string>();
  displayedColumns: string[] = ['title', 'action'];

  private subscriptions: Subscription[] = [];

  addedCamadas: (Camadas | CamadasRaster)[] = [];

  constructor(
    private fetchContentUserService: FetchContentUsuarioService,
    private fetchContentOrganizationService: FetchContentOrganizationService,
    private fetchConfigService: FetchConfigsService,
    private associateCamadaService: AssociateCamadasMapaService,
    public dialogRef: MatDialogRef<AddDadosComponent>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.initializeServices();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private initializeServices(): void {
    this.initializeConfig();
    this.initializeUserContent();
    this.initializeOrganizationContent();
    this.initializeLayerSubscriptions();
  }

  private initializeConfig(): void {
    const configSub = this.fetchConfigService
      .getConfigs()
      .subscribe((configs) => {
        const urlWmsConfig = configs.find(
          (config) => config.key === 'GEOSERVER_URL',
        );
        this.urlWms = urlWmsConfig?.value ?? undefined;
      });
    this.subscriptions.push(configSub);
  }

  private initializeUserContent(): void {
    const userContentSub = this.fetchContentUserService
      .getAllContent()
      .subscribe({
        next: (response: {
          camadas: Camadas[];
          camadasRaster: CamadasRaster[];
        }) => {
          this.meuConteudo = this.processLayers(response.camadas);
          this.meuConteudoRaster = this.processRasterLayers(
            response.camadasRaster,
          );
          this.syncLayerStates();
        },
        error: (error) => {
          console.error('Erro ao buscar camadas:', error);
        },
      });
    this.subscriptions.push(userContentSub);
  }

  private initializeOrganizationContent(): void {
    const orgContentSub = this.fetchContentOrganizationService
      .getContentOrganization()
      .subscribe({
        next: (response: {
          camadas: Camadas[];
          camadasRaster: CamadasRaster[];
        }) => {
          this.minhaOrganizacao = this.processLayers(response.camadas);
          this.minhaOrganizacaoRaster = this.processRasterLayers(
            response.camadasRaster,
          );
          this.syncLayerStates();
        },
        error: (error) => {
          console.error('Erro ao buscar mapas:', error);
        },
      });
    this.subscriptions.push(orgContentSub);
  }

  private initializeLayerSubscriptions(): void {
    const camadasSub = this.associateCamadaService.camadas$.subscribe(
      (camadas) => {
        this.updateAddedLayers(camadas);
      },
    );

    const camadasRasterSub =
      this.associateCamadaService.camadasRaster$.subscribe((camadasRaster) => {
        this.updateAddedLayers(camadasRaster);
      });

    const removedSub = this.associateCamadaService.camadaRemoved$.subscribe(
      (camada: Camadas | null) => {
        if (camada) {
          const layerKey = this.getLayerKey(camada);
          this.addedLayers.delete(layerKey);
        }
      },
    );

    this.subscriptions.push(camadasSub, camadasRasterSub, removedSub);
  }

  private processLayers(camadas: Camadas[]): Camadas[] {
    return camadas.map((camada) => ({
      ...camada,
      thumbnail: this.getThumbnail(camada.nomeCamada, camada.boundingBox),
    }));
  }

  private processRasterLayers(camadas: CamadasRaster[]): CamadasRaster[] {
    return camadas.map((camada) => ({
      ...camada,
      thumbnail: this.getThumbnail(
        `${camada.nomeCamada}_${camada.fonteDadosCamadaRaster}`,
      ),
    }));
  }

  private syncLayerStates(): void {
    this.updateAddedLayers([
      ...this.associateCamadaService.getCurrentVectorLayers(),
      ...this.associateCamadaService.getCurrentRasterLayers(),
    ]);
  }

  updateAddedLayers(camadas: (Camadas | CamadasRaster)[]): void {
    camadas.forEach((camada) => {
      const layerKey = this.getLayerKey(camada);
      this.addedLayers.add(layerKey);
    });
  }

  toggleLayer(camada: Camadas | CamadasRaster): void {
    const layerKey = this.getLayerKey(camada);

    const isAdded = this.addedLayers.has(layerKey);

    if (isAdded) {
      this.removeLayer(camada);
      this.layerAdded.emit({ camada, action: 'remove' });
    } else {
      if ('fonteDadosCamadaRaster' in camada) {
        if (
          camada.fonteDadosCamadaRaster === 'preloaded' &&
          this.isRasterAlreadyAdded('preloaded')
        ) {
          console.warn('Camada raster preloaded já adicionada:', camada);
          return;
        }

        if (
          camada.fonteDadosCamadaRaster === 'uploaded' &&
          this.isRasterAlreadyAdded('uploaded')
        ) {
          console.warn('Camada raster uploaded já adicionada:', camada);
          return;
        }
      }

      this.addLayer(camada);
      this.layerAdded.emit({ camada, action: 'add' });
    }

    this.cdr.detectChanges();
  }

  private isRasterAlreadyAdded(type: 'preloaded' | 'uploaded'): boolean {
    return this.addedCamadas.some(
      (camada) =>
        'fonteDadosCamadaRaster' in camada &&
        camada.fonteDadosCamadaRaster === type,
    );
  }

  private addLayer(camada: Camadas | CamadasRaster): void {
    const layerKey = this.getLayerKey(camada);

    if ('pacoteConceitual' in camada) {
      this.associateCamadaService.addCamada(camada);
    } else {
      this.associateCamadaService.addCamadaRaster(camada);
    }

    this.addedLayers.add(layerKey);

    this.addedCamadas.push(camada);
  }

  private removeLayer(camada: Camadas | CamadasRaster): void {
    const layerKey = this.getLayerKey(camada);

    if ('pacoteConceitual' in camada) {
      this.associateCamadaService.removeCamada(camada);
    } else {
      this.associateCamadaService.removeCamadaRaster(camada);
    }

    this.addedLayers.delete(layerKey);
  }

  private getLayerKey(camada: Camadas | CamadasRaster): string {
    if ('fonteDadosCamadaRaster' in camada) {
      return `content:${camada.nomeCamada}_${camada.fonteDadosCamadaRaster}`;
    }
    return `content:${camada.nomeCamada}`;
  }

  isLayerAdded(camada: Camadas | CamadasRaster): boolean {
    const layerKey = this.getLayerKey(camada);
    return this.addedLayers.has(layerKey);
  }

  getThumbnail(layerName: string, boundingBox?: string): string {
    const fullLayerName = `content:${layerName}`;
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

        if (width > height) {
          width = height;
        } else {
          height = width;
        }
      } catch (error) {
        console.error('Failed to parse bounding box:', error);
      }
    }

    const imageUrl = `${this.urlWms}/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${fullLayerName}&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:31984&styles=&format=image/png`;
    return imageUrl;
  }
  onClose(): void {
    this.dialogRef.close();
  }
}
