import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpHandler,
  HttpEvent,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { DataConnectorService } from './data-connector.service';

import { environment } from '../../environments/environment';

/**
 * Http request interceptor.
 */
@Injectable()
export class HttpRequestsInterceptor implements HttpInterceptor {
  constructor(private cookieService: CookieService, private dataConnectorService: DataConnectorService) {}

  /**
   * Intercepts every request.
   *
   * Injects 'with credentials'into request.
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      withCredentials: true,
      headers: request.headers.set('x-xsrf-token', this.cookieService.get('XSRF-TOKEN'))
    });

    if (!request.headers.has('Content-Type')) {
      request = request.clone({ headers: request.headers.set('Content-Type', 'application/json') });
    }

    request = request.clone({ headers: request.headers.set('Accept', 'application/json') });

    return next.handle(request).pipe(
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 500) {
            this.dataConnectorService.errorPopupCall();
          }
        }

        return throwError(error);
      }),

      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
        }
        return event;
      })
    );
  }
}
