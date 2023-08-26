import { Injectable, OnInit, NgZone, Directive } from '@angular/core';
import { ConstantsService } from './../services/constants.service';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class HttpResponse {
  private errorSubject = new Subject();
  public errorHappen = this.errorSubject.asObservable();

  constructor() {}
}

@Directive()
class Request<T> implements OnInit {
  private errorResponse: any;
  private successResponse: any;
  private xhr!: XMLHttpRequest;
  private data: any;
  private thenFn: any[] = []; // subscribers for success response
  private catchFn: any[] = []; // subscribers for error response

  public sendRequest = () => this.xhr.send(this.data);

  constructor(private ngZone: NgZone, private constants: any) {}

  ngOnInit(): void {}

  private standartFunctionality(): void {
    this.xhr.onreadystatechange = () => {
      if (this.xhr.readyState === 4) {
        if (this.xhr.status !== 200 && this.xhr.status !== 204 && this.xhr.status !== 201) {
          // Error
          setTimeout(() => this.ngZone.run(() => {}));
          this.errorResponse = new HttpResponse();
          this.errorResponse.setParams(this.xhr.responseText, this.constants);
          this.catchFn.map(fn => (this.errorResponse = fn(<HttpResponse>this.errorResponse)));
        } else {
          // Success
          setTimeout(() => this.ngZone.run(() => {}));
          this.successResponse = new HttpResponse();
          this.successResponse.setParams(this.xhr.response || this.xhr.responseText, this.constants);
          this.thenFn.map(fn => (this.successResponse = fn(<HttpResponse>this.successResponse)));
        }
      }
    };
  }

  public getCookie(name: string): any {
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

  public createRequest(req: any): void {
    this.xhr = new req();
    this.standartFunctionality();
  }

  public setOptions(options?: any): void {
    if (options && options.headers) {
      const keys = Object.keys(options.headers);

      keys.map(k => this.xhr.setRequestHeader(k, options.headers[k]));
    }

    this.xhr.withCredentials = true;

    // if (environment.PRODUCTION) {
    //   this.xhr.setRequestHeader('x-xsrf-token', this.getCookie('XSRF-TOKEN')[1]);
    // }

    const directOptionsKeys = Object.keys(options || {});

    directOptionsKeys.map(k => {
      if (k !== 'withCredentials' && k !== 'headers') {
        // @ts-ignore
        this.xhr[k] = options[k];
      }
    });
  }

  public setRequestParams(type: string, url: string, async?: boolean): void {
    this.xhr.open(type, url, async === undefined ? true : async);
  }

  public setData(data: any): void {
    this.data = typeof data === 'object' ? JSON.stringify(data) : data;
  }

  public then = (fn: any) => {
    this.thenFn.push(fn);

    return this;
  };

  public catch = (fn: any) => {
    this.catchFn.push(fn);

    return this;
  };

  public reset = () => {
    this.catchFn = [];
    this.thenFn = [];
  };
}

@Injectable()
export class HttpRService {
  private xhr: any;
  private iframeAdded: Boolean = false;
  private XMLHttpRequestAPI?: XMLHttpRequest;

  private iframeSubject: Subject<any> = new Subject<any>();

  public iframeloadedObserver: Observable<any> = this.iframeSubject.asObservable();

  constructor(private ngZone: NgZone, private constants: ConstantsService) {}

  public addIframe(): void {
    if (this.iframeAdded) {
      return this.iframeSubject.next();
    }

    const apiIframe = document.createElement('iframe'),
      self = this;

    apiIframe.onload = function () {
      // @ts-ignore
      self.XMLHttpRequestAPI = (<any>this['contentWindow']).XMLHttpRequest;
      self.iframeSubject.next();
    };

    // apiIframe.setAttribute('src', environment.ACCOUNT_API_URL + '/receiver');
    apiIframe.style.display = 'none';
    document.body.appendChild(apiIframe);
    document.body.appendChild(apiIframe);
    this.iframeAdded = true;
  }

  private createRequest(disablePreflight: Boolean): void {
    if (!disablePreflight) {
      this.xhr = XMLHttpRequest;
    } else {
      this.xhr = this.XMLHttpRequestAPI || XMLHttpRequest;
    }
  }

  public get(url: string, options?: any, disablePreflight?: any) {
    const request: any = new Request(this.ngZone, this.constants);

    this.createRequest(disablePreflight);
    request.createRequest(this.xhr);
    request.setRequestParams('GET', url);
    request.setOptions(options);
    request.sendRequest();

    return request;
  }

  public post(url: string, data: any, options?: any, disablePreflight?: any) {
    const request = new Request(this.ngZone, this.constants);

    this.createRequest(disablePreflight);
    request.createRequest(this.xhr);
    request.setData(data);
    request.setRequestParams('POST', url);
    request.setOptions(options);
    request.sendRequest();

    return request;
  }

  public put(url: string, data: any, options?: any, disablePreflight?: any) {
    const request = new Request(this.ngZone, this.constants);

    this.createRequest(disablePreflight);
    request.createRequest(this.xhr);
    request.setData(data);
    request.setRequestParams('PUT', url);
    request.setOptions(options);
    request.sendRequest();

    return request;
  }

  public delete(url: string, options?: any, disablePreflight?: any) {
    const request = new Request(this.ngZone, this.constants);

    this.createRequest(disablePreflight);
    request.createRequest(this.xhr);
    request.setRequestParams('DELETE', url);
    request.setOptions(options);
    request.sendRequest();

    return request;
  }
}
