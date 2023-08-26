import { Injectable } from '@angular/core';

import { environment } from './../../environments/environment';

@Injectable()
export class UtilsService {
  constructor() {}

  public copy(obj: any) {
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

    props.forEach((prop: any) => {
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

    props.forEach((prop: any) => {
      result[prop] = this.copy(obj[prop]);
    });

    return result;
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

  public userAvatarUrl(userId: string, size: number, uuid?: string): string {
    const tempUuid = uuid === '' || undefined === uuid ? '' : `${uuid}-`;
    return `${environment.PUBLIC_CDN_URL}/users/${userId}/avatar/images/${tempUuid}avatar?ext=png&width=${size}&height=0&max_age=0`;
  }

  public fetchErrorsTo(errors: any, to: any) {
    // Clear previous errors
    Object.keys(to).forEach(k => delete to[k]);

    errors?.errors?.forEach((error: any) => {
      to[error.location] =
        (!to[error.location] && [{ id: error.message }]) || to[error.location].push({ id: error.message });
    });
  }

  public selectedMultiple(id: number, objectData: any, propertyName: string): void {
    if (objectData[propertyName].indexOf(id) === -1 && typeof objectData[propertyName] === 'object') {
      objectData[propertyName].push(id);
    }
  }

  public removedFromMultiple(id: number, objectData: any, propertyName: string): void {
    if (typeof objectData[propertyName] === 'object') {
      objectData[propertyName].splice(objectData[propertyName].indexOf(id), 1);
    }
  }

  public removedFromMultipleWithoutParent(id: number, objectData: any, propertyName: string) {
    if (typeof objectData[propertyName] === 'object') {
      objectData[propertyName].splice(objectData[propertyName].indexOf(id));
    }
  }

  public selected(scope: any, e: any, vr: any, pr: any) {
    if (pr) {
      scope[pr][vr] = e.id;
    } else {
      scope[vr] = e.id;
    }
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

  absDaysDiff = (end: number, start: number) => Math.abs(Math.floor((end - start) / (1000 * 60 * 60 * 24) + 1));

  fullDate = (date: Date) => date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();

  replaceSpaces = (value: string) => value.replace(/\s+/g, '_');

  transformDropdownValues(obj: {[key: string]: any}) {
    Object.keys(obj).forEach(k => {
      const v = obj[k];

      if (typeof v === 'object' && v.length) {
        v.forEach((value: any, i: number) => {
          if (value.id !== undefined) {
            obj[k][i] = value.id;
          }
        });
      } else if (typeof v === 'object' && v.length === undefined) {
        obj[k] = obj[k].id;
      }
    });

    return obj;
  }

  // Get convert date to DateTime for rrule
  public getDateForRrule(): string {
    const date = new Date();
    date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    return date.toISOString();
  }

  // remove nullable and empty properties from the object
  public cleanObject(object: {[key: string]: any}) {
    Object.keys(object).forEach(key => (object[key] == null || object[key] === '') && delete object[key]);
    return object;
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
      table: {
        type: 'array',
        defaultValue: [],
        cols: [],
        rows: [[]]
      }
    };
  }

  convertTime24to12(date: string | Date): string | void {
    if (!date) return;
    if (typeof date === 'string') {
      const split = date.split(':');
      const tempHours = split[0];
      const tempMinutes = split[1].split(' ')[0];
      date = new Date();
      (date as Date).setHours(+tempHours, +tempMinutes, 0);
    }

    let hours: number = date.getHours();
    let minutes: string | number = date.getMinutes();
    const ampm = hours === 0 || hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const strTime = ('0' + hours).substr(-2) + ':' + ('0' + minutes).substr(-2) + ' ' + ampm;
    return strTime;
  }

  public convertTime12to24(time12h: string): string | void {
    if (!time12h) return;
    const [time, modifier] = time12h.split(' ');
    const timeFrames = time.split(':');

    let hours: string | number = timeFrames[0];
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
}
