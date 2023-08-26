import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, Subject } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { API_URL, HOSTS_PUBLIC_CDN_URL, PUBLIC_CDN_URL } from '../shared/constants.utils';

export interface IDesign {
  available_colors: {
    logo: string[];
    favicon: string[];
  };
  colors: {
    background: string;
    text: string;
  };
}

export interface ICompanyInfo {
  name: string;
  terms: string;
  website: string;
}

export interface IPaymentCardInfo {
  address1: string;
  address2?: string;
  cardholder_name: string;
  country?: string;
  locality: string;
  postal_code: string;
  region: string;
  token: string;
}

export enum SystemType {
  Logo = 'logo',
  Favicon = 'favicon',
  Analytics = 'analytics'
}

@Injectable()
export class DesignService {
  private withCredentials = { withCredentials: true };
  private logoUpdateSubject: Subject<any> = new Subject();
  private uuidChangeSubject: Subject<any> = new Subject();

  constructor(private sanitizer: DomSanitizer, private http: HttpClient) {}

  /**
   * Get design change sub as observable
   */
  designChangeSubscription = () => this.logoUpdateSubject.asObservable();

  /**
   * Get uuid change sub as observable
   */
  uuidChangeSubscription = () => this.uuidChangeSubject.asObservable();

  /**
   * Emit design change
   */
  designChange() {
    this.logoUpdateSubject.next();
  }

  /**
   * Emit analytics change
   */
  analyticsChange() {
    this.uuidChangeSubject.next();
  }

  /**
   * get Company info
   */
  getCompanyInfo(): Observable<any> {
    return this.http.get(API_URL('/host'), this.withCredentials).pipe(pluck('data'));
  }

  /**
   * Update Company info
   */
  updateCompanyInfo(payload: any): Observable<any> {
    return this.http.put(API_URL('/host'), payload, this.withCredentials);
  }

  /**
   * Update Signup info
   */
  updateSignupInfo(payload: any): Observable<any> {
    return this.http.put(API_URL('/settings/signup'), payload, this.withCredentials);
  }

  /**
   * Update design data
   * @param design: IDesign
   */
  updateDesignData(design: IDesign): Observable<any> {
    return this.http.put(API_URL('/system/design'), { design }, this.withCredentials);
  }

  /**
   * Delete system type
   * @param type: SystemType
   */
  deleteSystemType(type: SystemType): Observable<any> {
    return this.http.delete(API_URL(`/system/logo?logo_type=${type}`), this.withCredentials);
  }

  /**
   * Get analytics URL
   */
  getAnalyticsUrl = () => HOSTS_PUBLIC_CDN_URL('/analytics/analytics.js??max_age=0');

  /**
   * Get desing URL
   * @param targetName: string
   * @param ext: string
   * @param size: string
   */
  getDesignUrl = (targetName: string, ext: string, size?: string, heigth: string = '0'): SafeResourceUrl => {
    const url =
      targetName === 'design'
        ? `/${targetName}/design.css?max_age=0`
        : // @ts-ignore
          `/${targetName}/images/${targetName}?ext=${ext}&width=${size}&height=${heigth}&max_age=0&t=${Math.random()}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(HOSTS_PUBLIC_CDN_URL(url));
  };

  getFastLoadingDesign(): string {
    return HOSTS_PUBLIC_CDN_URL(`/design/fast-loading-design.css?max_age=0`);
  }

  /**
   * Update analytics key
   * @param analyticsId: string
   */
  updateAnalyticsKey(analyticsId: string): Observable<any> {
    const data = {
      analytics: {
        analytics_id: analyticsId
      }
    };

    return this.http.put(API_URL('/system/analytics'), data, this.withCredentials);
  }

  /**
   * Delete analytics key
   */
  deleteAnalyticsKey(): Observable<any> {
    return this.http.delete(API_URL('/system/analytics'), this.withCredentials);
  }

  getFaviconSecureUrl(targetName: string, ext: string, host: string, size?: string, uuid?: string) {
    const data = this[targetName + 'Data' as keyof DesignService];
    const uuidValue = uuid || (data && (data as any).uuid);

    if (targetName === 'design') {
      return `/${targetName}/design.css?max_age=0`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      PUBLIC_CDN_URL +
        '/hosts/' +
        host +
        `/${targetName}/images/${
          uuidValue ? `${uuidValue}-` : ''
        }${targetName}?ext=${ext}&width=${size}&height=0&max_age=0`
    );
  }
}
