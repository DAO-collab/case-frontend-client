import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { first, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { HOST_CDN_URL } from './utils/constants.utils';
import { AlwaysAuthGuard, UserService } from './services/user.service';
import { CasesService } from './services/cases.service';
import { RolesService } from './services/roles.service';
import { EventsService } from './services/events.service';
import { FormsService } from './services/forms.service';
import { SignsService } from './services/signs.service';
import { GarbageCollectorService } from './services/garbage-collector.service';
import { DesignService } from './services/design.service';
import { ConfirmationPopUpService } from './services/confirmation-pop-up.service';
import { PublishPopUpService } from './services/publish-pop-up.service';
import { StylesService } from './services/styles.service';
import { UtilsService } from './services/utils.service';
import { HostService } from './services/host.service';
import { DataConnectorService } from './services/data-connector.service';
import { AppsService } from './services/apps.service';
import { IApp } from './interfaces/app.interface';
import { UserType } from './interfaces/user.interface';
import { IApiGridResponse, NotificationItem, PublishType } from './models/AppModel';
import { NotificationsService } from './services/notifications.service';
import { isToday } from './utils/utils';
import { InvoicesService } from './services/invoices.service';
import { NotesService } from './services/notes.service';
import { FeedsService } from './services/feeds.service';
import { ConvoService } from './services/convo.service';
import { TasksService } from './services/tasks.service';
import { DashboardService } from './services/dashboard.service';
import { AutologoutService } from './services/autologout.service';
import { GlobalModalService } from './services/chunk-loading-error.service';
import { RoleNames, AppPermissions, Todos, CompanySystem, Case, WhoAmI } from './interfaces';
import { CaseStatus } from './types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChildren('userMenuApp') userMenuApp?: QueryList<ElementRef>;

  @ViewChild('userMenuDropdown') userMenuDropdown?: ElementRef;
  @ViewChild('userMenu', { static: true }) userMenu?: ElementRef;
  @ViewChild('notificationMenuDropdown') notificationMenuDropdown?: ElementRef;
  @ViewChild('notificationMenu') notificationMenu?: ElementRef;
  @ViewChild('teamSearchInput') teamSearchInput?: ElementRef;
  @ViewChild('teamSearchIcon') teamSearchIcon?: ElementRef;
  @ViewChild('mobileTeamSearchInput') mobileTeamSearchInput?: ElementRef;
  @ViewChild('mobileTeamSearchIcon') mobileTeamSearchIcon?: ElementRef;
  @ViewChild('caseSearchInput') caseSearchInput?: ElementRef;
  @ViewChild('caseSearchIcon') caseSearchIcon?: ElementRef;
  @ViewChild('rootDiv') rootDiv?: ElementRef;

  public designLink!: string;
  public caseSearch = '';
  public environment = environment;
  public noCases = false;
  public noPermissions = false;
  public teamLoading = true;
  public todayNotifications: NotificationItem[] = [];
  public lastWeekNotifications: NotificationItem[] = [];
  public userData: Partial<WhoAmI> = {
    given_name: '',
    family_name: '',
    locale: '',
    selfLink: '',
    picture: {},
    user_id: '',
    sync_info: {}
  };
  public currentRoute = '';
  public casesList: Case[] = [];
  public team: any = [];
  public roleNamesById: { [key: string]: string } = {};
  public permissions!: AppPermissions;
  public modules?: string[];
  public logoSrc: SafeResourceUrl = '';
  public userAvatarSrc: SafeResourceUrl = '';
  public shownConfirmationForm?: boolean;
  public shownPushishConfirmationForm?: boolean;
  public deleteConfirationMessage?: string;
  public confirmationMessage?: string;
  public title?: string;
  public serverError?: string;
  public expandedMedias = false;
  public expandedConvo = false;
  public showServerErrorModal = false;
  public apps: IApp[] = [];
  public selectedApp?: IApp;
  public UserType = UserType;
  public showUserMenu = false;
  public publishCheckBoxState = -1;
  public publishType?: PublishType;
  public publishingFlag = false;
  public showNotificationMenu = false;
  public allNotifications = true;
  public notifications?: IApiGridResponse<NotificationItem[]>;
  public unsubscribe$: Subject<void> = new Subject();
  public showTeamSearchBar = false;
  public showCaseSearchBar = false;
  public teamSearch = '';
  public showAnimationIndex: number | null = null;
  public todos!: Todos;
  public mobileMenuTabIndex = 0;
  public showMobileTeamSearchBar = false;
  public isConvoLayoutDropdownShow = false;
  public isIntakeExist = false;
  public currentCaseStatus$: Observable<CaseStatus>;
  public isCaseBannerOpened: boolean = true;
  public deleteConfirmationTitle?: string;
  public avatarUrl: string = '';

  private companySystem!: CompanySystem;
  private caseId = '';
  private routerSubscription: Subscription = new Subscription();

  get choosedCaseName(): string {
    return this.caseId;
  }

  set choosedCaseName(value: string) {
    this.caseId = value;
  }

  get isFullscreenMode(): boolean {
    return (
      this.currentRoute == 'e-signs/doc-e-sign-builder' ||
      this.currentRoute == 'forms/doc-form-builder' ||
      this.currentRoute == 'forms/form-builder' ||
      this.currentRoute == 'forms/form-view' ||
      this.currentRoute == 'forms/form-submit' ||
      this.currentRoute == 'forms/doc-form-submit' ||
      this.currentRoute == 'forms/doc-form-view' ||
      this.currentRoute == 'e-signs/e-sign-builder' ||
      this.currentRoute == 'e-signs/e-sign-submit' ||
      this.currentRoute == 'e-signs/e-sign-view' ||
      this.currentRoute == 'e-signs/doc-e-sign-submit' ||
      this.currentRoute == 'e-signs/doc-e-sign-view' ||
      this.currentRoute == 'invoice/invoice-builder' ||
      this.currentRoute == 'invoices/invoice-submit' ||
      this.currentRoute == 'intake-forms' ||
      this.currentRoute == 'dashboard' ||
      this.currentRoute == ''
    );
  }

  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    const teamElement = this.showTeamSearchBar ? this.teamSearchInput : this.teamSearchIcon;
    if (teamElement) {
      this.showTeamSearchBar = teamElement.nativeElement.contains(event.target);
    }

    const mobileTeamElement = this.showMobileTeamSearchBar ? this.mobileTeamSearchInput : this.mobileTeamSearchIcon;

    if (mobileTeamElement) {
      this.showMobileTeamSearchBar = mobileTeamElement.nativeElement.contains(event.target);
    }

    const caseElement = this.showCaseSearchBar ? this.caseSearchInput : this.caseSearchIcon;
    if (caseElement) {
      this.showCaseSearchBar = caseElement.nativeElement.contains(event.target);
    }
  }

  constructor(
    public router: Router,
    public userService: UserService,
    public utilsService: UtilsService,
    public casesService: CasesService,
    public appsService: AppsService,
    public convoService: ConvoService,
    public alwaysAuthGuard: AlwaysAuthGuard,
    public globalModalService: GlobalModalService,
    private stylesService: StylesService,
    private rolesService: RolesService,
    private eventsService: EventsService,
    private formsService: FormsService,
    private signsService: SignsService,
    private garbageCollectorService: GarbageCollectorService,
    private designService: DesignService,
    private translate: TranslateService,
    private confirmationPopUpService: ConfirmationPopUpService,
    private publishPopUpService: PublishPopUpService,
    private hostService: HostService,
    private route: ActivatedRoute,
    private dataConnectorService: DataConnectorService,
    private notificationsService: NotificationsService,
    private invoicesService: InvoicesService,
    private renderer: Renderer2,
    private notesService: NotesService,
    private feedsService: FeedsService,
    private tasksService: TasksService,
    private dashboardService: DashboardService,
    private autologoutService: AutologoutService
  ) {
    this.updateFastLoadingDesign();
    this.currentCaseStatus$ = this.casesService.activeCaseObs$.pipe(map(data => data?.status ?? 1));
  }

  ngOnInit() {
    this.updateDesign();
    this.updateAppFavicon();
    this.updateLogo();

    document.addEventListener('click', this.docClickHandler.bind(this));

    this.currentRoute = this.getRoute(location.hash);

    this.loadUserData();

    this.userService.getTeamData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      if (data) {
        this.team = data.items ? data.items : [];
      } else {
        this.team = [this.userData];
      }
      this.team.map((item: any) => {
        if (item.user_id === this.userData.user_id && this.userData.picture) {
          item.uuid = this.userData.picture.uuid;
        }
        if (item.sync_info) {
          item.full_name = item.sync_info.given_name + ' ' + item.sync_info.family_name;
        } else {
          item.full_name = item.given_name + ' ' + item.family_name;
        }
      });

      this.teamLoading = false;
    });

    this.rolesService.rolesGetSub.pipe(takeUntil(this.unsubscribe$)).subscribe((items: RoleNames[]) => {
      items.map((v: RoleNames) => (this.roleNamesById[v.role_id] = v.name));
    });

    this.router.events.pipe(takeUntil(this.unsubscribe$)).subscribe(ev => {
      if (ev instanceof NavigationStart) {
        this.outOfRoute();
        this.currentRoute = this.getRoute(ev['url']);

        if (this.currentRoute.includes('media/')) {
          this.expandedMedias = true;
        }

        if (this.currentRoute.includes('convo/')) {
          this.expandedConvo = true;
        }
      }
    });

    // Subscribe to permissions data - helps to identify right user has to manipulate content
    this.userService.getCasePermissionsData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.permissions = data.role.permissions;
    });

    this.confirmationPopUpService.popUpActivation.pipe(takeUntil(this.unsubscribe$)).subscribe(resp => {
      this.shownConfirmationForm = true;
      this.deleteConfirationMessage = resp.message;
      this.deleteConfirmationTitle = resp.title;
    });

    this.publishPopUpService.popUpActivation.pipe(takeUntil(this.unsubscribe$)).subscribe(resp => {
      this.shownPushishConfirmationForm = true;
      this.confirmationMessage = resp.message;
      this.title = resp.title;
    });

    this.dataConnectorService.interceptorError.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.showServerErrorModal = true;
    });

    this.signsService.signBuilder$.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.publishingFlag = false;
      this.publishCheckBoxState = res;
      this.publishType = PublishType.sign;
    });

    this.formsService.formBuilder$.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.publishingFlag = false;
      this.publishCheckBoxState = res;
      this.publishType = PublishType.form;
    });

    this.loadApps().subscribe();

    this.appsService.acceptInvitationSubject
      .asObservable()
      .pipe(switchMap(() => this.loadApps()))
      .subscribe();

    this.userService
      .getAuthStatus()
      .pipe(
        takeUntil(this.unsubscribe$),
        map(res => (this.isIntakeExist = !!(res.data as any)?.intake_content)) // check if intake exist
      )
      .subscribe();

    this.userService.openToDosMobile
      .asObservable()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.rootDiv?.nativeElement.classList.add('show-f');
        this.mobileTabCounter(2);
      });
  }

  /**
   * Show App Notfication modal
   */

  public loadNotifications(caseId: string): void {
    this.notificationsService
      .getAppNotifications()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.notifications = res as IApiGridResponse<NotificationItem[]>;
        this.notifications?.items?.map(item => {
          if (isToday(item.created_on)) {
            this.todayNotifications.push(item);
          } else {
            this.lastWeekNotifications.push(item);
          }
        });
      });
  }

  public openApp(app: IApp, user_type?: string): void {
    if (app.host_granted_status === 0) {
      this.appsService.showModal = true;
      this.selectedApp = app;
      return;
    }

    let reference = location.host;
    let path = '';
    let port = '';
    switch (user_type) {
      case 'admin':
        reference = reference.replace(/app/g, 'manage').substr(reference.indexOf('.') + 1);
        port = '4202';
        break;
      case 'app':
        reference = reference.substr(reference.indexOf('.') + 1);
        path = location.pathname;
        port = '4203';
        break;
    }
    location.href = environment.IS_LOCAL
      ? `http://${app.host_id}.localhost:${port}${path}`
      : `https://${app.host_id}.${reference}${path}`;
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

  public confirmRecordDelete() {
    this.confirmationPopUpService.removeRecord();
    this.shownConfirmationForm = false;
    this.stylesService.popUpDisactivated();
  }

  public confirmPublish() {
    this.publishPopUpService.publish();
    this.shownPushishConfirmationForm = false;
    this.stylesService.popUpDisactivated();
  }

  public confirmLater() {
    this.publishPopUpService.later();
    this.shownPushishConfirmationForm = false;
    this.stylesService.popUpDisactivated();
  }

  // SwitchCaseId - method to set another case id, all other view data depends on caseId
  public switchCaseId(caseData?: Case, caseForm?: HTMLFormElement) {
    if (caseForm) {
      caseForm.classList.remove('toggle');
    }

    this.noPermissions = false;
    this.checkToggle();
    this.choosedCaseName = caseData?.name!;
    this.casesService.activeCase = caseData;
    this.casesService.changeCaseId(caseData);
    this.dashboardService.selectedCase.next(caseData?.name!);
    this.loadTeamData(caseData?.case_id!);
    this.loadNotifications(caseData?.case_id!);
    this.casesService.setCurrentCase(caseData as any);
    this.isCaseBannerOpened = true;

    localStorage.setItem('app-' + location.hostname.split('.')[0], caseData?.name!);

    this.userService
      .getCasePermissions(caseData?.case_id!)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(r => {
        this.modules = [];
        this.modules = r.host.modules;
        this.permissions = r.role.permissions;
        this.userData.role_id = r.role.role_id;
        this.serverError = '';
      });
  }

  public togglePublished($event: Event, element: any) {
    this.publishingFlag = true;
    this.publishCheckBoxState = element.checked ? 1 : 0;
    switch (this.publishType) {
      case PublishType.sign:
        this.signsService.publishSign(element.checked);
        break;
      case PublishType.form:
        this.formsService.publishForm(element.checked);
        break;
      default:
        this.signsService.publishSign(element.checked);
        break;
    }
  }

  public activateCreateEventModal() {
    this.eventsService.activateCreateModal();
  }

  public activateCreateInvoiceModal() {
    this.invoicesService.activateCreateModal();
  }

  public activateCreateTaskModal() {
    this.tasksService.activateCreateModal.next(true);
  }

  public createForm(type: string) {
    this.formsService.openCreateForm(type);
  }

  public createSign(type: string) {
    this.signsService.openCreateForm(type);
  }

  public dismissModal() {
    this.shownConfirmationForm = false;
    this.stylesService.popUpDisactivated();
  }

  public dismissPublishModal() {
    this.shownPushishConfirmationForm = false;
    this.stylesService.popUpDisactivated();
    this.publishPopUpService.close();
  }

  public displayAll() {
    this.allNotifications = true;
  }
  public displayInvitations() {
    this.allNotifications = false;
  }

  // Add slide animation to user apps menu
  public openAppActions(app: IApp, event: Event, index: number) {
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
      this.renderer.removeClass((event.target as HTMLElement).closest('.user-menu-dropdown-app'), 'slide-in-animation');

      if (app.host_user_type === 'manage' || app.host_user_type === 'admin') {
        if (app.host_granted_status === 0) {
          this.openApp(app, 'app');
        }

        this.showAnimationIndex = index;
        this.renderer.addClass((event.target as HTMLElement).closest('.user-menu-dropdown-app'), 'slide-out-animation');
      } else if (app.host_user_type === 'user') {
        this.openApp(app, 'app');
        this.showUserMenu = false;
      }
    }
  }

  public closeCaseBanner(): void {
    this.isCaseBannerOpened = false;
  }

  private loadApps(): Observable<IApp[]> {
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

  // loadUserData waiting when user data loaded from server
  private loadUserData() {
    this.userService.getUserData.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.userData = res;
      this.hostService.appName = res.company_name;
      this.companySystem = res.company_system || [];
      this.userAvatarSrc = this.userService.getAvatarUrl(50);
      this.noPermissions = false;

      this.rolesService.getRolesList().subscribe();

      this.switchLanguage();

      this.routerSubscription.unsubscribe();

      this.routerSubscription = combineLatest([this.router.events, this.route.queryParams])
        .pipe(
          tap(([event, params]) => {
            if (event instanceof NavigationEnd) {
              if (params['case'] && params['id'] && params['action']) {
                this.loadCaseForDirectLink(params);
              } else if (window.location.pathname !== '/') {
                this.dashboardService.selectedCase
                  .pipe(
                    first(),
                    tap(res => (res ? this.loadCases(res) : this.loadInitialCases()))
                  )
                  .subscribe();
              }
            }
          })
        )
        .subscribe();
    });
  }

  // Check and set state in cases toggle
  private checkToggle() {
    const casesToggle = (window as any)['formSa'] as HTMLElement;

    if (casesToggle?.classList.contains('toggle')) {
      casesToggle.classList.remove('toggle');
    }
  }

  private getDesign() {
    if (this.companySystem && this.companySystem.design) {
      const uuid = this.companySystem.design.uuid || '';
      return this.designService.getDesignUrl('design', 'css', '', uuid);
    } else {
      return this.designService.getDesignUrl('design', 'css');
    }
  }

  private loadInitialCases() {
    this.casesService
      .getAllCases()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        ({ items }) => {
          this.casesList = items.map((value) => ({
            ...value,
            name: value.case_tag_id.substr(value.case_tag_id.indexOf('::') + 2),
          }));

          if (this.casesList.length > 0) {
            this.noCases = false;

            if (!this.noPermissions) {
              const localAppCase = localStorage.getItem('app-' + location.hostname.split('.')[0]);
              const caseItem = this.casesList.find(c => c.name === localAppCase);
              this.casesService.setCurrentCase(caseItem!);

              if (!caseItem) {
                this.noPermissions = true;

                return;
              }

              this.switchCaseId(caseItem || this.casesList[0]);
              this.userService
                .getToDos(this.casesService?.activeCase?.case_id!, 'uncompleted')
                .subscribe((res: Todos) => (this.todos = res));
            }
          } else {
            this.noCases = true;
          }
        },
        () => {
          this.loadCasesError();
        }
      );
  }

  // if direct link in url
  private loadCaseForDirectLink(routerParams: any): void {
    this.casesService
      .getAllCases()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        ({ items }) => {
          this.casesList = items.map(value => ({
            ...value,
            name: value.case_tag_id.slice(value.case_tag_id.indexOf('::') + 2)
          }));

          const selectedCase = this.casesList.find(c => c.case_id === routerParams.case);
          this.casesService.setCurrentCase(selectedCase!);

          if (!selectedCase) {
            this.noPermissions = true;
          }

          if (this.casesList.length > 0) {
            this.noCases = false;

            if (!this.noPermissions) {
              const caseName = this.casesList.find(c => c.case_id == routerParams?.case)?.name;

              if (caseName) {
                this.switchCaseId(selectedCase || this.casesList[0]);
                this.userService
                  .getToDos(this.casesService?.activeCase?.case_id!, 'uncompleted')
                  .subscribe((res: any) => (this.todos = res));
                this.openDirectLink(routerParams);
              }
            }
          } else {
            this.noCases = true;
          }
        },
        () => {
          this.loadCasesError();
        }
      );
  }

  private loadCases(res: string) {
    this.casesService
      .getAllCases()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        ({ items }) => {
          this.casesList = items.map(value => ({
            ...value,
            name: value?.case_tag_id?.substr(value.case_tag_id.indexOf('::') + 2),
          }));

          const selectedCase = this.casesList.find(c => c.name === res);
          this.casesService.setCurrentCase(selectedCase!);
          if (!selectedCase) {
            this.noPermissions = true;
          }

          if (this.casesList.length > 0) {
            this.noCases = false;

            if (!this.noPermissions) {
              this.switchCaseId(selectedCase || this.casesList[0]);
              this.userService
                .getToDos(this.casesService?.activeCase?.case_id!, 'uncompleted')
                .subscribe((res: any) => (this.todos = res));
            }
          } else {
            this.noCases = true;
          }
        },
        () => {
          this.loadCasesError();
        }
      );
  }

  private loadCasesError(): void {
    this.noCases = true;
    this.teamLoading = false;
    this.userData.sync_info = {
      given_name: this.userData.given_name,
      family_name: this.userData.family_name
    };
    this.team = [this.userData];
  }

  public closeNoPermissionToCaseModal(): void {
    this.noPermissions = false;
  }

  // convert date for toDos
  public convertToLocalDate(date: Date | string) {
    const newDate = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[newDate.getDay()];
    const dayNumber = newDate.getDate();
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    const month = months[newDate.getMonth()];

    return day + ', ' + month + ' ' + dayNumber;
  }

  // get creator name for ToDos
  public getToDosUserName(userId: string): string | void {
    if (this.team?.length) {
      const user = this.team.filter((user: any) => user.user_id === userId)[0];

      return user?.full_name;
    }
  }

  // get button text for ToDos
  public setButtonText(taskId: string): string {
    const endIndex = taskId.indexOf('::');
    const event = taskId.slice(0, endIndex);

    switch (event) {
      case 'event':
        return 'Confirm Event';
      case 'form':
        return 'Fill The Form';
      case 'sign':
        return 'E-sign The Form';
      case 'invoice':
        return 'View Invoice';
      default:
        return 'Do It Now';
    }
  }

  // redirect to ToDos, when user click button
  public redirectToSelectedToDo(taskId: string) {
    const endIndex = taskId.indexOf('::');
    const event = taskId.slice(0, endIndex);

    switch (event) {
      case 'event':
        this.router.navigate(['/events']);
        break;
      case 'form':
        this.router.navigate(['forms/form-submit', taskId]);
        break;
      case 'sign':
        this.router.navigate(['e-signs/e-sign-submit', taskId]);
        break;
      case 'invoice':
        this.router.navigate(['invoices/invoice-submit', taskId]);
        break;
      default:
        break;
    }

    this.rootDiv?.nativeElement.classList.remove('show-f');
  }

  public mobileTabCounter(index: number) {
    this.mobileMenuTabIndex = index;
  }

  public toggleConvoLayout(value: any) {
    this.convoService.toggleConvoLayoutSubject.next(value);
    this.isConvoLayoutDropdownShow = false;
  }

  public endConvo() {
    this.convoService.endConvoSubject.next();
    this.isConvoLayoutDropdownShow = false;
  }

  // loadTeamData
  private loadTeamData(caseId: string) {
    this.userService.getTeam(caseId).subscribe();
  }

  // switchLanguage switches language by using 'locale' property from userData object
  private switchLanguage() {
    this.translate.use(this.userData.locale as string);
  }

  // This method should solve route opening latency, when waiting for guard Auth response
  private outOfRoute() {
    // this.routeLoaded = false;
    this.garbageCollectorService.destroyActiveComponent();
  }

  private getRoute(route: string) {
    return route.split('?')[0].split('/').splice(1, 2).join('/');
  }

  private updateDesign() {
    // this.designLink = this.designService.getDesignUrl('design', 'css');

    const safeFaviconUrl = this.designService.getDesignUrl('design', 'css');

    document?.querySelector('#dynamic-design')?.setAttribute('href', HOST_CDN_URL(safeFaviconUrl as string));
  }

  private updateFastLoadingDesign(): void {
    const url = this.designService.getFastLoadingDesign();
    document?.querySelector('#fast-loading-design')?.setAttribute('href', url);
  }

  private updateFavicon() {
    const favEl = document.querySelector('#favicon-icon');

    if (this.designLink && favEl) {
      favEl.setAttribute('href', (this.getFavicon() as any)['changingThisBreaksApplicationSecurity']);
    }
  }

  private updateLogo() {
    if (this.companySystem && this.companySystem.logo) {
      const uuid = this.companySystem.logo.uuid || '';
      this.logoSrc = this.designService.getDesignUrl('logo', 'png', '160', uuid);
    } else {
      this.logoSrc = this.designService.getDesignUrl('logo', 'png', '160');
    }
  }

  private getFavicon() {
    if (this.companySystem && this.companySystem.favicon) {
      const uuid = this.companySystem.favicon.uuid || '';
      return this.designService.getDesignUrl('favicon', 'png', '48', uuid);
    } else {
      return this.designService.getDesignUrl('favicon', 'png', '48');
    }
  }

  private checkCaseFromUrl(params: any): void {
    const caseData = this.casesList.find(c => c.case_id === params.case);

    if (caseData) {
      this.choosedCaseName = caseData.name!;
      // delete params.case;
      // this.router.navigate([], { queryParams: params });
    } else {
      this.noPermissions = true;
    }
  }

  private docClickHandler(event: any) {
    this.showUserMenu = this.userMenuDropdown
      ? this.userMenuDropdown.nativeElement.contains(event.target)
      : this.userMenu?.nativeElement.contains(event.target);
    this.showNotificationMenu = this.notificationMenuDropdown
      ? this.notificationMenuDropdown.nativeElement.contains(event.target)
      : this.notificationMenu?.nativeElement.contains(event.target);

    if (!this.showUserMenu) {
      this.showAnimationIndex = null;
    }
  }

  private openDirectLink(params: any) {
    if (params?.case && params?.id && params?.action) {
      switch (this.currentRoute) {
        case 'feed': {
          this.feedsService.directLink = { id: params.id, action: params.action };
          break;
        }

        case 'notes': {
          this.notesService.noteDirectLinkSubject.next({ id: params.id, action: params.action });
          break;
        }

        case 'events': {
          this.eventsService.eventDirectLinkSubject.next({ id: params.id, action: params.action });
          break;
        }

        case 'forms': {
          this.formsService.formDirectLinkSubject.next({ id: params.id, action: params.action });
          break;
        }

        case 'signs': {
          this.signsService.signDirectLinkSubject.next({ id: params.id, action: params.action });
          break;
        }

        case 'invoices': {
          this.invoicesService.invoiceDirectLinkSubject.next({ id: params.id, action: params.action });
          break;
        }
      }
    }
  }

  private updateAppFavicon(): void {
    const safeFaviconUrl = this.designService.getDesignUrl('favicon', 'ico', '48');

    document?.querySelector('#favicon-icon')?.setAttribute('href', (safeFaviconUrl as any)['changingThisBreaksApplicationSecurity']);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
