import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ACCOUNT_API_URL, MANAGE_API_URL } from '../shared/constants.utils';
import { IApiGridResponse } from '../interfaces/api-response.model';
import { IApp } from '../interfaces/app.model';
import { pluck } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { IPaymentCardInfo } from './design.service';

export interface IPaymentModel {
  square: {
    customer_id: string;
    active: boolean;
    card: {
      card_brand: string;
      exp_month: number;
      exp_year: number;
      last_4: string;
      cardholder_name: string;
      card_id: string;
    };
  };
  selfLink: string;
  editLink: string;
}

@Injectable()
export class AppsService {
  public showModal = false;
  public acceptInvitationSubject: Subject<boolean> = new Subject<boolean>();
  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient) {}

  /**
   * Get user apps
   */
  public getApps(): Observable<IApiGridResponse<IApp[]>> {
    return this.http
      .get<IApiGridResponse<IApp[]>>(ACCOUNT_API_URL('self/apps'), this.withCredentials)
      .pipe(pluck('data'));
  }

  /**
   * Accepts application.
   */
  public acceptApp(host_id: string, host_granted_status: number): Observable<any> {
    return this.http.put(ACCOUNT_API_URL(`self/apps/${host_id}`), { host_granted_status }, this.withCredentials);
  }

  /**
   * Accepts application.
   */
  getPaymentCard(hostId: string): Observable<IPaymentModel> {
    return this.http
      .get<IPaymentCardInfo>(MANAGE_API_URL(`/v1/${hostId}/payment/card`), {
        withCredentials: true
      })
      .pipe(pluck('data'));
  }

  /**
   * Update Payment data
   * @param payload: IPaymentCardInfo
   * @param hostId: string
   */
  updatePaymentCard(payload: IPaymentCardInfo, hostId: string): Observable<any> {
    return this.http.put(MANAGE_API_URL(`/v1/${hostId}/payment/card`), payload, {
      withCredentials: true
    });
  }
}
