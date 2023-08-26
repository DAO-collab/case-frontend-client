import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { Router } from '@angular/router';
import { SafeResourceUrl } from '@angular/platform-browser';

import { map, switchMap, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

import { SettingsService } from '@acc/core/settings.service';
import { AppsService } from '@acc/modules/apps/apps.service';
import { IUser } from '@acc/core/user.model';
import { IApiGridResponse, IApp, NotificationItem } from '@acc/modules/apps/app.model';
import { HostUserType } from '../../modules/apps/app.model';
import { isToday, LOGO } from '@acc/utils/constants.utils';
import { NotificationsService } from '../../services/notifications.service';
import { UtilsService } from '../../services/utils.service';
import { DomainsService } from '../../modules/domains/domains.service';
import { DesignService } from '../../services/design.service';

/**
 * Navigation component.
 */
@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
  @ViewChildren('userMenuApp') userMenuApp?: QueryList<ElementRef>;

  @ViewChild('userMenuDropdown') userMenuDropdown?: ElementRef;
  @ViewChild('userMenu') userMenu?: ElementRef;
  @ViewChild('menuDropDownIcon') menuDropDownIcon?: ElementRef;
  @ViewChild('notificationMenuDropdown') notificationMenuDropdown?: ElementRef;
  @ViewChild('notificationMenu') notificationMenu?: ElementRef;

  @Input() isLoggedIn: boolean = false;
  @Input() user?: IUser;
  @Input() avatarUrl?: string;
  @Input() logo?: string | SafeResourceUrl;
  @Input() activeMobileMenu?: boolean;
  @Output() logout = new EventEmitter<void>();

  currentLocation = location;
  apps: IApp[] = [];
  showUserMenu = false;
  showNotificationMenu = false;
  allNotifications = true;
  todayNotifications: NotificationItem[] = [];
  lastWeekNotifications: NotificationItem[] = [];
  notifications?: IApiGridResponse<NotificationItem[]>;
  unsubscribe$: Subject<void> = new Subject();
  showAnimationIndex: number | null = null;

  constructor(
    public appsService: AppsService,
    public domainsService: DomainsService,
    public utilsService: UtilsService,
    public router: Router,
    private settingsService: SettingsService,
    private notificationsService: NotificationsService,
    private designService: DesignService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.appsService.isLogInOrSignUp.subscribe(res => {
      if (this.appsService.joinAppModalData && res) {
        this.logo = this.appsService.getDesignUrl(`ca-${this.appsService.joinAppModalData}`, 'logo', 'png');
      } else {
        this.logo = LOGO;
      }
    });

    document.addEventListener('click', this.docClickHandler.bind(this));

    this.settingsService.dataImageObservable.subscribe(imgUrl => {
      if (imgUrl) {
        this.avatarUrl = imgUrl;
      }
    });

    this.loadApps().subscribe();

    this.loadNotifications();

    this.appsService.acceptInvitationSubject
      .asObservable()
      .pipe(switchMap(() => this.loadApps()))
      .subscribe();
  }

  onLogout(): void {
    this.logout.emit();
  }

  /**
   * Show App Notfication modal
   */

  public loadNotifications(): void {
    this.notificationsService
      .getAccountNotifications()
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

      if (app.host_user_type === HostUserType.Manage || app.host_user_type === HostUserType.Admin) {
        if (app.host_granted_status === 0) {
          this.appsService.openApp(app, 'c');
        }

        this.showAnimationIndex = index;
        this.renderer.addClass((event.target as HTMLElement).closest('.user-menu-dropdown-app'), 'slide-out-animation');
      } else if (app.host_user_type === HostUserType.User) {
        this.appsService.openApp(app, 'c');
        this.showUserMenu = false;
      }
    }
  }

  public showSelectOptionModal(): void {
    this.appsService.isSelectOptionModalShowed = true;
  }

  public showDomainsModal() {
    this.domainsService.isDomainsModalShowed = true;
  }

  private loadApps(): Observable<IApp[]> {
    return this.appsService.findAllApps(true).pipe(
      map(apps => {
        this.apps = apps.map(app => ({
          ...app,
          favicon: this.designService.getFaviconSecureUrl('favicon', 'ico', app.host_id, '48')[
            'changingThisBreaksApplicationSecurity'
          ]
        }));

        return this.apps;
      })
    );
  }

  private docClickHandler(event: Event) {
    this.showUserMenu = this.userMenuDropdown
      ? this.userMenuDropdown?.nativeElement?.contains(event.target)
      : this.userMenu?.nativeElement?.contains(event.target) ||
        this.menuDropDownIcon?.nativeElement?.contains(event.target);
    this.showNotificationMenu = this.notificationMenuDropdown
      ? this.notificationMenuDropdown?.nativeElement?.contains(event.target)
      : this.notificationMenu?.nativeElement?.contains(event.target);

    if (!this.showUserMenu) {
      this.showAnimationIndex = null;
    }
  }
}
