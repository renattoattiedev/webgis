import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CookieService } from 'ngx-cookie-service';
import { AuthenticateService } from './authenticate.service';

describe('AuthenticateService', () => {
  let service: AuthenticateService;
  let cookieService: CookieService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CookieService],
    });
    service = TestBed.inject(AuthenticateService);
    cookieService = TestBed.inject(CookieService);
  });

  it('setSessionFromEntra grava os cookies de sessão a partir dos dados do callback', () => {
    service.setSessionFromEntra({
      access_token: 'token-abc',
      idUsuario: 'u1',
      nomeUsuario: 'Fulano',
      perfil: 'Visualizador',
    });

    expect(cookieService.get('access_token')).toBe('token-abc');
    expect(cookieService.get('idUsuario')).toBe('u1');
    expect(cookieService.get('nomeUsuario')).toBe('Fulano');
    expect(cookieService.get('perfilUsuario')).toBe('Visualizador');
    expect(service.isLoggedIn()).toBe(true);
  });
});
