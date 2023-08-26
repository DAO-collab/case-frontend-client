import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IMediaExtensions } from '../pages/modules/media/models/media.model';
import { IUserFields } from '../pages/users/models/user.model';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Injectable()
export class OptionsService {
  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient, private translateService: TranslateService) {}

  /**
   * Get supported files extensions
   */
  public getExtesions(): Observable<IMediaExtensions> {
    return this.http.get<IMediaExtensions>('/opts/en/filetypes/all.json');
  }

  /**
   * Get countries
   * @param locale: string
   */
  public getCountries(locale: string): Observable<{ [key: string]: string }> {
    return this.http.get<{ [key: string]: string }>(`/opts/${locale}/dropdowns/countries.json`);
  }

  /**
   * Get languages
   * @param locale: string
   */
  public getLanguages(locale: string): Observable<{ [key: string]: string }> {
    return this.http.get<{ [key: string]: string }>(`/opts/${locale}/dropdowns/languages.json`);
  }

  /**
   * Get modules name list
   */
  public moduleNamesList(): Observable<{ [key: string]: string }> {
    return this.http.get<{ [key: string]: string }>(
      `/opts/${this.translateService.currentLang}/modules/names.json`,
      this.withCredentials
    );
  }

  /**
   * Get import types list
   */
  public importTypesList(): Observable<{ [key: string]: string }> {
    return this.http.get<{ [key: string]: string }>(
      `/opts/${this.translateService.currentLang}/dropdowns/imports.json`,
      this.withCredentials
    );
  }

  /**
   * Get webhook events list
   */
  public webhookEventsList(): Observable<{ [key: string]: string }> {
    return this.http.get<{ [key: string]: string }>(
      `/opts/${this.translateService.currentLang}/notifications/webhooks.json`,
      this.withCredentials
    );
  }

  /**
   * Get webhook events list
   */
  public userFields(): Observable<IUserFields> {
    return this.http.get<IUserFields>(
      `/opts/${this.translateService.currentLang}/dropdowns/userfields.json`,
      this.withCredentials
    );
  }
}
