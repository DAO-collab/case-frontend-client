import { Injectable } from '@angular/core';
import { LanguageService } from '../core/language.service';
import { HttpClient } from '@angular/common/http';
import { IUser, IApiResponse } from './user.model';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { INotifyRequest } from './notify-request.model';
import { GET_API_URL } from '../shared/api.utils';

/**
 * Authentication service.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private languageService: LanguageService, private httpService: HttpClient) {}

  /**
   * Registers user.
   */
  public sendData(data: IUser): Observable<IApiResponse> {
    return this.httpService
      .post<IApiResponse>(GET_API_URL('/v1/users'), data, {
        headers: {
          'access-control-allow-headers': 'content-type'
        },
        withCredentials: true
      })
      .pipe(tap(() => this.languageService.setLanguage(data.locale)));
  }

  /**
   * Sends user notification.
   */
  public sendUsersNotification(data: INotifyRequest) {
    return this.httpService.post(GET_API_URL('/v1/prospects'), data);
  }
}
