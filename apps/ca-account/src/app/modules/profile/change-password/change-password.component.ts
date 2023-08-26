import { Component, OnInit, Output, EventEmitter, ViewChild, Input, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { PASSWORD_REG_EXP } from '@acc/utils/constants.utils';
import { MustMatch } from '@acc/common/validators/must-match.validators';
import { PasswordValidationComponent } from '@acc/common/components/password-validation/password-validation.component';
import { Observable, Subject } from 'rxjs';
import { takeUntil, skip } from 'rxjs/operators';
import { IPasswordChangeCredentials } from '@acc/auth/credentials.model';

/**
 * Change passord component.
 */
@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  public passwordForm!: UntypedFormGroup;
  public isShowCurrentPassword = false;
  public isShowNewPassword = false;
  public isShowConfirmPassword = false;
  public currentPasswordIsInvalid = false;

  @Input() updating?: number;
  @Input() isPasswordsSuccess$?: Observable<boolean>;
  @Output() updatePassword = new EventEmitter<IPasswordChangeCredentials>();

  @ViewChild('passwordFieldNewPassword') passwordFieldNewPassword?: PasswordValidationComponent;
  @ViewChild('passwordValidationConfirmPassword') passwordValidationConfirmPassword?: PasswordValidationComponent;

  private destroy$ = new Subject<void>();

  constructor(private fb: UntypedFormBuilder) {}

  /**
   * Initializes password form.
   *
   * Resets password form if output succeeds.
   */
  ngOnInit(): void {
    this.passwordForm = this.fb.group(
      {
        newPassword: [null, [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_REG_EXP)]],
        confirmPassword: [null, [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_REG_EXP)]],
        currentPassword: [null, [Validators.required]]
      },
      { validator: MustMatch('newPassword', 'confirmPassword') }
    );

    this.passwordForm.controls['currentPassword'].valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.currentPasswordIsInvalid = false));

    this.isPasswordsSuccess$?.pipe(takeUntil(this.destroy$), skip(1)).subscribe(isSuccess => {
      this.currentPasswordIsInvalid = !isSuccess;

      if (isSuccess) {
        this.resetPasswordForm();
      }
    });
  }

  /**
   * Resets password form.
   */
  public resetPasswordForm(): void {
    this.passwordForm.reset();
  }

  /**
   * Emits password form value.
   */
  public onUpdatePassword(): void {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    this.updatePassword.emit({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
  }

  /**
   * Validates new password.
   */
  public CheckPasswordValidation(passwordType: string): void {
    const comparePasswords =
      this.passwordForm.controls['newPassword'].value === this.passwordForm.controls['confirmPassword'].value;

    switch (passwordType) {
      case 'newPassword':
        const isValidNewPassword = PASSWORD_REG_EXP.test(this.passwordForm.controls['newPassword'].value);

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
        if (comparePasswords) {
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
   * Unsubscribes from observable.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
