import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { MANAGE_API_URL } from '../shared/constants.utils';

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  isCreatePopupOpened = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  getBroadcasts(hostId: string): Observable<any> {
    return this.http.get(MANAGE_API_URL(`/v1/${hostId}/broadcasts`)).pipe(pluck('data'));
  }

  getBroadcast(hostId: string, broadcastId: string): Observable<any> {
    return this.http.get(MANAGE_API_URL(`/v1/${hostId}/broadcasts/${broadcastId}`));
  }

  postBroadcast(hostId: string, data: any): Observable<any> {
    return this.http.post(MANAGE_API_URL(`/v1/${hostId}/broadcasts/`), data);
  }

  putBroadcast(hostId: string, data: any, broadcastId: string): Observable<any> {
    return this.http.put(MANAGE_API_URL(`/v1/${hostId}/broadcasts/${broadcastId}`), data);
  }

  deleteBroadcast(hostId: string, broadcastId: string): Observable<any> {
    return this.http.delete(MANAGE_API_URL(`/v1/${hostId}/broadcasts/${broadcastId}`));
  }
}
