import { PASSWORD_REG_EXP } from '../../../utils/constants.utils';
import { MustMatch } from '@acc/common/validators/must-match.validators';
import { PasswordValidationComponent } from '../../../common/components/password-validation/password-validation.component';
import { IPasswordChangeCredentials } from '../../../auth/credentials.model';
import {
  Component,
  OnInit,
  ElementRef,
  EventEmitter,
  Output,
  Renderer2,
  Inject,
  PLATFORM_ID,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';

import { NgbModalConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormGroup, Validators, UntypedFormBuilder } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil, skip } from 'rxjs/operators';

/**
 * Verification modal component.
 */
@Component({
  selector: 'app-change-password-modal',
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.css']
})
export class ChangePasswordModalComponent implements OnInit, OnDestroy {
  @ViewChild('contents', { static: true }) content?: ElementRef;

  @ViewChild('passwordFieldNewPassword', { static: true }) passwordFieldNewPassword?: PasswordValidationComponent;
  @ViewChild('passwordValidationConfirmPassword') passwordValidationConfirmPassword?: PasswordValidationComponent;

  @Output() closeChangePasswordModal: EventEmitter<boolean> = new EventEmitter<boolean>();

  public passwordForm!: UntypedFormGroup;
  public isShowCurrentPassword = false;
  public isShowNewPassword = false;
  public isShowConfirmPassword = false;
  public currentPasswordIsInvalid = false;

  @Input() updating?: number;
  @Input() isPasswordsSuccess$?: Observable<boolean>;
  @Output() updatePassword = new EventEmitter<IPasswordChangeCredentials>();

  private destroy$ = new Subject<void>();

  constructor(
    public config: NgbModalConfig,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platform: object,
    private fb: UntypedFormBuilder
  ) {
    config.backdrop = 'static';
    config.keyboard = false;
  }

  /**
   * Initializes verification form.
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

  closeModal() {
    this.passwordForm.reset();
    this.closeChangePasswordModal.emit(false);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
