import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  EventEmitter,
  Output,
  Renderer2,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { AccountService } from '../account.service';
import { NgbModalConfig, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { PopInNotificationConnectorService } from '@acc/common/components/pop-in-notifications/pop-in-notification-connector.service';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { ContactDetailsType } from '../user-contact-details.model';
import { catchError } from 'rxjs/operators';
import { IUser } from '@acc/core/user.model';
import { INotification } from '@acc/common/components/pop-in-notifications/notification.model';
import { IApiResponse } from '@acc/core/api-response.model';

/**
 * Verification modal component.
 */
@Component({
  selector: 'app-verify-modal',
  templateUrl: './verify-modal.component.html',
  styleUrls: ['./verify-modal.component.css']
})
export class VerifyModalComponent implements OnInit {
  private modalRef?: NgbModalRef;

  @ViewChild('contents', { static: true }) content?: ElementRef;
  @Output() success: EventEmitter<boolean> = new EventEmitter<boolean>();

  public modalType!: string;
  public verifyError: string[] = [];
  public verifying = false;
  public resending = false;
  public verificationForm!: UntypedFormGroup;
  public showResendCode = false;

  private profile!: IUser;
  private onSaveAction?: (() => void) | null;
  private triggerGettingUserAction?: (() => void) | null;

  constructor(
    private notificationsService: PopInNotificationConnectorService,
    private accountService: AccountService,
    public config: NgbModalConfig,
    private modalService: NgbModal,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platform: object
  ) {
    config.backdrop = 'static';
    config.keyboard = false;
  }

  /**
   * Initializes verification form.
   */
  ngOnInit(): void {
    this.verificationForm = new UntypedFormGroup({
      code: new UntypedFormControl({ value: '', disabled: this.verifying }, [
        Validators.required,
        Validators.pattern('^\\d+$')
      ])
    });
  }

  /**
   * Cancels current action.
   */
  public later(): void {
    this.verificationForm.reset();
    this.modalRef?.dismiss();
    this.updateUser();
  }

  /**
   * Force update user.
   */
  public updateUser(): void {
    if (typeof this.triggerGettingUserAction === 'function') {
      this.triggerGettingUserAction();
      this.triggerGettingUserAction = null;
    }
  }

  /**
   * Submits verification code.
   */
  public onSubmit(): void {
    if (this.verificationForm.invalid) {
      return;
    }

    const code = this.verificationForm.get('code')?.value;

    this.verifying = true;

    const notification: INotification = this.notificationsService.addNotification({
      title: `Verifying `
    });

    this.accountService
      .verifyCode(this.modalType, code)
      .pipe(
        catchError(response => {
          let error = response.error.error.message;
          if (error === 'CodeInvalidException') {
            error = 'Incorrect verify code';
          }
          this.notificationsService.failed(notification, error);
          this.verifying = false;

          return throwError(response);
        })
      )
      .subscribe(data => {
        this.notificationsService.ok(notification, data.message);

        this.verifyError = [];

        setTimeout(() => {
          this.later();

          setTimeout(() => {
            if (typeof this.onSaveAction === 'function') {
              this.onSaveAction();
              this.onSaveAction = null;
            } else {
              this.modalRef?.close();
            }
          }, 300);
        }, 300);

        this.verifying = false;
        this.success.emit(true);
      });
  }

  /**
   * Resends verification code.
   */
  public resendCode(): void {
    const type = this.modalType.toLowerCase();
    let observable$: Observable<IApiResponse>;

    if (!(type === ContactDetailsType.Email || type === ContactDetailsType.Phone)) {
      throw new Error('Verification type should ether email or phone, got:' + type);
    }

    if (type === ContactDetailsType.Email) {
      observable$ = this.accountService.saveContact(
        'email',
        this.profile.private.email_reset?.alias ?? this.profile.email
      );
    } else if (type === ContactDetailsType.Phone) {
      observable$ = this.accountService.saveContact(
        'phone',
        this.profile.private.phone_reset?.alias ?? this.profile.phone
      );
    }

    this.resending = true;

    observable$!
      .pipe(
        catchError(err => {
          this.verifyError = err.data.error.errors;
          this.resending = false;

          return throwError(err);
        })
      )
      .subscribe(() => {
        this.resending = false;
      });
  }

  /**
   * Opens modal.
   */
  public open(content: any): void {
    const data = content();

    this.profile = data.profile;
    // if (this.profile.private.email_reset || this.profile.private.phone_reset) {
    this.showResendCode = true;
    // }

    this.modalType = data.modalType;
    this.modalRef = this.modalService.open(this.content);
    this.onSaveAction = data.onsave;
    this.triggerGettingUserAction = data.getCurrentUser;

    setTimeout(() => {
      if (isPlatformBrowser(this.platform)) {
        const modalBody = this.document.querySelector('ngb-modal-window');
        const backDrop = this.document.querySelector('ngb-modal-backdrop');

        this.renderer.addClass(modalBody, 'ca-popup');
        this.renderer.addClass(modalBody, 'fade-in');
        this.renderer.addClass(modalBody, 'show-modal');
        this.renderer.addClass(backDrop, 'in');
      }
    });
  }
}
