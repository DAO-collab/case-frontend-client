import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormBuilder } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, Title } from '@angular/platform-browser';
import { UsersService } from './services/users.service';
import { AdminService } from '../../services/admin.service';
import { StylesService } from '../../services/styles.service';
import { HostService } from '../../services/host.service';
import { LocalTranslationService } from '../../services/local-translation.service';
import {
  PopInNotificationConnectorService,
  Notification
} from './../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { IUser, UserSearchAttribute, UserStatus, UserType } from './models/user.model';
import { UnsubscriptionHandler } from '../../shared/classes/unsubscription-handler';
import { catchError, takeUntil } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent extends UnsubscriptionHandler implements OnInit, OnDestroy {
  @ViewChild('searchMenu') searchMenu?: ElementRef;
  @ViewChild('searchMenuToggle') searchMenuToggle?: ElementRef;

  loading = true;
  users: any[] = [];
  filteredUsers: IUser[] = [];
  searchKey = UserSearchAttribute.Email;
  showSearchFilter = false;
  shownAddUserModal = false;
  userStatuses: UserStatus[] = [UserStatus.Disabled, UserStatus.Active];
  currentLoggedUserData?: IUser;
  defaultCountry = 'us';
  UserSearchAttribute = UserSearchAttribute;
  userSearchForm = this.fb.group({
    searchVal: ['']
  });
  UserType = UserType;
  UserStatus = UserStatus;
  userStatus = this.usersService.userStatus;
  userType = this.usersService.userType;
  startKey = '';

  SearchCountryField = SearchCountryField;
	CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
	preferredCountries: CountryISO[] = [CountryISO.UnitedStates, CountryISO.UnitedKingdom];

  private rendererListenerFn?: () => void;

  get searchKeyText(): string {
    switch (this.searchKey) {
      case UserSearchAttribute.Email:
        return UserSearchAttribute.Email;
      case UserSearchAttribute.Phone:
        return UserSearchAttribute.Phone;
      case UserSearchAttribute.FirstName:
        return 'First Name';
      case UserSearchAttribute.LastName:
        return 'Last Name';
      case UserSearchAttribute.TagId:
        return 'Tag ID';
      case UserSearchAttribute.UserType:
        return 'User Type';
    }
  }

  get searchValue(): string | any {
    return this.userSearchForm.controls['searchVal'].value;
  }

  constructor(
    private usersService: UsersService,
    private stylesService: StylesService,
    private adminService: AdminService,
    private router: Router,
    private notificationsService: PopInNotificationConnectorService,
    private titleService: Title,
    private hostService: HostService,
    private fb: UntypedFormBuilder,
    private renderer: Renderer2,
    private errorD: LocalTranslationService,
    private sanitizer: DomSanitizer
  ) {
    super();
  }

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Users`);
    this.currentLoggedUserData = this.adminService.userData;

    // update users on submenu change
    this.usersService.usersFilterSub.pipe(takeUntil(this.unsubscribe$)).subscribe(userStatus => {
      this.loading = true;
      this.userStatus = userStatus;
      this.searchUsers();
    });

    this.usersService.activateAddUserToHostModalSub.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
      this.shownAddUserModal = res;
      this.disactivatePreviousMessages();
      this.stylesService.popUpActivated();
    });

    this.rendererListenerFn = this.renderer.listen('window', 'click', (e: Event) => {
      if (
        this.searchMenuToggle &&
        e.target !== this.searchMenuToggle.nativeElement &&
        this.searchMenu &&
        e.target !== this.searchMenu.nativeElement
      ) {
        this.showSearchFilter = false;
      }
    });

    this.userSearchForm.controls['searchVal'].valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(searchValue => {
      if (!searchValue) {
        this.loadAllUsers();
      }
    });

    this.loadAllUsers(true);
  }

  /**
   * Remove user without user array
   *
   * @param userId: string
   */
  public removeUser(userId: string): void {
    this.disactivatePreviousMessages();

    const notification: Notification = this.notificationsService.addNotification({
      title: `Removing ${this.userType}`
    });

    this.usersService
      .removeUserRelation(userId)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          if (res.error && res.error.error && res.error.error.message === 'HostUserNotEmptyException') {
            this.showError(res.error.error.message || res.message, notification);
          } else {
            this.notificationsService.failed(notification, res.message);
          }
          this.loading = false;

          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, `${this.userType} removed`);
        this.searchUsers();
        const index = this.users.findIndex(user => {
          return user.user_id === userId;
        });

        this.users.splice(index, 1);
      });
  }

  /**
   * Search Users - search users by API request
   * @param loadFromInit: boolean
   */
  public searchUsers(loadFromInit?: any): void {
    this.disactivatePreviousMessages();

    if (!this.searchValue) {
      this.loadAllUsers();
    } else {
      this.usersService
        .searchUsers(this.searchKey, this.searchKey === 'phone' ? this.searchValue?.e164Number : this.searchValue)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.loading = false;

            if (loadFromInit) {
              this.usersService.noUsers();
            }
            return throwError(res.error);
          })
        )
        .subscribe(({ items }) => {
          this.filteredUsers = items;
          this.loading = false;
        });
    }
  }

  /**
   * Loading all users and search if searchVal is valid
   * @param loadFromInit: boolean
   */
  private loadAllUsers(loadFromInit?: any): void {
    this.disactivatePreviousMessages();
    this.usersService
      .fetchUsers()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;

          if (loadFromInit) {
            this.usersService.noUsers();
          }
          return throwError(res.error);
        })
      )
      .subscribe((data: any) => {
        if (data) {
          this.users = data.items;
          if (data.startKey) {
            this.startKey = encodeURIComponent(data.startKey);
          }
          this.filteredUsers = data.items.map((user: any) => ({
            ...user,
            avatar: this.sanitizer.bypassSecurityTrustResourceUrl(this.adminService.getAvatarUrl('50', user.user_id))
          }));
          this.loading = false;
        }
      });
  }

  /**
   * Loading all users and search if searchVal is valid
   * @param loadFromInit: boolean
   */

  public load_more() {
    this.usersService
      .fetchMoreUsers(this.startKey)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((data: any) => {
        if (data) {
          if (data.startKey) {
            this.startKey = encodeURIComponent(data.startKey);
          } else {
            this.startKey = '';
          }
          data.items.map((user: any) => {
            ({
              ...user,
              avatar: this.sanitizer.bypassSecurityTrustResourceUrl(this.adminService.getAvatarUrl('50', user.user_id))
            });
            this.filteredUsers.push(user);
          });
          this.loading = false;
        }
      });
  }

  /**
   * Set search key
   * @param key: UserSearchAttribute
   */
  public setSearchKey(key: UserSearchAttribute): void {
    this.searchKey = key;
    this.showSearchFilter = false;
    this.userSearchForm.reset();
    this.searchUsers();
  }

  /**
   * Deactivate Previous Messages
   */
  public disactivatePreviousMessages(): void {
    this.router.navigate(['users'], { queryParams: {} });
  }

  /**
   * Emits when user tries to close the add user modal
   */
  onAddUserModalClose() {
    this.shownAddUserModal = false;
    this.searchUsers();
  }

  getUserAvatarSrc(userId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.adminService.getAvatarUrl('50', userId));
  }

  private showError(error: string, notification: Notification) {
    let errorMessage: string;

    if (this.errorD.errorsDictionary) {
      errorMessage = this.errorD.errorsDictionary[error] || error;
      this.notificationsService.failed(notification, errorMessage);
    } else {
      this.errorD
        .loadErrors()
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(() => {
          errorMessage = this.errorD?.errorsDictionary?.[error] || error;
          this.notificationsService.failed(notification, errorMessage);
        });
    }
  }

  override ngOnDestroy(): void {
    if (this.rendererListenerFn) {
      this.rendererListenerFn();
    }

    super.ngOnDestroy();
  }

  // Method to prevent user from deleting phone number's country code
  onKeyDown(event: any): void {
    const value: string = event.target.value;
    if (value.charAt(value.length - 1) === ' ') {
      if (event.keyCode === 8 || event.keyCode === 46) {
        event.preventDefault();
      }
    }
  }

  changeUserStatus(user: any) {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Updating ${this.usersService.userType} `
    });
    const selectedUser = user;

    selectedUser.host_user_status = selectedUser.host_user_status === 1 ? 0 : 1;

    this.usersService.updateUserRelation(user.user_id, user).subscribe(
      () => {
        this.notificationsService.ok(notification, 'User updated');
        this.searchUsers();
      },
      err => {
        this.notificationsService.failed(notification, err);
      }
    );
  }
}
