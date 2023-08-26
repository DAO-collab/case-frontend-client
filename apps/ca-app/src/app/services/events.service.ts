import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs/index';
import { pluck } from 'rxjs/operators';

import { API_URL } from '../utils/constants.utils';
import { isEmptyValue } from '../utils/utils';

export interface IEventAnswers {
  rsvp: 'yes' | 'no' | 'maybe'
}

@Injectable()
export class EventsService {
  private withCredentials = { withCredentials: true };
  public activateCreateEventModal = new Subject<any>();
  public createEventModalState: Observable<string> = this.activateCreateEventModal.asObservable();
  public getConfirmationsSubject = new Subject<any>();
  public gotConfirmations: Observable<string> = this.getConfirmationsSubject.asObservable();
  public endDateSubject: Subject<string> = new Subject<string>();
  public endDate$: Observable<string> = this.endDateSubject.asObservable();
  public eventDirectLinkSubject: Subject<{ id: string; action: string } | null> = new Subject();

  constructor(private http: HttpClient) {}

  public publishEndDate(endDate: string) {
    this.endDateSubject.next(endDate);
  }

  public activateCreateModal() {
    this.activateCreateEventModal.next(true);
  }

  public createEvent(caseId: string, data: any): Observable<any> {
    return this.http.post(`${API_URL}/${caseId}/events`, data, this.withCredentials).pipe(pluck('data'));
  }

  public updateEvent(caseId: string, eventId: string, data: any): Observable<any> {
    data = {
      ...data,
      notifications: isEmptyValue(data.notifications) ? {} : data.notifications
    };
    return this.http.put(`${API_URL}/${caseId}/events/${eventId}`, data, this.withCredentials);
  }

  public getEvents(caseId: string, filter: any, limit: number = 20) {
    return this.http.get(`${API_URL}/${caseId}/events?filter=${filter}&limit=${limit}`, this.withCredentials).pipe(pluck('data'));
  }

  public getEvent(caseId: string, event_id: string): Observable<any> {
    return this.http.get(`${API_URL}/${caseId}/events/${event_id}`, this.withCredentials).pipe(pluck('data'));
  }

  public deleteEvent(caseId: string, eventId: string) {
    return this.http.delete(`${API_URL}/${caseId}/events/${eventId}`, this.withCredentials);
  }

  public getEventConfirmation(caseId: string, eventId: string): Observable<any> {
    return this.http.get(`${API_URL}/${caseId}/events/${eventId}/responses`, this.withCredentials).pipe(pluck('data'));
  }

  public postEventConfirmation(caseId: string, eventId: string, request: IEventAnswers) {
    return this.http.post(`${API_URL}/${caseId}/events/${eventId}/responses`, request, this.withCredentials);
  }

  public updateEventConfirmation(caseId: string, eventId: string, responseId: string, request: IEventAnswers) {
    return this.http.put(`${API_URL}/${caseId}/events/${eventId}/responses/${responseId}`, request, this.withCredentials);
  }

  public deleteEventConfirmation(caseId: string, eventId: string) {
    return this.http.delete(`${API_URL}/${caseId}/events/${eventId}/responses`, this.withCredentials);
  }
}
