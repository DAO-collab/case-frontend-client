import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { environment } from '../../environments/environment';
import { HOST_CDN_URL } from '../utils/constants.utils';

@Injectable({ providedIn: 'root' })
export class DesignService {
  constructor(private sanitizer: DomSanitizer) {}

  getFaviconSecureUrl(targetName: string, ext: string, host: string, size?: string, uuid?: string): any {
    const data = this[(targetName + 'Data') as keyof DesignService];
    const uuidValue = uuid || (data && (data as any).uuid);

    if (targetName === 'design') {
      return `/${targetName}/design.css?max_age=0`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      environment.PUBLIC_CDN_URL +
        '/hosts/' +
        host +
        `/${targetName}/images/${
          uuidValue ? `${uuidValue}-` : ''
        }${targetName}?ext=${ext}&width=${size}&height=0&max_age=0`
    );
  }

  updateDesign(design?: string, hostId?: string): void {
    const element = document.querySelector('#dynamic-design');

    design && hostId
      ? element?.setAttribute('href', HOST_CDN_URL(`/${hostId}/design/${design}.css?max_age=0`))
      : element?.setAttribute('href', '');
  }
}
