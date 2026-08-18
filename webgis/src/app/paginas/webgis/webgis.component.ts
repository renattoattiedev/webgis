import { MediaMatcher } from '@angular/cdk/layout';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { AuthenticateService } from '../../services/api/authenticate.service';
import { MatMenu } from '@angular/material/menu';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ConteudosComponent } from './componentes/conteudos/conteudos.component';
import { MapaComponent } from './componentes/mapa/mapa.component';
import { MatTabsModule } from '@angular/material/tabs';
import { AdicionarDadosComponent } from './componentes/adicionar-dados/adicionar-dados.component';
import { AttributeTableComponent } from './componentes/attribute-table/attribute-table.component';
import { ConteudoService } from '../../services/api/conteudo.service';
import { PerfilConteudoComponent } from './componentes/perfil-conteudo/perfil-conteudo.component';
import { CommonModule } from '@angular/common';
import { PerfilUsuarioComponent } from '../security/perfil-usuario/perfil-usuario.component';
import { MatDialog } from '@angular/material/dialog';
import { MenuTopoComponent } from './componentes/menu-topo/menu-topo.component';
import { SearchAddressComponent } from './componentes/search-address/search-address.component';
import { PreferenciasComponent } from './componentes/preferencias/preferencias.component';
import { PesquisarCamadasDialogComponent } from './componentes/pesquisar-camadas-dialog/pesquisar-camadas-dialog.component';
import { PesquisarCamadasUiStore } from './componentes/pesquisar-camadas-dialog/pesquisar-camadas-ui.store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './webgis.component.html',
  styleUrls: ['./webgis.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    ConteudosComponent,
    MapaComponent,
    AdicionarDadosComponent,
    MatTabsModule,
    AttributeTableComponent,
    PerfilConteudoComponent,
    MenuTopoComponent,
    SearchAddressComponent,
    PreferenciasComponent,
    PesquisarCamadasDialogComponent,
  ],
})
export class WebgisComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('menu') menu!: MatMenu;
  @ViewChild('snav') sidenav!: MatSidenav;

  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;
  public perfilUser = '';
  public nomeUsuario = '';
  public isUserLoggedIn = false;
  public menuAberto = false;
  public mobileMenuOpen = false;
  public mobileSearchOpen = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private authService: AuthenticateService,
    private router: Router,
    private conteudoService: ConteudoService,
    public dialog: MatDialog,
    public pesquisarCamadasUiStore: PesquisarCamadasUiStore,
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.authService.setUrlIntended(this.router.url);
  }

  ngAfterViewInit(): void {
    this.conteudoService.setSidenav(this.sidenav);
  }

  ngOnInit(): void {
    this.updateUserInfo();

    // Se o AuthService tiver um Observable para mudanças de autenticação, subscribe nele
    // Caso contrário, use setInterval para verificar periodicamente
    this.checkAuthStatus();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private updateUserInfo(): void {
    this.perfilUser = this.authService.getPerfilUsuario();
    this.nomeUsuario = this.authService.getNomeUsuario();
    this.isUserLoggedIn = this.authService.isLoggedIn();

    console.log('Informações do usuário atualizadas:', {
      perfilUser: this.perfilUser,
      nomeUsuario: this.nomeUsuario,
      isLoggedIn: this.isUserLoggedIn,
    });

    // Força detecção de mudanças
    this.changeDetectorRef.detectChanges();
  }

  private checkAuthStatus(): void {
    // Verifica o status de autenticação periodicamente
    const authCheckInterval = setInterval(() => {
      const currentLoginStatus = this.authService.isLoggedIn();
      const currentPerfil = this.authService.getPerfilUsuario();

      if (
        this.isUserLoggedIn !== currentLoginStatus ||
        this.perfilUser !== currentPerfil
      ) {
        console.log('Status de autenticação mudou, atualizando...');
        this.updateUserInfo();
      }
    }, 1000); // Verifica a cada segundo

    // Limpa o interval quando o componente for destruído
    const sub = new Subscription(() => clearInterval(authCheckInterval));
    this.subscriptions.push(sub);
  }

  // Getter para verificar se deve mostrar o menu
  get shouldShowMenu(): boolean {
    return (
      this.isUserLoggedIn &&
      (this.perfilUser === 'Admin' ||
        this.perfilUser === 'Publicador' ||
        this.perfilUser === 'Editor')
    );
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
    const el = target instanceof Element ? target : null;

    if (!el || !el.closest('.wg-user-pill')) {
      this.menuAberto = false;
    }

    if (!el || (!el.closest('.header-tools') && !el.closest('.mobile-menu-btn'))) {
      this.mobileMenuOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  openMobileSearch(): void {
    this.mobileMenuOpen = false;
    this.mobileSearchOpen = true;
  }

  closeMobileSearch(): void {
    this.mobileSearchOpen = false;
  }

  toggleOverlay(isOpened: boolean) {
    const overlay = document.querySelector(
      '.example-sidenav-container',
    ) as HTMLElement;
    if (overlay) {
      overlay.style.backgroundColor = isOpened ? 'transparent' : '';
    }
  }

  logout() {
    console.log('Fazendo logout...');
    this.authService.logout();

    // Atualiza imediatamente as informações do usuário
    setTimeout(() => {
      this.updateUserInfo();
    }, 100);
  }

  mostrarPerfil() {
    const dialogRef = this.dialog.open(PerfilUsuarioComponent, {
      width: '800px',
    });
    dialogRef.afterClosed().subscribe((result) => {});
  }

  goToPage(page: string) {
    this.router.navigate([page]);
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
