import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TematicasComponent } from './tematicas/tematicas.component';
import { AuthenticateService } from 'src/app/services/api/authenticate.service';
import { PerfilUsuarioComponent } from '../security/perfil-usuario/perfil-usuario.component';
import { MatDialog } from '@angular/material/dialog';
import { FetchIndicadoresService } from 'src/app/services/api/fetch.indicadores.service';

interface IndicadorIDE {
  valor: string;
  label: string;
}

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, TematicasComponent],
})
export class IndexComponent implements OnInit {
  perfilUser = '';
  nomeUsuario = '';
  menuAberto = false;

  indicadores: IndicadorIDE[] = [];

  modules = [
    {
      id: 'webgis',
      nome: 'WebGIS',
      descricao: 'Visualização interativa de camadas e dados geoespaciais',
      ativo: true,
    },
    {
      id: 'dados',
      nome: 'Dados',
      descricao: 'Download de conjuntos de dados geoespaciais',
      ativo: false,
    },
    {
      id: 'metadados',
      nome: 'Metadados',
      descricao: 'Informações detalhadas sobre os dados disponíveis',
      ativo: false,
    },
    {
      id: 'dashboards',
      nome: 'Dashboards',
      descricao: 'Painéis de indicadores e análises geoespaciais',
      ativo: false,
    },
    {
      id: 'aplicacoes',
      nome: 'Aplicações',
      descricao: 'Apps desenvolvidos pela RunForrestGIS para saneamento',
      ativo: false,
    },
  ];

  constructor(
    private router: Router,
    private authService: AuthenticateService,
    private fetchIndicadoresService: FetchIndicadoresService,
    public dialog: MatDialog,
  ) {
    this.authService.setUrlIntended(this.router.url);
  }

  ngOnInit(): void {
    this.perfilUser = this.authService.getPerfilUsuario();
    this.nomeUsuario = this.authService.getNomeUsuario();
    this.carregarIndicadores();
  }

  private carregarIndicadores(): void {
    this.fetchIndicadoresService.getIndicadores().subscribe((data) => {
      this.indicadores = [
        { valor: String(data.camadasVetoriais + data.camadasRaster), label: 'camadas' },
        { valor: String(data.temas), label: 'temas ativos' },
        { valor: String(data.usuarios), label: 'usuários cadastrados' },
      ];
    });
  }

  get iniciais(): string {
    return this.nomeUsuario
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  }

  toggleMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  @HostListener('document:click', ['$event.target'])
  fecharMenu(target: EventTarget | null): void {
    if (!(target instanceof HTMLElement) || !target.closest('.nav-user')) {
      this.menuAberto = false;
    }
  }

  acessarModulo(modulo: (typeof this.modules)[0]): void {
    if (!modulo.ativo) return;
    this.router.navigate([modulo.id]);
  }

  mostrarPerfil(): void {
    this.menuAberto = false;
    this.dialog.open(PerfilUsuarioComponent, { width: '800px' });
  }

  goToPage(page: string): void {
    this.menuAberto = false;
    this.router.navigate([page]);
  }

  logout(): void {
    this.menuAberto = false;
    this.authService.logout();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdminOrPublisher(): boolean {
    return ['Admin', 'Publicador', 'Editor'].includes(this.perfilUser);
  }
}
