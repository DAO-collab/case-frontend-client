import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
  OnDestroy,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Title, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectComponent } from '@ng-select/ng-select';
import { throwError } from 'rxjs';
import { catchError, debounceTime, finalize, takeUntil } from 'rxjs/operators';

import { CasesService } from '../../../pages/cases/services/cases.service';
import { AdminService } from '../../../services/admin.service';
import { StylesService } from '../../../services/styles.service';
import { HostService } from '../../../services/host.service';
import { RolesService } from '../../roles/services/roles.service';
import { UsersService } from '../../users/services/users.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { ICreateCaseRelation, ICaseAssignedUser } from '../../cases/models/case.model';
import { UsernameType, UserStatus, UserType } from '../../users/models/user.model';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import {
  PopInNotificationConnectorService,
  Notification
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { Country } from 'ngx-intl-tel-input/lib/model/country.model';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.css']
})
export class ActionsComponent extends UnsubscriptionHandler implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('usernameTypesMenu') usernameTypesMenu?: ElementRef;
  @ViewChild('usernameTypesMenuToggle') usernameTypesMenuToggle?: ElementRef;
  @ViewChild('usersDropdownField') usersDropdownField?: NgSelectComponent;

  @Input() actionCaseId = '';
  @Input() assignUserList: ICaseAssignedUser[] = [];
  @Input() createCase = false;
  @Input() creatingCase = false;
  @Output() userDetails: EventEmitter<{ request: ICreateCaseRelation; userData: any }> = new EventEmitter<{
    request: ICreateCaseRelation;
    userData: any;
  }>();
  @Output() updatedAssignUserList: EventEmitter<ICaseAssignedUser[]> = new EventEmitter<ICaseAssignedUser[]>();
  @Output() onSubmit: EventEmitter<null> = new EventEmitter<null>();
  @Output() onRest: EventEmitter<null> = new EventEmitter<null>();

  showAddUserButton = true;
  saving = false;
  type: string = UsernameType.Email;
  loading = true;
  shownAddModal = false;
  isOpenDropDown = false;
  validationErrors: any = [];
  afterActionList: any[] = [];
  userStatuses: UserStatus[] = [UserStatus.Disabled, UserStatus.Active];
  rolesSelectList: object[] = [];
  rolesById: any = {};
  formTouched = false;
  addedUserData?: { relationData: { username: string }; res: any };
  assignUserForm = this.formBuilder.group({
    user_id: [null, [Validators.required]],
    role_id: [null, Validators.required],
    notify: false,
    phone_number: ''
  });
  shownAddUserModal = false;
  username?: string;
  showUsernameTypeFilter = false;
  UsernameType = UsernameType;
  usernameType = UsernameType.Email;
  users: any[] = [];
  defaultCountry = 'us';
  userInputValue?: string;
  selectedCountryCode = '';
  selectedCountryPrefix = '';
  selectedValue?: string;
  phoneNumber?: string;
  isEditMode = false;
  userInfo = [];
  userByID: any = {};
  userEmailByID: any = {};
  SearchCountryField = SearchCountryField;
	CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
	preferredCountries: CountryISO[] = [CountryISO.UnitedStates, CountryISO.UnitedKingdom];

  private roles: any[] = [];
  private rendererListenerFn?: () => void;

  get searchKeyText(): string {
    switch (this.usernameType) {
      case UsernameType.Email:
        return UsernameType.Email;
      case UsernameType.Phone:
        return UsernameType.Phone;
      case UsernameType.FirstName:
        return 'First Name';
      case UsernameType.LastName:
        return 'Last Name';
      case UsernameType.TagId:
        return 'Tag ID';
    }
  }

  constructor(
    private route: ActivatedRoute,
    private casesService: CasesService,
    private stylesService: StylesService,
    private notificationConnectorService: PopInNotificationConnectorService,
    private adminService: AdminService,
    private titleService: Title,
    private hostService: HostService,
    private translateService: LocalTranslationService,
    private rolesService: RolesService,
    private formBuilder: UntypedFormBuilder,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2,
    private usersService: UsersService,
    private router: Router
  ) {
    super();
  }

  ngOnInit() {
    document.addEventListener('click', this.clickHandler.bind(this));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.shownAddModal) {
        this.closeAssignPopUp();
      }
    });

    this.route.params.subscribe(data => {
      if (data && data['case_id']) {
        this.isEditMode = true;
      } else {
        this.isEditMode = false;
      }
    });
    this.titleService.setTitle(`${this.hostService.appName} | Cases`);
    this.actionCaseId = this.actionCaseId || this.route.snapshot.paramMap.get('case_id')!;

    this.casesService.changeAddUserModalStateSub.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.shownAddModal = !this.shownAddModal;

      if (this.shownAddModal) {
        this.usersService.userType = UserType.User;
        this.usernameType = UsernameType.Email;

        this.assignUserForm.controls['phone_number'].valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
          this.usersDropdownField!.searchTerm = value;
          this.usersDropdownField?.filter(this.usersDropdownField.searchTerm);
        });

        this.loadUsers(this.usernameType, '');

        this.setSearchDropDownTimeout();
      }

      this.stylesService.popUpActivated();
    });

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

    this.onLoadActions(true);
  }

  public closeAssignPopUp(withReset = true) {
    if (withReset) {
      this.assignUserForm.reset({ notify: false });
    }

    if (!this.isEditMode) {
      const request: ICreateCaseRelation = {
        case_id: this.actionCaseId,
        ...this.assignUserForm.value
      };
      this.userDetails.emit({ request, userData: this.addedUserData });
      this.assignUserForm.reset({ notify: false });
    }

    this.shownAddModal = false;

    this.stylesService.popUpDisactivated();
  }

  public createActions() {
    this.formTouched = true;
    if (this.assignUserForm.invalid) {
      return;
    }
    this.saving = true;
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: 'Creating Actions'
    });
    const saveData = {
      notify: this.assignUserForm.value.notify,
      role_id: this.assignUserForm.value.role_id,
      user_id: this.assignUserForm.value.user_id
    };
    const request = { assign_users: [...this.afterActionList, saveData] };
    this.casesService
      .addAssignUser(request)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          if (res.error && res.error.error && res.error.error.message) {
            this.translateService
              .showError(res.error.error.message)
              .pipe(takeUntil(this.unsubscribe$))
              .subscribe(errorMessage => this.notificationConnectorService.failed(notification, errorMessage));
          } else {
            this.notificationConnectorService.failed(notification, res.message);
          }

          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.closeAssignPopUp();
        this.savingSuccessActions();
        this.notificationConnectorService.ok(notification, ' Assign User Added! ');
      });
  }

  showUserModal(filterValue: string) {
    this.userInputValue = filterValue;
    this.closeAssignPopUp(false);
    this.shownAddUserModal = true;
  }

  onSaveUser(data: any) {
    const { relationData, type, countryCode } = data;
    this.addedUserData = data;
    this.defaultCountry = countryCode && countryCode !== '' ? countryCode : this.defaultCountry;
    if (type === 'email') {
      this.usernameType = type;
      const obj = {
        email: this.addedUserData?.relationData.username,
        user_id: this.addedUserData?.res.user_id
      };
      this.users.push(obj);
      this.assignUserForm.patchValue({
        user_id: this.addedUserData?.res.user_id
      });
    } else if (type === 'phone') {
      this.usernameType = type;
      this.assignUserForm.patchValue({
        phone_number:
          this.addedUserData && this.addedUserData.relationData ? this.addedUserData.relationData.username : ''
      });
      this.phoneNumber =
        this.addedUserData && this.addedUserData.relationData ? this.addedUserData.relationData.username : '';
    }
    this.createActions();
  }

  public setSearchDropDownTimeout() {
    setTimeout(() => {
      this.usersDropdownField?.searchEvent.pipe(takeUntil(this.unsubscribe$), debounceTime(400)).subscribe(value => {
        if (value && value.term && value.term.length) {
          this.loadUsers(this.usernameType, value.term);
        }
      });
    });
  }

  public runRemove() {
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: 'Removing Assign User'
    });

    this.casesService
      .deleteAssignUser()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.saving = false;
          this.loading = false;

          this.notificationConnectorService.failed(notification, 'Failed.');
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.onLoadActions(true);
        this.notificationConnectorService.ok(notification, 'Done.');
      });
  }

  onAddUserModalClose() {
    this.shownAddUserModal = false;
    this.shownAddModal = true;
    this.isOpenDropDown = false;
    this.setSearchDropDownTimeout();
  }

  usernameTypeChange(type: UsernameType) {
    if (type === UsernameType.Email || type === UsernameType.Phone) {
      this.showAddUserButton = true;
      this.type = type;
    } else {
      this.showAddUserButton = false;
    }
    if (type === 'phone' || type === 'email') {
      this.showAddUserButton = true;
      this.type = type;
    } else {
      this.showAddUserButton = false;
    }
    this.usernameType = type;
    this.showUsernameTypeFilter = !this.showUsernameTypeFilter;
    this.users = [];
    this.assignUserForm.controls['user_id'].reset();

    if (type === UsernameType.Phone) {
      this.usersDropdownField!.searchTerm = '+1';
    } else {
      this.usersDropdownField!.searchTerm = (null as any);
    }
  }

  getUserAvatarSrc(userId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.adminService.getAvatarUrl('50', userId));
  }

  private loadUsers(usernameType: UsernameType, searchValue: string) {
    if (searchValue) {
      this.usersService
        .searchUsers(usernameType, usernameType === UsernameType.Phone ? `+${this.selectedCountryPrefix}${searchValue}` : searchValue)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(({ items }) => {
          this.users = items.filter(item => item[usernameType]);
          this.isOpenDropDown = true;
        });
    }
  }

  private savingSuccessActions() {
    this.formTouched = false;
    this.validationErrors = [];
    this.onLoadActions(true);
  }

  private onLoadActions(silent?: boolean) {
    this.getUsers();
    this.getActionList();
    this.getRole();
  }

  public getActionList() {
    this.hostService
      .getHostInfo()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: any) => {
        if (data.action_after?.assign_users) {
          this.afterActionList = data.action_after?.assign_users ? data.action_after.assign_users : [];
        } else {
          this.afterActionList = [];
        }
        this.loading = false;
      });
  }

  public getRole() {
    this.rolesService
      .getRoles()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => throwError(res.error))
      )
      .subscribe(data => {
        this.roles = data.items.filter(v => v.role_id !== 'role::bots');

        this.rolesSelectList.splice(this.rolesSelectList.length * -1);
        this.roles.forEach(v => {
          this.rolesById[v.role_id] = v.name;
          this.rolesSelectList.push({ text: v.name, id: v.role_id });
        });
      });
  }

  public getUsers() {
    this.usersService
      .fetchUsers()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (res: any) => {
          this.userInfo = res.items;
          this.userInfo.forEach((v: any) => {
            this.userByID[v.user_id] = v.given_name + ' ' + v.family_name;
            this.userEmailByID[v.user_id] = v.email;
          });
        },
        () => {}
      );
  }

  override ngOnDestroy(): void {
    if (this.rendererListenerFn) {
      this.rendererListenerFn();
    }

    super.ngOnDestroy();
  }

  ngAfterViewInit(): void {
    this.phoneNumber =
      this.addedUserData && this.addedUserData.relationData ? this.addedUserData.relationData.username : '';
    if (this.shownAddModal) {
      this.usersService.userType = UserType.User;
      this.usernameType = UsernameType.Email;

      this.assignUserForm.controls['phone_number'].valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
        this.usersDropdownField!.searchTerm = value;
        this.usersDropdownField?.filter(this.usersDropdownField.searchTerm);
      });

      this.loadUsers(this.usernameType, '');

      setTimeout(() => {
        this.usersDropdownField?.searchEvent.pipe(takeUntil(this.unsubscribe$), debounceTime(400)).subscribe(value => {
          if (value && value.term && value.term.length) {
            this.loadUsers(this.usernameType, value.term);
          }
        });
      });
    }
    if (this.addedUserData) {
      this.usersDropdownField?.writeValue(this.addedUserData.relationData.username);
      this.phoneNumber = this.addedUserData.relationData.username;
    }
  }

  onCountryCodeChange(country: Country) {
    this.selectedCountryCode = country.iso2;
    this.selectedCountryPrefix = country.dialCode;
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

  shownAddModalSwitch() {
    this.casesService.changeAddUserModalState();
  }

  onRedirect() {
    this.router.navigate(['/cases']);
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes.assignUserList) {
  //     this.addedUsers = changes.assignUserList.currentValue;
  //   }
  //   if (changes.creatingCase) {
  //     this.creatingCase = changes.creatingCase.currentValue;
  //   }
  // }

  notInterested() {
    this.onRest.emit();
  }

  onCreate() {
    this.onSubmit.emit();
  }
  selectedItem() {
    this.isOpenDropDown = false;
  }
  onSearchType(event: { term: string; items: any[] }) {
    this.isOpenDropDown = false;
  }

  onChange() {
    this.isOpenDropDown = false;
  }

  private clickHandler(event: any) {
    if (this.shownAddModal) {
      if (!this.usersDropdownField?.element.contains(event.target)) {
        this.isOpenDropDown = false;
      }
    }
  }
}
