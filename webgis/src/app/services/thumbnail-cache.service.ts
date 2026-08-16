// thumbnail-cache.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ThumbnailCacheService {
  private cache: Map<string, Observable<string>> = new Map();
  private inMemoryCache: Map<string, string> = new Map();
  private failedRequests: Set<string> = new Set();
  private readonly CACHE_SIZE = 100;
  private readonly MAX_RETRIES = 3;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'thumbnailDB';
  private readonly STORE_NAME = 'thumbnails';

  constructor(private http: HttpClient) {
    this.initIndexedDB();
  }

  private initIndexedDB(): void {
    const request = indexedDB.open(this.DB_NAME, 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        db.createObjectStore(this.STORE_NAME, { keyPath: 'url' });
      }
    };
  }

  private handleError(
    error: HttpErrorResponse,
    url: string,
  ): Observable<never> {
    let errorMessage = 'Unknown error occurred';

    if (error.status === 0) {
      errorMessage =
        'CORS error or network issue. Make sure Geoserver CORS is configured.';
      this.failedRequests.add(url);
    } else if (error.status === 404) {
      errorMessage = 'Layer not found in Geoserver';
      this.failedRequests.add(url);
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = `Server-side error: ${error.status} ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private blobToBase64(blob: Blob): Observable<string> {
    return new Observable<string>((observer) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      reader.onerror = (error) => observer.error(error);
      reader.readAsDataURL(blob);
    });
  }

  getThumbnail(url: string): Observable<string> {
    // Se a URL já falhou anteriormente, retorne um placeholder
    if (this.failedRequests.has(url)) {
      return of(this.getPlaceholderImage());
    }

    // Verificar cache em memória
    if (this.inMemoryCache.has(url)) {
      return of(this.inMemoryCache.get(url)!);
    }

    // Verificar cache do Observable
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Criar novo Observable para carregar a imagem
    const request$ = from(this.getFromIndexedDB(url)).pipe(
      switchMap((cachedData) => {
        if (cachedData) {
          return of(cachedData);
        }

        return this.http
          .get(url, {
            responseType: 'blob',
            headers: {
              Accept: 'image/png',
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          })
          .pipe(
            retry(this.MAX_RETRIES),
            switchMap((blob) => this.blobToBase64(blob)),
            map((base64data) => {
              this.saveToIndexedDB(url, base64data);
              this.inMemoryCache.set(url, base64data);
              this.manageCacheSize();
              return base64data;
            }),
            catchError((error) => this.handleError(error, url)),
          );
      }),
      shareReplay(1),
    );

    this.cache.set(url, request$);
    return request$;
  }

  private async getFromIndexedDB(url: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        resolve(request.result ? request.result.data : null);
      };

      request.onerror = () => {
        console.error('Error reading from IndexedDB');
        resolve(null);
      };
    });
  }

  private saveToIndexedDB(url: string, data: string): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    store.put({ url, data, timestamp: Date.now() });
  }

  private manageCacheSize(): void {
    if (this.inMemoryCache.size > this.CACHE_SIZE) {
      const entriesToRemove = this.CACHE_SIZE * 0.2;
      const entries = Array.from(this.inMemoryCache.entries());
      entries.slice(0, Math.floor(entriesToRemove)).forEach(([key]) => {
        this.inMemoryCache.delete(key);
        this.cache.delete(key);
      });
    }
  }

  private getPlaceholderImage(): string {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  }

  clearCacheForUrl(url: string): void {
    this.inMemoryCache.delete(url);
    this.cache.delete(url);
    this.failedRequests.delete(url);

    if (this.db) {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.delete(url);
    }
  }

  clearAllCache(): void {
    this.inMemoryCache.clear();
    this.cache.clear();
    this.failedRequests.clear();

    if (this.db) {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.clear();
    }
  }

  reloadThumbnail(url: string): Observable<string> {
    this.clearCacheForUrl(url);
    return this.getThumbnail(url);
  } // Adicione este método ao ThumbnailCacheService

  preloadThumbnails(urls: string[]): void {
    // Cria um array de promises para carregar todas as imagens
    urls.forEach((url) => {
      if (!this.inMemoryCache.has(url) && !this.cache.has(url)) {
        this.getThumbnail(url).subscribe({
          next: (cachedUrl) => {
            console.log(`Preloaded thumbnail for ${url}`);
          },
          error: (error) => {
            console.error(`Error preloading thumbnail for ${url}:`, error);
          },
        });
      }
    });
  }
}
