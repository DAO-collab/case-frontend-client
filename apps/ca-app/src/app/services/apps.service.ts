import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IDefaultResponse } from '../interfaces/default-response.interface';
import { IApp } from '../interfaces/app.interface';
import { ACCOUNT_API_URL } from '../utils/constants.utils';
import { pluck } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class AppsService {
  public showModal = false;
  public acceptInvitationSubject: Subject<boolean> = new Subject<boolean>();
  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient) {}

  /**
   * Get user apps
   */
  public getApps(): Observable<IDefaultResponse<IApp[]>> {
    return this.http
      .get<IDefaultResponse<IApp[]>>(ACCOUNT_API_URL('self/apps'), this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Accepts application.
   */
  public acceptApp(host_id: string, host_granted_status: number): Observable<any> {
    return this.http.put(ACCOUNT_API_URL(`self/apps/${host_id}`), { host_granted_status }, this.withCredentials);
  }
}
