import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LocalTranslationService {
  public errorsDictionary: any;
  private translationPromise: any;

  constructor(private http: HttpClient, public tr: TranslateService) {}

  public loadErrors() {
    let resp;
    const promise = res => {
      this.errorsDictionary = res;
    };

    if (!this.translationPromise && !this.errorsDictionary) {
      this.translationPromise = this.http.get('/opts/' + this.tr.currentLang + '/responses/error.json').toPromise();
    }

    resp = this.errorsDictionary
      ? this.errorsDictionary
      : this.translationPromise
      ? this.translationPromise.then(promise)
      : this.translationPromise.then(promise);

    return resp;
  }

  public showError(message) {
    return new Promise((resolved, reject) => {
      if (this.errorsDictionary) {
        resolved(this.errorsDictionary[message]);
      } else {
        this.loadErrors().then(res => {
          resolved(this.errorsDictionary[message]);
        });
      }
    });
  }

  public showSystemError(scope, err, variableKey?) {
    const key = variableKey || 'message',
      messageKey = err.code === 403 && err.message;

    if (this.errorsDictionary) {
      scope[key] = this.errorsDictionary[messageKey];
    } else {
      this.loadErrors().then(res => {
        scope[key] = this.errorsDictionary[messageKey];
      });
    }
  }
}
