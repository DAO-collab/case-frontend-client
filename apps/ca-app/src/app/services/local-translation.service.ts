import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable()
export class LocalTranslationService {
  public errorsDictionary?: { [key: string]: string };
  private translationPromise: any;

  constructor(private http: HttpClient, public tr: TranslateService) {}

  public loadErrors(): Observable<{ [key: string]: string }> {
    return this.http
      .get<{ [key: string]: string }>(`/opts/${this.tr.currentLang}/responses/error.json`)
      .pipe(tap(res => (this.errorsDictionary = res)));
  }

  public showError(message: string): Observable<string> {
    return this.errorsDictionary
      ? of(this.errorsDictionary[message])
      : this.loadErrors().pipe(map(res => res[message]));
  }

  public showSystemError(scope: any, err: any, variableKey?: any) {
    const key = variableKey || 'message',
      messageKey = err.code === 403 && err.message;

    if (this.errorsDictionary) {
      scope[key] = this.errorsDictionary[messageKey];
    } else {
      this.loadErrors().subscribe(res => {
        scope[key] = this.errorsDictionary?.[messageKey];
      });
    }
  }
}
