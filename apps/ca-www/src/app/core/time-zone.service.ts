import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITimeZone } from './time-zone.model';
import { map, shareReplay } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { GET_OPTIONS_URL } from '../shared/api.utils';

/**
 * Time zone service.
 */
@Injectable({
  providedIn: 'root'
})
export class TimeZoneService {
  constructor(private http: HttpClient, private cookiesService: CookieService) {}

  /**
   * Gets time zones.
   */
  public getTimezones(): Observable<ITimeZone[]> {
    const locale = this.cookiesService.get('locale') || 'en';

    return this.http.get(GET_OPTIONS_URL('/dropdowns/timezones', locale)).pipe(
      map(timeZones =>
        Object.entries(timeZones)
          .map(([key, value]) => ({ id: key, timeZone: value }))
          .sort((a, b) => a.timeZone.localeCompare(b.timeZone))
      ),
      shareReplay()
    );
  }
}
