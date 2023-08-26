import { Component, OnInit, OnDestroy, Input, ViewChild, SimpleChanges, OnChanges, AfterViewInit } from '@angular/core';
import { catchError, tap, switchMap, finalize, filter, takeUntil, skip } from 'rxjs/operators';
import { throwError, Observable, of, Subject, forkJoin, BehaviorSubject } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ScrollToService } from '@nicky-lenaers/ngx-scroll-to';
import { cloneDeep, isEqual } from 'lodash';

import { PopInNotificationConnectorService } from '@acc/common/components/pop-in-notifications/pop-in-notification-connector.service';
import { ContactDetailsType, IUserContactDetails, AccountPageTabs } from './user-contact-details.model';
import { INotification } from '@acc/common/components/pop-in-notifications/notification.model';
import { ChangeContactComponent } from './change-contact/change-contact.component';
import { VerifyModalComponent } from './verify-modal/verify-modal.component';
import { IPasswordChangeCredentials } from '@acc/auth/credentials.model';
import { IApiResponse } from '@acc/core/api-response.model';
import { CacheService } from '@acc/core/cache/cache.service';
import { IOptions, SettingsService } from '@acc/core/settings.service';
import { UtilsService } from '../../services/utils.service';
import { AuthService } from '@acc/auth/auth.service';
import { AccountService } from './account.service';
import { IUser } from '@acc/core/user.model';
import { EMAIL_REG_EXP } from '../../utils/constants.utils';
import { UserService } from '@acc/services/user.service';
import * as ct from 'countries-and-timezones';
import { ResponseError } from './interfaces/response-error.interface';

