import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';
import { User } from 'src/app/models/users.model';

@Injectable({
  providedIn: 'root',
})
export class UpdateUserEmailService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  updateEmail(email: string): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-user-email');
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.put<any>(baseUrl, { email: email }, { headers }).pipe(
      catchError((error) => {
        console.error('Erro ao atualizar o email:', error);
        return throwError(() => new Error('Erro ao atualizar o email'));
      }),
    );
  }
}
