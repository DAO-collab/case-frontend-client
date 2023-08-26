import { Component, OnInit, OnDestroy, Inject, AfterViewInit } from '@angular/core';
import { Observable, Subject, iif, of, throwError } from 'rxjs';
import { JoyrideService } from 'ngx-joyride';
import { IUser } from '../core/user.model';
import { LOGO, EVENTS } from '../utils/constants.utils';
import { DataConnectorService } from '../core/data-connector.service';
import { AuthService } from '../auth/auth.service';
import { tap, takeUntil, switchMap, catchError, delay, take } from 'rxjs/operators';
import { ScrollToService } from '@nicky-lenaers/ngx-scroll-to';
import { HttpResponse } from '../services/http-r.service';
import { IOptions, SettingsService } from '../core/settings.service';
import { AccountService } from '../modules/profile/account.service';
import { PopInNotificationConnectorService } from '../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { INotification } from '../common/components/pop-in-notifications/notification.model';
import { CacheService } from '../core/cache/cache.service';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { STEPS_ARRAY } from './constants/tour-steps-info.constant';
import { CustomStepInfo } from '../common/interfaces/custom-step-info.interface';
import { AppsService } from '../modules/apps/apps.service';
import { GlobalModalService } from '@acc/services/chunk-loading-error.service';

/**
 * Main component.
 */
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, AfterViewInit, OnDestroy {
  public activeMobileMenu?: boolean;
  public avatarUrl?: string;
  public isLoggedIn$?: Observable<boolean>;
  public logo = LOGO;
  public user$?: Observable<IUser>;
  public showServerErrorModal = false;
  public systemErrorException!: string | null;
  public profileOptions$?: Observable<IOptions>;
  public isIncompleteProfile = false;
  public stepsArray: CustomStepInfo[] = STEPS_ARRAY;

  private isTourCompleted: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    public router: Router,
    public globalModalService: GlobalModalService,
    private dataConnectorService: DataConnectorService,
    private authService: AuthService,
    private httpResponse: HttpResponse,
    private scrollToService: ScrollToService,
    private settingsService: SettingsService,
    private accountService: AccountService,
    private notificationService: PopInNotificationConnectorService,
    private cache: CacheService,
    @Inject(DOCUMENT) private document: Document,
    private joyrideService: JoyrideService,
    private appsService: AppsService
  ) {}

  /**
   * Checks if user is logged in.
   *
   * Gets current user.
   *
   * Sets avatar url.
   *
   * Shows error modal.
   */
  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn$;

    this.user$ = this.isLoggedIn$.pipe(
      switchMap(isLoggedIn =>
        iif(
          () => isLoggedIn,
          this.authService.getCurrentUser(true).pipe(
            tap(user => {
              this.avatarUrl = this.settingsService.getAvatarUrl(user.user_id, '50');
              this.settingsService.setLanguage(user.locale);
              this.isTourCompleted = user?.meta?.tour_completed ?? false;
              if (user.incomplete_profile) {
                this.isIncompleteProfile = true;
              }
            })
          )
        )
      )
    );

    this.profileOptions$ = this.settingsService.profileOptions();

    // learn more about this
    this.httpResponse.errorHappen.pipe(takeUntil(this.destroy$)).subscribe(err => {
      switch (err) {
        case EVENTS.UNAUTHORIZED:
          if (this.authService.isLoggedIn) {
            // this.userService.clearUserData();
          }
          break;

        case EVENTS.UNKNOWN_ERROR:
          const config = {
            target: 'systemErrorException'
          };

          this.systemErrorException = 'SystemErrorException';
          this.scrollToService.scrollTo(config);

          setTimeout(() => {
            this.systemErrorException = null;
          }, 6000);
          break;
      }
    });

    this.dataConnectorService.interceptorError.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.showServerErrorModal = true;
    });
  }

  public ngAfterViewInit(): void {
    if (this.isTourCompleted || this.router.url.includes('apps/create')) return;
    of(1)
      .pipe(
        take(1),
        delay(1000),
        tap(() =>  this.appsService.activeAppsCount$.value > 0 && this.startTour())
      )
      .subscribe();
  }

  /**
   * Update profile with required fields.
   */
  public updateProfile(data: { given_name: string; family_name: string; locale: string; zoneinfo: string }): void {
    const notification: INotification = this.notificationService.addNotification({
      title: `Saving profile `
    });

    this.accountService
      .saveProfile(data)
      .pipe(
        catchError(error => {
          this.isIncompleteProfile = true;
          return throwError(error);
        }),
        tap(response => {
          this.notificationService.ok(notification, 'Profile updated');

          this.isIncompleteProfile = false;

          this.settingsService.setLanguage(data.locale);

          this.cache.delete(response.selfLink);
        }),
        switchMap(() => {
          const attributesToDelete = this.accountService.attributesToBeRemoved(data);
          return this.accountService.deleteValuesByAttributeNames(attributesToDelete);
        })
      )
      .subscribe();
  }

  /**
   * Logs out user.
   */
  public logout(): void {
    this.authService
      .logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.document.defaultView?.localStorage.setItem('logout-event', Math.random().toString());
      });
  }

  private startTour(): void {
    const userApps = this.appsService.userApps;
    const steps = ['step1', 'step2', 'step3', 'step4', 'step5'];
    if (!userApps.some(userApp => userApp.host_user_type === 'admin')) {
      steps.splice(1, 1);
    }
    this.joyrideService
      .startTour({ steps, themeColor: '#4B5153', showPrevButton: false, customTexts: { done: 'Done' } })
      .subscribe(
        step => {},
        error => {},
        () => this.onDone()
      );
  }

  private onDone(): void {
    this.authService.setTourCompleted().pipe(take(1)).subscribe();
  }

  /**
   * Unsubscribes from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
