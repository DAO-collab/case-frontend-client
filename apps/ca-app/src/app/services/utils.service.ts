import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { distinct, count } from 'rxjs/operators';

import { environment } from './../../environments/environment';
import { NotificationItem } from '../models/AppModel';

@Injectable()
export class UtilsService {
  private draftSavedElent?: Element;

  constructor(private router: Router) {}

  public copy(obj: {[key: string]: any}) {
    return JSON.parse(JSON.stringify(obj));
  }

  public host() {
    return window.location.hostname;
  }

  public omit(obj: any, props: any) {
    if (obj.length) {
      return obj.map((o: any) => {
        return this.omit(o, props);
      });
    }

    const result = this.copy(obj);

    props.forEach((prop: string) => {
      delete result[prop];
    });

    return result;
  }

  public pick(obj: any, props: any) {
    if (obj.length) {
      return obj.map((o: any) => {
        return this.pick(o, props);
      });
    }

    const result: any = {};

    props.forEach((prop: string) => {
      result[prop] = this.copy(obj[prop]);
    });

    return result;
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
        resURL = `/e-signs/doc-e-sign-builder/${notification?.who.sign?.sign_id}`;
        resURL = '/e-signs';
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
    this.router.navigate([resURL]);
  }

  public get_host() {
    const host = this.host();

    if (host.indexOf('.') < 0) {
      return null;
    } else {
      return host.split('.')[0];
    }
  }

  public get_random(l: number) {
    // todo make better random
    return Math.random()
      .toString(36)
      .substring(2, l + 2);
  }

  public getCookie(name: string) {
    const cookiesSplit = document.cookie.split(';');
    let targetCookieVl;

    cookiesSplit.map(cookie => {
      const cookieParts = cookie.split('=');

      if (cookieParts[0].trim() === name) {
        targetCookieVl = cookieParts;
      }
    });

    return targetCookieVl;
  }

  public convertTime12to24(time12h: string) {
    const [time, modifier] = time12h.split(' ');
    const timeFrames = time.split(':');

    let hours: any = timeFrames[0];
    const minutes = timeFrames[1];

    if (hours === '12') {
      hours = '00';
    }

    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }

    hours = ('0' + hours).substr(-2);

