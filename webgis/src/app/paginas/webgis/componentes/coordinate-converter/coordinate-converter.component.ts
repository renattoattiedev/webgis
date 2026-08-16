import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  Subject,
  Subscription,
  debounceTime,
  firstValueFrom,
  from,
  switchMap,
} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Map } from 'ol';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { fromLonLat, transform } from 'ol/proj';
import proj4 from 'proj4';
import * as mgrs from 'mgrs';
import { WindowBehavior } from 'src/app/shared/window/window-behavior';
import { MapaService } from 'src/app/services/mapa.service';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Geometry from 'ol/geom/Geometry';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';

const WGS84 = 'EPSG:4326';

export type CoordinateFormatId =
  | 'dd'
  | 'ddm'
  | 'dms'
  | 'longlat'
  | 'mgrs'
  | 'usng'
  | 'utm'
  | 'address';
export type InputFormatId = CoordinateFormatId | 'auto';

interface CoordinateValue {
  lat: number;
  lon: number;
}

interface FormatState {
  id: CoordinateFormatId;
  defaultLabel: string;
  label: string;
  defaultPattern: string;
  pattern: string;
  value: string;
  visible: boolean;
  expanded: boolean;
  isEditing: boolean;
  readonly closable: boolean;
  fields: FormatField[];
}

interface ParsedCoordinate {
  format: CoordinateFormatId;
  coordinate: CoordinateValue;
}

interface GeocodeSuggestion {
  label: string;
  lat: number;
  lon: number;
}

interface FormatField {
  label: string;
  value: string;
}

type FormatTokens = Record<string, string> & {
  lat: string;
  lon: string;
  latAbs: string;
  lonAbs: string;
  latDeg: string;
  lonDeg: string;
  latDir: string;
  lonDir: string;
  latMin: string;
  lonMin: string;
  latMinInt: string;
  lonMinInt: string;
  latSec: string;
  lonSec: string;
};

