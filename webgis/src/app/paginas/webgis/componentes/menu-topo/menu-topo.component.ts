import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImprimirCroquiVistoriaComponent } from '../imprimir-croqui-vistoria/imprimir-croqui-vistoria.component';
import { SpatialSearchComponent } from '../spatial-search/spatial-search.component';
import { CoordinateConverterComponent } from '../coordinate-converter/coordinate-converter.component';
import { PitometriaCardComponent } from '../pitometria/pitometria-card.component';
import { ConsultaPitometriaComponent } from '../consulta-pitometria/consulta-pitometria.component';
import { ConsultaEspacialPitometriaComponent } from '../consulta-espacial-pitometria/consulta-espacial-pitometria.component';
import { ThematicCardComponent } from '../thematic/thematic-card.component';
import { CommonModule } from '@angular/common';
import { GetComponenteNomeService } from 'src/app/services/api/get-componente-nome.service';
import { AuthenticateService } from 'src/app/services/api/authenticate.service';
import { PesquisarCamadasUiStore } from '../pesquisar-camadas-dialog/pesquisar-camadas-ui.store';

@Component({
  selector: 'app-menu-topo',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ImprimirCroquiVistoriaComponent,
    SpatialSearchComponent,
    CoordinateConverterComponent,
    PitometriaCardComponent,
    ConsultaPitometriaComponent,
    ConsultaEspacialPitometriaComponent,
    ThematicCardComponent,
  ],
  templateUrl: './menu-topo.component.html',
  styleUrl: './menu-topo.component.scss',
})
export class MenuTopoComponent implements OnInit {
  vistoriaAtiva = false;
  spatialSearchAtiva = false;
  coordinateConverterAtivo = false;
  impressaoCroquisHabilitada = false;
  pitometriaAtiva = false;
  pitometriaHabilitada = false;
  consultaPitometriaAtiva = false;
  consultaEspacialPitometriaAtiva = false;
  visualizacaoTematicaAtiva = false;
  perfilUsuario = '';

  constructor(
    private getComponenteNomeService: GetComponenteNomeService,
    private authService: AuthenticateService,
    private pesquisarCamadasUiStore: PesquisarCamadasUiStore,
  ) {}

  ngOnInit(): void {
    this.perfilUsuario = this.authService.getPerfilUsuario();

    this.getComponenteNomeService
      .getComponenteByNome('imprimir-croqui')
      .subscribe({
        next: (componente) => {
          this.impressaoCroquisHabilitada = !!componente?.habilitado;
        },
        error: () => {
          this.impressaoCroquisHabilitada = false;
        },
      });

    this.getComponenteNomeService.getComponenteByNome('pitometria').subscribe({
      next: (componente) => {
        this.pitometriaHabilitada = !!componente?.habilitado;
      },
      error: () => {
        this.pitometriaHabilitada = false;
      },
    });
  }

  get podeVerPitometria(): boolean {
    return ['Admin', 'Editor'].includes(this.perfilUsuario);
  }

  onPesquisaEspacialClick() {
    console.log('Abrindo Pesquisa Espacial...');
    this.spatialSearchAtiva = true;
  }

  onPesquisarPorCamadasClick() {
    this.pesquisarCamadasUiStore.abrir();
  }

  onCoordinateConverterClick() {
    console.log('Abrindo Conversor de Coordenadas...');
    this.coordinateConverterAtivo = true;
  }

  onSpatialSearchFechada() {
    console.log('Pesquisa Espacial fechada');
    this.spatialSearchAtiva = false;
  }

  onCoordinateConverterFechado() {
    console.log('Conversor de Coordenadas fechado');
    this.coordinateConverterAtivo = false;
  }

  onImprimirDadosVistoriaClick() {
    console.log('Abrindo Vistoria...');

    // Se já está ativa, não fazer nada (ou focar)
    if (this.vistoriaAtiva) {
      console.log('Vistoria já está ativa');
      return;
    }

    // Ativar o componente
    this.vistoriaAtiva = true;
  }

  onVistoriaFechada() {
    this.vistoriaAtiva = false;
  }

  onPitometriaClick() {
    if (!this.podeVerPitometria) return;
    if (!this.pitometriaAtiva) {
      this.pitometriaAtiva = true;
    }
  }

  onPitometriaFechada() {
    this.pitometriaAtiva = false;
  }

  onConsultaPitometriaClick() {
    if (!this.podeVerPitometria) return;
    this.consultaPitometriaAtiva = true;
  }

  onConsultaPitometriaFechada() {
    this.consultaPitometriaAtiva = false;
  }

  onConsultaEspacialPitometriaClick() {
    if (!this.podeVerPitometria) return;
    this.consultaEspacialPitometriaAtiva = true;
  }

  onConsultaEspacialPitometriaFechada() {
    this.consultaEspacialPitometriaAtiva = false;
  }

  onVisualizacaoTematicaClick() {
    this.visualizacaoTematicaAtiva = true;
  }

  onVisualizacaoTematicaFechada() {
    this.visualizacaoTematicaAtiva = false;
  }
}
