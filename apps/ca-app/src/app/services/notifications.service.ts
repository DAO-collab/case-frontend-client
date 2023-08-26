import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { pluck } from 'rxjs/operators';
import { IApiGridResponse, NotificationItem } from '../models/AppModel';
import { API_URL } from '../utils/constants.utils';
import { CasesService } from './cases.service';

@Injectable()
export class NotificationsService {
  public caseId?: string;

  constructor(private http: HttpClient, private casesService: CasesService) {
    this.casesService.getCaseId.subscribe(res => {
      this.caseId = res['case_id'];
    });
  }

  /**
   * Get app notifications
   */
  public getAppNotifications(): Observable<IApiGridResponse<NotificationItem[]>> {
    return this.http
      .get<IApiGridResponse<NotificationItem[]>>(`${API_URL}/${this.caseId}/case/stream`)
      .pipe(pluck('data'));
  }
}
