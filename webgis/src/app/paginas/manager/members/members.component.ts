import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FetchUsuariosService } from 'src/app/services/api/fetch.usuarios.service';
import { User } from 'src/app/models/users.model';
import { catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FetchPerfisService } from 'src/app/services/api/fetch.perfis.service';
import { Perfil } from 'src/app/models/perfis.model';
import { MatSelectModule } from '@angular/material/select';
import { UpdatePerfilService } from 'src/app/services/api/update.perfil.service';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { AuthenticateService } from 'src/app/services/api/authenticate.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DeleteUserService } from 'src/app/services/api/delete.user.service';
import { RecoveryUserService } from 'src/app/services/api/recovery.user.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSidenavModule,
    MatSelectModule,
    MatListModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    FormsModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
  ],
  templateUrl: './members.component.html',
  styleUrl: './members.component.scss',
})
export class MembersComponent implements OnInit {
  displayedColumns: string[] = [
    'nome',
    'email',
    'ultimaAutenticacao',
    'perfil',
    'acoes',
  ];
  dataSourceUsuarios = new MatTableDataSource<User>();

  dataSourcePerfis: Perfil[] = [];
  todosUsuarios: User[] = [];
  selectedProfileId: string | null = null;
  selectedPeriodo: string | null = null;
  dataInicio: Date | null = null;
  dataFim: Date | null = null;
  userIdAutenticado: string | null = null;
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  isSidenavOpened = false;

  isAdmin: boolean = false;

  // ─── Mobile (3D) — chips no header + lista de cards ─────────────────────
  mobileVisibleCount = 10;
  mobilePeriodSheetOpen = false;

  constructor(
    private fetchUserService: FetchUsuariosService,
    private fetchPerfisService: FetchPerfisService,
    private updatePerfilService: UpdatePerfilService,
    private deleteUserService: DeleteUserService,
    private recoveryUserService: RecoveryUserService,
    private authService: AuthenticateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    if (!this.isAdmin) {
      return;
    }

    this.selectedProfileId = '';
    this.selectedPeriodo = '';

    this.carregaDataSources();

    this.userIdAutenticado = this.authService.getIdUsuario();
  }

  ngAfterViewInit() {
    this.dataSourceUsuarios.paginator = this.paginator;
  }

  toggleSidenav() {
    this.isSidenavOpened = !this.isSidenavOpened;
  }

  aplicarFiltroNome(event: Event) {
    const filtroValor = (event.target as HTMLInputElement).value;
    this.dataSourceUsuarios.filter = filtroValor.trim().toLowerCase();
  }

