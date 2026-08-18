import { HttpClient, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fromLonLat, transformExtent } from 'ol/proj';
import { MapaService } from 'src/app/services/mapa.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-search-address',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './search-address.component.html',
  styleUrl: './search-address.component.scss',
})
export class SearchAddressComponent {
  address: string = '';
  suggestions: any[] = [];
  private searchSubject = new Subject<string>();

  constructor(
    private http: HttpClient,
    private mapaService: MapaService,
  ) {}

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((address) => this.searchAddress(address)),
      )
      .subscribe(
        (result: any) => {
          if (Array.isArray(result) && result.length > 0) {
            this.suggestions = result.slice(0, 5);
          } else {
            this.suggestions = [];
          }
        },
        (error) => {
          console.error('Erro na requisição:', error);
          this.suggestions = [];
        },
      );
  }

  onKeyup() {
    this.searchSubject.next(this.address);
  }

  searchAddress(address: string) {
    let params = new HttpParams()
      .set('q', address)
      .set('format', 'json')
      .set('addressdetails', '1')
      .set('limit', '5')
      .set('countrycodes', 'br');

    // Usa a área visível do mapa como preferência de busca (sem excluir o resto do país,
    // já que a região de atuação varia por implantação/tenant e não deve ficar fixa no código).
    const viewbox = this.getMapViewbox();
    if (viewbox) {
      params = params.set('viewbox', viewbox).set('bounded', '0');
    }

    return this.http.get('https://nominatim.openstreetmap.org/search', {
      params,
    });
  }

  private getMapViewbox(): string | null {
    const map = this.mapaService.getMapa();
    const size = map?.getSize();
    if (!map || !size) return null;

    const extent = map.getView().calculateExtent(size);
    const [minLon, minLat, maxLon, maxLat] = transformExtent(
      extent,
      'EPSG:3857',
      'EPSG:4326',
    );

    return `${minLon},${maxLat},${maxLon},${minLat}`;
  }

  selectSuggestion(suggestion: any) {
    const lat = suggestion.lat;
    const lon = suggestion.lon;
    this.address = suggestion.display_name;
    this.suggestions = [];
    this.updateMap(lat, lon);
  }

  updateMap(lat: number, lon: number) {
    const map = this.mapaService.getMapa();
    if (!map) {
      return;
    }
    const view = map.getView();
    view.setCenter(fromLonLat([lon, lat]));
    view.setZoom(19);
  }
}
