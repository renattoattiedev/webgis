import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { catchError, forkJoin, of } from 'rxjs';
import { Basemap, BasemapUpsertRequest } from 'src/app/models/basemap.model';
import { BasemapService } from 'src/app/services/basemap.service';
import { Mapas } from 'src/app/models/mapas.model';
import { CreateBasemapService } from 'src/app/services/api/create.basemap.service';
import { FetchBasemapsService } from 'src/app/services/api/fetch.basemaps.service';
import { FetchContentOrganizationService } from 'src/app/services/api/fetch.content.organization.service';

@Component({
  selector: 'app-add-basemap-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './add-basemap-dialog.component.html',
  styleUrl: './add-basemap-dialog.component.scss',
})
export class AddBasemapDialogComponent implements OnInit {
  mapasPublicados: Mapas[] = [];
  mapaSelecionado: Mapas | null = null;

  basemap: BasemapUpsertRequest = {
    name: '',
    thumbnail: '',
    source: '',
    wmsParams: null,
    order: 0,
    isDefault: false,
    isActive: true,
  };

  constructor(
    public dialogRef: MatDialogRef<AddBasemapDialogComponent>,
    private createBasemapService: CreateBasemapService,
    private fetchContentOrganizationService: FetchContentOrganizationService,
    private fetchBasemapsService: FetchBasemapsService,
    private basemapService: BasemapService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      organization: this.fetchContentOrganizationService
        .getContentOrganization()
        .pipe(
          catchError((error) => {
            console.error('Erro ao buscar mapas publicados:', error);
            return of({ camadas: [], camadasRaster: [], mapas: [] });
          }),
        ),
      basemaps: this.fetchBasemapsService.getBasemaps().pipe(
        catchError((error) => {
          console.error('Erro ao buscar basemaps:', error);
          return of([] as Basemap[]);
        }),
      ),
    }).subscribe(({ organization, basemaps }) => {
      const layersJaCadastradas = new Set(
        basemaps
          .map((b) => (b.wmsParams?.['LAYERS'] as string) ?? '')
          .filter(Boolean),
      );

      this.mapasPublicados = ((organization as any).mapas || [])
        .filter(
          (mapa: Mapas) =>
            mapa.visivel !== false &&
            mapa.mapaAtivo !== false &&
            !layersJaCadastradas.has(`content:${mapa.nomeMapa}`),
        )
        .sort((a: Mapas, b: Mapas) => a.nomeMapa.localeCompare(b.nomeMapa));
    });
  }

  submitBasemap(form: NgForm) {
    if (!form.valid || !this.mapaSelecionado?.nomeMapa) {
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.createBasemapService.createBasemap(payload).subscribe(() => {
      this.basemapService.notifyBasemapsChanged();
      this.dialogRef.close(true);
    });
  }

  onMapaSelecionado(mapa: Mapas): void {
    this.mapaSelecionado = mapa;

    const generatedBasemap = this.buildGeneratedBasemap(mapa);
    this.basemap = {
      ...this.basemap,
      ...generatedBasemap,
    };
  }

  getMapaLabel(mapa: Mapas): string {
    return mapa.tituloMapa
      ? `${mapa.tituloMapa} (${mapa.nomeMapa})`
      : mapa.nomeMapa;
  }

  private buildPayload(): BasemapUpsertRequest | null {
    const payload = {
      ...this.basemap,
      order: Number(this.basemap.order ?? 0),
    };
    console.log(
      '[AddBasemap] Payload enviado:',
      JSON.stringify(payload, null, 2),
    );
    return payload;
  }

  private buildGeneratedBasemap(
    mapa: Mapas,
  ): Pick<BasemapUpsertRequest, 'name' | 'thumbnail' | 'source' | 'wmsParams'> {
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
    };
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
