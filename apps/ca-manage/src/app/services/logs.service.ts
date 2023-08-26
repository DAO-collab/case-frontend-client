import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LogsRequest } from '../interfaces/services/logs.model';
import { API_URL } from '../shared/constants.utils';
import { Observable, Subject } from 'rxjs';
import { pluck } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private withCredentials = { withCredentials: true };
  private activateModalSubject: Subject<any> = new Subject<any>();

  public modalActivatedSub = this.activateModalSubject.asObservable();

  constructor(private http: HttpClient) {}

  public activateCreateModal() {
    this.activateModalSubject.next();
  }

  /**
   * Request logs
   * @param requestData: LogsRequest
   */
  public requestLogs(requestData: LogsRequest): Observable<any> {
    return this.http.post(API_URL(`/logs/${requestData.domain}`), requestData, this.withCredentials);
  }

  /**
   * Get queue
   */
  public getQueue(): Observable<any> {
    return this.http.get(API_URL('/logs'), this.withCredentials);
  }

  /**
   * Get Logs
   * @param params: any
   */
  public getLogs(params: any): Observable<any> {
    return this.http.get(API_URL('/logs/query'), { ...this.withCredentials, params }).pipe(pluck('data'));
  }

  /**
   * Update logs status
   * @param logId: string
   */
  public changeLogsStatus(logId: string): Observable<any> {
    return this.http.delete(API_URL(`/logs/query?log=${logId}`), this.withCredentials);
  }
}
