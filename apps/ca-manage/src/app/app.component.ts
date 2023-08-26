import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  Renderer2,
  QueryList,
  ViewChildren,
  Inject
} from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

import { map, switchMap, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

import { TERMS_OF_USE_URL, ACCOUNT_CLIENT_URL, APP_FAVICON, getHost, CONTACT_US_URL } from './shared/constants.utils';
import { environment } from '../environments/environment';
import { FormsService, CreateFormType } from './services/forms.service';
import { SignsService } from './services/signs.service';
import { CasesService } from './pages/cases/services/cases.service';
import { AdminService } from './services/admin.service';
import { DesignService } from './services/design.service';
import { UsersService } from './pages/users/services/users.service';
import { RolesService } from './pages/roles/services/roles.service';
import { LocationsService } from './services/locations.service';
import { ContentMediaService } from './services/content-media.service';
import { StylesService } from './services/styles.service';
import { LogsService } from './services/logs.service';
import { ConfirmationPopUpService } from './services/confirmation-pop-up.service';
import { HostService } from './services/host.service';
import { DataConnectorService } from './services/data-connector.service';
import { UtilsService } from './services/utils.service';
import { ImportsService } from './pages/integration/services/imports.service';
import { KeysService } from './pages/integration/services/keys.service';
import { WebhooksService } from './pages/integration/services/webhooks.service';
import { AppsService } from './services/apps.service';
import { DashboardViews, OnMetricsRequested, ViewDateType } from './shared/classes/dashboard-views';
import { RoleType } from './pages/roles/models/role.model';
import { CaseStatus } from './pages/cases/models/case.model';
import { UserStatus, UserType } from './pages/users/models/user.model';
import { IApp } from './interfaces/app.model';
import { NotificationsService } from './services/notifications.service';
import { IApiGridResponse } from './interfaces/api-response.model';
import { NotificationItem } from './pages/modules/media/models/media.model';
import { IntakeFormsService } from './services/intake-forms.service';
import { AnnouncementsService } from './services/announcements.service';
import { TicketsService } from './services/tickets.service';
import { AutologoutService } from './services/autologout.service';
import { TasksService } from './services/tasks.service';
import { GlobalModalService } from './services/chunk-loading-error.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent extends DashboardViews implements OnInit, OnDestroy, OnMetricsRequested {
  @ViewChildren('userMenuApp') userMenuApp?: QueryList<ElementRef>;

  @ViewChild('userMenuDropdown') userMenuDropdown?: ElementRef;
  @ViewChild('userMenu') userMenu?: ElementRef;
  @ViewChild('menuDropDownIcon') menuDropDownIcon?: ElementRef;
  @ViewChild('notificationMenuDropdown') notificationMenuDropdown?: ElementRef;
  @ViewChild('notificationMenu') notificationMenu?: ElementRef;
  @ViewChild('analyticsScript', { static: true }) analyticsScript?: ElementRef;

  isLoggedIn = '';
  avatarUrl: any;
  vm: any = {};
  subscribers: any[] = [];
  defaultLanguage?: any;
  currentRoute = '';
  threeChainsOfRoute = '';
  pageSubMenu = '';
  usersFilterVal: any = UserStatus.Active;
  caseSatusFilterValue: CaseStatus = CaseStatus.Active;
  roleFilterValue: RoleType = RoleType.System;
  systemErrorException = '';
  designLink?: SafeResourceUrl;
  showServerErrorModal = false;
  showPaymentErrorModal = false;
  showLogo = false;
  accountClientUrl = ACCOUNT_CLIENT_URL;
  currentYear: number = new Date().getFullYear();
  termsOfUseUrl = TERMS_OF_USE_URL;
  contactUs = CONTACT_US_URL;
  subTitlesByRoute: any = {
    '': 'Dashboard',
    announcements: 'Announcements',
    support: 'Support',
    roles: 'Roles',
    'roles/edit': 'Edit Role',
    'roles/add': 'Create Role',
    cases: 'Cases',
    'cases/create': 'Create Case',
    'cases/edit': 'Edit Case',
    'cases/permissions': 'Assign Users',
    users: 'Users',
    'users/add': 'Add User',
    'users/edit': 'Edit User',
    'users/view': 'View User',
    'users/cases': 'View Cases',
    integration: 'Imports',
    'integration/imports': 'Imports',
    'integration/import': 'Imports/Import',
    'integration/webhooks': 'Webhooks',
    'integration/keys': 'Keys',
    library: 'Feed Templates',
    'library/forms': 'Form Templates',
    'library/e-signs': 'E-sign Templates',
    'library/offices': 'Office Locations',
    'settings/intake-forms': 'Intake Forms',
    'library/tasks': 'Task Templates',
    settings: 'System',
    'settings/caseform': 'Custom Fields',
    'settings/userform': 'Custom Fields',
    'settings/modules': 'Modules',
    'settings/actions': 'After Actions',
    'settings/after-actions-users': 'Assign Users',
    'settings/after-actions-templates': 'Add Templates',
    'settings/after-actions-cases': 'Idle Cases',
    'settings/logs': 'Logs',
    'settings/noteform': 'Custom Fields',
    'settings/user-intake-settings': 'Intake Settings',
    invoices: 'Invoices',
    'invoices/settings': 'Settings'
  };

  settingsSubitems: any = {
    settings: true,
    roles: true,
    'roles/add': true,
    'roles/edit': true,
    'settings/caseform': true,
    'settings/module': true,
    'settings/logs': true,
    'settings/userform': true,
    'settings/modules': true,
    'settings/noteform': true,
    'settings/actions': true,
    'settings/after-actions-users': true,
    'settings/after-actions-templates': true,
    'settings/after-actions-cases': true,
    'settings/advance-settings': true,
    'settings/user-intake-settings': true,
    'settings/intake-forms': true,
    'settings/intake-forms/form-builder': false,
    'settings/intake-forms/doc-form-builder': false
  };

  librarySubitems: any = {
    library: true,
    'library/offices': true,
    'library/forms': true,
    'library/e-signs': true,
    'library/library': true,
    'library/tasks': true
  };

  homeSubItem: any = {
    '': true,
    announcements: true,
    support: true,
    invoices: true,
    'invoices/settings': true
  };

  noneBottomMenuItems: any = {
    '': true,
    'library/doc-form-builder': true,
    'library/form-builder': true,
    'library/forms/doc-form-builder': true,
    'library/forms/form-builder': true,
    'library/e-signs/doc-e-signs-builder': true,
    'library/e-signs/e-signs-builder': true
  };

  threeChainLibrarySubitems: any = {
    'library/doc-form-builder': true,
    'library/form-builder': true,
    'library/forms/doc-form-builder': true,
    'library/forms/form-builder': true,
    'library/e-signs/doc-e-signs-builder': true,
    'library/e-signs/e-signs-builder': true
  };

  integrationSubitems: any = {
    integration: true,
    'integration/imports': true,
    'integration/import': true,
    'integration/webhooks': true,
    'integration/keys': true
  };

  stepBackSupport: any = {
    'library/e-signs/doc-e-signs-builder': 'library/e-signs',
    'library/e-signs/simple-e-signs-builder': 'library/e-signs',
    'library/forms/doc-form-builder': 'library/forms',
    'library/forms/simple-form-builder': 'library/forms'
  };

  title = 'app';
  logoSrc: any;
  logoTopSrc: any = '';
  shownConfirmationForm?: boolean;
  deleteConfirationMessage?: string;
  activeMobileMenu?: boolean;
  logoLoaded?: boolean;
  routeLoaderActive?: boolean;
  showPopUpLoader?: boolean;
  deletePopUpStatus = {
    loading: false
  };
  today = this.utilsService.fullDate(new Date());
  yesterday: Date = new Date();
  analyticsUrl?: string;
  RoleType = RoleType;
  CaseStatus = CaseStatus;
  UserType = UserType;
  UserStatus = UserStatus;
  CreateFormType = CreateFormType;
  apps: IApp[] = [];
  selectedApp?: IApp;
  showUserMenu = false;
  interval?: any;
  selectionColor = '#16b0c5';
  selectionBackgroundColor = '#16b0c5';
  showAnimationIndex: number | null = null;

  showNotificationMenu = false;
  allNotifications = true;
  companySystem: any;
  notifications?: IApiGridResponse<NotificationItem[]>;
  unsubscribe$: Subject<void> = new Subject();
  todayNotifications: any[] = [];
  lastWeekNotifications: any[] = [];
  deleteConfirmationTitle?: string;

  private isProduction = environment.PRODUCTION;

  constructor(
    public stylesService: StylesService,
    public adminService: AdminService,
    public router: Router,
    public translate: TranslateService,
    public rolesService: RolesService,
    public hostService: HostService,
    public override formBuilder: UntypedFormBuilder,
    public appsService: AppsService,
    public utilsService: UtilsService,
    public globalModalService: GlobalModalService,
    @Inject(DOCUMENT) private document: Document,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private casesService: CasesService,
    private designService: DesignService,
    private sanitizer: DomSanitizer,
    private locationsService: LocationsService,
    private importsService: ImportsService,
    private keysService: KeysService,
    private webhooksService: WebhooksService,
    private contentMediaService: ContentMediaService,
    private formsService: FormsService,
    private signsService: SignsService,
    private intakeFormsService: IntakeFormsService,
    private confirmationPopUpService: ConfirmationPopUpService,
    private logsService: LogsService,
    private dataConnectorService: DataConnectorService,
    private notificationsService: NotificationsService,
    private cd: ChangeDetectorRef,
    private renderer: Renderer2,
    private announcementsService: AnnouncementsService,
    private ticketsService: TicketsService,
    private autologoutService: AutologoutService,
    private tasksService: TasksService
  ) {
    super(formBuilder);
    this.updateFastLoadingDesign();
  }

  ngOnInit() {
    this.updateDesign();
    this.updateFavicon();
    this.insertScript();

    this.interval = setInterval(() => {
      if (document.querySelector('#root.logged-in #nav > ul > li.active > a')) {
        if (
          this.selectionColor ===
          window.getComputedStyle(document.querySelector('#root.logged-in #nav > ul > li.active > a') as Element).color
        ) {
          clearInterval(this.interval);
        } else {
          if (document.querySelector('.btn')) {
            this.selectionBackgroundColor = window.getComputedStyle(document.querySelector('.btn') as Element).borderBottomColor;
            document.documentElement.style.setProperty('--background-color', this.selectionBackgroundColor);
          }

          this.selectionColor = window.getComputedStyle(
            document.querySelector('#root.logged-in #nav > ul > li.active > a') as Element).color;
          document.getElementById('root')?.style.setProperty('--color', this.selectionColor);

          this.cd.detectChanges();
        }
      }
    }, 500);

    document.addEventListener('click', this.docClickHandler.bind(this));

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.shownConfirmationForm) {
        this.shownConfirmationForm = false;
        this.stylesService.popUpDisactivated();
      }
    });

    this.yesterday.setDate(this.yesterday.getDate() - 1);

    this.hostService.hostLoad.subscribe(data => {
      this.viewStartDate?.setValue(data.startDate);
      this.viewEndDate?.setValue(data.endDate);

      this.checkDateRange(ViewDateType.ViewStartDate, {
        dateString: this.viewStartDate?.value
      });
      this.checkDateRange(ViewDateType.ViewEndDate, {
        dateString: this.viewEndDate?.value
      });
    });

    this.importsService.importTitleSubject.subscribe(next => {
      this.subTitlesByRoute['integration/import'] = `Imports/${next}`;
    });

    this.loadNotifications();

    this.adminService.userDataSub.subscribe(res => {
      this.isLoggedIn = res.user_id;
      this.companySystem = res.company_system || [];
      this.avatarUrl = this.adminService.getAvatarUrl('50');
      this.avatarUrl = this.avatarUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(this.avatarUrl) : '';
      this.defaultLanguage = res.locale;
      this.currentRoute = this.currentRoute ? this.currentRoute : this.getRoute(location.hash, 2);
      this.threeChainsOfRoute = this.threeChainsOfRoute ? this.threeChainsOfRoute : this.getRoute(location.hash, 3);
      this.pageSubMenu = this.subTitlesByRoute[this.currentRoute];

      this.subscribers.push(
        this.router.events.subscribe(ev => {
          if (ev instanceof NavigationEnd) {
            // this.routeLoaderActive = false;
            this.currentRoute = this.getRoute(ev['url'], 2);
            this.threeChainsOfRoute = this.getRoute(ev['url'], 3);
            this.pageSubMenu = this.subTitlesByRoute[this.currentRoute];
          }
        })
      );

      this.showLogo = true;
      this.updateLogo();
      // this.updateFavicon();

      this.translate.use(this.defaultLanguage);
    });

    this.designService.designChangeSubscription().subscribe(() => {
      this.updateLogo();
      this.updateFavicon();
      this.updateDesign();
    });

    this.designService.uuidChangeSubscription().subscribe(() => {
      this.analyticsUrl = this.designService.getAnalyticsUrl();

      const script = document.createElement('script');

      script.type = 'text/javascript';
      script.src = this.analyticsUrl;

      const previousScript = this.analyticsScript?.nativeElement.querySelector('script');

      if (previousScript) {
        previousScript.remove();
      }

      this.analyticsScript?.nativeElement.appendChild(script);
    });

    this.confirmationPopUpService.popUpActivation.subscribe(resp => {
      this.shownConfirmationForm = true;
      this.deleteConfirationMessage = resp.message;
      this.deleteConfirmationTitle = resp.title;
      this.deletePopUpStatus = resp.includeLoader;
      this.stylesService.popUpActivated();
    });

    this.confirmationPopUpService.popUpDisactivation.subscribe(resp => {
      this.shownConfirmationForm = false;
      this.showPopUpLoader = false;
      this.stylesService.popUpDisactivated();
    });

    this.usersService.noUsersSub.subscribe(() => {
      this.usersFilterVal = UserStatus.Active;
      this.userStatusFilter(UserStatus.Active);
    });

    this.dataConnectorService.interceptorError.subscribe(() => {
      this.showServerErrorModal = true;
    });

    this.loadApps().subscribe();

    this.appsService.acceptInvitationSubject
      .asObservable()
      .pipe(switchMap(() => this.loadApps()))
      .subscribe();
  }

  ngOnDestroy() {
    this.subscribers.forEach(v => v.unsubscribe());
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  override onMetricsRequested = (event: any) => {
    this.hostService.updateMetrics(event);
  };

  loadApps(): Observable<IApp[]> {
    return this.appsService.getApps().pipe(
      map(({ items }) => {
        this.apps = items.map(app => ({
          ...app,
          favicon: (this.designService.getFaviconSecureUrl('favicon', 'ico', app.host_id, '48') as any)[
            'changingThisBreaksApplicationSecurity'
          ],
          require_userfields: app.require_userfields.sort()
        }));

        return this.apps;
      })
    );
  }

  goToRoute(routeAddres: string) {
    this.router.navigate([routeAddres]);
  }

  openApp(app: IApp, userType?: string): void {
    if (app.host_granted_status === 0) {
      this.appsService.showModal = true;
      this.selectedApp = app;
      return;
    }

    let reference = location.host;
    let path = '';
    let port = '';

    switch (userType) {
      case 'admin':
        reference = reference.substr(reference.indexOf('.') + 1);
        path = location.pathname;
        port = '4202';
        break;
      case 'app':
        reference = reference.replace(/manage/g, 'app').substr(reference.indexOf('.') + 1);
        port = '4201';
        break;
    }

    location.href = environment.IS_LOCAL
      ? `http://${app.host_id}.localhost:${port}${path}`
      : `https://${app.host_id}.${reference}${path}`;
  }

  /**
   * Show App Notfication modal
   */

  public loadNotifications(): void {
    this.notificationsService
      .getManageNotifications()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        res => {
          this.notifications = res as IApiGridResponse<NotificationItem[]>;

          this.notifications?.items?.map(item => {
            const inputDate = new Date(item.created_on);
            const todayDate = new Date();

            inputDate.setHours(0, 0, 0, 0) === todayDate.setHours(0, 0, 0, 0)
              ? this.todayNotifications.push(item)
              : this.lastWeekNotifications.push(item);
          });
        },
        error => {
          if (error?.error?.error?.error_type === 'ManageBillingInactiveException') {
            this.showPaymentErrorModal = true;
          }
        }
      );
  }

  /**
   * Show App Invitation modal
   */
  public showAppInvitationModal(app: IApp): void {
    this.selectedApp = app;
    this.appsService.showModal = true;
  }

  /**
   * Closes modal.
   */
  public closeModal() {
    this.appsService.showModal = false;
  }

  confirmRecordDelete() {
    this.confirmationPopUpService.removeRecord();

    if (!this.deletePopUpStatus) {
      this.shownConfirmationForm = false;
      this.stylesService.popUpDisactivated();
    } else {
      this.showPopUpLoader = true;
    }
  }

  pageResize() {
    this.stylesService.resize();
  }

  updateFavicon() {
    const safeFaviconUrl = this.designService.getDesignUrl('favicon', 'ico', '48'),
      cleanUrl = (safeFaviconUrl as any)['changingThisBreaksApplicationSecurity'];

    document.querySelector('#favicon-icon')?.setAttribute('href', cleanUrl);
  }

  updateLogo(): void {
    const safeLogoUrl = this.designService.getDesignUrl('logo', 'png', '100'),
      safeTopLogoUrl = this.designService.getDesignUrl('logo', 'png');

    this.logoSrc = safeLogoUrl;
    this.logoTopSrc = safeTopLogoUrl;
  }

  updateDesign(): void {
    // this.designLink = this.designService.getDesignUrl('design', 'css');

    const safeFaviconUrl = this.designService.getDesignUrl('design', 'css');

    document
      .querySelector('#dynamic-design')?.setAttribute('href', (safeFaviconUrl as any)['changingThisBreaksApplicationSecurity']);
  }

  private updateFastLoadingDesign(): void {
    const url = this.designService.getFastLoadingDesign();
    document.querySelector('#fast-loading-design')?.setAttribute('href', url);
  }

  multiDropdownFocus(e: any) {
    const target = e.target['closest']('.ui-select-multiple'),
      targetClass = e.target.classList.contains('ui-select-match');

    if (target && targetClass) {
      target.querySelector('input').focus();
      target.querySelector('input').click();
    }
  }

  private getRoute(route: string, endPoint: number) {
    const resp = route.split('?')[0].split('/').splice(1, endPoint).join('/');

    return resp;
  }

  /*
   * User Type Filter
   */
  // public userTypeFilter(value: UserType) {
  //   this.usersService.userType = value;
  //   this.pageSubMenu = `${value}s`;
  //   this.usersFilterVal = value;
  //   this.usersService.setUsersFilter(value);
  // }

  /*
   * User Status Filter
   */
  public userStatusFilter(value: UserStatus) {
    this.usersService.userStatus = value;
    this.usersFilterVal = value;
    this.usersService.setUsersFilter(value);
  }

  /*
   * Case Status Filter
   */
  public caseStatusFilter(caseStatus: CaseStatus) {
    this.caseSatusFilterValue = caseStatus;
    this.casesService.setCasesFilter(caseStatus);
  }

  /*
   * Role Type Filter
   */
  public roleTypeFilter(roleType: RoleType) {
    this.roleFilterValue = roleType;
    this.rolesService.setRolesFilter(roleType);
  }

  /*
   * shownAddModalSwitch - show/hide popup to add new user to permissions
   */
  public shownAddModalSwitch() {
    this.casesService.changeAddUserModalState();
  }

  /*
   * activateAddUserToHostModal() - show user modal on users page
   */
  public activateAddUserToHostModal() {
    this.usersService.activateAddUserToHostModal();
  }

  /*
   * activateAddLocationModal() - show popup on offices page
   */
  public activateAddLocationModal() {
    this.locationsService.activateAddLocationModal();
  }

  public activateAddFileModal() {
    this.contentMediaService.activateAddFileModal();
  }

  public activateAddImportsModal() {
    this.importsService.activateAddImportsModal();
  }

  public activateAddKeyModal() {
    this.keysService.activateAddKeyModal();
  }

  public activateAddWebhookModal() {
    this.webhooksService.activateAddWebhookModal();
  }

  public createIntake(type: any) {
    this.intakeFormsService.activateFormModal.next(type);
  }

  public createForm(type: any) {
    this.formsService.activateCreateModal(type);
  }

  public createSign(type: CreateFormType) {
    this.signsService.activateCreateModal(type);
  }

  public createTask(): void {
    this.tasksService.activateModal();
  }

  public activateAddLogsModal() {
    this.logsService.activateCreateModal();
  }

  public activateUserIntakeModal() {
    this.intakeFormsService.activateUserIntakeModal.next(true);
  }

  public activateAfterActionsUsersModal() {
    this.casesService.changeAddUserModalState();
  }

  public activateAfterActionsTemplatesModal() {
    this.casesService.changeAddTemplateModalState();
  }

  public activateAfterActionsCasesModal() {
    this.casesService.changeAddCaseModalState();
  }

  private docClickHandler(event: any) {
    this.showUserMenu = this.userMenuDropdown
      ? this.userMenuDropdown.nativeElement.contains(event.target)
      : this.userMenu?.nativeElement.contains(event.target) ||
        this.menuDropDownIcon?.nativeElement.contains(event.target);
    this.showNotificationMenu = this.notificationMenuDropdown
      ? this.notificationMenuDropdown?.nativeElement.contains(event.target)
      : this.notificationMenu?.nativeElement.contains(event.target);

    if (!this.showUserMenu) {
      this.showAnimationIndex = null;
    }
  }
  displayAll() {
    this.allNotifications = true;
  }
  displayInvitations() {
    this.allNotifications = false;
  }

  public getItemIdForTitle() {
    return this.router.url.slice(this.router.url.lastIndexOf('-') + 1);
  }

  public openAnnouncementPopup(): void {
    this.announcementsService.isCreatePopupOpened.next(true);
  }

  public openTicketPopup(): void {
    this.ticketsService.isCreatePopupOpened.next(true);
  }

  // Add slide animation to user apps menu
  public openAppActions(app: IApp, event: any, index: number) {
    if (index === this.showAnimationIndex) {
      this.showAnimationIndex = null;
      this.userMenuApp?.forEach(listItem => {
        if (listItem.nativeElement.classList.contains('slide-out-animation')) {
          listItem.nativeElement.classList.add('slide-in-animation');
          listItem.nativeElement.classList.remove('slide-out-animation');
        }
      });
    } else {
      this.showAnimationIndex = null;
      this.userMenuApp?.forEach(listItem => {
        if (listItem.nativeElement.classList.contains('slide-out-animation')) {
          listItem.nativeElement.classList.add('slide-in-animation');
          listItem.nativeElement.classList.remove('slide-out-animation');
        }
      });
      this.renderer.removeClass(event.target.closest('.user-menu-dropdown-app'), 'slide-in-animation');

      if (app.host_user_type === 'manage' || app.host_user_type === 'admin') {
        if (app.host_granted_status === 0) {
          this.openApp(app, 'app');
        }

        this.showAnimationIndex = index;
        this.renderer.addClass(event.target.closest('.user-menu-dropdown-app'), 'slide-out-animation');
      } else if (app.host_user_type === 'user') {
        this.openApp(app, 'app');
        this.showUserMenu = false;
      }
    }
  }

  private insertScript() {
    const script = this.renderer.createElement('script');

    script.type = 'text/javascript';
    script.src = this.isProduction
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';

    this.renderer.appendChild(this.document.head, script);
  }
}
