import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { cloneDeep } from 'lodash';

import { environment } from '../../environments/environment';
import { NotificationItem } from '../modules/apps/app.model';
import { not } from 'rxjs/internal-compatibility';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor(private router: Router) {}

  private copy(obj: { [key: string]: string }): { [key: string]: string } {
    return cloneDeep(obj);
  }

  private host(): any {
    return window.location.hostname;
  }

  private omit(obj: any, props: any): any {
    if (obj.length) {
      return obj.map((o: any) => {
        return this.omit(o, props);
      });
    }

    const result = this.copy(obj);

    props.forEach((prop: any) => {
      delete result[prop];
    });

    return result;
  }

  public pick(obj: any, props: any): any {
    if (obj.length) {
      return obj.map((o: any) => {
        return this.pick(o, props);
      });
    }

    const result: {[key: string]: string} = {};

    props.forEach((prop: string) => {
      result[prop] = typeof obj[prop] === 'object' ? this.copy(obj[prop]) : obj[prop];
    });

    return result;
  }

  // should be removed from the service.
  public toggleHtmlBg(setE: boolean): void {
    const html = document.querySelector('html');

    if (setE) {
      html?.classList.remove('b');
      html?.classList.add('e');
    } else {
      html?.classList.remove('e');
      html?.classList.add('b');
    }
  }

  public userAvatarUrl(userId: string, size: number, uuid?: string): string {
    const tempUuid = uuid === '' || undefined === uuid ? '' : `${uuid}-`;
    return `${environment.PUBLIC_CDN_URL}/users/${userId}/avatar/images/${tempUuid}avatar?ext=png&width=${size}&height=0&max_age=0`;
  }

  public redirectTo(notification: NotificationItem): void {
    let resURL = '';
    switch (notification.module_name) {
      case 'form':
        resURL = `/forms/doc-form-builder/${notification?.who.form?.form_id}`;
        resURL = '/forms';
        break;
      case 'sign':
        resURL = `/signs/doc-sign-builder/${notification?.who.sign?.sign_id}`;
        resURL = '/signs';
        break;
      case 'event':
        resURL = '/events';
        break;
      case 'note':
        resURL = '/notes';
        break;
      default:
        resURL = '/';
        break;
    }
    const reference: string = location.host;
    const port = '4203';

    location.href = environment.IS_LOCAL
      ? `http://${notification.who.host.host_id}.localhost:${port}${resURL}`
      : `https://${notification.who.host.host_id}.${reference}${resURL}`;
  }

  // remove nullable and empty properties from the object
  public cleanObject(object: {[key: string]: string }) {
    Object.keys(object).forEach(key => (object[key] == null || object[key] === '') && delete object[key]);
    return object;
  }

  public fullDate = (date: Date) => date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();
}
