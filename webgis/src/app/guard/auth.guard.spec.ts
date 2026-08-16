import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let cookieService: jasmine.SpyObj<CookieService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    cookieService = jasmine.createSpyObj('CookieService', ['get']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: CookieService, useValue: cookieService },
        { provide: Router, useValue: router },
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('permite ativação quando existe cookie access_token', () => {
    cookieService.get.and.returnValue('token-abc');

    expect(guard.canActivate()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('bloqueia ativação e redireciona para /login quando não há access_token', () => {
    cookieService.get.and.returnValue('');

    expect(guard.canActivate()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
