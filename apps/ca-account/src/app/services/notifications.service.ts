import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { pluck } from 'rxjs/operators';
import { IApiGridResponse, NotificationItem } from '../modules/apps/app.model';
import { API_URL, MANAGE_API_URL } from '../utils/constants.utils';

@Injectable()
export class NotificationsService {
  constructor(private http: HttpClient) {}

  /**
   * Get account notifications
   */
  public getAccountNotifications(): Observable<IApiGridResponse<NotificationItem[]>> {
    return this.http.get<IApiGridResponse<NotificationItem[]>>(API_URL('/v1/self/stream')).pipe(pluck('data'));
  }

  /**
   * Get manage notifications
   */
  public getManageNotifications(hostId: string): Observable<IApiGridResponse<NotificationItem[]>> {
    return this.http
      .get<IApiGridResponse<NotificationItem[]>>(MANAGE_API_URL(`/v1/${hostId}/stream`))
      .pipe(pluck('data'));
  }
}
