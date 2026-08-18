import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, Type } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { catchError, of } from 'rxjs';
import { AdminRoutesService } from 'src/app/services/admin.routes.service';
import { PacotesConceituaisComponent } from './pacotes-conceituais/pacotes-conceituais.component';
import { GruposComponent } from './grupos/grupos.component';
import { TemasComponent } from './temas/temas.component';
import { AuthenticateService } from 'src/app/services/api/authenticate.service';
import { Router } from '@angular/router';
import { GeralComponent } from './geral/geral.component';
import { ComponentesComponent } from './componentes/componentes.component';
import { BasemapsComponent } from './basemaps/basemaps.component';
import { MembersComponent } from '../members/members.component';
import { FetchConfigsService } from 'src/app/services/api/fetch.configs.service';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { FetchPacotesConceituaisService } from 'src/app/services/api/fetch.pacotes.conceituais.service';
import { FetchComponenteService } from 'src/app/services/api/fetch-componente.service';
import { FetchBasemapsService } from 'src/app/services/api/fetch.basemaps.service';
import { FetchUsuariosService } from 'src/app/services/api/fetch.usuarios.service';

interface AdminSection {
  key: string;
  component: Type<any>;
  navLabel: string;
  navSubtitle: string;
  titleMain: string;
  titleEm?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatListModule, MatNativeDateModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  isSidenavOpened = true;
  currentComponent: Type<any> | null = GeralComponent;

  PacotesConceituaisComponent = PacotesConceituaisComponent;
  TemasComponent = TemasComponent;
  GruposComponent = GruposComponent;
  GeralComponent = GeralComponent;
  ComponentesComponent = ComponentesComponent;
  BasemapsComponent = BasemapsComponent;
  MembersComponent = MembersComponent;

  isAdmin: boolean = false;

  // ─── Mobile shell (índice + drill-in) ──────────────────────────────────
  isMobileViewport = false;
  mobileShowIndex = true;
  mobileSectionSheetOpen = false;

  sections: AdminSection[] = [
    {
      key: 'geral',
      component: GeralComponent,
      navLabel: 'Geral',
      navSubtitle: 'Parâmetros do sistema',
      titleMain: 'Configurações',
      titleEm: 'do sistema',
    },
    {
      key: 'pacotes',
      component: PacotesConceituaisComponent,
      navLabel: 'Pacotes Conceituais',
      navSubtitle: 'Modelos de dados',
      titleMain: 'Pacotes',
      titleEm: 'conceituais',
    },
    {
      key: 'temas',
      component: TemasComponent,
      navLabel: 'Temas',
      navSubtitle: 'Temas geoespaciais',
      titleMain: 'Temas',
      titleEm: 'geoespaciais',
    },
    {
      key: 'grupos',
      component: GruposComponent,
      navLabel: 'Grupos',
      navSubtitle: 'Grupos de camadas',
      titleMain: 'Grupos',
      titleEm: 'de camadas',
    },
    {
      key: 'componentes',
      component: ComponentesComponent,
      navLabel: 'Componentes',
      navSubtitle: 'Módulos do WebGIS',
      titleMain: 'Configuração de',
      titleEm: 'componentes',
    },
    {
      key: 'basemaps',
      component: BasemapsComponent,
      navLabel: 'Basemaps',
      navSubtitle: 'Mapas de fundo',
      titleMain: 'Basemaps',
      titleEm: 'do mapa',
    },
    {
      key: 'membros',
      component: MembersComponent,
      navLabel: 'Membros',
      navSubtitle: 'Usuários e permissões',
      titleMain: 'Membros',
      titleEm: 'da organização',
    },
  ];

  // Seções de lista (3C) mostram a contagem no header mobile no lugar da
  // ação de seção; as demais não têm essa faixa.
  listSectionNouns: Record<string, string> = {
    temas: 'temas',
    grupos: 'grupos',
    pacotes: 'pacotes',
    basemaps: 'basemaps',
  };

  sectionCounts: Record<string, number | null> = {
    geral: null,
    pacotes: null,
    temas: null,
    grupos: null,
    componentes: null,
    basemaps: null,
    membros: null,
  };
  private countsLoaded = false;

