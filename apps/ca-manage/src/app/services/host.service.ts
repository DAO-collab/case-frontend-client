import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie';
import { Subject, of, Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';

import { UtilsService } from './utils.service';
import { API_URL } from '../shared/constants.utils';
import { ISchema, IUiSchema } from './admin.service';

export interface IHost {
  created_on: string;
  editLink: string;
  host_id: string;
  name: string;
  modules: string[];
  require_userfields: string[] | null;
  note_schema: {
    schema: string;
  };
  event_schema: {
    schema: string;
  };
  user_schema: {
    schema: string;
  };
  case_schema: {
    schema: string;
  };
  default_schemas: {
    cases: {
      schema: string;
      ui_schema: string;
    };
    events: {
      schema: string;
      ui_schema: string;
    };
    notes: {
      schema: string;
      ui_schema: string;
    };
    users: {
      schema: string;
      ui_schema: string;
    };
  };
  selfLink: string;
  updated_on: string;
  tour_completed: string[];
  website: string;
}

@Injectable({
  providedIn: 'root'
})
export class HostService {
  private updateMetricsSubject: Subject<any> = new Subject<any>();
  private todayDate = new Date();

  public metricsFormSubscription = this.updateMetricsSubject.asObservable();
  endDate = this.utilsService.fullDate(this.todayDate);
  startDate = (() => {
    const initialStartDate = new Date();
    initialStartDate.setDate(this.todayDate.getDate() - 7);

    return this.utilsService.fullDate(initialStartDate);
  })();
  public createdAppDate?: string;
  public appName = 'CaseActive';
  public modules: string[] = [];
  public requireUserFields: string[] = [];
  public caseSchema?: ISchema;
  public caseUiSchema?: IUiSchema;
  public userSchema?: ISchema;
  public userUiSchema?: IUiSchema;
  public noteSchema?: ISchema;
  public noteUiSchema?: IUiSchema;
  public hostSubject: Subject<any> = new Subject();
  public hostLoad: Observable<any> = this.hostSubject.asObservable();

  constructor(private utilsService: UtilsService, private cookieService: CookieService, private http: HttpClient) {}

  private absDaysDiff = (end: number, start: number) => Math.floor((end - start) / (1000 * 60 * 60 * 24));
  /**
   * Get host data
   * @param startDate: string
   * @param endDate: string
   */
  public getHostData(startDate: string, endDate: string): Observable<any> {
    const dateIndex = startDate + endDate;
    const cachedData = this.cookieService.getObject(dateIndex);

    const start: any = new Date(startDate);
    const end: any = new Date(endDate);
    const dateDiff = (this.absDaysDiff(end, start) + 1).toString();

    if (cachedData) {
      return of(cachedData);
    } else {
      return this.http
        .get(API_URL('/metrics'), { withCredentials: true, params: { date: startDate, days_between: dateDiff } })
        .pipe(
          map((response: any) => {
            const data = response.data,
              cookiesExpiration = new Date();
            cookiesExpiration.setDate(cookiesExpiration.getDate() + 1);

            this.cookieService.putObject(dateIndex, data, {
              expires: new Date()
            });

            return data;
          })
        );
    }
  }

  public setHostCompletedTours(completedTours: string[]): Observable<IHost> {
    return this.http.put<IHost>(API_URL(`/host`), { tour_completed: completedTours });
  }

  /**
   * Get host info
   */
  public getHostInfo(): Observable<IHost> {
    return this.http.get<IHost>(API_URL(`/host`)).pipe(pluck('data'));
  }

  /**
   * Get host info
   * @param data: any
   */
  public updateMetrics = (data: any) => this.updateMetricsSubject.next(data);
}
