import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';

interface SessionData {
  access_token: string;
  idUsuario: string;
  nomeUsuario: string;
  perfil: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticateService {
  private loggedIn = false;
  private urlIntended: string = '/';
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  private setSession(session: SessionData) {
    this.cookieService.set('access_token', session.access_token);
    this.cookieService.set('perfilUsuario', session.perfil);
    this.cookieService.set('idUsuario', session.idUsuario);
    this.cookieService.set('nomeUsuario', session.nomeUsuario);
    this.loggedIn = true;
  }

  login(
    DSC_EMAIL: string,
    DSC_PASSWORD: string,
    captchaToken: string,
  ): Observable<boolean> {
    this.errorMessage = '';
    const url = this.getConfigService.getUrl('authenticate');
    return this.http
      .post<any>(url, { DSC_EMAIL, DSC_PASSWORD, captchaToken })
      .pipe(
        map((response) => {
          if (response && response.access_token) {
            this.setSession(response);
            return true;
          }
          return false;
        }),
        catchError((error) => {
          this.errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            error?.message ||
            'Login inválido. Verifique e-mail e senha.';
          return of(false);
        }),
      );
  }

  setSessionFromEntra(session: SessionData) {
    this.setSession(session);
  }

  getMicrosoftLoginUrl(): string {
    return this.getConfigService.getUrl('authenticate/entra');
  }

  completeEntraLogin(code: string): Observable<boolean> {
    this.errorMessage = '';
    const url = this.getConfigService.getUrl('authenticate/entra/callback');
    return this.http.get<any>(url, { params: { code } }).pipe(
      map((response) => {
        if (response && response.access_token) {
          this.setSession(response);
          return true;
        }
        return false;
      }),
      catchError((error) => {
        this.errorMessage =
          error?.error?.message ||
          error?.error?.error ||
          error?.message ||
          'Falha ao concluir o login com Microsoft. Tente novamente.';
        return of(false);
      }),
    );
  }

  logout() {
    this.cookieService.delete('access_token');
    this.loggedIn = false;
  }

  isLoggedIn(): boolean {
    return this.cookieService.check('access_token');
  }

  isAdmin(): boolean {
    return this.getPerfilUsuario() === 'Admin';
  }

  isHighUser(): boolean {
    switch (this.getPerfilUsuario()) {
      case 'Admin':
      case 'Publicador':
      case 'Editor':
        return true;
      default:
        return false;
    }
  }

  setLogged(logged: boolean) {
    this.loggedIn = logged;
  }

  setUrlIntended(url: string) {
    this.urlIntended = url;
  }

  getUrlIntended(): string {
    return this.urlIntended;
  }

  getIdUsuario(): string {
    return this.cookieService.get('idUsuario');
  }

  getNomeUsuario(): string {
    return this.cookieService.get('nomeUsuario');
  }

  getPerfilUsuario(): string {
    return this.cookieService.get('perfilUsuario');
  }
}
