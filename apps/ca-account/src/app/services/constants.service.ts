import { Injectable } from '@angular/core';

// to be removed.
@Injectable({
  providedIn: 'root'
})
export class ConstantsService {
  constructor() {}

  public HTTP = {
    STATUSES: {
      UNAUTHORIZED: 401,
      ACCESS_DENIED: 403,
      NOT_FOUND: 404,
      ERROR: 500,
      OFFLINE: 0,
      CORS_ERROR: -1
    }
  };

  public EVENTS = {
    SUCCESS: 'SUCCESS',
    FORBIDDEN: 'ACCESS_DENIED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  };
}
