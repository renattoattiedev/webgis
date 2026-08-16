import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class UpdatePasswordService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-user-password');
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.put<any>(baseUrl, passwordData, { headers }).pipe(
      catchError((error) => {
        console.error('Erro ao atualizar o password:', error);
        return throwError(
          () => error.error || new Error('Erro ao atualizar o password'),
        );
      }),
    );
  }
}
