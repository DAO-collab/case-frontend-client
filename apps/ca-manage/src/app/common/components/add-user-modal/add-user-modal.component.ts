import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
  OnDestroy,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { catchError, takeUntil } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import {
  Notification,
  PopInNotificationConnectorService
} from '../pop-in-notifications/pop-in-notification-connector.service';
import { UsersService } from '../../../pages/users/services/users.service';
import { StylesService } from '../../../services/styles.service';
import { AdminService } from '../../../services/admin.service';
import { UtilsService } from '../../../services/utils.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { IUser, UsernameType } from '../../../pages/users/models/user.model';
import { emailOrPhoneValidator } from '../../../shared/constants.utils';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { Country } from 'ngx-intl-tel-input/lib/model/country.model';

@Component({
  selector: 'app-add-user-modal',
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css']
})
export class AddUserModalComponent extends UnsubscriptionHandler implements OnInit, OnDestroy {
  @Input() username?: string;
  @Output() save: EventEmitter<any> = new EventEmitter<any>();
  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  @Input('defaultValue') userInputValue?: string;
  @Input('type') type?: string;
  @Input('countryCode') countryCode?: string;
  @Input('showTagId') showTagId?: boolean;
  @ViewChild('usernameTypesMenu', { static: true }) usernameTypesMenu?: ElementRef;
  @ViewChild('usernameTypesMenuToggle', { static: true }) usernameTypesMenuToggle?: ElementRef;

  usernameType = UsernameType.Email;
  showUsernameTypeFilter = false;
  addUserFormTouched = false;
  showRegisterInfo = true;
  validationErrors: any[] = [];
  options: any = {};
  saving = false;
  addButtonActive = false;
  currentLoggedUserData?: IUser;
  defaultCountry = 'us';
  UsernameType = UsernameType;

  userAddForm?: UntypedFormGroup;

  SearchCountryField = SearchCountryField;
	CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
	preferredCountries: CountryISO[] = [CountryISO.UnitedStates, CountryISO.UnitedKingdom];

  private rendererListenerFn?: () => void;
  selectedCountryCode?: string;

  get tagId() {
    return this.userAddForm?.controls['host_tag_id'];
  }

