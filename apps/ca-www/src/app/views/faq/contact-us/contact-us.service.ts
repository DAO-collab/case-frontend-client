import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { IContact } from './contact.model';
import { Observable } from 'rxjs';
import { GET_API_URL } from '@www/shared/api.utils';

/**
 * Contact Us service.
 */
@Injectable({
  providedIn: 'root'
})
export class ContactUsService {
  constructor(private cookiesService: CookieService, private http: HttpClient) {}

  /**
   *  Sends ticket data to API.
   */
  public sendTicket(data: IContact): Observable<IContact> {
    const ticketKeys = Object.keys(data);

    data.locale = this.cookiesService.get('locale') || 'en';
    data.topic = data.topic ? data.topic.toLowerCase() : null;
    data.importance = data.importance ? data.importance.toLowerCase() : null;

    ticketKeys.forEach(key => {
      if (!data[key]) {
        delete data[key];
      }
    });

    return this.http.post<IContact>(GET_API_URL('/v1/tickets'), data);
  }
}
