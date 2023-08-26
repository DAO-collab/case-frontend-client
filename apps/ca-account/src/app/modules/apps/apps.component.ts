import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, Renderer2 } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, tap, switchMap, takeUntil } from 'rxjs/operators';
import { throwError, Observable, Subject, combineLatest, of } from 'rxjs';
import { JoyrideService } from 'ngx-joyride';

import { AppsService } from './apps.service';
import { AuthService } from '@acc/auth/auth.service';
import { IApp, HostUserType } from './app.model';
import { DesignService } from '../../services/design.service';

/**
 * Application component.
 */
@Component({
  selector: 'app-apps',
  templateUrl: './apps.component.html',
  styleUrls: ['./apps.component.css']
})
export class AppsComponent implements OnInit, OnDestroy {
  @ViewChildren('appTableRow') appTableRow?: QueryList<ElementRef>;

  public message?: string;
  public loading: boolean = false;
  public emptyApps?: boolean;
  public apps: IApp[] = [];
  public HostUserType = HostUserType;
  public isCustomCreateApp = false;
  public showAnimationIndex: number | null = null;
  public appStatus = 'active';
  public unsubscribe$: Subject<void> = new Subject();
  public invite_cnt = 0;
  public active_cnt = 0;
  public showCreateAppModal = false;
  public appIndexRowTour: number = -1;

  private appId?: IApp;
  private openAcceptInvitationModal = true;
  private destroy$ = new Subject<void>();

  public get isLastStep(): boolean {
    return (this.joyrideService as any).stepService.currentStep.name === 'step5';
  }

