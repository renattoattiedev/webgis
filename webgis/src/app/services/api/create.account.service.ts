import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class CreateAccountService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
  ) {}

  register(userData: {
    NOM_USER: string;
    DSC_EMAIL: string;
    DSC_PASSWORD: string;
    captchaToken: string;
  }): Observable<boolean> {
    const url = this.getConfigService.getUrl('create-account');

    if (url !== 'undefined') {
      return this.http.post(url, userData).pipe(
        map(() => true),
        catchError((error) => {
          console.error('Erro ao criar a conta:', error);
          return of(false);
        }),
      );
    } else {
      console.error('URL inválida');
      return of(false);
    }
  }
}
