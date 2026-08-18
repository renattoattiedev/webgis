import {
  Component,
  HostBinding,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { MyContentComponent } from '../my-content/my-content.component';
import { OrganizationContentComponent } from '../organization-content/organization-content.component';
import { AdminComponent } from '../admin/admin.component';
import { MapsComponent } from '../maps/maps.component';
import { GruposPageComponent } from '../grupos/grupos-page.component';
import { RelatorioPageComponent } from '../relatorio/relatorio-page.component';

import { AuthenticateService } from 'src/app/services/api/authenticate.service';
import { PerfilUsuarioComponent } from '../../security/perfil-usuario/perfil-usuario.component';
import { Mapas } from 'src/app/models/mapas.model';

interface AppTab {
  label: string;
  icon: string; // chave do switch de ícones no template
  visible: () => boolean;
}

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [
    CommonModule,
    MyContentComponent,
    OrganizationContentComponent,
    MapsComponent,
    GruposPageComponent,
    AdminComponent,
    RelatorioPageComponent,
  ],
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss',
})
export class ContentComponent implements OnInit {
  @ViewChildren(MyContentComponent)
  myContentComponents!: QueryList<MyContentComponent>;
  @ViewChildren(OrganizationContentComponent)
  organizationContentComponents!: QueryList<OrganizationContentComponent>;
  @ViewChildren(AdminComponent) adminComponents!: QueryList<AdminComponent>;
  @ViewChildren(MapsComponent) mapsComponent!: QueryList<MapsComponent>;

  titulo: string | null = null;
  perfilUser: string | null = null;
  nomeUsuario: string | null = null;
  menuAberto = false;
  isHighUser = false;

  activeTabIndex = 0;
  activeTabLabel = 'Minha Organização';
  /** Última aba de conteúdo antes de entrar em Mapas — usada pelo ‹ voltar mobile. */
  private previousTabLabel: string | null = null;

  /** Mobile (≤768px): esconde a faixa de tabs quando o mapa está aberto. */
  @HostBinding('class.is-maps-mobile')
  get isMapsMobileActive(): boolean {
    return this.activeTabLabel === 'Mapas';
  }

  /** Definição das abas — mesmas labels usadas pelos *ngIf do template. */
  tabs: AppTab[] = [
    {
      label: 'Meu Conteúdo',
      icon: 'folder',
      visible: () => this.podeVerMeuConteudo,
    },
    { label: 'Minha Organização', icon: 'org', visible: () => this.isHighUser },
    { label: 'Mapas', icon: 'map', visible: () => this.isHighUser },
    {
      label: 'Relatórios',
      icon: 'chart',
      visible: () =>
        this.perfilUser === 'Admin' || this.perfilUser === 'Editor',
    },
    { label: 'Grupos', icon: 'users', visible: () => true },
    {
      label: 'Administração',
      icon: 'gear',
      visible: () => this.perfilUser === 'Admin',
    },
  ];

  constructor(
    private authService: AuthenticateService,
    private router: Router,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    this.isHighUser = this.authService.isHighUser();
    this.nomeUsuario = this.authService.getNomeUsuario();
    this.perfilUser = this.authService.getPerfilUsuario();
    this.activeTabLabel = this.podeVerMeuConteudo
      ? 'Meu Conteúdo'
      : this.isHighUser
        ? 'Minha Organização'
        : 'Grupos';
    this.activeTabIndex = this.visibleTabs.findIndex(
      (t) => t.label === this.activeTabLabel,
    );
    if (this.activeTabIndex < 0) this.activeTabIndex = 0;
  }

  get podeVerMeuConteudo(): boolean {
    return this.perfilUser === 'Admin' || this.perfilUser === 'Publicador';
  }

  get visibleTabs(): AppTab[] {
    return this.tabs.filter((t) => t.visible());
  }

  get iniciais(): string {
    return (this.nomeUsuario ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('');
  }

  /** Compatível com o método original `selectTab(index)`. */
  selectTab(index: number): void {
    const tab = this.visibleTabs[index];
    if (!tab) return;
    if (this.activeTabLabel !== 'Mapas') this.previousTabLabel = this.activeTabLabel;
    this.activeTabIndex = index;
    this.activeTabLabel = tab.label;
  }

  selectTabByLabel(tab: AppTab): void {
    const idx = this.visibleTabs.findIndex((t) => t.label === tab.label);
    if (idx < 0) return;
    if (this.activeTabLabel !== 'Mapas') this.previousTabLabel = this.activeTabLabel;
    this.activeTabIndex = idx;
    this.activeTabLabel = tab.label;
  }

  /** ‹ voltar do mapa (mobile v2): reexibe as tabs / volta para a última aba de conteúdo. */
  onExitMobileMap(): void {
    const fallback = this.podeVerMeuConteudo
      ? 'Meu Conteúdo'
      : this.isHighUser
        ? 'Minha Organização'
        : 'Grupos';
    const targetLabel = this.previousTabLabel || fallback;
    const tab = this.visibleTabs.find((t) => t.label === targetLabel);
    if (tab) this.selectTabByLabel(tab);
  }

  toggleUserMenu(event?: Event): void {
    event?.stopPropagation();
    this.menuAberto = !this.menuAberto;
  }

  closeUserMenu(): void {
    this.menuAberto = false;
  }

  goToPage(page: string): void {
    this.menuAberto = false;
    this.router.navigate([page]);
  }

  logout(): void {
    this.menuAberto = false;
    this.authService.logout();
    const urlIntended = this.authService.getUrlIntended();
    this.router.navigateByUrl(urlIntended);
  }

  mostrarPerfil(): void {
    this.menuAberto = false;
    this.dialog.open(PerfilUsuarioComponent, { width: '800px' });
  }

  onMapaSalvo(mapaAtualizado: Mapas): void {
    this.titulo = mapaAtualizado.tituloMapa;
  }
}
