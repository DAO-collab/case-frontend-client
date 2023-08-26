import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { ACCOUNT_API_URL } from '../utils/constants.utils';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  getStripe(): Observable<any> {
    return this.http.get(ACCOUNT_API_URL(`self/stripe`)).pipe(pluck('data'));
  }

  postStripe(): Observable<any> {
    return this.http.post(ACCOUNT_API_URL(`self/stripe`), null).pipe(pluck('data'));
  }

  deleteStripe(id: string): Observable<any> {
    return this.http.delete(ACCOUNT_API_URL(`self/stripe/${id}`));
  }
}
