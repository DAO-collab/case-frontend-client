import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUserFields } from '../interfaces/user.interface';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class OptionsService {
  private loadedLanguages: any = {};
  private loadedCountries: any = {};

  constructor(private http: HttpClient, private translate: TranslateService) {}

  public getCountries(l: string) {
    return this.loadedCountries[l]
      ? of(this.loadedCountries[l])
      : this.http.get('/opts/' + l + '/dropdowns/countries.json').pipe(
          map(res => {
            const jsonData = res;

            this.loadedCountries[l] = jsonData;

            return jsonData;
          })
        );
  }

  public getLanguages(l: string) {
    return this.loadedLanguages[l]
      ? of(this.loadedLanguages[l])
      : this.http.get('/opts/' + l + '/dropdowns/languages.json').pipe(
          map(res => {
            const jsonData = res;
            this.loadedLanguages[l] = jsonData;

            return jsonData;
          })
        );
  }

  public userFields(): Observable<IUserFields> {
    return this.http.get<IUserFields>(`/opts/${this.translate.currentLang}/dropdowns/userfields.json`);
  }
}