  constructor(
    public appsService: AppsService,
    private router: Router,
    private route: ActivatedRoute,
    private translateService: TranslateService,
    private authService: AuthService,
    private designService: DesignService,
    private renderer: Renderer2,
    private joyrideService: JoyrideService
  ) {}
  /**
   * Initializes apps.
   */
  ngOnInit(): void {
    this.showCreateAppModal = this.router.url.includes('create');

    this.route.queryParams.subscribe(params => {
      this.isCustomCreateApp = params['creatingApp'] || false;
    });
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.message = params['message'];
      this.appId = params['app'];
    });
    this.appsService.acceptInvitationSubject
      .asObservable()
      .pipe(switchMap(() => this.loadAppsByStatus('active')))
      .subscribe();

    combineLatest([this.appsService.findStatusApps(true, 'active'), this.appsService.findStatusApps(true, 'invites')])
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(([active, invites]) => {
          this.active_cnt = active.length;
          this.invite_cnt = invites.length;
          this.appsService.activeAppsCount$.next(active.length);
          this.activate(this.active_cnt);

          if (!this.active_cnt && !this.invite_cnt) {
            this.showSelectOptionsPopup();
          }
        })
      )
      .subscribe();

    const startString = 'ca-';
    const startIndex = this.router.url.indexOf(startString);
    const appDataFromRout = this.router.url.slice(startIndex, this.router.url.length);

    if (appDataFromRout.includes(startString) && !this.appsService.joinAppModalData) {
      this.appsService.joinAppModalData = appDataFromRout.slice(3, appDataFromRout.length);
      this.appsService.isJoinAppModalShowed = true;
    }

    this.appsService.acceptInvitationSubject
      .asObservable()
      .pipe(tap(() => this.findInvitesApp()))
      .subscribe();
  }

  public findInvitesApp() {
    this.appsService
      .findStatusApps(true, 'invites')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.invite_cnt = res.length;
      });
  }

  public loadApps(status: string) {
    this.loadAppsByStatus(status).subscribe();
  }
  public loadAppsByStatus(status: string): Observable<IApp[]> {
    if (this.appId) {
      this.appsService.openApp(this.appId);
      return of([]);
    }
    this.appStatus = status;
    this.loading = true;
    return this.appsService
      .findStatusApps(true, status)
      .pipe(
        catchError(error => {
          if (error.status === 404) {
            this.emptyApps = true;
          }

          this.loading = false;
          return throwError(error);
        })
      )
      .pipe(
        tap(apps => {
          this.apps = apps;
          if (!this.apps.length) {
            this.emptyApps = true;
          } else {
            this.emptyApps = false;
            this.apps.map(app => {
              app.favicon = this.designService.getFaviconSecureUrl('favicon', 'ico', app.host_id, '48')[
                'changingThisBreaksApplicationSecurity'
              ];
              app.require_userfields = app.require_userfields.sort();
            });
            this.findAppIndexForTour(this.apps);
          }

          const queryParams = this.route.snapshot.queryParams;

          if (queryParams['needAccess']) {
            const needAccessApp = this.apps.find(app => app.host_id === queryParams['needAccess']);

            if (needAccessApp) {
              this.appsService.openApp(needAccessApp, 'c');
            }
          } else if (queryParams['reconfirmInvitation'] && this.openAcceptInvitationModal && this.appStatus === 'active') {
            const reconfirmInvitationApp = this.apps.find(
              app => app.host_id === `ca-${queryParams['reconfirmInvitation']}`
            );

            if (reconfirmInvitationApp) {
              reconfirmInvitationApp.host_granted_status = 0;

              this.openAcceptInvitationModal = false;
              this.appsService.openApp(reconfirmInvitationApp, 'c');
            }
          } else if (queryParams['addPayment']) {
            const addPaymentApp = this.apps.find(app => app.host_id === `ca-${queryParams['addPayment']}`);

            if (addPaymentApp) {
              this.appsService.selectedApp = addPaymentApp;
              this.appsService.showModal = true;
            }
          }

          this.loading = false;
          return this.apps;
        })
      );
  }
  /**
   * Activates applications.
   */
  private activate(activeCnt: number): void {
    this.loading = true;
    if (activeCnt === 0) {
      this.appStatus = 'invites';
    }
    this.authService
      .getCurrentUser()
      .pipe(
        tap(user => {
          this.translateService.use(user.locale || 'en');
          if (user.meta.create_app && !this.isCustomCreateApp) {
            this.router.navigate(['/apps/create'], { queryParams: { creatingApp: true } });
            return;
          }

          this.loading = false;
        }),
        switchMap(() => this.loadAppsByStatus(this.appStatus))
      )
      .subscribe();
  }

  // Add slide animation to the apps table
  public openAppActions(app: IApp, event: any, index: number) {
    if (index === this.showAnimationIndex) {
      this.showAnimationIndex = null;
      this.appTableRow?.forEach(listItem => {
        if (listItem.nativeElement.classList.contains('slide-out-animation')) {
          listItem.nativeElement.classList.add('slide-in-animation');
          listItem.nativeElement.classList.remove('slide-out-animation');
        }
      });
    } else {
      this.showAnimationIndex = null;
      this.appTableRow?.forEach(listItem => {
        if (listItem.nativeElement.classList.contains('slide-out-animation')) {
          listItem.nativeElement.classList.add('slide-in-animation');
          listItem.nativeElement.classList.remove('slide-out-animation');
        }
      });
      this.renderer.removeClass(event.target.parentNode.parentNode.parentNode, 'slide-in-animation');

      if (app.host_user_type === HostUserType.Manage || app.host_user_type === HostUserType.Admin) {
        if (app.host_granted_status === 0) {
          this.appsService.openApp(app, 'c');
        }

        this.showAnimationIndex = index;
        this.renderer.addClass(event.target.parentNode.parentNode.parentNode, 'slide-out-animation');
      } else if (app.host_user_type === HostUserType.User) {
        this.appsService.openApp(app, 'c');
      }
    }
  }

  public closeModal(): void {
    this.showCreateAppModal = false;
    this.router.navigate(['/apps']);
  }

  public skipTour(e: Event): void {
    e.stopPropagation();
    this.joyrideService.closeTour();
  }

  private showSelectOptionsPopup(): void {
    if (
      !this.router.url.includes('create') &&
      !this.router.url.includes('ca-') &&
      !this.appsService.isSelectOptionModalDisabled
    ) {
      this.appsService.isSelectOptionModalDisabled = true;
      this.appsService.isSelectOptionModalShowed = true;
    } else if (this.router.url.includes('create') || this.router.url.includes('ca-')) {
      this.appsService.isSelectOptionModalDisabled = true;
    }
  }

  private findAppIndexForTour(apps: IApp[]): void {
    const appIndexWithAdminRole = apps.findIndex(app => app.host_user_type === this.HostUserType.Admin);
    if (appIndexWithAdminRole !== -1) {
      this.appIndexRowTour = appIndexWithAdminRole;
      return;
    }
    if (apps.length) {
      this.appIndexRowTour = 0;
    }
  }

  /**
   * Unsubscribe from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
