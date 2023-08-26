import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { NgSelectComponent } from '@ng-select/ng-select';

import { IUser, UsernameType, UserType } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { Country } from 'ngx-intl-tel-input/lib/model/country.model';

@Component({
  selector: 'app-create-ticket-modal',
  templateUrl: './create-ticket-modal.component.html',
  styleUrls: ['./create-ticket-modal.component.css']
})
export class CreateTicketModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('usernameTypesMenu') usernameTypesMenu?: ElementRef;
  @ViewChild('usernameTypesMenuToggle') usernameTypesMenuToggle?: ElementRef;
  @ViewChild('usersDropdownField') usersDropdownField?: NgSelectComponent;

  @Input() ticket?: any;
  @Input() users: IUser[] = [];

  @Output() submitTicket = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();

  ticketForm: UntypedFormGroup = this.fb.group({
    message: [null, Validators.required],
    title: [null, Validators.required],
    user_id: [null, Validators.required],
    phone_number: ''
  });
  formTouched = false;
  validationErrors: any[] = [];
  showUsernameTypeFilter = false;
  isOpenDropDown = false;
  defaultCountry = 'us';
  showAddUserButton = true;
  type = UsernameType.Email;
  UsernameType = UsernameType;
  usernameType = UsernameType.Email;
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
	preferredCountries: CountryISO[] = [CountryISO.UnitedStates, CountryISO.UnitedKingdom];

  private selectedCountryCode = '';
  selectedCountryPrefix = '';
  private unsubscribe$ = new Subject<void>();

  constructor(
    private fb: UntypedFormBuilder,
    private renderer: Renderer2,
    private router: Router,
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.usersService.userType = UserType.User;
    this.usernameType = UsernameType.Email;

    this.ticketForm.controls['phone_number'].valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
      this.usersDropdownField!.searchTerm = value;
      this.usersDropdownField?.filter(this.usersDropdownField.searchTerm);
    });

    this.setSearchDropDownTimeout();

    this.renderer.listen('window', 'click', (e: Event) => {
      if (
        this.usernameTypesMenuToggle &&
        e.target !== this.usernameTypesMenuToggle.nativeElement &&
        this.usernameTypesMenu &&
        e.target !== this.usernameTypesMenu.nativeElement
      ) {
        this.showUsernameTypeFilter = false;
      }
    });
  }

  ngAfterViewInit() {
    this.loadUsers(this.usernameType, '');
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  close(): void {
    this.closeModal.emit();
  }

  saveNewTicket(): void {
    if (this.ticketForm.invalid) {
      this.formTouched = true;

      return;
    }

    this.submitTicket.emit(this.ticketForm);
  }

  searchKeyText(): string {
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

  usernameTypeChange(type: UsernameType): void {
    if (type === UsernameType.Email || type === UsernameType.Phone) {
      this.showAddUserButton = true;
      this.type = type;
    } else {
      this.showAddUserButton = false;
    }

    this.usernameType = type;
    this.showUsernameTypeFilter = !this.showUsernameTypeFilter;
    this.ticketForm.controls['user_id'].reset();

    if (type === UsernameType.Phone) {
      this.usersDropdownField!.searchTerm = '+1';
    } else {
      this.usersDropdownField!.searchTerm = (null as any);
    }
  }

  onCountryCodeChange(country: Country): void {
    this.selectedCountryCode = country.iso2;
    this.selectedCountryPrefix = country.dialCode;
  }

  onKeyDown(event: any): void {
    const value: string = event.target.value;
    if (value.charAt(value.length - 1) === ' ') {
      if (event.keyCode === 8 || event.keyCode === 46) {
        event.preventDefault();
      }
    }
  }

  onChange(): void {
    this.isOpenDropDown = false;
  }

  onSearchType(event: { term: string; items: any[] }): void {
    this.isOpenDropDown = false;
  }

  showUserModal(filterValue: string) {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/users']));

    window.open(url, '_blank');
  }

  private setSearchDropDownTimeout(): void {
    setTimeout(() => {
      this.usersDropdownField?.searchEvent.pipe(takeUntil(this.unsubscribe$), debounceTime(400)).subscribe(value => {
        if (value && value.term && value.term.length) {
          this.loadUsers(this.usernameType, value.term);
        }
      });
    });
  }

  private loadUsers(usernameType: UsernameType, searchValue: string): void {
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
}
