import { Component, OnInit } from '@angular/core';
import { View } from 'ol';
import { MapaService } from 'src/app/services/mapa.service';
import { fromLonLat } from 'ol/proj';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OverviewMap } from 'ol/control.js';
import { FetchConfigsService } from 'src/app/services/api/fetch.configs.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
})
export class HomeComponent implements OnInit {
  latitude!: number;
  longitude!: number;
  constructor(
    private mapaService: MapaService,
    private fetchConfigService: FetchConfigsService,
  ) {}

  ngOnInit() {
    this.fetchConfigService.getConfigs().subscribe((configs) => {
      const latitude = configs.find((config) => config.key === 'LATITUDE');
      const longitude = configs.find((config) => config.key === 'LONGITUDE');
      if (latitude && longitude) {
        this.latitude = parseFloat(latitude.value ?? '');
        this.longitude = parseFloat(longitude.value ?? '');
      }
    });
  }
  resetToInitialView() {
    const mapa = this.mapaService.getMapa();
    if (mapa) {
      const overviewMapControl = mapa
        .getControls()
        .getArray()
        .find((ctl) => ctl instanceof OverviewMap);

      if (overviewMapControl) {
        mapa.removeControl(overviewMapControl);
      }

      mapa.setView(
        new View({
          center: fromLonLat([this.longitude, this.latitude]),
          zoom: 8,
          projection: 'EPSG:3857',
        }),
      );

      if (overviewMapControl) {
        mapa.addControl(overviewMapControl);
      }
    }
  }
}
