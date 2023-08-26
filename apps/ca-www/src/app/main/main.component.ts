import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, tap, takeUntil } from 'rxjs/operators';

import { CookieService } from 'ngx-cookie-service';

import { LanguageService } from '../core/language.service';
import { environment } from '@www-src/environments/environment';
import { ILanguage } from '../core/language.model';
import { TimeZoneService } from '../core/time-zone.service';
import { ITimeZone } from '../core/time-zone.model';
import { GET_LOGO, GET_ACCOUNT_CLIENT_URL } from '../shared/api.utils';
import { POPULAR_LANGUAGES } from '../shared/constants.utils';
import { UiService } from '../shared/ui.service';

/**
 * Main component.
 */
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnDestroy {
  loginUrl: string;
  filteredLanguages$: Observable<ILanguage[]>;
  popularLanguages$: Observable<ILanguage[]>;
  languages$: Observable<ILanguage[]>;
  timeZones$: Observable<ITimeZone[]>;
  locale: string;
  logoTopSrc: string;
  showServerErrorModal = false;
  preview = false;
  isProduction: any;

  private destroy$ = new Subject<void>();

  get signupUrl(): string {
    return `${GET_ACCOUNT_CLIENT_URL('/apps/create')}${this.preview ? '?preview=true' : ''}`;
  }

  constructor(
    private languageService: LanguageService,
    private timeZoneService: TimeZoneService,
    private cookiesService: CookieService,
    private route: ActivatedRoute,
    public router: Router,
    public uiService: UiService
  ) {}

  /**
   * Gets production environment.
   *
   * Gets login url.
   *
   * Gets language from cookies.
   *
   * Sets default language.
   *
   * Gets languages and time zones.
   */
  ngOnInit(): void {
    this.isProduction = environment.PRODUCTION;
    this.logoTopSrc = GET_LOGO();
    this.loginUrl = GET_ACCOUNT_CLIENT_URL();
    this.locale = this.cookiesService.get('locale') || 'en';
    this.languageService.setLanguage(this.locale);

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => (this.preview = params['preview']));

    // keeping language in sync
    this.languageService.systemLanguage.pipe(takeUntil(this.destroy$)).subscribe(lang => {
      if (lang) {
        this.languageService.setLanguage(lang);
      }
    });

    this.getLanguages();
    this.getTimeZones();
  }

  /**
   * Get languages
   */
  getLanguages(): void {
    this.languages$ = this.languageService.getLanguages();

    this.popularLanguages$ = this.languages$.pipe(
      map(languages => languages.filter(lang => POPULAR_LANGUAGES.includes(lang.id))),
      tap(languages => this.selectedLanguage(languages))
    );

    this.filteredLanguages$ = this.languages$.pipe(
      map(languages => languages.filter(lang => !POPULAR_LANGUAGES.includes(lang.id))),
      tap(languages => this.selectedLanguage(languages))
    );
  }

  /**
   * Get time zones
   */
  getTimeZones(): void {
    this.timeZones$ = this.timeZoneService.getTimezones();
  }

  /**
   * Handle language change
   */
  onLanguageChange(): void {
    this.getLanguages();
    this.getTimeZones();
  }

  /**
   * Controls sign up pop-up.
   */
  managedSignUpPopUp(): void {
    this.uiService.managedSignUpPopUp();
  }

  /**
   * Scrolls to the top of the page.
   */
  scrollPageToTop(): void {
    this.uiService.scrollPageToTop();
  }

  /**
   * Helper method for setting isSelect flag.
   */
  private selectedLanguage(languages: ILanguage[]): void {
    this.locale = this.cookiesService.get('locale') || 'en';
    const selectedLang = languages.find(lang => lang.id === this.locale);

    if (selectedLang) {
      selectedLang.isSelected = true;
    }
  }

  /**
   * Unsubscribes from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
