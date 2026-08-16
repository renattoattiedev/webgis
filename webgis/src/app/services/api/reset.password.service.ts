import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class ResetPasswordService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
  ) {}

  resetPassword(
    token: string,
    DSC_PASSWORD: string,
    captchaToken: string,
  ): Observable<any> {
    const requestBody = {
      token,
      DSC_PASSWORD,
      captchaToken,
    };
    const baseUrl = this.getConfigService.getUrl('reset-password');

    return this.http.post(baseUrl, requestBody).pipe(
      catchError((error) => {
        console.error('Erro ao redefinir a senha:', error);
        return throwError(() => new Error('Erro ao redefinir a senha'));
      }),
    );
  }
}