  fetchUsers() {
    this.fetchUserService
      .getUsers()
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar os usuários:', error);
          return of([]);
        }),
      )
      .subscribe((users: User[]) => {
        this.todosUsuarios = users;
        this.dataSourceUsuarios.data = users;
      });
  }

  fetchPerfis() {
    this.fetchPerfisService
      .getPerfis()
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar os perfis:', error);
          return of({ Perfil: [] });
        }),
      )
      .subscribe((resposta) => {
        this.dataSourcePerfis = resposta as Perfil[];
      });
  }

  updatePerfil(COD_USER_ID: string, COD_PERFIL_USER: string) {
    const perfilAtualizado = {
      COD_USER_ID,
      COD_PERFIL_USER,
    };

    this.updatePerfilService.updatePerfil(perfilAtualizado).subscribe({
      next: () => {
        this.carregaDataSources();
      },
      error: (error) => {
        console.error('Erro ao atualizar o perfil:', error);
      },
    });
  }

  contarUsuariosPorPerfil(perfilId?: string): number {
    if (perfilId) {
      return this.todosUsuarios.filter(
        (usuario) => usuario.perfilId === perfilId,
      ).length;
    } else {
      return this.todosUsuarios.length;
    }
  }

  carregaDataSources() {
    this.fetchUsers();
    this.fetchPerfis();
  }

  filtrarPorPerfil(perfilId: string) {
    this.selectedProfileId = perfilId;
    this.selectedPeriodo = '';
    this.dataInicio = null;
    this.dataFim = null;
    this.aplicarFiltros();
  }

  filtrarPorPeriodo(periodo: string) {
    this.selectedPeriodo = periodo;
    this.aplicarFiltros();
  }
  mostrarCustomPeriodoPicker() {
    this.selectedPeriodo = 'custom';
  }

  get mobileRows(): User[] {
    return this.dataSourceUsuarios.filteredData.slice(0, this.mobileVisibleCount);
  }

  get mobileLoadMoreStep(): number {
    return Math.min(10, this.dataSourceUsuarios.filteredData.length - this.mobileVisibleCount);
  }

  loadMoreMobile(): void {
    this.mobileVisibleCount += 10;
  }

  openMobilePeriodSheet(): void {
    this.selectedPeriodo = 'custom';
    this.mobilePeriodSheetOpen = true;
  }

  closeMobilePeriodSheet(): void {
    this.mobilePeriodSheetOpen = false;
  }

  aplicarFiltrosMobile(): void {
    this.aplicarFiltros();
    this.mobilePeriodSheetOpen = false;
  }

  aplicarFiltros() {
    this.isSidenavOpened = false;

    let usuariosFiltrados = [...this.todosUsuarios];

    if (this.selectedProfileId) {
      usuariosFiltrados = usuariosFiltrados.filter(
        (usuario) => usuario.perfilId === this.selectedProfileId,
      );
    }

    if (this.selectedPeriodo === '') {
    } else if (
      this.selectedPeriodo === 'custom' &&
      this.dataInicio &&
      this.dataFim
    ) {
      const inicio = new Date(this.dataInicio);
      const fim = new Date(this.dataFim);
      usuariosFiltrados = usuariosFiltrados.filter((u) => {
        if (!u.ultimaAutenticacao) return false;
        const dataAutenticacao = new Date(u.ultimaAutenticacao);
        return dataAutenticacao >= inicio && dataAutenticacao <= fim;
      });
    } else {
      usuariosFiltrados = this.filtrarUsuariosPorPeriodo(
        usuariosFiltrados,
        this.selectedPeriodo,
      ).filter((u) => !!u.ultimaAutenticacao);
    }

    this.dataSourceUsuarios.data = usuariosFiltrados;
  }

  filtrarUsuariosPorPeriodo(usuarios: User[], periodo: string | null): User[] {
    const dataReferencia = new Date();
    switch (periodo) {
      case 'hoje':
        return usuarios.filter(
          (u) =>
            new Date(u.ultimaAutenticacao).toDateString() ===
            dataReferencia.toDateString(),
        );
      case 'ontem':
        dataReferencia.setDate(dataReferencia.getDate() - 1);
        return usuarios.filter(
          (u) =>
            new Date(u.ultimaAutenticacao).toDateString() ===
            dataReferencia.toDateString(),
        );
      case 'ultimos7dias':
        dataReferencia.setDate(dataReferencia.getDate() - 7);
        return usuarios.filter((u) => {
          const dataAutenticacao = new Date(u.ultimaAutenticacao);
          return (
            dataAutenticacao >= dataReferencia && dataAutenticacao <= new Date()
          );
        });
      case 'ultimos30dias':
        dataReferencia.setDate(dataReferencia.getDate() - 30);
        return usuarios.filter((u) => {
          const dataAutenticacao = new Date(u.ultimaAutenticacao);
          return (
            dataAutenticacao >= dataReferencia && dataAutenticacao <= new Date()
          );
        });
      case 'nunca':
        return usuarios.filter((u) => !u.ultimaAutenticacao);
      default:
        return usuarios;
    }
  }

  excluirUsuario(id: string) {
    this.deleteUserService.deleteUser(id).subscribe({
      next: () => {
        this.carregaDataSources();
      },
      error: (error) => {
        console.error('Erro ao atualizar o perfil:', error);
      },
    });
  }

  recuperarUsuario(id: string) {
    this.recoveryUserService.recoveryUser(id).subscribe({
      next: () => {
        this.carregaDataSources();
      },
      error: (error) => {
        console.error('Erro ao atualizar o perfil:', error);
      },
    });
  }
}
