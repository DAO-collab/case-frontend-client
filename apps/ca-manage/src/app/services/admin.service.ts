import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { map, pluck, tap } from 'rxjs/operators';
import { Observable, Subject, forkJoin } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import * as _ from 'lodash';

import { environment } from '../../environments/environment';
import { API_URL, PUBLIC_CDN_URL, OPTIONS_URL } from '../shared/constants.utils';
import { IDesign } from './design.service';

/*
 * User profile interface
 */
export interface IUserProfile {
  company_system: { analytics: any; design: IDesign };
  family_name: string;
  given_name: string;
  locale: string;
  selfLink: string;
  user_id: string;
  zoneinfo: string;
  app_name?: string;
}

/*
 * Modules response interface
 */
export interface IModulesResponse {
  editLink: string;
  modules: string[];
  selfLink: string;
}

/*
 * Schema response interface
 */
export interface ISchemaResponse {
  [key: string]: {
    schema: string;
  };
}

/*
 * Schema interface
 */
export interface ISchema {
  type: string;
  properties: {
    [id: string]: {
      name?: string;
      type: string;
      fieldType: string;
      title: string;
      description: string;
      readonly: boolean;
      defaultValue: any;
      required?: boolean;
      items?: any;
      id?: string;
    };
  };
  required?: string[];
  header?: string[];
}

/*
 * Schema interface
 */
export interface IUiSchema {
  type: string;
  elements: [
    {
      type: string;
      scope: string;
    }
  ];
}

export interface CommonOptions {
  [key: string]: string;
}

export interface TourOptions {
  [key: string]: {
    title: string;
    explanation: string;
  };
}

@Injectable()
export class AdminService {
  public appName = '';
  public userData: any = {};
  public userDataSubject = new Subject<any>();
  public userDataSub: Observable<any> = this.userDataSubject.asObservable();

  private withCredentials = { withCredentials: true };

  constructor(private http: HttpClient, private cookie: CookieService, private translate: TranslateService) {}

  /**
   * Provides avatar image s3 url
   * @param size: string
   */
  public getAvatarUrl(size: string, userId?: string): string {
    const picData = this.userData.picture;
    const picture = picData && picData.picture;

    return picture
      ? `
        ${PUBLIC_CDN_URL}/${picture.display_start
          .replace('${display_size}', size)
          .replace('${display_format}', picture.display_formats[0])
          .replace('avatar/avatar', 'avatar/' + picData.uuid + '-avatar')}
      `
      : `
        ${PUBLIC_CDN_URL}/users/${
          userId ? userId : this.userData.user_id
        }/avatar/images/avatar?ext=png&width=${size}&height=0&max_age=0
      `;
  }

  /**
   * Get user profile
   */
  public getProfile(): Observable<IUserProfile> {
    return this.fetchProfile().pipe(
      map((userProfile: IUserProfile) => {
        this.appName = userProfile.app_name || 'CaseActive';

        this.updateProfile(userProfile);
        this.setLanguage(userProfile.locale);

        this.userDataSubject.next(userProfile);

        return userProfile;
      })
    );
  }

  /**
   * Clear and update user profile
   * @param userProfile: UserProfile
   */
  public updateProfile(userProfile: IUserProfile) {
    this.clearUserData();
    _.extend(this.userData, userProfile);
  }

  /**
   * Fetch profile
   */
  public fetchProfile(): Observable<IUserProfile> {
    return this.http.get<IUserProfile>(API_URL('/whoami')).pipe(pluck('data'));
  }

  /**
   * Fetch options
   * @param path: string
   * @param locale: string
   */
  public fetchOptions(path: string, locale: string): Observable<CommonOptions | TourOptions> {
    locale = locale || this.userData.locale || this.cookie.get('locale') || 'en';

    return this.http.get<{ [key: string]: string } | TourOptions>(OPTIONS_URL(path, locale), this.withCredentials);
  }

  /**
   * Fetch options from server
   * @param path: string
   * @param locale: string
   */
  public fetchOptionsServerOnly(path: string, locale: string): Observable<{ [key: string]: string }> {
    locale = locale || this.userData.locale || this.cookie.get('locale') || 'en';

    return this.http.get<{ [key: string]: string }>(OPTIONS_URL(path, locale), this.withCredentials);
  }

  /**
   * Convert object to array
   * @param obj: { [key: string]: string }
   */
  public toArray(obj: { [key: string]: string }): { [key: string]: string }[] {
    return Object.keys(obj).map(keyValue => ({ key: keyValue, value: obj[keyValue] }));
  }

  /**
   * Get options
   * @param list: string[]
   * @param locale: string
   */
  public getOptions(list: string[], locale: string): Observable<any> {
    const ALL_OPTIONS = ['/dropdowns/countries', '/dropdowns/genders', '/dropdowns/timezones', '/dropdowns/languages'];
    const observables$: Array<Observable<any>> = [];

    list = list || ALL_OPTIONS;

    list.forEach(option => observables$.push(this.fetchOptions(option, locale).pipe(map(this.toArray as any))));

    return forkJoin(observables$);
  }

  /**
   * Get options from server
   * @param list: string[]
   * @param locale: string
   */
  public getOptionsServerOnly(list: string[], locale: string): Observable<any> {
    const observables$: Array<Observable<any>> = [];

    list.forEach(option => observables$.push(this.fetchOptionsServerOnly(option, locale).pipe(map(this.toArray))));

    return forkJoin(observables$);
  }

  /**
   * Clear user profile data
   */
  public clearUserData() {
    for (const prop in this.userData) {
      if (this.userData.hasOwnProperty(prop)) {
        delete this.userData[prop];
      }
    }
  }

  /**
   * Login request
   * @param username: string
   * @param password: string
   */
  public login(username: string, password: string): Observable<any> {
    return this.http.post(API_URL('/session'), { username, password }, this.withCredentials);
  }

  /**
   * Set app language
   * @param locale: string
   */
  public setLanguage(locale: string = this.cookie.get('locale') || 'en') {
    this.cookie.set('locale', locale);
    this.translate.setDefaultLang(locale);
  }

  /**
   * Redirect to logout route
   */
  public logout() {
    location.href = `${environment.ACCOUNT_CLIENT_URL}/apps/logout`;
  }

  /**
   * Check if the user is logged in
   */
  public isLoggedIn() {
    return !_.isEqual(this.userData, {});
  }

  /**
   * Update modules
   * @param data: { modules: string[] }
   */
  public updateModules(data: { modules: string[] }): Observable<any> {
    return this.http.put(API_URL('/modules'), data, this.withCredentials);
  }

  /**
   * Update profile information
   * @param data: { require_userfields: string[] }
   */
  public updateProfileInfo(data: { require_userfields: string[] | null}): Observable<any> {
    return this.http.put(API_URL('/host'), data, this.withCredentials);
  }

  /**
   * Update schema
   * @param data: any
   * @param schemaType: string
   */
  public updateSchema(data: any, schemaType: string): Observable<any> {
    return this.http.put(API_URL(`/schemas/${schemaType}`), data, this.withCredentials);
  }
}
