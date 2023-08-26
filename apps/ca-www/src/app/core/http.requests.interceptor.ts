import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataConnectorService } from './data-connector.service';

@Injectable()
export class HttpRequestsInterceptor implements HttpInterceptor {
  constructor(private dataConnectorService: DataConnectorService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 500) {
            this.dataConnectorService.errorPopupCall();
          }
        }

        return throwError(error);
      })
    );
  }
}
