import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { Subscription } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MapaService } from 'src/app/services/mapa.service';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav } from '@angular/material/sidenav';
import { Camadas } from 'src/app/models/camadas.model';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Mapas } from 'src/app/models/mapas.model';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';

@Component({
  selector: 'app-perfil-conteudo',
  templateUrl: './perfil-conteudo.component.html',
  styleUrls: ['./perfil-conteudo.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDividerModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
  ],
})
export class PerfilConteudoComponent implements AfterViewInit, OnDestroy {
  private toggleSubscription!: Subscription;
  camada: Camadas | null = null;
  camadasRaster: CamadasRaster | null = null;
  mapa: Mapas | null = null;
  isMapa: boolean = false;
  legendUrl: string | null = null;
  @ViewChild('snav') snav!: MatSidenav;
  atributos: any[] = [];

  constructor(
    public conteudoService: ConteudoService,
    private mapaService: MapaService,
  ) {}

  ngAfterViewInit(): void {
    this.toggleSubscription = this.conteudoService.expandPanelPerfil$.subscribe(
      (conteudo) => {
        if (!conteudo) return;

        if ('nomeMapa' in conteudo) {
          this.isMapa = true;
          this.mapa = conteudo as Mapas;
          this.camada = null;
          this.updateLegendUrl();
        } else {
          this.isMapa = false;
          this.camada = conteudo as Camadas;
          this.mapa = null;
          this.updateLegendUrl();
        }
      },
    );
  }

  ngOnDestroy() {
    this.toggleSubscription.unsubscribe();
  }

  closeExpandPerfilPanel(): void {
    this.conteudoService.perfilPanel = false;
  }

  updateLegendUrl(): void {
    if (!this.camada && !this.mapa) return;

    const mapa = this.mapaService.getMapa();
    if (!mapa) return;

    const layers = mapa.getLayers().getArray();
    const resolution = mapa.getView().getResolution();
    const baseUrl = this.getGeoServerBaseUrl();

    if (this.isMapa && this.mapa) {
      this.legendUrl = this.getLegendUrlForMapa(layers, resolution, baseUrl);
    } else if (this.camada) {
      this.legendUrl = this.getLegendUrlForCamada(layers, resolution, baseUrl);
    }
  }

  private getGeoServerBaseUrl(): string {
    return 'https://hom-giscesan.cesan.com.br/geoserver-proxy/';
  }

  private getLegendUrlForMapa(
    layers: any[],
    resolution: number | undefined,
    baseUrl: string,
  ): string | null {
    let legendUrl: string | null = null;

    if (this.mapa?.camadas) {
      for (const camada of this.mapa.camadas) {
        legendUrl = this.getLegendUrlForLayer(
          layers,
          resolution,
          baseUrl,
          camada.nomeCamada,
        );
        if (legendUrl) break;
      }
    }

    if (!legendUrl && this.mapa?.camadasRaster) {
      for (const camadaRaster of this.mapa.camadasRaster) {
        const layerName = `${camadaRaster.nomeCamada}_${camadaRaster.fonteDadosCamadaRaster}`;
        legendUrl = this.getLegendUrlForLayer(
          layers,
          resolution,
          baseUrl,
          layerName,
        );
        if (legendUrl) break;
      }
    }

    return legendUrl;
  }

  private getLegendUrlForCamada(
    layers: any[],
    resolution: number | undefined,
    baseUrl: string,
  ): string | null {
    const layerName = this.camada?.nomeCamada;
    if (!layerName) return null;

    return this.getLegendUrlForLayer(layers, resolution, baseUrl, layerName);
  }

  private getLegendUrlForLayer(
    layers: any[],
    resolution: number | undefined,
    baseUrl: string,
    layerName: string,
  ): string | null {
    for (const layer of layers) {
      if (
        layer instanceof ImageLayer &&
        layer.getSource() instanceof ImageWMS
      ) {
        const source = layer.getSource() as ImageWMS;
        if (source.getParams().LAYERS === layerName) {
          let legendUrl = source.getLegendUrl(resolution);
          if (!legendUrl) {
            legendUrl = `${baseUrl}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${layerName}`;
          }
          return legendUrl;
        }
      }
    }
    return null;
  }

