import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { map, shareReplay } from 'rxjs/operators';
import { ILanguage } from './language.model';
import { GET_OPTIONS_URL } from '../shared/api.utils';

/**
 * Language service.
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private languages: Subject<any> = new Subject();
  private loadedLanguagesSubject: Subject<any> = new Subject();

  public systemLanguage: Observable<string> = this.languages.asObservable();
  public loadedLanguages: Observable<string> = this.loadedLanguagesSubject.asObservable();

  constructor(
    private cookiesService: CookieService,
    private http: HttpClient,
    private translateService: TranslateService
  ) {}

  /**
   * Gets languages.
   */
  public getLanguages(): Observable<ILanguage[]> {
    const locale = this.cookiesService.get('locale') || 'en';

    return this.http.get(GET_OPTIONS_URL('/dropdowns/languages', locale)).pipe(
      map(languages =>
        Object.entries(languages).map(([key, value]) => ({
          id: key,
          language: value,
          isSelected: false
        }))
      ),
      map(languages => languages.sort((a, b) => (a.language > b.language ? 1 : b.language > a.language ? -1 : 0))),
      shareReplay()
    );
  }

  /**
   * Sets language for site
   */
  public setLanguage(locale: string): void {
    !locale ? (locale = this.cookiesService.get('locale') || 'en') : this.cookiesService.set('locale', locale);

    this.translateService.setDefaultLang(locale);
    this.translateService.use(locale);
    this.languages.next();
  }
}