  constructor(
    public usersService: UsersService,
    private stylesService: StylesService,
    private adminService: AdminService,
    private notificationsService: PopInNotificationConnectorService,
    private fb: UntypedFormBuilder,
    private renderer: Renderer2,
    private utils: UtilsService,
    private errorD: LocalTranslationService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        this.cancelNewUserData();
      }
    });

    this.initAddUserForm();
    this.defaultCountry = this.countryCode && this.countryCode !== '' ? this.countryCode : this.defaultCountry;
    this.usernameType = this.type === UsernameType.Email ? UsernameType.Email : UsernameType.Phone;
    this.currentLoggedUserData = this.adminService.userData;
    this.rendererListenerFn = this.renderer.listen('window', 'click', (e: Event) => {
      if (
        this.usernameTypesMenuToggle &&
        e.target !== this.usernameTypesMenuToggle.nativeElement &&
        this.usernameTypesMenu &&
        e.target !== this.usernameTypesMenu.nativeElement
      ) {
        this.showUsernameTypeFilter = false;
      }
    });

    this.adminService
      .getOptions(['/dropdowns/languages', '/dropdowns/timezones'], 'en')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(data => {
        const langs = data[0];
        const timezones = data[1];

        this.options.languages = Object.keys(langs).map(k => {
          const key = langs[k].key;
          const vl = langs[k].value;

          return {
            id: key,
            text: vl
          };
        });

        this.options.timezones = Object.keys(timezones).map(k => {
          const key = timezones[k].key;
          const vl = timezones[k].value;

          return {
            id: key,
            text: vl
          };
        });

        (this.options.timezones as any[]).sort((a, b) => {
          const textA = a.text.toUpperCase();
          const textB = b.text.toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });

        this.userAddForm?.patchValue({
          locale: this.currentLoggedUserData?.locale,
          zoneinfo: this.currentLoggedUserData?.zoneinfo
        });
      });

    if (this.username) {
      this.userAddForm?.patchValue({ username: this.username });
      this.nextUserToAdd();
    }

    this.tagId?.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(value => this.tagId?.setValue(this.utils.replaceSpaces(value), { emitEvent: false }));
  }

  initAddUserForm() {
    this.userAddForm = this.fb.group({
      username: [
        this.userInputValue && this.userInputValue !== '' ? this.userInputValue : '',
        Validators.compose([Validators.required, emailOrPhoneValidator])
      ],
      locale: [null, Validators.required],
      zoneinfo: [null, Validators.required],
      family_name: ['', Validators.required],
      given_name: ['', Validators.required],
      host_tag_id: '',
      phone: [this.type === UsernameType.Phone ? this.userInputValue : '']
    });
  }

  /**
   * Update username: email or phone
   * @param type: UsernameType
   */
  public usernameTypeChange(type: UsernameType) {
    this.usernameType = type;
    this.showUsernameTypeFilter = !this.showUsernameTypeFilter;

    // if (type === UsernameType.Phone) {
    //   this.userAddForm.controls['phone'].setValue('+1');
    // } else {
    //   this.userAddForm.controls['phone'].setValue('');
    // }
  }

  /**
   * Next step
   */
  nextUserToAdd() {
    if (!this.userAddForm?.controls['username'].value) {
      return;
    }

    this.validationErrors = this.validationErrors.filter(item => item !== 'email');
    this.addButtonActive = true;
    this.showRegisterInfo = true;
  }

  /**
   * Add User To Host
   */
  public addUserToHost(): void {
    debugger;
    this.addUserFormTouched = true;
    if (this.userAddForm?.controls['username'].invalid) {
      const phone = this.userAddForm.controls['phone'].value.e164Number;
      this.userAddForm.controls['username'].patchValue(phone);
    }

    if (this.userAddForm?.controls['username'].invalid) {
      return;
    }

    const formData = this.userAddForm?.getRawValue();
    const relationData: IUser = {
      ...formData,
      family_name: formData.family_name.trim(),
      given_name: formData.given_name.trim(),
      username: formData.username.trim(),
      host_user_status: 1,
      host_user_type: this.usersService.userTypeQuery.toLowerCase()
    };

    delete relationData.phone;

    if (!relationData.host_tag_id) {
      delete relationData.host_tag_id;
    }

    this.saving = true;

    if (this.showRegisterInfo) {
      this.createUserRelation(relationData);
    }
  }

  /**
   * Create User Relation
   * @param relationData: IUser
   */
  private createUserRelation(relationData: IUser): void {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Adding ${this.usersService.userType}`
    });
    relationData.locale = relationData && relationData.locale ? relationData.locale : 'af';
    relationData.zoneinfo = 'Atlantic/Canary';
    this.usersService
      .createUserRelation(relationData)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.saving = false;

          if (
            res.error.error.message === 'FieldTagDupsException' ||
            res.error.error.message === 'FieldUsernameDupsException'
          ) {
            this.showError(res.error.error.message, notification);
          } else if (
            res.error.error.reason === 'FieldUsernameTypeException' ||
            res.error.error.reason === 'FieldPhoneTypeException'
          ) {
            this.showError('FieldUsernameTypeException', notification);
          } else {
            this.notificationsService.failed(notification, 'Something went wrong');
          }

          return throwError(res.error);
        })
      )
      .subscribe(res => {
        const obj = {
          relationData,
          type: this.usernameType,
          countryCode:
            this.selectedCountryCode && this.selectedCountryCode !== ''
              ? this.selectedCountryCode
              : this.defaultCountry,
          res
        };
        this.save.emit(obj);
        this.notificationsService.ok(notification, `${this.usersService.userType} added`);
        this.cancelNewUserData();
      });
  }

  /**
   * Cancel New User Data
   */
  public cancelNewUserData(): void {
    this.stylesService.popUpDisactivated();
    this.close.emit();
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

  onCountryCodeChange(country: Country) {
    this.selectedCountryCode = country.iso2;
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

  public openImportsModal(): void {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/integration']));

    sessionStorage.setItem('importsType', 'post_user');
    window.open(url, '_blank');
    sessionStorage.removeItem('importsType');
  }

  public redirectToSettingsPage(): void {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/settings'], { fragment: 'signup' }));

    window.open(url, '_blank');
  }
}
