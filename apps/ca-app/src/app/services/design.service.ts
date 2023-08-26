import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { AlwaysAuthGuard } from './../services/user.service';
import { UtilsService } from './utils.service';
import { API_URL, PUBLIC_CDN_URL, ADMIN_CDN_URL, HOST_CDN_URL } from '../utils/constants.utils';

@Injectable()
export class DesignService {
  private withCredentials = { withCredentials: true };
  private userType?: string;
  private designCdnLink?: string;
  public uuid = '';

  constructor(
    private http: HttpClient,
    private utils: UtilsService,
    private sanitizer: DomSanitizer,
    private authGuardService: AlwaysAuthGuard
  ) {
    this.authGuardService.authSub.subscribe(r => {
      this.userType = r.user_type;

      if (this.userType === 'admin') {
        this.designCdnLink = ADMIN_CDN_URL;
      } else {
        this.designCdnLink = PUBLIC_CDN_URL;
      }
    });
  }

  getFaviconSecureUrl(targetName: string, ext: string, host: string, size?: string, uuid?: string) {
    const data = this[(targetName + 'Data') as keyof DesignService];
    const uuidValue: any = uuid || (data && (data as any).uuid);

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

  getCssLink = () => {
    return this.userType !== 'admin'
      ? this.sanitizer.bypassSecurityTrustResourceUrl(
          this.designCdnLink + '/hosts/' + this.utils.get_host() + '/design.css'
        )
      : this.sanitizer.bypassSecurityTrustResourceUrl(
          this.designCdnLink + '/public/file?file=hosts/' + this.utils.get_host() + '/design.css&max_age=0'
        );
  };

  getDesignUrl = (targetName: string, ext: string, size?: string, uuid?: string) => {
    const data = this[(targetName + 'Data') as keyof DesignService];
    const uuidValue: any = uuid || (data && (data as any).uuid);

    if (targetName === 'design') {
      return `/${targetName}/design.css?max_age=0`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      HOST_CDN_URL(
        `/${targetName}/images/${
          uuidValue ? `${uuidValue}-` : ''
        }${targetName}?ext=${ext}&width=${size}&height=0&max_age=0`
      )
    );
  };

  getFastLoadingDesign(): string {
    return HOST_CDN_URL(`/design/fast-loading-design.css?max_age=0`);
  }

  getFaviconUrl() {
    return {
      then: (fn: any) => {
        fn(
          this.userType !== 'admin'
            ? this.designCdnLink +
                '/public/image?width=100&height=100&ext=png&image=hosts/' +
                this.utils.get_host() +
                '/favicon.png&max_age=86400&avatar=False'
            : this.designCdnLink +
                '/public/image?width=100&height=100&ext=png&image=hosts/' +
                this.utils.get_host() +
                '/favicon.png&max_age=0&avatar=False&q=' +
                new Date().getTime()
        );
      }
    };
  }

  getLogoUrl() {
    return {
      then: (fn: any) => {
        const logoUrl =
          this.userType !== 'admin'
            ? this.designCdnLink +
              '/public/image?width=100&height=100&ext=png&image=hosts/' +
              this.utils.get_host() +
              '/logo.png&max_age=86400&avatar=False'
            : this.designCdnLink +
              '/public/image?width=100&height=100&ext=png&image=hosts/' +
              this.utils.get_host() +
              '/logo.png&max_age=0&avatar=False&q=' +
              new Date().getTime();

        fn(logoUrl);
      }
    };
  }

  getDesignJson() {
    return this.http.get(`${API_URL}/design/design`, this.withCredentials);
  }
}
