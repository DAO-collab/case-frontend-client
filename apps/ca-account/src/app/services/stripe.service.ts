import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { pluck, tap } from 'rxjs/operators';

import { CookieService } from 'ngx-cookie-service';

import { MANAGE_API_URL } from '../utils/constants.utils';

interface GetStripe {
  billing_plan: string;
  card: {
    card_brand: string;
    card_id: string;
    cardholder_name: string | null;
    exp_month: number;
    exp_year: number;
    last_4: string;
  };
  editLink: string;
  selfLink: string;
};

interface PostStripe {
  client_secret: string;
  editLink: string;
  selfLink: string;
};

@Injectable({ providedIn: 'root' })
export class StripeService {
  constructor(private http: HttpClient, private cookieService: CookieService) {}

  getStripe(hostId: string, forceUpdate: boolean): Observable<GetStripe> {
    return this.http
      .get<{ data: GetStripe}>(MANAGE_API_URL(`/v1/${hostId}/stripe/card`), {
        withCredentials: true,
        headers: { ...this.credentials().headers, ...(forceUpdate ? { 'x-refresh': 'true' } : {}) }
      })
      .pipe(pluck('data'));
  }

  postStripe(hostId: string): Observable<PostStripe> {
    return this.http.post<{ data: PostStripe }>(MANAGE_API_URL(`/v1/${hostId}/stripe/card`), null).pipe(pluck('data'));
  }

  putStripe(hostId: string, request: {[key: string]: string}): Observable<null> {
    return this.http.put<null>(MANAGE_API_URL(`/v1/${hostId}/stripe/card`), request);
  }

  credentials() {
    return {
      headers: { 'X-XSRF-TOKEN': this.cookieService.get('XSRF-TOKEN') },
      withCredentials: true
    };
  }
}