@Component({
  selector: 'app-coordinate-converter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  templateUrl: './coordinate-converter.component.html',
  styleUrl: './coordinate-converter.component.scss',
})
export class CoordinateConverterComponent
  extends WindowBehavior
  implements AfterViewInit, OnDestroy
{
  @Output() fechado = new EventEmitter<void>();
  inputText = '';
  selectedInputFormat: InputFormatId = 'auto';
  detectedFormat: CoordinateFormatId | null = null;
  inputError = '';
  inputIsProcessing = false;
  mapPickActive = false;
  inputDetailsExpanded = false;
  inputSettingsOpen = false;

  geocodeSuggestions: GeocodeSuggestion[] = [];
  isGeocoding = false;
  reverseAddress = '';
  isReverseGeocoding = false;

  readonly formats: FormatState[] = [
    {
      id: 'address',
      defaultLabel: 'Address',
      label: 'Address',
      defaultPattern: '{{address}}',
      pattern: '{{address}}',
      value: '',
      visible: true,
      expanded: true,
      isEditing: false,
      closable: false,
      fields: [],
    },
    {
      id: 'dd',
      defaultLabel: 'DD',
      label: 'DD',
      defaultPattern: '{{latAbs}}°{{latDir}}, {{lonAbs}}°{{lonDir}}',
      pattern: '{{latAbs}}°{{latDir}}, {{lonAbs}}°{{lonDir}}',
      value: '',
      visible: true,
      expanded: true,
      isEditing: false,
      closable: true,
      fields: [],
    },
    {
      id: 'ddm',
      defaultLabel: 'DDM',
      label: 'DDM',
      defaultPattern:
        "{{latDeg}}° {{latMin}}'{{latDir}}, {{lonDeg}}° {{lonMin}}'{{lonDir}}",
      pattern:
        "{{latDeg}}° {{latMin}}'{{latDir}}, {{lonDeg}}° {{lonMin}}'{{lonDir}}",
      value: '',
      visible: true,
      expanded: true,
      isEditing: false,
      closable: true,
      fields: [],
    },
    {
      id: 'dms',
      defaultLabel: 'DMS',
      label: 'DMS',
      defaultPattern:
        '{{latDeg}}° {{latMinInt}}\' {{latSec}}"{{latDir}}, {{lonDeg}}° {{lonMinInt}}\' {{lonSec}}"{{lonDir}}',
      pattern:
        '{{latDeg}}° {{latMinInt}}\' {{latSec}}"{{latDir}}, {{lonDeg}}° {{lonMinInt}}\' {{lonSec}}"{{lonDir}}',
      value: '',
      visible: true,
      expanded: true,
      isEditing: false,
      closable: true,
      fields: [],
    },
    {
      id: 'longlat',
      defaultLabel: 'Long-Lat',
      label: 'Long-Lat',
      defaultPattern: '{{lon}}°, {{lat}}°',
      pattern: '{{lon}}°, {{lat}}°',
      value: '',
      visible: true,
      expanded: true,
      isEditing: false,
      closable: true,
      fields: [],
    },
    {
      id: 'mgrs',
      defaultLabel: 'MGRS',
      label: 'MGRS',
      defaultPattern: '{{mgrs}}',
      pattern: '{{mgrs}}',
      value: '',
      visible: true,
      expanded: true,
      isEditing: false,
      closable: true,
      fields: [],
    },
    {
      id: 'usng',
      defaultLabel: 'USNG',
      label: 'USNG',
      defaultPattern: '{{usng}}',
      pattern: '{{usng}}',
      value: '',
      visible: true,
      expanded: true,
      isEditing: false,
      closable: true,
      fields: [],
    },
    {
      id: 'utm',
      defaultLabel: 'UTM',
      label: 'UTM',
      defaultPattern: '{{zone}}{{zoneLetter}} {{easting}} {{northing}}',
      pattern: '{{zone}}{{zoneLetter}} {{easting}} {{northing}}',
      value: '',
      visible: true,
      expanded: true,
      isEditing: false,
      closable: true,
      fields: [],
    },
  ];

  private readonly inputChange$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private map: Map | null = null;
  private mapClickSubscription: Subscription | null = null;
  private markerLayer: VectorLayer<VectorSource> | null = null;
  private markerSource: VectorSource | null = null;
  private markerFeature: Feature<Geometry> | null = null;
  currentCoordinate: CoordinateValue | null = null;
  private reverseGeocodeToken = 0;
  private readonly espiritoSantoViewbox = '-41.8800,-17.8900,-39.5200,-21.3000';
  private readonly espiritoSantoBounds = {
    minLon: -41.88,
    maxLon: -39.52,
    minLat: -21.3,
    maxLat: -17.89,
  } as const;

  constructor(
    private readonly mapaService: MapaService,
    private readonly http: HttpClient,
    private readonly clipboard: Clipboard,
    private readonly snackBar: MatSnackBar,
    protected override cdr: ChangeDetectorRef,
  ) {
    super(cdr);
    this.defaultSize = { width: 420, height: 640 };
    this.minimizedSize = { width: 360, height: 42 };

    this.inputChange$
      .pipe(
        debounceTime(250),
        switchMap((value) => from(this.evaluateInput(value))),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  ngAfterViewInit(): void {
    this.map = this.mapaService.getMapa();
    this.initMarkerLayer();
    this.positionTopRight();
    this.initWindowBehaviorLifecycle();
    this.cdr.detectChanges();
  }

  override ngOnDestroy(): void {
    this.disableMapPick();
    this.teardownMarkerLayer();
    this.destroy$.next();
    this.destroy$.complete();
    super.ngOnDestroy();
  }

  fechar(): void {
    this.disableMapPick();
    this.inputText = '';
    this.geocodeSuggestions = [];
    this.clearResults();
    this.fechado.emit();
  }

  onInputChange(value: string): void {
    this.inputText = value;
    if (!value.trim()) {
      this.selectedInputFormat = 'auto';
    }
    this.inputIsProcessing = true;
    this.inputChange$.next(value);
  }

  getInputLabel(): string {
    if (this.selectedInputFormat === 'auto') {
      return this.detectedFormat
        ? this.getFormatLabel(this.detectedFormat)
        : 'Auto';
    }
    return this.getFormatLabel(this.selectedInputFormat as CoordinateFormatId);
  }

  onSuggestionSelected(item: GeocodeSuggestion): void {
    this.inputText = item.label;
    this.selectedInputFormat = 'address';
    this.geocodeSuggestions = [];
    this.setCoordinate({ lat: item.lat, lon: item.lon }, 'address');
  }

  clearAllInputs(): void {
    this.disableMapPick();
    this.reverseGeocodeToken++;
    this.inputText = '';
    this.selectedInputFormat = 'auto';
    this.detectedFormat = null;
    this.reverseAddress = '';
    this.isGeocoding = false;
    this.isReverseGeocoding = false;
    this.inputIsProcessing = false;
    this.clearResults();
  }

  toggleMapPick(): void {
    if (this.mapPickActive) {
      this.disableMapPick();
      return;
    }

    if (!this.map) {
      this.snackBar.open('Mapa não disponível', 'Fechar', { duration: 2500 });
      return;
    }

    this.mapPickActive = true;
    this.mapaService.setIdentifyEnabled(false);
    const handler = (event: MapBrowserEvent<UIEvent>) => {
      const [lon, lat] = transform(event.coordinate, 'EPSG:3857', WGS84);
      const formatted = this.formatValue('dd', { lat, lon });
      this.disableMapPick();
      this.inputText = formatted;
      this.selectedInputFormat = 'dd';
      this.setCoordinate({ lat, lon }, 'dd');
      this.cdr.detectChanges();
    };

    this.mapClickSubscription = new Subscription(() => {
      this.map?.un('singleclick', handler as any);
      this.mapaService.setIdentifyEnabled(true);
      const viewport = this.map?.getViewport();
      if (viewport) viewport.style.cursor = 'auto';
      this.mapPickActive = false;
      this.cdr.detectChanges();
    });
    this.map.on('singleclick', handler as any);
    const viewport = this.map.getViewport();
    viewport.style.cursor = 'crosshair';
  }

  disableMapPick(): void {
    if (!this.mapPickActive) return;
    this.mapPickActive = false;
    this.mapaService.setIdentifyEnabled(true);
    if (this.map && this.mapClickSubscription) {
      this.mapClickSubscription.unsubscribe();
      this.mapClickSubscription = null;
      const viewport = this.map.getViewport();
      viewport.style.cursor = 'auto';
    }
  }

  private initMarkerLayer(): void {
    if (!this.map || this.markerLayer) return;

    this.markerSource = new VectorSource();
    this.markerLayer = new VectorLayer({
      source: this.markerSource,
      style: new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: 'rgba(26, 115, 232, 0.85)' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
      }),
    });
    this.markerLayer.set('coordinateConverterMarker', true);
    this.markerLayer.setZIndex(999);
    this.map.addLayer(this.markerLayer);
  }

  private teardownMarkerLayer(): void {
    if (this.map && this.markerLayer) {
      this.map.removeLayer(this.markerLayer);
    }
    this.markerSource?.clear();
    this.markerLayer = null;
    this.markerSource = null;
    this.markerFeature = null;
  }

  private updateMarker(coordinate: CoordinateValue | null): void {
    if (!this.map) return;
    if (!this.markerLayer || !this.markerSource) {
      this.initMarkerLayer();
    }
    if (!this.markerSource) return;

    if (!coordinate) {
      this.markerSource.clear();
      this.markerFeature = null;
      return;
    }

    const position = fromLonLat([coordinate.lon, coordinate.lat]);
    const geometry = new Point(position);

    if (!this.markerFeature) {
      this.markerFeature = new Feature({ geometry });
      this.markerSource.addFeature(this.markerFeature);
    } else {
      this.markerFeature.setGeometry(geometry);
    }
  }

  toggleFormatVisibility(format: FormatState, visible: boolean): void {
    if (!visible && !format.closable) return;
    format.visible = visible;
    if (visible && this.currentCoordinate) {
      format.value = this.formatValue(format.id, this.currentCoordinate);
      this.updateFormatFields(format, this.currentCoordinate);
    }
    this.cdr.detectChanges();
  }

  toggleFormatExpand(format: FormatState): void {
    format.expanded = !format.expanded;
  }

  toggleFormatEditing(format: FormatState): void {
    format.isEditing = !format.isEditing;
  }

  toggleInputDetails(): void {
    this.inputDetailsExpanded = !this.inputDetailsExpanded;
  }

  toggleInputSettings(): void {
    this.inputSettingsOpen = !this.inputSettingsOpen;
  }

  resetFormat(format: FormatState): void {
    format.label = format.defaultLabel;
    format.pattern = format.defaultPattern;
    format.value = this.formatValue(format.id, this.currentCoordinate);
    this.updateFormatFields(format, this.currentCoordinate);
    format.isEditing = false;
  }

  copyFormat(format: FormatState): void {
    const sanitizedValue = format.value?.trim();
    const fieldValues = format.fields
      .map((field) => field.value?.trim())
      .filter((value): value is string => Boolean(value));
    const textToCopy = sanitizedValue || fieldValues.join('\n');

    if (!textToCopy) {
      this.snackBar.open('Nenhum valor disponível para copiar', 'Fechar', {
        duration: 2000,
      });
      return;
    }

    this.clipboard.copy(textToCopy);
    this.snackBar.open(`${format.label} copiado`, 'Fechar', { duration: 2000 });
  }

  copyAll(): void {
    if (!this.currentCoordinate) return;
    const lines: string[] = ['Copy All'];
    const inputLabel = this.getFormatLabel(this.detectedFormat ?? 'dd');
    lines.push(`Input(${inputLabel})`);
    lines.push(this.inputText);
    const addressFormat = this.formats.find((f) => f.id === 'address');
    lines.push('Address');
    lines.push(addressFormat?.value ?? '');

    for (const format of this.formats) {
      if (format.id === 'address') continue;
      if (!format.visible || !format.value) continue;
      lines.push(format.label);
      lines.push(format.value);
    }

    this.clipboard.copy(lines.join('\n'));
    this.snackBar.open('Coordenadas copiadas', 'Fechar', { duration: 2500 });
  }

  onFormatPatternChange(format: FormatState): void {
    if (!this.currentCoordinate) return;
    format.value = this.formatValue(format.id, this.currentCoordinate);
    this.updateFormatFields(format, this.currentCoordinate);
  }

  private async evaluateInput(value: string): Promise<void> {
    const trimmed = value.trim();
    if (!trimmed) {
      this.clearResults();
      this.inputIsProcessing = false;
      return;
    }

    const hasLetters = /[a-zA-Z]/.test(trimmed);
    if (this.selectedInputFormat === 'address' && !hasLetters) {
      this.selectedInputFormat = 'auto';
    }

    if (this.selectedInputFormat === 'address') {
      await this.performGeocode(trimmed);
      this.inputIsProcessing = false;
      return;
    }

    let parsed: ParsedCoordinate | null = null;
    if (this.selectedInputFormat === 'auto') {
      parsed = this.detectFormat(trimmed);
    } else {
      const formatId = this.selectedInputFormat as CoordinateFormatId;
      const direct = this.tryParse(trimmed, formatId);
      parsed = direct
        ? { format: formatId, coordinate: direct }
        : this.detectFormat(trimmed);
    }

    if (parsed) {
      if (parsed.format === 'dd' && !/[NSEW]/i.test(trimmed)) {
        const longLatCandidate = this.parseLongLat(trimmed);
        if (longLatCandidate) {
          const ddInsideBounds = this.isWithinEspiritoSantoBounds(
            parsed.coordinate,
          );
          const longLatInsideBounds =
            this.isWithinEspiritoSantoBounds(longLatCandidate);
          if (!ddInsideBounds && longLatInsideBounds) {
            parsed = { format: 'longlat', coordinate: longLatCandidate };
          }
        }
      }
      this.setCoordinate(parsed.coordinate, parsed.format);
      this.inputError = '';
      this.inputIsProcessing = false;
      return;
    }

    if (hasLetters) {
      this.selectedInputFormat = 'address';
      await this.performGeocode(trimmed);
      this.inputIsProcessing = false;
      return;
    }

    this.inputError = 'Formato inválido ou não reconhecido.';
    this.detectedFormat = null;
    this.currentCoordinate = null;
    this.clearFormatValues();
    this.updateMarker(null);
    this.inputIsProcessing = false;
  }

  private setCoordinate(
    coordinate: CoordinateValue,
    sourceFormat: CoordinateFormatId,
  ): void {
    this.currentCoordinate = coordinate;
    this.detectedFormat = sourceFormat;
    this.reverseAddress = '';
    this.updateMarker(coordinate);
    for (const format of this.formats) {
      if (format.id === 'address') continue;
      format.value = this.formatValue(format.id, coordinate);
      this.updateFormatFields(format, coordinate);
    }
    const addressFormat = this.formats.find((f) => f.id === 'address');
    if (addressFormat) {
      addressFormat.value = 'Buscando endereço...';
      addressFormat.fields = [{ label: '', value: addressFormat.value }];
    }
    this.focusCurrentCoordinate();
    this.fetchReverseGeocode(coordinate);
    this.cdr.detectChanges();
  }

  private async performGeocode(query: string): Promise<void> {
    this.isGeocoding = true;
    this.geocodeSuggestions = [];
    try {
      const url = 'https://nominatim.openstreetmap.org/search';
      const params = {
        q: `${query}, Espírito Santo, Brasil`,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'br',
        viewbox: this.espiritoSantoViewbox,
        bounded: '1',
      } as const;
      const result = await firstValueFrom(
        this.http.get<any[]>(url, {
          params: params as any,
          headers: {
            'Accept-Language': 'pt-BR',
            'User-Agent': 'webgis-app/1.0',
          },
        }),
      );
      const filtered = (result ?? []).filter((item) =>
        this.isAddressInEspiritoSanto(item?.address),
      );
      if (!filtered.length) {
        this.inputError = 'Nenhum endereço encontrado no Espírito Santo.';
        return;
      }
      this.inputError = '';
      this.geocodeSuggestions = filtered.map((item) => ({
        label: item.display_name,
        lat: Number(item.lat),
        lon: Number(item.lon),
      }));
      const first = this.geocodeSuggestions[0];
      if (first) {
        this.setCoordinate({ lat: first.lat, lon: first.lon }, 'address');
        this.reverseAddress = first.label;
        const format = this.formats.find((f) => f.id === 'address');
        if (format) {
          format.value = first.label;
          this.updateFormatFields(format, this.currentCoordinate);
        }
      }
    } catch (error) {
      this.inputError = 'Erro ao buscar endereço.';
    } finally {
      this.isGeocoding = false;
    }
  }

  private detectFormat(value: string): ParsedCoordinate | null {
    const order: CoordinateFormatId[] = [
      'dd',
      'ddm',
      'dms',
      'longlat',
      'utm',
      'mgrs',
      'usng',
    ];

    for (const id of order) {
      const parsed = this.tryParse(value, id);
      if (parsed) {
        return { format: id, coordinate: parsed };
      }
    }
    return null;
  }

  private tryParse(
    value: string,
    id: CoordinateFormatId,
  ): CoordinateValue | null {
    switch (id) {
      case 'dd':
        return this.parseDD(value);
      case 'ddm':
        return this.parseDDM(value);
      case 'dms':
        return this.parseDMS(value);
      case 'longlat':
        return this.parseLongLat(value);
      case 'mgrs':
        return this.parseMGRS(value);
      case 'usng':
        return this.parseUSNG(value);
      case 'utm':
        return this.parseUTM(value);
      case 'address':
        return null;
    }
  }

  private fetchReverseGeocode(coordinate: CoordinateValue): void {
    const requestId = ++this.reverseGeocodeToken;
    this.isReverseGeocoding = true;
    const url = 'https://nominatim.openstreetmap.org/reverse';
    this.http
      .get<any>(url, {
        params: {
          lat: coordinate.lat.toString(),
          lon: coordinate.lon.toString(),
          format: 'jsonv2',
          zoom: '18',
          addressdetails: '1',
          countrycodes: 'br',
        },
        headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'webgis-app/1.0' },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (requestId !== this.reverseGeocodeToken) return;
          const address = response?.address ?? null;
          this.reverseAddress = this.isAddressInEspiritoSanto(address)
            ? response?.display_name ?? ''
            : '';
          const format = this.formats.find((f) => f.id === 'address');
          if (format) {
            format.value = this.applyPattern(format.pattern, {
              address: this.reverseAddress,
            });
            this.updateFormatFields(format, this.currentCoordinate);
          }
          this.isReverseGeocoding = false;
          this.cdr.detectChanges();
        },
        error: () => {
          if (requestId !== this.reverseGeocodeToken) return;
          this.reverseAddress = '';
          const format = this.formats.find((f) => f.id === 'address');
          if (format) {
            format.value = '';
            this.updateFormatFields(format, this.currentCoordinate);
          }
          this.isReverseGeocoding = false;
          this.cdr.detectChanges();
        },
      });
  }

  private isAddressInEspiritoSanto(
    address: { state?: string } | null | undefined,
  ): boolean {
    if (!address?.state) return false;
    return this.normalizeText(address.state).includes('espirito santo');
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private isWithinEspiritoSantoBounds(coordinate: CoordinateValue): boolean {
    const { minLat, maxLat, minLon, maxLon } = this.espiritoSantoBounds;
    return (
      coordinate.lat >= minLat &&
      coordinate.lat <= maxLat &&
      coordinate.lon >= minLon &&
      coordinate.lon <= maxLon
    );
  }

  private clearResults(): void {
    this.inputError = '';
    this.currentCoordinate = null;
    this.geocodeSuggestions = [];
    this.clearFormatValues();
    this.updateMarker(null);
    this.cdr.detectChanges();
  }

  private clearFormatValues(): void {
    for (const format of this.formats) {
      format.value = '';
      format.fields = [];
    }
  }

  private formatValue(
    id: CoordinateFormatId,
    coordinate: CoordinateValue | null,
  ): string {
    if (!coordinate) return '';
    const tokens = this.buildTokens(coordinate);
    switch (id) {
      case 'address':
        return this.applyPattern(
          this.formats.find((f) => f.id === 'address')?.pattern ??
            '{{address}}',
          { address: this.reverseAddress },
        );
      case 'dd':
        return this.applyPattern(
          this.formats.find((f) => f.id === 'dd')?.pattern ?? '',
          tokens,
        );
      case 'ddm':
        return this.applyPattern(
          this.formats.find((f) => f.id === 'ddm')?.pattern ?? '',
          tokens,
        );
      case 'dms':
        return this.applyPattern(
          this.formats.find((f) => f.id === 'dms')?.pattern ?? '',
          tokens,
        );
      case 'longlat':
        return this.applyPattern(
          this.formats.find((f) => f.id === 'longlat')?.pattern ?? '',
          tokens,
        );
      case 'mgrs':
        tokens['mgrs'] = this.buildMGRS(coordinate);
        return this.applyPattern(
          this.formats.find((f) => f.id === 'mgrs')?.pattern ?? '',
          tokens,
        );
      case 'usng':
        tokens['usng'] = this.buildUSNG(coordinate);
        return this.applyPattern(
          this.formats.find((f) => f.id === 'usng')?.pattern ?? '',
          tokens,
        );
      case 'utm':
        const utm = this.buildUTM(coordinate);
        tokens['zone'] = utm.zone;
        tokens['zoneLetter'] = utm.zoneLetter;
        tokens['easting'] = utm.easting;
        tokens['northing'] = utm.northing;
        return this.applyPattern(
          this.formats.find((f) => f.id === 'utm')?.pattern ?? '',
          tokens,
        );
    }
  }

  private buildTokens(coordinate: CoordinateValue): FormatTokens {
    const latAbs = Math.abs(coordinate.lat);
    const lonAbs = Math.abs(coordinate.lon);

    const latDegInt = Math.floor(latAbs);
    const lonDegInt = Math.floor(lonAbs);

    const latMinTotal = (latAbs - latDegInt) * 60;
    const lonMinTotal = (lonAbs - lonDegInt) * 60;

    const latMinInt = Math.floor(latMinTotal);
    const lonMinInt = Math.floor(lonMinTotal);

    const latSec = (latMinTotal - latMinInt) * 60;
    const lonSec = (lonMinTotal - lonMinInt) * 60;

    const tokens: FormatTokens = {
      lat: this.toFixed(coordinate.lat, 6),
      lon: this.toFixed(coordinate.lon, 6),
      latAbs: this.toFixed(latAbs, 6),
      lonAbs: this.toFixed(lonAbs, 6),
      latDeg: latDegInt.toString().padStart(2, '0'),
      lonDeg: lonDegInt.toString().padStart(3, '0'),
      latDir: coordinate.lat >= 0 ? 'N' : 'S',
      lonDir: coordinate.lon >= 0 ? 'E' : 'W',
      latMin: this.toFixed(latMinTotal, 6).padStart(2 + 1 + 6, '0'),
      lonMin: this.toFixed(lonMinTotal, 6).padStart(2 + 1 + 6, '0'),
      latMinInt: latMinInt.toString().padStart(2, '0'),
      lonMinInt: lonMinInt.toString().padStart(2, '0'),
      latSec: this.toFixed(latSec, 6).padStart(2 + 1 + 6, '0'),
      lonSec: this.toFixed(lonSec, 6).padStart(2 + 1 + 6, '0'),
    };

    return tokens;
  }

  private buildMGRS(coordinate: CoordinateValue): string {
    const mgrsValue = mgrs.forward([coordinate.lon, coordinate.lat], 5);
    return this.formatMgrsString(mgrsValue);
  }

  private buildUSNG(coordinate: CoordinateValue): string {
    const mgrsValue = mgrs.forward([coordinate.lon, coordinate.lat], 5);
    const formatted = this.formatMgrsString(mgrsValue);
    return formatted;
  }

  private buildUTM(coordinate: CoordinateValue): {
    zone: string;
    zoneLetter: string;
    easting: string;
    northing: string;
  } {
    const zoneNumber = Math.floor((coordinate.lon + 180) / 6) + 1;
    const zoneLetter = this.latToZoneLetter(coordinate.lat);
    const utmProjection = this.getUtmProjString(zoneNumber, zoneLetter);
    const [easting, northing] = proj4(WGS84, utmProjection, [
      coordinate.lon,
      coordinate.lat,
    ]);

    return {
      zone: zoneNumber.toString(),
      zoneLetter,
      easting: Math.round(easting).toString(),
      northing: Math.round(northing).toString(),
    };
  }

  private parseDD(value: string): CoordinateValue | null {
    const regex =
      /^\s*(-?\d+(?:\.\d+)?)°?\s*([NS])?\s*[;,]?\s*(-?\d+(?:\.\d+)?)°?\s*([EW])?\s*$/i;
    const match = value.trim().match(regex);
    if (!match) return null;
    let lat = Number(match[1]);
    let lon = Number(match[3]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    const latDir = match[2]?.toUpperCase();
    const lonDir = match[4]?.toUpperCase();
    if (latDir === 'S') lat = -Math.abs(lat);
    if (latDir === 'N') lat = Math.abs(lat);
    if (lonDir === 'W') lon = -Math.abs(lon);
    if (lonDir === 'E') lon = Math.abs(lon);
    if (!this.isValidLat(lat) || !this.isValidLon(lon)) return null;
    return { lat, lon };
  }

  private parseDDM(value: string): CoordinateValue | null {
    const regex =
      /^\s*(\d{1,3})°\s*(\d+(?:\.\d+)?)'\s*([NS])?\s*[;,]?\s*(\d{1,3})°\s*(\d+(?:\.\d+)?)'\s*([EW])?\s*$/i;
    const match = value.trim().match(regex);
    if (!match) return null;
    let lat = Number(match[1]) + Number(match[2]) / 60;
    let lon = Number(match[4]) + Number(match[5]) / 60;
    const latDir = match[3]?.toUpperCase();
    const lonDir = match[6]?.toUpperCase();
    if (latDir === 'S') lat = -Math.abs(lat);
    if (latDir === 'N') lat = Math.abs(lat);
    if (lonDir === 'W') lon = -Math.abs(lon);
    if (lonDir === 'E') lon = Math.abs(lon);
    if (!this.isValidLat(lat) || !this.isValidLon(lon)) return null;
    return { lat, lon };
  }

  private parseDMS(value: string): CoordinateValue | null {
    const regex =
      /^\s*(\d{1,3})°\s*(\d{1,3})'\s*(\d+(?:\.\d+)?)"\s*([NS])?\s*[;,]?\s*(\d{1,3})°\s*(\d{1,3})'\s*(\d+(?:\.\d+)?)"\s*([EW])?\s*$/i;
    const match = value.trim().match(regex);
    if (!match) return null;
    let lat =
      Number(match[1]) + Number(match[2]) / 60 + Number(match[3]) / 3600;
    let lon =
      Number(match[5]) + Number(match[6]) / 60 + Number(match[7]) / 3600;
    const latDir = match[4]?.toUpperCase();
    const lonDir = match[8]?.toUpperCase();
    if (latDir === 'S') lat = -Math.abs(lat);
    if (latDir === 'N') lat = Math.abs(lat);
    if (lonDir === 'W') lon = -Math.abs(lon);
    if (lonDir === 'E') lon = Math.abs(lon);
    if (!this.isValidLat(lat) || !this.isValidLon(lon)) return null;
    return { lat, lon };
  }

  private parseLongLat(value: string): CoordinateValue | null {
    const regex = /^\s*(-?\d+(?:\.\d+)?)°?\s*,\s*(-?\d+(?:\.\d+)?)°?\s*$/;
    const match = value.trim().match(regex);
    if (!match) return null;
    const lon = Number(match[1]);
    const lat = Number(match[2]);
    if (!this.isValidLat(lat) || !this.isValidLon(lon)) return null;
    return { lat, lon };
  }

  private parseMGRS(value: string): CoordinateValue | null {
    try {
      const cleaned = value.trim().replace(/\s+/g, '');
      const point = mgrs.toPoint(cleaned);
      if (!point) return null;
      const [lon, lat] = point;
      if (!this.isValidLat(lat) || !this.isValidLon(lon)) return null;
      return { lat, lon };
    } catch {
      return null;
    }
  }

  private parseUSNG(value: string): CoordinateValue | null {
    return this.parseMGRS(value);
  }

  private parseUTM(value: string): CoordinateValue | null {
    const regex =
      /^\s*(\d{1,2})([C-HJ-NP-X])\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$/i;
    const match = value.trim().match(regex);
    if (!match) return null;
    const zoneNumber = Number(match[1]);
    const zoneLetter = match[2].toUpperCase();
    const easting = Number(match[3]);
    const northing = Number(match[4]);
    const utmProjection = this.getUtmProjString(zoneNumber, zoneLetter);
    try {
      const [lon, lat] = proj4(utmProjection, WGS84, [easting, northing]);
      if (!this.isValidLat(lat) || !this.isValidLon(lon)) return null;
      return { lat, lon };
    } catch {
      return null;
    }
  }

  private getUtmProjString(zone: number, zoneLetter: string): string {
    const south = zoneLetter < 'N';
    return `+proj=utm +zone=${zone} ${south ? '+south' : ''} +datum=WGS84 +units=m +no_defs`;
  }

  private latToZoneLetter(lat: number): string {
    if (lat > 84) return 'X';
    if (lat < -80) return 'C';
    const letters = 'CDEFGHJKLMNPQRSTUVWX';
    const index = Math.floor((lat + 80) / 8);
    return letters.charAt(index);
  }

  private formatMgrsString(value: string): string {
    const zoneNumberMatch = value.match(/^\d+/);
    if (!zoneNumberMatch) return value;
    const zoneNumber = zoneNumberMatch[0];
    const rest = value.slice(zoneNumber.length);
    const zoneLetter = rest.charAt(0);
    const square = rest.slice(1, 3);
    const remainder = rest.slice(3);
    const half = remainder.length / 2;
    const easting = remainder.slice(0, half);
    const northing = remainder.slice(half);
    return `${zoneNumber}${zoneLetter} ${square} ${easting} ${northing}`.trim();
  }

  private applyPattern(
    pattern: string,
    tokens: Record<string, string>,
  ): string {
    return pattern.replace(
      /\{\{(.*?)\}\}/g,
      (_, token: string) => tokens[token] ?? '',
    );
  }

  getFormatLabel(id: CoordinateFormatId): string {
    const format = this.formats.find((f) => f.id === id);
    return format?.label ?? id.toUpperCase();
  }

  copyFieldValue(value: string): void {
    if (!value) return;
    this.clipboard.copy(value);
    this.snackBar.open('Valor copiado', 'Fechar', { duration: 2000 });
  }

  focusCurrentCoordinate(): void {
    if (!this.map || !this.currentCoordinate) return;
    const { lon, lat } = this.currentCoordinate;
    const view = this.map.getView();
    view.animate({
      center: fromLonLat([lon, lat]),
      zoom: Math.max(view.getZoom() ?? 15, 16),
      duration: 450,
    });
  }

  private toFixed(value: number, decimals: number): string {
    return (
      Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
    ).toFixed(decimals);
  }

  private isValidLat(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  private isValidLon(lon: number): boolean {
    return lon >= -180 && lon <= 180;
  }

  private updateFormatFields(
    format: FormatState,
    coordinate: CoordinateValue | null,
  ): void {
    if (!coordinate) {
      format.fields = [];
      return;
    }

    const tokens = this.buildTokens(coordinate);
    const {
      latAbs,
      latDir,
      lonAbs,
      lonDir,
      latDeg,
      lonDeg,
      latMin,
      lonMin,
      latMinInt,
      lonMinInt,
      latSec,
      lonSec,
    } = tokens;

    switch (format.id) {
      case 'address':
        format.fields = [
          {
            label: '',
            value: this.reverseAddress || format.value || '',
          },
        ];
        break;
      case 'dd':
        format.fields = [
          { label: '', value: `${latAbs}°${latDir}, ${lonAbs}°${lonDir}` },
        ];
        break;
      case 'ddm':
        format.fields = [
          {
            label: '',
            value: `${latDeg}° ${latMin}'${latDir}, ${lonDeg}° ${lonMin}'${lonDir}`,
          },
        ];
        break;
      case 'dms':
        format.fields = [
          {
            label: '',
            value: `${latDeg}° ${latMinInt}' ${latSec}"${latDir}, ${lonDeg}° ${lonMinInt}' ${lonSec}"${lonDir}`,
          },
        ];
        break;
      case 'longlat':
        format.fields = [
          {
            label: '',
            value: `${this.toFixed(coordinate.lat, 6)}°, ${this.toFixed(coordinate.lon, 6)}°`,
          },
        ];
        break;
      case 'mgrs':
        format.fields = [{ label: '', value: this.buildMGRS(coordinate) }];
        break;
      case 'usng':
        format.fields = [{ label: '', value: this.buildUSNG(coordinate) }];
        break;
      case 'utm': {
        const utm = this.buildUTM(coordinate);
        format.fields = [
          {
            label: '',
            value: `${utm.zone}${utm.zoneLetter} ${utm.easting} ${utm.northing}`,
          },
        ];
        break;
      }
      default:
        format.fields = format.value
          ? [{ label: format.label, value: format.value }]
          : [];
    }
  }
}
