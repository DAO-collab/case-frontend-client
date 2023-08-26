import { HttpResponse } from '@angular/common/http';

/**
 * Cache entry model.
 */
export interface ICacheEntry {
  url: string;
  response: HttpResponse<any>;
  lastRead: number;
}
