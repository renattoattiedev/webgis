import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fromLonLat } from 'ol/proj';
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
    const url = `https://nominatim.openstreetmap.org/search?q=${address}&format=json&addressdetails=1&limit=5&viewbox=-41.5078,-18.5156,-39.6976,-21.3542&bounded=1`;
    return this.http.get(url);
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
