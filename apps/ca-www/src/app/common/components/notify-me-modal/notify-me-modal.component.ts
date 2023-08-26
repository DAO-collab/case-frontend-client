import { Component, OnInit, OnDestroy } from '@angular/core';
import { Validators, UntypedFormGroup, UntypedFormBuilder, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { throwError, Subject, Observable } from 'rxjs';
import { EMAIL_REG_EXP } from '@www/shared/constants.utils';
import { catchError, takeUntil, shareReplay } from 'rxjs/operators';
import { UiService } from '@www/shared/ui.service';
import { CookieService } from 'ngx-cookie-service';

/**
 * Notify form component.
 */
@Component({
  selector: 'app-notify-me-modal',
  templateUrl: './notify-me-modal.component.html',
  styleUrls: ['./notify-me-modal.component.css']
})
export class NotifyMeModalComponent implements OnInit, OnDestroy {
  touchForm = false;
  notifyForm: UntypedFormGroup;
  isError = false;
  isSuccess = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: UntypedFormBuilder,
    private signUpService: AuthService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private uiService: UiService,
    private cookiesService: CookieService
  ) {}

  /**
   * Initializes notify form.
   *
   * Handles recaptcha.
   *
   * Handles modal.
   */
  ngOnInit(): void {
    this.notifyForm = this.fb.group({
      given_name: ['', Validators.required],
      family_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_REG_EXP)]],
      company_name: ['', Validators.required],
      recaptcha: [''],
      locale: this.cookiesService.get('locale') || 'en'
    });

    this.uiService.modalObservable.pipe(takeUntil(this.destroy$)).subscribe(showModal => {
      if (!showModal) {
        this.refreshModal(true);
        this.isSuccess = false;
      }
    });
  }

  /**
   * Sends notification.
   */
  sendNotification() {
    this.getRecaptcha('prospect')
      .pipe(takeUntil(this.destroy$))
      .subscribe(token => {
        if (token) {
          this.control('recaptcha').setValue(token);
        }
        this.signUpService
          .sendUsersNotification(this.notifyForm.getRawValue())
          .pipe(
            catchError(error => {
              this.isSuccess = false;
              this.refreshModal(false);
              return throwError(error);
            })
          )
          .subscribe(() => {
            this.isSuccess = true;
            this.refreshModal(true);
          });
      });
  }

  /**
   * Closes modal.
   */
  refreshModal(isRefresh: boolean, cancel?: boolean): void {
    if (isRefresh) {
      this.notifyForm.reset();
      this.touchForm = false;

      if (cancel) {
        this.uiService.managedSignUpPopUp(true);
      }
      this.isError = false;
    } else {
      this.isError = true;
      this.touchForm = true;
    }
  }

  /**
   * Executes recaptcha.
   */
  getRecaptcha(action: string): Observable<string> {
    return this.recaptchaV3Service.execute(action);
  }

  /**
   * Helper for easy accessing form controls.
   */
  private control(control: string): AbstractControl {
    return this.notifyForm.get(control);
  }

  /**
   * Unsubscribe from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
