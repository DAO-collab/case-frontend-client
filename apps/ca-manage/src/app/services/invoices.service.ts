import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { API_URL } from '../shared/constants.utils';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  constructor(private http: HttpClient) {}

  getInvoices(): Observable<any> {
    return this.http.get(API_URL('/invoices')).pipe(pluck('data'));
  }

  postRefundInvoices(data: any): Observable<any> {
    return this.http.post(API_URL('/invoices/refund'), data);
  }
}
