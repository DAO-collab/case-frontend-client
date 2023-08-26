import { Injectable } from '@angular/core';
import { AVATAR_URL, OPTIONS_URL } from '../utils/constants.utils';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '@acc-envs/environment';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';

export interface IOptions {
  countries: Array<{ id: string; text: string }>;
  genders: Array<{ id: string; text: string }>;
  languages: Array<{ id: string; text: string }>;
  timezones: Array<{ id: string; text: string }>;
}

/**
 * Settings service.
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public dataImage = new BehaviorSubject<string>('');
  public dataImageObservable = this.dataImage.asObservable();

  constructor(private http: HttpClient, private cookies: CookieService, private translate: TranslateService) {}

  /**
   * Gets user avatar.
   */
  public getAvatarUrl(userId?: string, size?: string): string {
    return AVATAR_URL(userId!, size!);
  }

  /**
   * Upadte user avatar image
   */
  public updateAvatarImage(url: string): void {
    this.dataImage.next(url);
  }

  /**
   * Sets language.
   */
  public setLanguage(locale: string): void {
    !locale
      ? (locale = this.cookies.get('locale') || 'en')
      : this.cookies.set('locale', locale, undefined, undefined, environment.IS_LOCAL ? 'localhost' : 'caseactive.net');
    this.translate.use(locale);
  }

  /**
   * Retrieves all profile options.
   *
   * Returns an array with sorted options arrays.
   */
  public profileOptions(): Observable<IOptions> {
    const options = ['/dropdowns/countries', '/dropdowns/genders', '/dropdowns/languages', '/dropdowns/timezones'];
    const observables$: Array<Observable<{ [key: string]: string }>> = [];

    options.forEach(option => observables$.push(this.retrieveOptions(option)));

    return forkJoin(observables$).pipe(
      map((dropdowns: { [key: string]: string }[]) =>
        dropdowns.map(dropdown =>
          Object.entries(dropdown)
            .map(([key, value]) => ({ id: key, text: value as string }))
            .sort((a, b) => a.text.localeCompare(b.text))
        )
      ),
      map(data => ({
        countries: data[0],
        genders: data[1],
        languages: data[2],
        timezones: data[3]
      }))
    );
  }

  /**
   * Retrieves app payment plans.
   */
  public appPaymentPlans(): Observable<Array<{ key: string; text: string }>> {
    return this.retrieveOptions('/dropdowns/plans').pipe(
      map(data => Object.entries(data).map(([key, value]) => ({ key, text: value })))
    );
  }

  /**
   * Retrieves server responses (error and success messages).
   */
  public serverResponses(responses: string[]): Observable<{ [key: string]: string }[]> {
    const observables$: Array<Observable<{ [key: string]: string }>> = [];

    responses.forEach(response => observables$.push(this.retrieveOptions(response)));

    return forkJoin(observables$);
  }

  /**
   * Retrieves user fields.
   */
  public userFields() {
    return this.retrieveOptions('/dropdowns/userfields');
  }

  /**
   * Helper for retrieving options.
   */
  private retrieveOptions(path: string): Observable<{ [key: string]: string }> {
    const locale = this.cookies.get('locale') || 'en';

    return this.http.get<{ [key: string]: string }>(OPTIONS_URL(path, locale)).pipe(shareReplay());
  }
}
