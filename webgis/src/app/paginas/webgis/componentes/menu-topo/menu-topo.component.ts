import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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

interface RibbonListItem {
  icon: string;
  titulo: string;
  descricao: string;
  disabled?: boolean;
  action: () => void;
}

interface RibbonListSection {
  titulo: string;
  items: RibbonListItem[];
}

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
  /** 'ribbon' = barra horizontal do desktop (padrão). 'list' = lista rotulada do drawer mobile. */
  @Input() variant: 'ribbon' | 'list' = 'ribbon';
  /** Emitido quando uma ferramenta é acionada na variante 'list', para o drawer mobile se fechar. */
  @Output() toolSelected = new EventEmitter<void>();

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

  /** Estrutura em seções usada pela variante 'list' do drawer mobile. */
  get visibleSections(): RibbonListSection[] {
    const sections: RibbonListSection[] = [
      {
        titulo: 'PESQUISAR',
        items: [
          {
            icon: 'travel_explore',
            titulo: 'Pesquisa espacial',
            descricao: 'Desenhar área no mapa',
            action: () => this.onPesquisaEspacialClick(),
          },
          {
            icon: 'layers',
            titulo: 'Pesquisar por camadas',
            descricao: 'Filtrar por atributos',
            action: () => this.onPesquisarPorCamadasClick(),
          },
          {
            icon: 'my_location',
            titulo: 'Por coordenadas',
            descricao: 'UTM, MGRS ou grau',
            action: () => this.onCoordinateConverterClick(),
          },
        ],
      },
      {
        titulo: 'IMPRIMIR',
        items: [
          {
            icon: 'print',
            titulo: 'Impressão de croquis',
            descricao: this.impressaoCroquisHabilitada
              ? 'Imprimir croqui da vistoria atual'
              : 'Selecione uma vistoria',
            disabled: !this.impressaoCroquisHabilitada,
            action: () => this.onImprimirDadosVistoriaClick(),
          },
        ],
      },
    ];

    if (this.pitometriaHabilitada && this.podeVerPitometria) {
      sections.push({
        titulo: 'PITOMETRIA',
        items: [
          {
            icon: 'water_drop',
            titulo: 'Pitometria',
            descricao: 'Cadastro de campanhas',
            action: () => this.onPitometriaClick(),
          },
          {
            icon: 'analytics',
            titulo: 'Consulta DW',
            descricao: 'Série histórica',
            action: () => this.onConsultaPitometriaClick(),
          },
          {
            icon: 'travel_explore',
            titulo: 'Consulta espacial',
            descricao: 'Pitometria por área',
            action: () => this.onConsultaEspacialPitometriaClick(),
          },
        ],
      });
    }

    return sections;
  }

  onListItemClick(item: RibbonListItem): void {
    if (item.disabled) return;
    item.action();
    this.toolSelected.emit();
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
