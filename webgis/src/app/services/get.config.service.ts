import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GetConfigService {
  constructor() {}

  public getUrl(endpoint: string): string {
    return `${environment.base_url}/${endpoint}`;
  }
}
