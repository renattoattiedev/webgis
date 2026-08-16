import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class RecoveryPasswordService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
  ) {}

  requestPasswordReset(
    DSC_EMAIL: string,
    captchaToken: string,
  ): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('recovery-password');

    return this.http.post(baseUrl, { DSC_EMAIL, captchaToken }).pipe(
      catchError((error) => {
        console.error('Erro ao solicitar redefinição de senha:', error);
        return throwError(
          () => new Error('Erro ao solicitar redefinição de senha'),
        );
      }),
    );
  }
}
