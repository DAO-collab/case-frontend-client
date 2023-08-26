import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormGroup, Validators, UntypedFormBuilder, AbstractControl } from '@angular/forms';
import { PasswordValidationComponent } from '@acc/common/components/password-validation/password-validation.component';
import { AuthService } from '../auth.service';
import { catchError, takeUntil } from 'rxjs/operators';
import { throwError, Subject } from 'rxjs';
import { PASSWORD_REG_EXP } from '@acc/utils/constants.utils';
import { MustMatch } from '@acc/common/validators/must-match.validators';

/**
 * Confirm reset password component.
 */
@Component({
  selector: 'app-reset-password-confirm',
  templateUrl: './reset-password-confirm.component.html',
  styleUrls: ['./reset-password-confirm.component.css']
})
export class ResetPasswordConfirmComponent implements OnInit, OnDestroy {
  public loading = false;
  public message?: string;
  public confirmRequestError: string[] = [];
  public resetPasswordConfirmForm!: UntypedFormGroup;
  @ViewChild('passwordFieldNewPassword') passwordFieldNewPassword?: PasswordValidationComponent;
  @ViewChild('passwordValidationConfirmPassword') passwordValidationConfirmPassword?: PasswordValidationComponent;

  public isShowNewPassword = false;
  public isShowConfirmPassword = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  /**
   * Initializes reset password confirm form.
   *
   * Sets username value.
   */
  ngOnInit(): void {
    this.resetPasswordConfirmForm = this.fb.group(
      {
        code: [null, [Validators.required, Validators.maxLength(250)]],
        new_password: [null, [Validators.required, Validators.maxLength(250)]],
        confirmNewPassword: [null, [Validators.required, Validators.maxLength(250)]],
        username: [{ value: null, disabled: true }]
      },
      { validator: MustMatch('new_password', 'confirmNewPassword') }
    );

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.message = params['message'];
      this.resetPasswordConfirmForm?.get('username')?.setValue(params['username']);
    });
  }

  /**
   * Resets user password.
   */
  public submitConfirmation(): void {
    if (this.resetPasswordConfirmForm?.invalid) {
      return;
    }

    this.confirmRequestError = [];
    this.loading = true;

    this.authService
      .confirmResetPassword(this.resetPasswordConfirmForm?.getRawValue())
      .pipe(
        catchError(res => {
          this.loading = false;
          if (res && res.error && res.error.error) {
            this.confirmRequestError = res.error.error.errors || [res.error.error];
          }
          return throwError(res);
        })
      )
      .subscribe(() => {
        this.loading = false;
        this.router.navigate(['login']);
      });
  }

  /**
   * Helper for easy accessing form controls.
   */
  public control(control: string): AbstractControl {
    return this.resetPasswordConfirmForm?.get(control) as AbstractControl;
  }

  /**
   * Checks password validation.
   */
  public checkPasswordValidation(passwordType: string): void {
    const comparePasswords = this.control('new_password').value === this.control('confirmNewPassword').value;

    switch (passwordType) {
      case 'newPassword':
        const isValidNewPassword = PASSWORD_REG_EXP.test(this.control('new_password').value);

        if (isValidNewPassword) {
          this.isShowNewPassword = false;
        } else {
          this.isShowNewPassword = true;
          this.passwordFieldNewPassword?.checkRegularExpression(passwordType);
        }

        if (comparePasswords) {
          this.passwordValidationConfirmPassword?.checkRegularExpression(passwordType, true);
        } else {
          this.passwordValidationConfirmPassword?.checkRegularExpression(passwordType, false);
        }

        break;
      case 'confirmPassword':
        const isValidConfirmPassword = PASSWORD_REG_EXP.test(this.control('confirmNewPassword').value);

        if (isValidConfirmPassword && comparePasswords) {
          this.isShowConfirmPassword = false;
          this.passwordValidationConfirmPassword?.checkRegularExpression(passwordType, true);
        } else {
          this.isShowConfirmPassword = true;
          this.passwordValidationConfirmPassword?.checkRegularExpression(passwordType, false);
        }
        break;
    }
  }

  /**
   * Unsubscribe from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
