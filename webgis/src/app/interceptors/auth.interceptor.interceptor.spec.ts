import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { of } from 'rxjs';

import { AuthInterceptor } from './auth.interceptor.interceptor';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let cookieService: jasmine.SpyObj<CookieService>;

  beforeEach(() => {
    cookieService = jasmine.createSpyObj('CookieService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: CookieService, useValue: cookieService },
      ],
    });

    interceptor = TestBed.inject(AuthInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('adiciona o header Authorization quando existe cookie access_token', () => {
    cookieService.get.and.returnValue('token-abc');
    const request = new HttpRequest('GET', '/api/qualquer');
    const next: HttpHandler = { handle: (req) => of(req) as any };
    spyOn(next, 'handle').and.callThrough();

    interceptor.intercept(request, next);

    const forwardedRequest = (next.handle as jasmine.Spy).calls.mostRecent()
      .args[0] as HttpRequest<any>;
    expect(forwardedRequest.headers.get('Authorization')).toBe(
      'Bearer token-abc',
    );
  });

  it('não adiciona o header quando não há cookie access_token', () => {
    cookieService.get.and.returnValue('');
    const request = new HttpRequest('GET', '/api/qualquer');
    const next: HttpHandler = { handle: (req) => of(req) as any };
    spyOn(next, 'handle').and.callThrough();

    interceptor.intercept(request, next);

    const forwardedRequest = (next.handle as jasmine.Spy).calls.mostRecent()
      .args[0] as HttpRequest<any>;
    expect(forwardedRequest.headers.has('Authorization')).toBe(false);
  });
});