    return hours + ':' + minutes;
  }

  convertTime24to12(date: string | Date) {
    if (typeof date === 'string') {
      const split = date.split(':');
      const tempHours = split[0];
      const tempMinutes = split[1].split(' ')[0];
      date = new Date();
      (date as Date).setHours(+tempHours, +tempMinutes, 0);
    }

    let hours: number = date.getHours();
    let minutes: string | number = date.getMinutes();
    var ampm = hours === 0 || hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = ('0' + hours).substr(-2) + ':' + ('0' + minutes).substr(-2) + ' ' + ampm;
    return strTime;
  }

  roundTimeToCustom(dateTime: Date, minutesToAdd: number) {
    if (dateTime.getMinutes() >= 30) {
      dateTime.setHours(dateTime.getHours() + 1);
    }

    let minutes = dateTime.getMinutes() >= 30 ? 0 : 30;

    minutes += minutesToAdd;

    if (minutesToAdd !== null) {
      dateTime.setMinutes(minutes);
    }

    return dateTime;
  }

  // Generate time array for times
  public generateTimeArray() {
    const minutesInterval = 30;
    const tempTimeArray = [];
    let startTime = 0;
    const ap = ['AM', 'PM'];

    for (let i = 0; startTime < 24 * 60; i++) {
      const hh = Math.floor(startTime / 60);
      const mm = startTime % 60;
      let time = ('0' + (hh % 12)).slice(-2) + ':' + ('0' + mm).slice(-2) + ' ' + ap[Math.floor(hh / 12)];

      switch (time) {
        case '00:00 AM':
          time = '12:00 AM';
          break;
        case '00:30 AM':
          time = '12:30 AM';
          break;
        case '00:00 PM':
          time = '12:00 PM';
          break;
        case '00:30 PM':
          time = '12:30 PM';
          break;
      }

      tempTimeArray[i] = time;
      startTime = startTime + minutesInterval;
    }

    return tempTimeArray;
  }

  public convertObjectKeysToArray(obj: any): string[] {
    return Object.keys(obj || {});
  }

  public getObjectLength(obj: {[key: string]: string}): number {
    if (obj != undefined) {
      const objectLength = Object.keys(obj).length;
      return objectLength > 0 ? objectLength : 0;
    } else {
      return 0;
    }
  }

  public getDistinctValueCount(arr: any): number {
    if (arr != undefined) {
      let counts: any = {};
      for (let i = 0; i < arr.length; i++) {
        counts[arr[i]] = 1 + (counts[arr[i]] || 0);
      }
      return counts ? Object.keys(counts).length : 0;
    } else {
      return 0;
    }
  }

  // Generate array for acceptable fields
  public generateAcceptableFields(): string[] {
    return ['title', 'type', 'items', 'readonly', 'fieldType', 'defaultValue'];
  }

  // Generate types array for fields
  public generateTypesByFields() {
    return {
      'text-only': { type: 'string', defaultValue: '' },
      docs: { type: 'string', defaultValue: '' },
      images: { type: 'string', defaultValue: '' },
      blank: { type: 'string', defaultValue: '' },
      text: { type: 'string', defaultValue: '' },
      'multi-text': { type: 'string', defaultValue: '' },
      textarea: { type: 'string', defaultValue: '' },
      dropdown: {
        type: 'string',
        items: {
          type: 'string',
          enum: []
        },
        enum: [],
        defaultValue: ''
      },
      radio: {
        type: 'string',
        items: {
          type: 'string',
          enum: []
        },
        enum: [],
        defaultValue: ''
      },
      multidropdown: {
        type: 'array',
        items: {
          type: 'string',
          enum: []
        },
        enum: [],
        defaultValue: []
      },
      checkboxes: {
        type: 'array',
        items: {
          type: 'string',
          enum: []
        },
        enum: [],
        itemsToAddLimit: 10,
        defaultValue: []
      },
      'checkbox-options': {
        type: 'array',
        items: {
          type: 'string',
          enum: []
        },
        enum: [],
        itemsToAddLimit: 10,
        defaultValue: []
      },
      options: {
        type: 'string',
        items: {
          type: 'string',
          enum: []
        },
        enum: [],
        itemsToAddLimit: 10,
        defaultValue: ''
      },
      list: {
        type: 'string',
        items: {
          type: 'string',
          enum: []
        },
        enum: [],
        itemsToAddLimit: 10,
        defaultValue: '',
        height: '150px'
      },
      date: {
        type: 'string',
        pattern: '^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$',
        defaultValue: '',
        format: 'date'
      },
      time: {
        type: 'string',
        pattern: '^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$',
        defaultValue: '',
        format: 'time'
      },
      boolean: { type: 'boolean', defaultValue: false },
      number: { type: 'number', defaultValue: 0 },
      'signature-box': { type: 'string', value: null },
      table: {
        type: 'array',
        defaultValue: [],
        cols: [],
        rows: [[]],
        height: '110px'
      }
    };
  }

  public selectedMultiple(id: string, objectData: any, propertyName: string) {
    if (objectData[propertyName].indexOf(id) === -1 && typeof objectData[propertyName] === 'object') {
      objectData[propertyName].push(id);
    }
  }

  public removedFromMultiple(id: string, objectData: any, propertyName: string) {
    if (typeof objectData[propertyName] === 'object') {
      objectData[propertyName].splice(objectData[propertyName].indexOf(id));
    }
  }

  /**
   * description: check if object is empty or not
   * @param obj : Object to check
   * created by: Igor Terentjev
   */
  public checkObjectEmpty(obj: Object) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }

    return true;
  }

  public filterNumbers = (v: string) => v.replace(/[^0-9.]/g, '');

  public doMask(x: string, mask: string): string | void {
    if (typeof x !== 'string') return;
    x = x.replace(/-/g, '').replace('&&', '');
    const characterPattern = '#';
    const digitPattern = '9';
    var strippedValue = x;
    var chars = strippedValue.split('');
    var count = 0;

    var formatted = '';
    for (var i = 0; i < mask.length; i++) {
      const c = mask[i];
      if (c === characterPattern) {
        if (chars[count]) {
          formatted += chars[count];
          count++;
        } else {
          break;
        }
      } else if (c === digitPattern) {
        if (chars[count] && chars[count] >= '0' && chars[count] <= '9') {
          formatted += chars[count];
          count++;
        } else {
          break;
        }
      } else {
        if (chars[count]) {
          formatted += c;
        }
      }
    }
    return formatted;
  }

  // Update document size for resize window
  public updateDocumentViewSizeDueToWindowWidth = () => {
    const parentNode: any = document.querySelector('.document-image-wrapper');

    if (parentNode) {
      const documentList = document.querySelector('.documents-list') as HTMLElement;
      if (!documentList) return;
      const documentsListElWidthDiff = documentList['offsetWidth'] / 880;
      parentNode.style.zoom = documentsListElWidthDiff;
    }
  };

  public convertResponseArrayToObject(responseArray: { [key: string]: unknown }[]): { [key: string]: unknown } {
    let obj: { [key: string]: unknown } = {};
    for (let i = 0; i < responseArray.length; i++) {
      obj = { ...obj, ...responseArray[i] };
    }
    return obj;
  }
}
