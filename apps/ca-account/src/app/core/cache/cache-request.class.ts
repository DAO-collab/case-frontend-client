import { HttpRequest, HttpResponse } from '@angular/common/http';

/**
 * Cache request class.
 */
export abstract class CacheRequest {
  abstract get(req: HttpRequest<any>): HttpResponse<any> | null;
  abstract set(req: HttpRequest<any>, response: HttpResponse<any>): void;
}
