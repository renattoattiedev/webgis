import { NgIf } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subscription } from 'rxjs';
import { MapaService } from 'src/app/services/mapa.service';
import { Map } from 'ol';
import { getPointResolution } from 'ol/proj';

@Component({
  selector: 'app-escala',
  standalone: true,
  imports: [MatInputModule, MatButtonModule, FormsModule, NgIf],
  templateUrl: './escala.component.html',
  styleUrl: './escala.component.scss',
})
export class EscalaComponent implements OnInit, OnDestroy {
  @ViewChild('scaleBar', { static: true })
  scaleBar!: ElementRef<HTMLDivElement>;
  @ViewChild('scaleInput', { static: false })
  scaleInput!: ElementRef<HTMLInputElement>;

  private map$!: Observable<Map>;
  private mapSubscription!: Subscription;
  private scaleSubscription!: Subscription;
  private manualZoomSubscription!: Subscription;

  currentScale: string = '1:900.000';
  scaleValue: number = 900000;
  isEditing: boolean = false;
  editingValue: string = '';
  manuallySet: boolean = false;
  mapInitialized: boolean = false;
  customZoomActive: boolean = false;

  units = [
    { value: 1, label: 'km', factor: 1000 },
    { value: 0.001, label: 'm', factor: 1 },
    { value: 0.000001, label: 'mm', factor: 0.001 },
  ];

  private readonly DPI = 96;
  private readonly INCHES_PER_METER = 39.37008;
  private readonly SCALE_STEP = 1000;

