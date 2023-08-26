import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { CacheService } from './cache.service';
import { CacheRequest } from './cache-request.class';
import { tap, startWith } from 'rxjs/operators';

/**
 * Cache interceptor.
 */
@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  constructor(private cache: CacheService) {}

  /**
   * Passes the request for next processing if it is not cachable.
   *
   * Caches or fetches the request.
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRequestCachable(request)) {
      return next.handle(request);
    }

    const cachedResponse = this.cache.get(request);

    if (request.headers.get('x-refresh')) {
      const results$ = this.sendRequest(request, next, this.cache);

      return cachedResponse ? results$.pipe(startWith(cachedResponse)) : results$;
    }

    return cachedResponse ? of(cachedResponse) : this.sendRequest(request, next, this.cache);
  }

  /**
   * Checks if request is cachable.
   */
  private isRequestCachable(req: HttpRequest<any>): boolean {
    return req.method === 'GET';
  }

  /**
   * Gets server response observable by sending request.
   *
   * Adds the response to the cache.
   */
  private sendRequest(req: HttpRequest<any>, next: HttpHandler, cache: CacheRequest): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          cache.set(req, event);
        }
      })
    );
  }
}
