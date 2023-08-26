import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { API_URL } from '../../utils/constants.utils';
import { IApiGridResponse } from '../apps/app.model';

export interface IDomains {
  domain_name: string;
  enterprise_host_id: string;
}

@Injectable({ providedIn: 'root' })
export class DomainsService {
  isDomainsModalShowed = false;
  updateDomainsSubject: BehaviorSubject<'active' | 'pending'> = new BehaviorSubject<'active' | 'pending'>('active');

  constructor(private http: HttpClient) {}

  postDomain(data: IDomains): Observable<any> {
    return this.http.post(API_URL('/v1/self/domains'), data);
  }

  putDomain(domain_name: string, data: IDomains): Observable<any> {
    return this.http.put(API_URL(`/v1/self/domains/${domain_name}`), data);
  }

  getDomains(status: string): Observable<IApiGridResponse<any>> {
    const options = {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'x-refresh': 'true'
      })
    };

    return this.http.get<{ data: IApiGridResponse<any> }>(API_URL(`/v1/self/domains?status=${status}`), options).pipe(pluck('data'));
  }

  deleteDomain(status: string, domain_name: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: { status }
    };

    return this.http.delete<any>(API_URL(`/v1/self/domains/${domain_name}`), options);
  }

  deleteSso(domain_name: string): Observable<any> {
    return this.http.delete<any>(API_URL(`/v1/self/domains/${domain_name}/sso`));
  }

  putSso(domain_name: string, data: any): Observable<any> {
    return this.http.put(API_URL(`/v1/self/domains/${domain_name}/sso`), data);
  }

  getSso(domain_name: string): Observable<any> {
    return this.http.get(API_URL(`/v1/sso/${domain_name}`));
  }
}
