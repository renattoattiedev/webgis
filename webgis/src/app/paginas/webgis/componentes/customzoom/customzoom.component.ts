import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MapaService } from 'src/app/services/mapa.service';
import { Map } from 'ol';
import { getPointResolution } from 'ol/proj';
import { Observable, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-custom-zoom',
  templateUrl: './customzoom.component.html',
  styleUrls: ['./customzoom.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
})
export class CustomZoomComponent implements OnInit, OnDestroy {
  private map$!: Observable<Map>;
  private mapSubscription!: Subscription;

  private readonly DPI = 96;
  private readonly INCHES_PER_METER = 39.37008;
  private readonly SCALE_STEP = 1000;

  currentScale: number = 900000;
  isZooming: boolean = false;

  constructor(
    private mapaService: MapaService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.map$ = this.mapaService.getMapaObservable();
    this.mapSubscription = this.map$.subscribe((map: Map) => {
      if (map) {
        this.currentScale = 900000;
      }
    });

    this.mapaService.getScaleObservable().subscribe((scale: number) => {
      if (scale !== this.currentScale && !this.isZooming) {
        this.currentScale = scale;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
  }

  zoomIn(): void {
    this.map$ = this.mapaService.getMapaObservable();
    this.map$.subscribe((map: Map) => {
      if (map) {
        this.isZooming = true;

        this.mapaService.setManualZoom(true);

        const newScale = Math.max(
          this.currentScale - this.SCALE_STEP,
          this.SCALE_STEP,
        );

        this.currentScale = newScale;

        this.mapaService.updateScale(newScale);

        this.applyScale(map, newScale);

        setTimeout(() => {
          this.isZooming = false;
        }, 300);
      }
    });
  }

  zoomOut(): void {
    this.map$ = this.mapaService.getMapaObservable();
    this.map$.subscribe((map: Map) => {
      if (map) {
        this.isZooming = true;

        this.mapaService.setManualZoom(true);

        const newScale = this.currentScale + this.SCALE_STEP;

        this.currentScale = newScale;

        this.mapaService.updateScale(newScale);

        this.applyScale(map, newScale);

        setTimeout(() => {
          this.isZooming = false;
        }, 300);
      }
    });
  }

  private applyScale(map: Map, targetScale: number): void {
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

      view.animate({
        resolution: targetResolution,
        duration: 250,
        easing: (t) => t * (2 - t),
      });
    } catch (error) {
      const targetResolution = targetScale / (this.DPI * this.INCHES_PER_METER);
      view.animate({
        resolution: targetResolution,
        duration: 250,
      });
    }
  }

  syncWithScale(scale: number): void {
    this.currentScale = scale;
    this.cdr.detectChanges();
  }
  getCurrentPosition(): number {
    const minScale = 1000;
    const maxScale = 2000000;

    const percentage =
      ((this.currentScale - minScale) / (maxScale - minScale)) * 100;
    return Math.max(0, Math.min(100, percentage));
  }

  onRulerClick(event: MouseEvent): void {
    if (this.isZooming) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const percentage = (clickY / rect.height) * 100;

    const minScale = 1000;
    const maxScale = 2000000;

    const targetScale = minScale + (percentage / 100) * (maxScale - minScale);

    const roundedScale = Math.round(targetScale / 1000) * 1000;

    this.jumpToScale(Math.max(roundedScale, 1000));
  }
  jumpToScale(targetScale: number): void {
    if (this.isZooming || targetScale === this.currentScale) return;

    this.map$ = this.mapaService.getMapaObservable();
    this.map$.subscribe((map: Map) => {
      if (map) {
        this.isZooming = true;

        this.mapaService.setManualZoom(true);

        this.currentScale = targetScale;

        this.mapaService.updateScale(targetScale);

        this.applyScale(map, targetScale);

        setTimeout(() => {
          this.isZooming = false;
        }, 300);
      }
    });
  }
}
