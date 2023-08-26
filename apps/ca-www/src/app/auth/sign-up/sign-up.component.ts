import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, AbstractControl } from '@angular/forms';

import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../auth.service';
import { PopInNotificationConnectorService } from '@www/common/components/pop-in-notifications/pop-in-notification-connector.service';
import { PasswordValidationComponent } from './password-validation/password-validation.component';
import { ILanguage } from '@www/core/language.model';
import { ITimeZone } from '@www/core/time-zone.model';

import { EMAIL_REG_EXP, PASSWORD_REG_EXP } from '@www/shared/constants.utils';
import { GET_ACCOUNT_CLIENT_URL } from '@www/shared/api.utils';
import { UiService } from '@www/shared/ui.service';
import { INotification } from '@www/common/components/pop-in-notifications/notification.model';
import { MustMatch } from '@www/common/validators/must-match.validator';

/**
 * Sign up component.
 */
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {
  @Input() languages: ILanguage[];
  @Input() timeZones: ITimeZone[];
  @ViewChild('passwordFieldNewPassword') passwordFieldNewPassword: PasswordValidationComponent;
  @ViewChild('passwordValidationConfirmPassword') passwordValidationConfirmPassword: PasswordValidationComponent;

  public successMessage = '';
  public sending = false;

  public signUpForm: UntypedFormGroup;

  public isShowNewPassword = false;
  public isShowConfirmPassword = false;

  constructor(
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private notificationsService: PopInNotificationConnectorService,
    private uiService: UiService
  ) {}

  /**
   * Initializes sign up form.
   *
   * Sets browser time zone and language.
   */
  ngOnInit(): void {
    this.signUpForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_REG_EXP)]],
        given_name: ['', Validators.required],
        family_name: ['', Validators.required],
        password: ['', [Validators.required, Validators.pattern(PASSWORD_REG_EXP)]],
        confirm_password: ['', [Validators.required, Validators.pattern(PASSWORD_REG_EXP)]],
        locale: ['', Validators.required],
        zoneinfo: ['', Validators.required],
        agreed: ['', Validators.required]
      },
      { validator: MustMatch('password', 'confirm_password') }
    );

    const { timeZone } = Intl.DateTimeFormat().resolvedOptions();

    const locale = navigator.language.split('-')[0];
    const userLocale = this.languages.find(lang => lang.id === locale);

    this.signUpForm.patchValue({ locale: userLocale.id, zoneinfo: timeZone });
  }

  /**
   * Helper for easy accessing form controls.
   */
  public control(control: string): AbstractControl {
    return this.signUpForm.get(control);
  }

  /**
   * Registers user.
   */
  public signUp(): void {
    if (this.signUpForm.valid) {
      const notification: INotification = this.notificationsService.addNotification({
        title: 'Creating account '
      });

      this.authService
        .sendData(this.signUpForm.value)
        .pipe(
          catchError(response => {
            let error = response.error.error.message;

            if (error === 'EmailExistsException' || error === 'UsernameExistsException') {
              error = 'User already exists';
            }

            this.notificationsService.failed(notification, error);

            return throwError(error);
          })
        )
        .subscribe(res => {
          this.notificationsService.ok(notification, ' Account created');
          const accountUrl = GET_ACCOUNT_CLIENT_URL();
          window.location.href = accountUrl;
        });
    }
  }

  /**
   * Closes sign up modal.
   */
  public refreshModal(): void {
    this.uiService.managedSignUpPopUp();
  }

  /**
   * Checks password validation.
   */
  public CheckPasswordValidation(passwordType: string): void {
    setTimeout(() => {
      const comparePasswords = this.control('password').value === this.control('confirm_password').value;

      switch (passwordType) {
        case 'newPassword':
          const isValidNewPassword = PASSWORD_REG_EXP.test(this.control('password').value);

          if (isValidNewPassword) {
            this.isShowNewPassword = false;
          } else {
            this.isShowNewPassword = true;
            this.passwordFieldNewPassword.checkRegularExpression(passwordType);
          }
          break;
        case 'confirmPassword':
          const isValidConfirmPassword = PASSWORD_REG_EXP.test(this.control('confirm_password').value);

          this.isShowConfirmPassword = isValidConfirmPassword ? false : true;
          break;
      }

      if (comparePasswords) {
        this.passwordValidationConfirmPassword.checkRegularExpression(passwordType, true);
      } else {
        this.passwordValidationConfirmPassword.checkRegularExpression(passwordType, false);
      }
    });
  }
}
