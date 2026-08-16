import { Component, ElementRef, ViewChild } from '@angular/core';
import Map from 'ol/Map';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Overlay } from 'ol';
import { MapaService } from 'src/app/services/mapa.service';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-current-location',
  templateUrl: './current-location.component.html',
  styleUrls: ['./current-location.component.scss'],
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatIconModule, MatButtonModule],
})
export class CurrentLocationComponent {
  @ViewChild('mapElement') mapElement!: ElementRef;
  map: Map | undefined;
  coordinatesMessage = '';
  marker: Overlay | null = null;
  isLocationAvailable = false;

  constructor(private mapaService: MapaService) {}

  showCoordinates() {
    const mapa = this.mapaService.getMapa();
    if (mapa) {
      const centerCoords = mapa.getView().getCenter();
      if (centerCoords) {
        const coords = toLonLat(centerCoords);

        this.coordinatesMessage = `Latitude: ${coords[1].toFixed(
          6,
        )}, Longitude: ${coords[0].toFixed(6)}`;
      }
    }
  }

  toggleLocationAvailability() {
    if (this.isLocationAvailable) {
      this.isLocationAvailable = false;
    } else {
      this.getCurrentLocation();
    }
  }

  getCurrentLocation() {
    const mapa = this.mapaService.getMapa();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        if (mapa) {
          mapa.getView().setCenter(fromLonLat([longitude, latitude]));
          mapa.getView().setZoom(13);
        }

        this.coordinatesMessage = `Latitude: ${latitude}, Longitude: ${longitude}`;
      });
      this.isLocationAvailable = true;
      if (mapa) {
        this.showCoordinates();
        mapa.on('pointerdrag', () => {
          this.showCoordinates();
        });
      }
    }
  }
}
