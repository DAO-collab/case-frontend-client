import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { MANAGE_API_URL } from '../shared/constants.utils';
import { pluck } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  isCreatePopupOpened = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  getTickets(hostId: string, status: string): Observable<any> {
    return this.http.get(MANAGE_API_URL(`/v1/${hostId}/tickets?status=${status}`)).pipe(pluck('data'));
  }

  getTicket(hostId: string, ticketId: string): Observable<any> {
    return this.http.get(MANAGE_API_URL(`/v1/${hostId}/tickets/${ticketId}`));
  }

  postTicket(hostId: string, data: any): Observable<any> {
    return this.http.post(MANAGE_API_URL(`/v1/${hostId}/tickets/`), data);
  }

  putTicket(hostId: string, ticketId: string, data: any): Observable<any> {
    return this.http.put(MANAGE_API_URL(`/v1/${hostId}/tickets/${ticketId}`), data);
  }

  postTicketComment(hostId: string, ticketId: string, data: any): Observable<any> {
    return this.http.post(MANAGE_API_URL(`/v1/${hostId}/tickets/${ticketId}/comments`), data);
  }
}