  constructor(
    public adminRoutesService: AdminRoutesService,
    private authService: AuthenticateService,
    private router: Router,
    private fetchConfigsService: FetchConfigsService,
    private fetchTemasService: FetchTemasService,
    private fetchGrupoTemaService: FetchGrupoTemaService,
    private fetchPacotesService: FetchPacotesConceituaisService,
    private fetchComponenteService: FetchComponenteService,
    private fetchBasemapsService: FetchBasemapsService,
    private fetchUsuariosService: FetchUsuariosService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    if (!this.isAdmin) {
      return;
    }

    this.adminRoutesService.component$.subscribe((component: any) => {
      if (!component) {
        this.currentComponent = GeralComponent;
        this.adminRoutesService.setComponent(GeralComponent);
        return;
      }
      this.currentComponent = component;
    });

    this.updateViewportState();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportState();
  }

  private updateViewportState(): void {
    const wasMobile = this.isMobileViewport;
    this.isMobileViewport = window.matchMedia('(max-width: 768px)').matches;

    if (this.isMobileViewport && !wasMobile) {
      this.loadSectionCounts();
    }
  }

  openComponent(component: Type<any>) {
    this.adminRoutesService.setComponent(component);
  }

  // Índice mobile: escolher uma seção sai do índice e navega até ela.
  openSection(section: AdminSection): void {
    this.adminRoutesService.setComponent(section.component);
    this.mobileShowIndex = false;
    this.mobileSectionSheetOpen = false;
    if (this.isMobileViewport) {
      this.refreshSectionCount(section.key);
    }
  }

  openIndex(): void {
    this.mobileShowIndex = true;
    this.mobileSectionSheetOpen = false;
  }

  toggleSectionSheet(): void {
    this.mobileSectionSheetOpen = !this.mobileSectionSheetOpen;
  }

  closeSectionSheet(): void {
    this.mobileSectionSheetOpen = false;
  }

  currentSection(): AdminSection | undefined {
    return this.sections.find((s) => s.component === this.currentComponent);
  }

  currentListNoun(): string | null {
    const section = this.currentSection();
    return section ? this.listSectionNouns[section.key] ?? null : null;
  }

  private countFetchers: Record<string, () => void> = {
    geral: () =>
      this.fetchConfigsService
        .getConfigs()
        .pipe(catchError(() => of(null)))
        .subscribe((v) => (this.sectionCounts['geral'] = v ? v.length : null)),
    pacotes: () =>
      this.fetchPacotesService
        .getAllPacotes()
        .pipe(catchError(() => of(null)))
        .subscribe((v) => (this.sectionCounts['pacotes'] = v ? v.length : null)),
    temas: () =>
      this.fetchTemasService
        .getTemas()
        .pipe(catchError(() => of(null)))
        .subscribe((v) => (this.sectionCounts['temas'] = v ? v.length : null)),
    grupos: () =>
      this.fetchGrupoTemaService
        .getAllGrupos()
        .pipe(catchError(() => of(null)))
        .subscribe((v) => (this.sectionCounts['grupos'] = v ? v.length : null)),
    componentes: () =>
      this.fetchComponenteService
        .getComponentes()
        .pipe(catchError(() => of(null)))
        .subscribe((v) => (this.sectionCounts['componentes'] = v ? v.length : null)),
    basemaps: () =>
      this.fetchBasemapsService
        .getBasemaps()
        .pipe(catchError(() => of(null)))
        .subscribe((v) => (this.sectionCounts['basemaps'] = v ? v.length : null)),
    membros: () =>
      this.fetchUsuariosService
        .getUsers()
        .pipe(catchError(() => of(null)))
        .subscribe((v) => (this.sectionCounts['membros'] = v ? v.length : null)),
  };

  private loadSectionCounts(): void {
    if (this.countsLoaded) {
      return;
    }
    this.countsLoaded = true;
    Object.values(this.countFetchers).forEach((fetch) => fetch());
  }

  // Refaz a contagem da seção ao entrar nela — mantém o badge do header
  // mobile atualizado após criar/excluir itens numa visita anterior.
  private refreshSectionCount(key: string): void {
    this.countFetchers[key]?.();
  }
}
