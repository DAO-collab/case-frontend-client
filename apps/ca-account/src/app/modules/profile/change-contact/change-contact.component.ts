import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { IUser } from '@acc/core/user.model';
import { EMAIL_REG_EXP } from '@acc/utils/constants.utils';
import { IUserContactDetails } from '../user-contact-details.model';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { Country } from 'ngx-intl-tel-input/lib/model/country.model';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Change contact component.
 */
@Component({
  selector: 'app-change-contact',
  templateUrl: './change-contact.component.html',
  styleUrls: ['./change-contact.component.css']
})
export class ChangeContactComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('internationalPhoneNumber') internationalPhoneNumber?: any;

  @Input() savingError!: string[];
  @Input() updating?: boolean;
  @Input() user?: IUser;
  @Output() cancelVerify = new EventEmitter<string>();
  @Output() reclaim = new EventEmitter<string>();
  @Output() openVerifyModal = new EventEmitter<string[]>();
  @Output() updateContacts = new EventEmitter<IUserContactDetails>();

  public contactForm!: UntypedFormGroup;
  public defaultCountry?: CountryISO;
  public showingErrorDelay = 2000;
  public showEmailError?: boolean;
  public showPhoneError?: boolean;
  private destroy$ = new Subject<void>();
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
	preferredCountries: CountryISO[] = [CountryISO.UnitedStates, CountryISO.UnitedKingdom];

  constructor(private fb: UntypedFormBuilder) {}

  /**
   * Initializes contact form.
   *
   * Updates contact form value.
   *
   * Sets default country for international phone number.
   */
  ngOnInit(): void {
    const countryCode = parsePhoneNumberFromString(this.user?.phone ? this.user.phone : '');
    this.defaultCountry = countryCode?.country ? countryCode?.country as CountryISO : this.user?.country as CountryISO;
    this.contactForm = this.fb.group({
      phone: [this.user?.phone ? countryCode?.nationalNumber : '', [Validators.minLength(6), Validators.pattern(/^\+/)]],
      email: [this.user?.email, [Validators.email, Validators.pattern(EMAIL_REG_EXP)]]
    });
    this.handlePhoneNumberChange();
    this.handleEmailChange();
  }

  /**
   * Update email field wher user date is updated
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']?.currentValue !== changes['user']?.previousValue) {
      this.contactForm?.controls['email'].patchValue(changes['user'].currentValue.email);
      this.contactForm?.controls['phone'].patchValue(changes['user'].currentValue.phone);
    }
  }

  /**
   * Handle phone number change and set delay for showing error
   */
  public handlePhoneNumberChange(): void {
    this.contactForm.controls['phone'].valueChanges
      .pipe(
        tap(() => (this.showPhoneError = false)),
        takeUntil(this.destroy$),
        debounceTime(this.showingErrorDelay)
      )
      .subscribe(() => {
        if (this.contactForm.controls['phone'].invalid) {
          this.showPhoneError = true;
        }
      });
  }

  /**
   * Handle email change and set delay for showing error
   */
  public handleEmailChange(): void {
    this.contactForm.controls['email'].valueChanges
      .pipe(
        tap(() => (this.showEmailError = false)),
        takeUntil(this.destroy$),
        debounceTime(this.showingErrorDelay)
      )
      .subscribe(() => {
        if (!this.validatePhoneNumber(this.contactForm.controls['phone'].value.nationalNumber)) {
          this.showEmailError = true;
        }
      });
  }
  public validatePhoneNumber(input_str: string) {
    var re = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;
  
    return re.test(input_str);
  }
  /**
   * Resets contact form.
   */
  public resetContactForm(): void {
    this.contactForm.reset({ email: this.user!.email, phone: this.user!.phone ? this.user!.phone : '' });
  }

  /**
   * Emits contact detail to cancel verification.
   */
  public onCancelVerify(type: string): void {
    this.cancelVerify.emit(type);
  }

  /**
   * Emits contact detail to reclaim it.
   */
  public onReclaim(type: string): void {
    this.reclaim.emit(type);
  }

  /**
   * Emits modal type.
   */
  public onOpenVerifyModal(modalType: string[]) {
    this.openVerifyModal.emit(modalType);
  }

  /**
   * Emits contact form value.
   */
  public onUpdateContacts(): void {
    this.contactForm.markAsPristine();
    this.updateContacts.emit(this.contactForm.value);
  }

  /**
   * Unsubscribes from observable.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  // Method to prevent user from deleting phone number's country code
  public preventDeleteCountryCode(event: any): boolean | void {
    const countryCode = this.internationalPhoneNumber.getSelectedCountryDialCode();
    const value = this.internationalPhoneNumber.value;

    if (
      event?.target?.value?.length === countryCode?.length &&
      (event?.code === 'Backspace' || event?.code === 'Delete')
    ) {
      return false;
    } else {
      setTimeout(() => {
        if (!this.internationalPhoneNumber.value.includes(countryCode)) {
          this.contactForm.controls['phone'].patchValue(value);
        }
      }, 0);
    }
  }
}
