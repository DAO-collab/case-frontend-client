import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { API_URL } from '../shared/constants.utils';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient) {}

  getStripe(): Observable<any> {
    return this.http.get(API_URL('/payments/stripe'), this.withCredentials).pipe(pluck('data'));
  }

  putStripe(data: any): Observable<any> {
    return this.http.put(API_URL('/payments'), data, this.withCredentials);
  }
}
