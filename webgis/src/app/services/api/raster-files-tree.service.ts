import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';
import {
  RasterTreeNode,
  RasterTreeResponse,
  RasterCheckResponse,
} from 'src/app/models/raster-tree-node.model';

@Injectable({ providedIn: 'root' })
export class RasterFilesTreeService {
  constructor(
    private http: HttpClient,
    private cookie: CookieService,
    private config: GetConfigService,
  ) {}

  private auth(): HttpHeaders {
    const token = this.cookie.get('access_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getTree(relativePath: string): Observable<RasterTreeNode[]> {
    const url = this.config.getUrl('raster-files/tree');
    const params = new HttpParams().set('path', relativePath ?? '');
    return this.http
      .get<RasterTreeResponse>(url, { headers: this.auth(), params })
      .pipe(map((r) => r.items));
  }

  check(relativePath: string): Observable<RasterCheckResponse> {
    const url = this.config.getUrl('raster-files/check');
    const params = new HttpParams().set('path', relativePath);
    return this.http.get<RasterCheckResponse>(url, {
      headers: this.auth(),
      params,
    });
  }
}
