import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable()
export class LocalTranslationService {
  public errorsDictionary?: { [key: string]: string };

  constructor(private http: HttpClient, public translation: TranslateService) {}

  /**
   * Get errors json
   */
  public loadErrors(): Observable<{ [key: string]: string }> {
    return this.http
      .get<{ [key: string]: string }>(`/opts/${this.translation.currentLang}/responses/error.json`)
      .pipe(tap(res => (this.errorsDictionary = res)));
  }

  /**
   * Show error message
   * @param message: string
   */
  public showError(message: string): Observable<string> {
    return this.errorsDictionary
      ? of(this.errorsDictionary[message])
      : this.loadErrors().pipe(map(res => res[message]));
  }
}
