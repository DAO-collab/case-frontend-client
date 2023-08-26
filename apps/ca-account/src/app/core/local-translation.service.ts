import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Local translation service.
 */
@Injectable({
  providedIn: 'root'
})
export class LocalTranslationService {
  public errorsDictionary?: { [key: string]: string };
  public errors!: { [key: string]: string };
  private translationPromise: any;

  constructor(private http: HttpClient, public tr: TranslateService) {}

  /**
   * Get errors json
   */
  public loadErrorsJSON(): Observable<{ [key: string]: string }> {
    return this.http
      .get<{ [key: string]: string }>(`/opts/${this.tr.currentLang}/responses/error.json`)
      .pipe(tap(res => (this.errors = res)));
  }

  /**
   * Loads errors.
   */
  public loadErrors(): any {
    let resp;
    const promise = (res: any) => {
      this.errorsDictionary = res;
    };

    if (!this.translationPromise && !this.errorsDictionary) {
      this.translationPromise = this.http
        .get('/opts/' + (this.tr.currentLang || 'en') + '/responses/error.json')
        .toPromise();
    }

    resp = this.errorsDictionary
      ? this.errorsDictionary
      : this.translationPromise
      ? this.translationPromise.then(promise)
      : this.translationPromise.then(promise);

    return resp;
  }

  /**
   * Shows errors.
   */
  public showError(message: string): Promise<any> {
    return new Promise((resolved, reject) => {
      if (this.errorsDictionary) {
        resolved(this.errorsDictionary[message]);
      } else {
        this.loadErrors().then(() => {
          resolved(this.errorsDictionary?.[message]);
        });
      }
    });
  }

  /**
   * Shows system error.
   */
  public showSystemError(scope: any, err: any, variableKey?: any): void {
    const key = variableKey || 'message';
    const messageKey = err.code === 403 && err.message;

    if (this.errorsDictionary) {
      scope[key] = this.errorsDictionary[messageKey];
    } else {
      this.loadErrors().then(() => {
        scope[key] = this.errorsDictionary?.[messageKey];
      });
    }
  }
}
