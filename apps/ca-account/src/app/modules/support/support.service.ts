import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '@acc/utils/constants.utils';
import { Observable } from 'rxjs';
import { ITicket } from './ticket.model';
import { IApiResponse } from '@acc/core/api-response.model';
import { pluck } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  constructor(private http: HttpClient) {}

  /**
   * Sends ticket to support.
   */
  public sendSupportMessage(ticket: ITicket): Observable<Partial<IApiResponse>> {
    if (ticket.recaptcha) {
      sessionStorage.setItem('recaptcha', ticket.recaptcha);
    } else if (!ticket.recaptcha && sessionStorage.getItem('recaptcha')) {
      ticket.recaptcha = sessionStorage.getItem('recaptcha')!;
    }

    return this.http.post<{ data: Partial<IApiResponse> }>(API_URL('/v1/tickets'), ticket).pipe(pluck('data'));
  }
}
