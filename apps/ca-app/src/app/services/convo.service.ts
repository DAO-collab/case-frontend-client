import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { GetConvo, JoinConvo } from '@app/interfaces/convos.interface';
import { pluck } from 'rxjs/operators';
import { Subject } from 'rxjs/index';
import { Observable } from 'rxjs';

import { API_URL } from '../utils/constants.utils';

@Injectable({
  providedIn: 'root'
})
export class ConvoService {
  public convoOptions = { status: false, isAudioOnly: false };
  public endConvoSubject: Subject<void> = new Subject();
  public toggleConvoLayoutSubject: Subject<'galleryView' | 'speakerView'> = new Subject();
  public updatePageInterval?: any;

  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient) {}

  /**
   * Create convo
   */
  public createConvo(caseId: string, request: any) {
    return this.http.post(`${API_URL}/${caseId}/convos`, request, this.withCredentials).pipe(pluck('data'));
  }
  /**
   * Get status of convo
   */
  public getConvos(caseId: string): Observable<GetConvo> {
    return this.http.get<{ data: GetConvo }>(`${API_URL}/${caseId}/convos`, this.withCredentials).pipe(pluck('data'));
  }
  /**
   * End convo
   */
  public deleteConvo(caseId: string) {
    return this.http.delete(`${API_URL}/${caseId}/convos`, this.withCredentials).pipe(pluck('data'));
  }
  /**
   * Join convo
   */
  public joinConvo(caseId: string, roomId: string): Observable<JoinConvo> {
    return this.http.post<JoinConvo>(`${API_URL}/${caseId}/convos/room`, this.withCredentials).pipe(pluck('data'));
  }
  /**
   * Leave convo
   */
  public leaveConvo(caseId: string, roomId: string, userId: string) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: {
        user_id: userId
      },
      withCredentials: true
    };

    return this.http.delete(`${API_URL}/${caseId}/convos/room`, options).pipe(pluck('data'));
  }

  /**
   * Get recording of convo
   */
  public getConvosRecordings(caseId: string) {
    return this.http.get(`${API_URL}/${caseId}/convos/recordings`, this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Delete recording of convo
   */
  public deleteConvoRecording(caseId: string, convoId: string): Observable<any> {
    return this.http.delete(`${API_URL}/${caseId}/convos/recordings/${convoId}`, this.withCredentials);
  }

  /**
   * Notify the host
   */
  public notifyTheHost(caseId: string, userId: string) {
    return this.http.post(`${API_URL}/${caseId}/convos/notify`, userId, this.withCredentials).pipe(pluck('data'));
  }
}
