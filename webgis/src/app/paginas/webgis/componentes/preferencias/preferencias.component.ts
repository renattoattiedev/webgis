import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserPreferencesService } from 'src/app/services/api/user-preferences.service';
import { MapaService } from 'src/app/services/mapa.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-preferencias',
  templateUrl: './preferencias.component.html',
  styleUrls: ['./preferencias.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
})
export class PreferenciasComponent implements OnInit {
  carregando = false;
  temPreferencia = false;
  ultimaAtualizacao: string | null = null;

  constructor(
    private userPreferencesService: UserPreferencesService,
    private mapaService: MapaService,
  ) {}

  ngOnInit(): void {
    // Carrega preferências e aplica quando o mapa estiver pronto
    this.userPreferencesService.fetchPreference().subscribe((pref) => {
      if (pref) {
        this.mapaService
          .getMapaObservable()
          .pipe(take(1))
          .subscribe(() => {
            this.userPreferencesService.applyPreference(pref);
          });
      }
    });

    // Assina para mudanças subsequentes
    this.userPreferencesService.preference$.subscribe((pref) => {
      this.temPreferencia = !!pref;
      this.ultimaAtualizacao = pref?.updatedAt || pref?.createdAt || null;
    });
  }

  salvarOuAtualizar() {
    const payload = this.userPreferencesService.captureCurrentState();
    this.carregando = true;
    const pref = this.userPreferencesService.getCurrentPreference();
    const obs = pref
      ? this.userPreferencesService.updatePreference(payload)
      : this.userPreferencesService.createPreference(payload);
    obs.subscribe({
      next: () => {
        this.carregando = false;
      },
      error: () => (this.carregando = false),
    });
  }

  aplicar() {
    const pref = this.userPreferencesService.getCurrentPreference();
    this.userPreferencesService.applyPreference(pref);
  }

  remover() {
    if (!confirm('Remover preferências salvas?')) return;
    this.carregando = true;
    this.userPreferencesService.deletePreference().subscribe({
      next: () => {
        this.carregando = false;
        this.temPreferencia = false;
      },
      error: () => (this.carregando = false),
    });
  }
}
