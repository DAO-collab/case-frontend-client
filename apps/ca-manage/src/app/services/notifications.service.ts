import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { NotificationItem } from '../pages/modules/media/models/media.model';
import { IApiGridResponse } from '../interfaces/api-response.model';
import { API_URL } from '../shared/constants.utils';
import { pluck } from 'rxjs/operators';

@Injectable()
export class NotificationsService {
  constructor(private http: HttpClient) {}

  /**
   * Get account notifications
   */
  public getAccountNotifications(): Observable<IApiGridResponse<NotificationItem[]>> {
    return this.http.get<IApiGridResponse<NotificationItem[]>>(API_URL('/self/stream')).pipe(pluck('data'));
  }

  /**
   * Get manage notifications
   */
  public getManageNotifications(): Observable<IApiGridResponse<NotificationItem[]>> {
    return this.http.get<IApiGridResponse<NotificationItem[]>>(API_URL(`/stream`)).pipe(pluck('data'));
  }

  /**
   * Get app notifications
   */
  public getAppNotifications(): Observable<IApiGridResponse<NotificationItem[]>> {
    return this.http.get<IApiGridResponse<NotificationItem[]>>(API_URL('/self/stream')).pipe(pluck('data'));
  }
}