  getLegendaPorCamada(): { camada: string; legendUrl: string | null }[] {
    const mapa = this.mapaService.getMapa();
    if (!mapa) return [];

    const layers = mapa.getLayers().getArray();
    const resolution = mapa.getView().getResolution();
    const baseUrl = this.getGeoServerBaseUrl();
    const legendas: { camada: string; legendUrl: string | null }[] = [];

    const getLegendUrl = (layerName: string): string | null => {
      const layer = layers.find(
        (layer) =>
          layer instanceof ImageLayer &&
          layer.getSource() instanceof ImageWMS &&
          layer.getSource().getParams().LAYERS === `content:${layerName}`,
      ) as ImageLayer<ImageWMS> | undefined;

      if (layer?.getSource()) {
        let legendUrl = layer?.getSource()?.getLegendUrl(resolution);

        if (!legendUrl) {
          legendUrl = `${baseUrl}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${layerName}`;
        }

        return legendUrl;
      }
      return null;
    };

    if (this.isMapa && this.mapa) {
      this.mapa.camadas.forEach((camada) => {
        legendas.push({
          camada: camada.tituloCamada,
          legendUrl: getLegendUrl(camada.nomeCamada),
        });
      });

      this.mapa.camadasRaster.forEach((camadaRaster) => {
        const layerName = `${camadaRaster.nomeCamada}_${camadaRaster.fonteDadosCamadaRaster}`;
        legendas.push({
          camada: camadaRaster.tituloCamada,
          legendUrl: getLegendUrl(layerName),
        });
      });
    }

    if (!this.isMapa && this.camada) {
      legendas.push({
        camada: this.camada.tituloCamada,
        legendUrl: getLegendUrl(this.camada.nomeCamada),
      });
    }

    return legendas;
  }

  isCamada(camada: any): boolean {
    return camada !== null && camada !== undefined;
  }

  getCamadaInfo(): { label: string; value: string }[] {
    if (!this.camada) {
      return [];
    }

    const info = [
      { label: 'Tema', value: this.camada.temaCamadaNome || '' },
      { label: 'Grupo', value: this.camada.grupoCamadaNome || '' },
    ];

    if (this.camada.tipo === 'camada') {
      info.push(
        {
          label: 'Pacote Conceitual',
          value: this.camada.pacoteConceitualNome || '',
        },
        { label: 'Fonte', value: this.camada.fonteDadosCamada || '' },
      );
    }

    info.push(
      { label: 'Termos de Uso', value: this.camada.termosDeUso || '' },
      {
        label: 'Criado em',
        value: this.camada.criadoEm
          ? new Date(this.camada.criadoEm).toLocaleDateString()
          : '',
      },
      {
        label: 'Última Atualização',
        value: this.camada.updatedAt
          ? new Date(this.camada.updatedAt).toLocaleDateString()
          : '',
      },
      { label: 'Usuário Criação', value: this.camada.usrCriacao || '' },
    );

    return info;
  }

  getCamadaAtributos(): {
    camada: string;
    atributos: { label: string; value: string }[];
  }[] {
    if (this.isMapa && this.mapa) {
      return this.mapa.camadas.map((camada) => ({
        camada: camada.tituloCamada,
        atributos: (camada.atributos ?? [])
          .filter(
            (atributo: any) =>
              atributo &&
              atributo.visivel === true &&
              atributo.nomeAtributo !== 'geom' &&
              atributo.nomeAtributo !== 'geometry',
          )
          .sort(
            (a: any, b: any) =>
              (a.ordemRenderizacao ?? 0) - (b.ordemRenderizacao ?? 0),
          )
          .map((atributo: any) => ({
            label: atributo.label || atributo.nomeAtributo,
            value: `${atributo.tipo} (${atributo.tamanho})`,
          })),
      }));
    }

    if (this.camada && this.camada.atributos) {
      return [
        {
          camada: this.camada.tituloCamada,
          atributos: (this.camada.atributos ?? [])
            .filter(
              (atributo: any) =>
                atributo &&
                atributo.visivel === true &&
                atributo.nomeAtributo !== 'geom' &&
                atributo.nomeAtributo !== 'geometry',
            )
            .sort(
              (a: any, b: any) =>
                (a.ordemRenderizacao ?? 0) - (b.ordemRenderizacao ?? 0),
            )
            .map((atributo: any) => ({
              label: atributo.label || atributo.nomeAtributo,
              value: `${atributo.tipo} (${atributo.tamanho})`,
            })),
        },
      ];
    }

    return [];
  }
}
