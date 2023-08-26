import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnsubscribeFromEmailService {
  constructor(private http: HttpClient) {}

  getDataFromJSON(locale: string): Observable<{ [key: string]: string }> {
    return this.http.get<{ [key: string]: string }>(`opts/${locale}/notifications/revoked_reason.json`);
  }
}