/**
 * Profile component.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  animations: [
    trigger('routerTransition', [
      state('void', style({ 'margin-top': '10px', opacity: '0' })),
      state('*', style({ 'margin-top': '0px', opacity: '1' })),
      transition(':enter', [animate('0.3s ease-out', style({ opacity: '1', 'margin-top': '0px' }))])
    ])
  ]
})
export class ProfileComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild(VerifyModalComponent, { static: false }) verifyModal?: VerifyModalComponent;

  public options!: IOptions;
  public savingError: string[] = [];
  public updating = false;
  public loading = false;
  public profileForm!: UntypedFormGroup;
  public notifications: string[] = [];
  public notificationsCheck = true;
  // set min age (13+)
  public maxBirthdate = this.utilsService.fullDate(new Date('2007-12-31'));

  private userProfile?: Partial<IUser>;
  private destroy$ = new Subject<void>();

  // Here
  private isPasswordsSuccess = new BehaviorSubject<boolean>(false);
  public isPasswordsSuccess$ = this.isPasswordsSuccess.asObservable();

  public isOpenChangePasswordModal = false;
  public isContactFormValid = false;

  public showEmailError?: boolean;
  public showPhoneError?: boolean;
  @ViewChild('changeContact') changeContact?: ChangeContactComponent;

  @Input() user?: IUser;

  public defaultPhone = '+1';
  public contactForm?: UntypedFormGroup;
  public defaultCountry?: string;
  public showingErrorDelay = 2000;

  public avatarMessage = '';
  public profileImage?: string;

  public originalProfile?: IUser;
  public profile?: IUser;
  public uploadingAvatar = false;
  public success: { message: string } | null = null;
  public display_notification = [
    {
      label: 'Posts',
      value: ['app_updated_feed']
    },
    {
      label: 'Forms',
      value: ['app_requested_forms', 'app_submission_forms']
    },
    {
      label: 'Signs',
      value: ['app_requested_signs', 'app_submission_signs']
    },
    {
      label: 'Invoices',
      value: ['app_requested_invoices', 'app_submission_invoices']
    },
    {
      label: 'Events',
      value: ['app_confirmation_events', 'app_submission_events']
    }
  ];

  public isRefreshAvailable = false;
  public notificationsValue?: Array<{ id: string; text: string }>;
  public firstComeNotifications?: string[];

  constructor(
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private notificationsService: PopInNotificationConnectorService,
    private scrollToService: ScrollToService,
    private accountService: AccountService,
    private cache: CacheService,
    private settingsService: SettingsService,
    private utilsService: UtilsService,
    private userService: UserService
  ) {}

  /**
   * Initializes profile form.
   *
   * Activates user profile and options.
   */
  ngOnInit(): void {
    setTimeout(() => {
      Array.prototype.slice.call(document.getElementsByTagName('ng-select')).map(item => {
        const suffix = item.id.slice(-4) || 'none';
        if (suffix === '_sel') {
          const autoComplete = item.id.substring(0, item.id.length - 4);
          item.getElementsByTagName('input')[0].setAttribute('id', autoComplete);
          item.getElementsByTagName('input')[0].setAttribute('name', autoComplete);
          item.getElementsByTagName('input')[0].setAttribute('autocomplete', autoComplete);
        } else {
          const autoComplete = 'nope';
          item.getElementsByTagName('input')[0].setAttribute('autocomplete', autoComplete);
        }
      });
    }, 1000);

    this.getCurrentUser(this.isRefreshAvailable);
    this.contactForm = this.fb.group({
      phone: [this.user?.phone ? this.user.phone : '+1', [Validators.minLength(6), Validators.pattern(/^\+/)]],
      email: [this.user?.email, [Validators.email, Validators.pattern(EMAIL_REG_EXP)]]
    });

    this.defaultCountry = this.user?.phone ? '' : 'us';

    this.profileForm = this.fb.group({
      given_name: null,
      family_name: null,
      birthdate: null,
      gender: null,
      company: null,
      title: null,
      address1: [null, Validators.pattern('^[a-zA-Z0-9_]+$')],
      address2: [null, Validators.pattern('^[a-zA-Z0-9_]+$')],
      locality: [null, Validators.pattern('^[a-zA-Z0-9_]+$')],
      region: [null, Validators.pattern('^[a-zA-Z0-9_]+$')],
      country: null,
      postal_code: null,
      locale: null,
      zoneinfo: null
    });

    this.activateUserProfileAndOptions();
  }

  changePasswordModal(isOpen: boolean) {
    this.isOpenChangePasswordModal = isOpen;
  }

  showCheckedOrUnchecked(value: string) {
    return !this.notifications.includes(value);
  }

  notificationUpdated(value: string) {
    if (this.notifications.includes(value)) {
      const index = this.notifications.findIndex(item => item === value);
      this.notifications.splice(index, 1);
    } else {
      this.notifications.push(value);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']?.currentValue !== changes['user']?.previousValue) {
      this.contactForm?.controls['email'].patchValue(changes['user'].currentValue.email);
    }
  }

  /**
   * Actions afer image upload.
   */
  public avatarOnUpload(success: { message: string } | null): void {
    if (success) {
      this.avatarMessage = success.message;
      this.scrollToService.scrollTo({ target: 'avatarMessage' });
    }
  }

  /**
   * Reclaims user contact detail.
   */
  public reclaim(type: string): void {
    type = type.toLowerCase();
    let observable$: Observable<IApiResponse>;

    if (!(type === 'email' || type === 'phone')) {
      throw new Error('Verification type should ether email or phone, got:');
    }

    if (type === ContactDetailsType.Email) {
      observable$ = this.accountService.saveContact('email', this.originalProfile!.email);
    } else if (type === ContactDetailsType.Phone) {
      observable$ = this.accountService.saveContact('phone', this.originalProfile!.phone);
    }

    this.updating = true;
    observable$!
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.updating = false)),
        catchError(err => {
          this.onAccountError(err, this);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.savingError = [];
        this.openVerifyModal([type]);
      });
  }

  /**
   * Actions on account error.
   */
  private onAccountError(response: ResponseError, self: ProfileComponent): void {
    if (response && response.error && response?.error?.error?.errors) {
      self.savingError = self.savingError.concat(response.error.error.errors);
    }
  }

  /**
   * Cancels verification.
   */
  public cancelVerify(type: string): void {
    type = type.toLowerCase();

    let observable$: Observable<IApiResponse>;

    if (!(type === ContactDetailsType.Email || type === ContactDetailsType.Phone)) {
      throw new Error('Verification type should ether email or phone, got:');
    }

    if (type === ContactDetailsType.Email) {
      observable$ = this.accountService.deleteContact('unverified', type);
    } else if (type === ContactDetailsType.Phone) {
      observable$ = this.accountService.deleteContact('unverified', type);
    }

    this.updating = true;

    observable$!.pipe(takeUntil(this.destroy$)).subscribe(
      () => {
        this.savingError = [];
        this.updating = false;
        this.getCurrentUser(true);
      },
      err => {
        this.onAccountError(err, this);
        this.updating = false;
      }
    );
  }

  /**
   * Actions afer image remove.
   */
  public avatarOnRemove(): void {
    this.accountService.deleteAvatar();
    this.getCurrentUser(true);
    this.profileImage = '';
  }

  /**
   * Updates user contact details.
   */
  public updateContacts(contact: any): void {
    let notification: INotification;
    const oldPhone = this.originalProfile?.phone || '';
    const phone = (contact.phone.e164Number || '').trim();
    const phoneChanged = phone !== oldPhone && phone !== this.defaultPhone;
    const deletePhone = (contact.phone === '' || phone === this.defaultPhone) && this.originalProfile?.phone;

    const savingChain: Array<Observable<any> | null> = [
      this.saveEmail(contact, this.originalProfile!),
      this.savePhone(phone)
    ].filter(Boolean);

    if (savingChain.length) {
      notification = this.notificationsService.addNotification({
        title: `Saving Account `
      });

      this.updating = true;
    }

    of(null)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => forkJoin(savingChain))
      )
      .pipe(
        catchError(err => {
          if (err.error.error.errors) {
            for (const e of err.error.error.errors) {
              let message = e.message;

              if (e.message === 'FieldUsernameTypeException') {
                message = 'FieldEmailTypeException';
              }

              this.notificationsService.failed(notification, message);
            }
          } else {
            this.notificationsService.failed(notification, err.error.error.message);
          }

          this.updating = false;

          return throwError(err);
        })
      )
      .subscribe(() => {
        const fieldsToUpdate: string[] = [];

        this.notificationsService.ok(notification, 'Your account is updated');
        this.updating = false;

        if (contact.email && contact.email !== this.originalProfile?.email) {
          fieldsToUpdate.push('email');
        }

        if (contact.phone && !deletePhone && phoneChanged) {
          fieldsToUpdate.push('phone');
        }
        this.getCurrentUser(true);
      });
  }

  /**
   * Saves user email.
   */
  private saveEmail(data: IUserContactDetails, originalData: IUser): Observable<any> | null {
    return data.email && data.email !== originalData.email
      ? this.accountService.saveContact('email', data.email)
      : null;
  }

  /**
   * Saves user phone.
   */
  private savePhone(phone: string): Observable<IApiResponse> | null{
    const deletePhone = (phone === '' || phone?.trim() === this.defaultPhone) && this.originalProfile?.phone;
    const savePhone: boolean =
      phone !== '' && phone?.trim() !== this.defaultPhone && phone !== this.originalProfile?.phone;

    return deletePhone
      ? this.accountService.deleteContact('verified', 'phone')
      : savePhone
      ? this.accountService.saveContact('phone', phone)
      : null;
  }

  /**
   * Opens verification modal.
   */
  public openVerifyModal(modalType: string[]): void {
    this.verifyModal?.open(() => ({
      modalType: modalType.shift(),
      profile: this.profile,
      onsave: () => this.handleVerificationModalSave(modalType),
      getCurrentUser: () => this.getCurrentUser(true)
    }));
  }

  /**
   * Force update user and show next modal if it's needed.
   */
  public handleVerificationModalSave(modalType: string[]) {
    this.getCurrentUser(true);

    if (modalType.length) {
      this.openVerifyModal(modalType);
    }
  }

  /**
   * Get current user
   */
  public getCurrentUser(forceUpdate?: boolean): void {
    this.authService
      .getCurrentUser(forceUpdate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe(user => {
        this.notifications = user.muted_notifications || [];
        this.firstComeNotifications = JSON.parse(JSON.stringify(this.notifications));
        this.originalProfile = user;
        this.profile = user;
        this.user = user;
        this.profileImage = this.settingsService.getAvatarUrl(user.user_id, '180');
        this.userService.getOptionsServerOnly(['/notifications/all'], 'en').subscribe(
          resp => {
            this.notificationsValue = resp[0];
            this.loading = false;
          },
          () => {
            this.loading = false;
          }
        );
        this.isRefreshAvailable = true;
      });
  }
  /**
   * Updates user password.
   */
  // public updatePassword(credentials: IPasswordChangeCredentials): void {
  //   const notification: INotification = this.notificationsService.addNotification({
  //     title: `Saving password `
  //   });
  //
  //   this.savePassword(credentials)
  //     .pipe(
  //       takeUntil(this.destroy$),
  //       catchError(err => {
  //         this.notificationsService.failed(notification, err.error.error.message);
  //         this.isPasswordsSuccess.next(false);
  //         this.updating = false;
  //
  //         return throwError(err);
  //       })
  //     )
  //     .subscribe(() => {
  //       this.isPasswordsSuccess.next(true);
  //       this.notificationsService.ok(notification, 'Your account is updated');
  //       this.updating = false;
  //       this.isOpenChangePasswordModal = false;
  //     });
  // }

  /**
   * Changes user password.
   */
  // private savePassword(credentials: IPasswordChangeCredentials): Observable<IApiResponse> {
  //   let observable$: Observable<IApiResponse>;
  //
  //   if (credentials.new_password && credentials.confirm_password && credentials.current_password) {
  //     observable$ = this.authService.changePassword({
  //       current_password: credentials.current_password,
  //       new_password: credentials.new_password
  //     });
  //   }
  //
  //   if (observable$) {
  //     this.updating = true;
  //   }
  //
  //   return observable$ || of(null);
  // }

  /**
   * Gets user profile.
   */
  private getUserProfile(): Observable<IUser> {
    return this.authService.getCurrentUser(true);
  }

  /**
   * Sets user profile.
   */
  private setUserProfile(): Observable<IUser> {
    return this.getUserProfile().pipe(
      tap(user => {
        let birthdate: string;

        if (user.birthdate) {
          const date = new Date(user.birthdate);
          birthdate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        }
        const timezoneCountryInfo = ct.getCountryForTimezone(user.zoneinfo);

        this.userProfile = {
          given_name: user.given_name,
          family_name: user.family_name,
          birthdate: user.birthdate ? birthdate! : undefined,
          gender: user.gender ? user.gender : undefined,
          company: user.company ? user.company : undefined,
          title: user.title ? user.title : undefined,
          address1: user.address1 ? user.address1 : undefined,
          address2: user.address2 ? user.address2 : undefined,
          locality: user.locality ? user.locality : undefined,
          region: user.region ? user.region : undefined,
          country: user.country ? user.country : timezoneCountryInfo?.id,
          postal_code: user.postal_code ? user.postal_code : undefined,
          locale: user.locale,
          zoneinfo: user.zoneinfo
        };

        this.profileForm?.patchValue(this.userProfile!);

        this.settingsService.setLanguage(user.locale);
      })
    );
  }

  /**
   * Activates user profile and options.
   */
  private activateUserProfileAndOptions(): void {
    this.loading = true;

    this.setUserProfile()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(user => this.settingsService.profileOptions()),
        finalize(() => (this.loading = false))
      )
      .subscribe(data => (this.options = data));
  }

  /**
   * Saves profile.
   */
  public saveProfile(): void {
    this.isContactFormValid = !(
      (this.changeContact?.contactForm.controls['email'].pristine &&
        this.changeContact?.contactForm.controls['phone'].pristine) ||
      this.changeContact?.updating ||
      (this.changeContact?.contactForm.controls['email'].invalid && this.changeContact?.contactForm.controls['phone'].invalid)
    );
    if (this.isContactFormValid) {
      this.changeContact?.onUpdateContacts();
    }
    const profile: Partial<IUser> = cloneDeep(this.profileForm?.value);

    const attributesToDelete = this.accountService.attributesToBeRemoved(profile);
    profile.muted_notifications = this.notifications || [];

    this.saveData(profile)
      .pipe(
        takeUntil(this.destroy$),
        catchError(response => {
          this.savingError = response.error.error.errors;
          this.updating = false;

          return throwError(response);
        }),
        filter(response => !!response),
        tap(response => {
          this.savingError = [];

          this.scrollToService.scrollTo({ target: 'scrollTopTarget' });
          this.updating = false;

          this.cache.delete(response!.selfLink);
        }),
        switchMap(() => this.accountService.deleteValuesByAttributeNames(attributesToDelete)),
        switchMap(() => this.setUserProfile())
      )
      .subscribe();
  }

  /**
   * Resets form to previous values.
   */
  public resetForm(): void {
    this.profileForm?.reset(this.userProfile);
  }

  /**
   * Saves data if changed.
   */
  private saveData(profile: Partial<IUser>): Observable<IApiResponse | null> {
    this.updating = true;

    const notification: INotification = this.notificationsService.addNotification({
      title: `Saving profile `
    });

    if (
      !isEqual(this.profileForm?.value, this.userProfile) ||
      !this.notificationsCheck ||
      !this.isNotificationsChanged(this.notifications, this.firstComeNotifications!)
    ) {
      if (this.userProfile?.zoneinfo !== this.profileForm?.value.zoneinfo) {
        profile.country = ct.getCountryForTimezone(this.profileForm?.value.zoneinfo).id;
      }
      return this.accountService.saveProfile(profile).pipe(
        tap(() => {
          this.notificationsService.ok(notification, 'Profile saved');
          this.updating = false;
          this.notificationsCheck = true;
        })
      );
    } else {
      return of(null).pipe(
        tap(() => {
          this.notificationsService.ok(notification, 'Nothing to update');
          this.updating = false;
        })
      );
    }
  }

  public isNotificationsChanged(a: string[], b: string[]) {
    if (a.length === b.length) {
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Unsubscribes from observable.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
