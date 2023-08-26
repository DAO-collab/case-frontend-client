import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import * as _ from 'lodash';

import { environment } from '@acc-envs/environment';
import { map } from 'rxjs/operators';
import { IUser } from '../core/user.model';
import { API_URL, OPTIONS_URL, PUBLIC_CDN_URL, HOST_CDN_URL, RESPONSE_DATA } from '../utils/constants.utils';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private withCredentials = { withCredentials: true };
  public userData: any = {};
  private cachedProfilePromise: any;
  public avatarRandKey = Math.random();

  private credentials = () => {
    return {
      headers: {
        'X-XSRF-TOKEN': this.cookies.get('XSRF-TOKEN')
      },
      withCredentials: true
    };
  };

  constructor(
    private httpClient: HttpClient,
    private cookies: CookieService,
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  public getAvatarUrl(user: IUser, size: string): string {
    /**
     *  The commented block doesn't seem to be valid.
     */
    // const picData = this.userData.picture,
    // picture = picData && picData.picture;

    // if (picture) {
    //   return PUBLIC_CDN_URL('/' + picture.display_start
    //     .replace('${display_size}', size)
    //     .replace('${display_format}', picture.display_formats[0])
    //     .replace('avatar/avatar', 'avatar/' + picData.uuid + '-avatar'));
    // } else {
    //   return `${environment.PUBLIC_CDN_URL}/users/${this.userData.user_id}/avatar/images/avatar?max_age=0&width=${size}&height=0&t=${this.avatarRandKey}`;
    // }

    return `${environment.PUBLIC_CDN_URL}/users/${user.user_id}/avatar/images/avatar?max_age=0&width=${size}&height=0&t=${this.avatarRandKey}`;
  }
  public fetchOptionsServerOnly(path: string, locale: string): Observable<{ [key: string]: string }> {
    locale = locale || this.userData.locale || this.cookies.get('locale') || 'en';

    return this.httpClient.get<{ [key: string]: string }>(OPTIONS_URL(path, locale), this.withCredentials);
  }
  public getProfile(forceUpdate?: boolean): any {
    return forkJoin(
      this.fetchProfile().then((response: { data: unknown }) => {
        return response.data || response;
      })
    )
      .toPromise()
      .then(data => {
        const fData: any = data[0];

        this.updateProfile(fData);
        this.setLanguage(fData.locale);
        this.cachedProfilePromise = null;
        this.avatarRandKey = Math.random();
        return fData;
      });
  }

  public loginTry(): any {
    return this.httpClient.get(API_URL('/v1/self'), this.credentials()).toPromise();
  }

  private updateProfile(data: any): void {
    this.clearUserData();
    _.extend(this.userData, data);
  }

  // return promise for already pending request instead of making a new one
  private fetchProfile(): any {
    if (!this.cachedProfilePromise) {
      this.cachedProfilePromise = this.httpClient
        .get(API_URL('/v1/self'), this.credentials())
        .toPromise()
        .catch(err => {
          this.cachedProfilePromise = null;
          this.router.navigate(['login']);
        });
    }

    return this.cachedProfilePromise;
  }

  private fetchOptions(path: string, locale?: string): Promise<{ [key: string]: string }> {
    locale = locale || this.userData.locale || this.cookies.get('locale') || 'en';

    return this.httpClient.get<{ [key: string]: string }>(OPTIONS_URL(path, locale!)).toPromise();
  }

  private toArray(obj: {[key: string]: string}): { [key: string]: string }[] {
    return Object.keys(obj).map(key => {
      return { id: key, text: obj[key] };
    });
  }

  public getOptions(list: string[], locale?: string, asArray?: boolean): any {
    const ALL_OPTIONS = ['/dropdowns/countries', '/dropdowns/genders', '/dropdowns/timezones', '/dropdowns/languages'],
      promises: Promise<any>[] = [];

    list = list || ALL_OPTIONS;

    list.forEach(option => {
      const key = option.split('/').pop();

      promises.push(
        this.fetchOptions(option, locale)
          .then(RESPONSE_DATA)
          // converting options to arrays to later sort with orderBy filter
          .then(asArray ? this.toArray : _.identity)
      );
    });

    return forkJoin(promises).toPromise();
  }

  public clearUserData(): void {
    for (const prop in this.userData) {
      if (this.userData.hasOwnProperty(prop)) {
        delete this.userData[prop];
      }
    }
  }

  public setLanguage(locale: string): void {
    !locale
      ? (locale = this.cookies.get('locale') || 'en')
      : this.cookies.set('locale', locale, undefined, undefined, environment.IS_LOCAL ? 'localhost' : 'caseactive.net');
    this.translate.use(locale);
  }

  public isLoggedIn(): number {
    return Object.keys(this.userData).length;
  }

  public getDesignUrl = (targetName: string, ext: string, size?: string, hostId?: string, uuid?: string) => {
    const uuidValue = uuid || '';
    if (!hostId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        PUBLIC_CDN_URL('/' + targetName + '/' + targetName + (size ? '_' + size : '') + '.' + ext)
      );
    } else {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        HOST_CDN_URL(
          '/' +
            hostId +
            '/' +
            targetName +
            '/' +
            (uuidValue ? uuidValue + '-' : '') +
            targetName +
            (size ? '_' + size : '') +
            '.' +
            ext
        )
      );
    }
  };
  public getOptionsServerOnly(list: string[], locale: string): Observable<any> {
    const observables$: Array<Observable<any>> = [];

    list.forEach(option => observables$.push(this.fetchOptionsServerOnly(option, locale).pipe(map(this.toArray))));

    return forkJoin(observables$);
  }
}