  constructor(
    private mapaService: MapaService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.map$ = this.mapaService.getMapaObservable();
    this.mapSubscription = this.map$.subscribe((map: Map) => {
      if (map && !this.mapInitialized) {
        this.mapInitialized = true;
        this.setupMapListeners(map);

        setTimeout(() => {
          this.applyInitialScale(map, 900000);
        }, 100);
      }
    });

    this.scaleSubscription = this.mapaService
      .getScaleObservable()
      .subscribe((scale: number) => {
        if (scale !== this.scaleValue) {
          this.customZoomActive = true;
          this.scaleValue = scale;
          this.currentScale = `1:${this.formatNumber(this.scaleValue)}`;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.customZoomActive = false;
          }, 200);
        }
      });

    this.manualZoomSubscription = this.mapaService
      .getManualZoomObservable()
      .subscribe((isManual: boolean) => {
        if (isManual) {
          this.manuallySet = true;
          this.customZoomActive = true;
        } else {
          setTimeout(() => {
            this.manuallySet = false;
            this.customZoomActive = false;
          }, 50);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
    if (this.scaleSubscription) {
      this.scaleSubscription.unsubscribe();
    }
    if (this.manualZoomSubscription) {
      this.manualZoomSubscription.unsubscribe();
    }
  }

  private setupMapListeners(map: Map): void {
    map.getView().on('change:resolution', () => {
      if (!this.manuallySet && this.mapInitialized && !this.customZoomActive) {
        setTimeout(() => {
          if (!this.manuallySet && !this.customZoomActive) {
            this.updateScale(map);
          }
        }, 50);
      }
    });

    map.getView().on('change:center', () => {
      if (!this.manuallySet && this.mapInitialized && !this.customZoomActive) {
        setTimeout(() => {
          if (!this.manuallySet && !this.customZoomActive) {
            this.updateScale(map);
          }
        }, 50);
      }
    });
  }

  private updateScale(map: Map): void {
    const view = map.getView();
    const resolution = view.getResolution();
    const center = view.getCenter();
    const projection = view.getProjection();

    if (!resolution || !center) return;

    try {
      const pointResolution = getPointResolution(
        projection,
        resolution,
        center,
      );

      const scale = this.calculateScale(pointResolution);
      const newScaleValue = Math.round(scale);

      // Só atualizar se a diferença for significativa (evita loops)
      if (Math.abs(newScaleValue - this.scaleValue) > 10) {
        this.scaleValue = newScaleValue;
        this.currentScale = `1:${this.formatNumber(this.scaleValue)}`;

        // Atualizar também o serviço para manter sincronizado
        if (
          Math.abs(this.mapaService.getCurrentScale() - this.scaleValue) > 10
        ) {
          this.mapaService.updateScale(this.scaleValue);
        }

        this.cdr.detectChanges();
      }
    } catch (error) {
      const scale = this.calculateScale(resolution);
      const newScaleValue = Math.round(scale);

      if (Math.abs(newScaleValue - this.scaleValue) > 10) {
        this.scaleValue = newScaleValue;
        this.currentScale = `1:${this.formatNumber(this.scaleValue)}`;

        if (
          Math.abs(this.mapaService.getCurrentScale() - this.scaleValue) > 10
        ) {
          this.mapaService.updateScale(this.scaleValue);
        }

        this.cdr.detectChanges();
      }
    }
  }

  private calculateScale(resolution: number): number {
    return resolution * this.DPI * this.INCHES_PER_METER;
  }

  private formatNumber(num: number): string {
    return num.toLocaleString('pt-BR');
  }

  onDoubleClick(): void {
    if (this.isEditing) return;

    this.isEditing = true;
    this.editingValue = this.scaleValue.toString();

    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.scaleInput) {
        this.scaleInput.nativeElement.focus();
        this.scaleInput.nativeElement.select();
      }
    }, 100);
  }

  confirmEdit(): void {
    const newScale = parseFloat(this.editingValue.replace(/[^\d]/g, ''));

    if (isNaN(newScale) || newScale <= 0) {
      this.cancelEdit();
      return;
    }

    const roundedScale =
      Math.round(newScale / this.SCALE_STEP) * this.SCALE_STEP;

    this.manuallySet = true;

    this.applyScale(roundedScale);
    this.isEditing = false;

    this.recenterComponent();

    setTimeout(() => {
      this.manuallySet = false;
    }, 3000);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingValue = '';

    this.recenterComponent();
  }

  private recenterComponent(): void {
    if (this.scaleBar) {
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 50);
    }
  }

  private applyInitialScale(map: Map, targetScale: number): void {
    const view = map.getView();
    const center = view.getCenter();
    const projection = view.getProjection();

    if (!center) return;

    try {
      let targetResolution = targetScale / (this.DPI * this.INCHES_PER_METER);

      if (projection.getUnits() === 'degrees') {
        const currentPointResolution = getPointResolution(
          projection,
          1,
          center,
        );
        targetResolution = targetResolution / currentPointResolution;
      }

      view.setResolution(targetResolution);

      this.scaleValue = targetScale;
      this.currentScale = `1:${this.formatNumber(this.scaleValue)}`;
      this.cdr.detectChanges();

      this.mapaService.updateScale(targetScale);

      this.manuallySet = true;
      setTimeout(() => {
        this.manuallySet = false;
      }, 2000);
    } catch (error) {
      this.scaleValue = targetScale;
      this.currentScale = `1:${this.formatNumber(this.scaleValue)}`;
      this.mapaService.updateScale(targetScale);
      this.cdr.detectChanges();
    }
  }

  private applyScale(targetScale: number): void {
    this.map$ = this.mapaService.getMapaObservable();
    this.map$.subscribe((map: Map) => {
      if (map) {
        const view = map.getView();
        const center = view.getCenter();
        const projection = view.getProjection();

        if (!center) return;

        try {
          let targetResolution =
            targetScale / (this.DPI * this.INCHES_PER_METER);

          if (projection.getUnits() === 'degrees') {
            const currentPointResolution = getPointResolution(
              projection,
              1,
              center,
            );
            targetResolution = targetResolution / currentPointResolution;
          }

          view.animate({
            resolution: targetResolution,
            duration: 250,
          });

          this.scaleValue = targetScale;
          this.currentScale = `1:${this.formatNumber(this.scaleValue)}`;
          this.cdr.detectChanges();
        } catch (error) {
          this.scaleValue = targetScale;
          this.currentScale = `1:${this.formatNumber(this.scaleValue)}`;
          this.cdr.detectChanges();
        }
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.confirmEdit();
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }

  onBlur(): void {
    setTimeout(() => {
      if (this.isEditing) {
        this.confirmEdit();
      }
    }, 150);
  }

  onInputChange(event: any): void {
    const value = event.target.value;
    this.editingValue = value.replace(/[^\d]/g, '');
  }

  private cleanup(): void {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
  }
}
