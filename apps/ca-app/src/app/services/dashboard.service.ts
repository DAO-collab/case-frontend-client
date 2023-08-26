import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { CaseStatus } from '@app/types';
import { Case, Ticket, AppLocation, Broadcast, IDefaultResponse, AddComment } from '@app/interfaces';

import { API_URL } from '../utils/constants.utils';
import { TicketResponse } from './interfaces';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  selectedCase = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  getBroadcasts(): Observable<IDefaultResponse<Broadcast[]>> {
    return this.http.get(API_URL + '/broadcasts').pipe(pluck('data'));
  }

  getLocations(): Observable<IDefaultResponse<AppLocation[]>> {
    return this.http.get(API_URL + '/locations').pipe(pluck('data'));
  }

  getTickets(status: CaseStatus): Observable<IDefaultResponse<Ticket[]>> {
    return this.http.get(API_URL + `/tickets?status=${status}`).pipe(pluck('data'));
  }

  postTicketComment(ticketId: string, data: AddComment): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${API_URL}/tickets/${ticketId}/comments`, data);
  }

  postTicket(data: { message: string; title: string }): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${API_URL}/tickets/`, data);
  }

  putTicket(ticketId: string, data: { status: 0 | 1 }): Observable<TicketResponse> {
    return this.http.put<TicketResponse>(`${API_URL}/tickets/${ticketId}`, data);
  }

  public getCases(status: CaseStatus): Observable<IDefaultResponse<Case[]>> {
    return this.http.get<{ data: IDefaultResponse<Case[]> }>(`${API_URL}/cases?status=${status}`).pipe(
      pluck('data'),
      map((data: IDefaultResponse<Case[]>) => ({
        ...data,
        items: data.items.map(item => ({
          ...item,
          status
        }))
      }))
    );
  }
}
