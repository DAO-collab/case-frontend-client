import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormGroup, UntypedFormBuilder, Validators, AbstractControl } from '@angular/forms';

import { throwError, Subject, Observable, Subscription } from 'rxjs';
import { catchError, takeUntil, tap, shareReplay, switchMap, finalize } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { ReCaptchaV3Service } from 'ng-recaptcha';

import { SupportService } from './support.service';
import { environment } from './../../../environments/environment';
import { EMAIL_REG_EXP } from '@acc/utils/constants.utils';
import { AuthService } from '../../auth/auth.service';

/**
 * Support component.
 */
@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit, AfterViewInit, OnDestroy {
  public signUpSuffix = environment.PRODUCTION ? 'true' : 'false';
  public RECAPTCHA_KEY: string = environment.RECAPTCHA_KEY;
  public loading = false;
  public supportError?: any[] = [];
  public message: string | undefined = '';

  public supportForm!: UntypedFormGroup;

  private destroy$ = new Subject<void>();
  private isLoggedIn$?: Subscription;
  private user$?: Subscription;

  constructor(
    private fb: UntypedFormBuilder,
    private supportService: SupportService,
    private cookies: CookieService,
    private router: Router,
    private recaptchaV3Service: ReCaptchaV3Service,
    private authService: AuthService
  ) {}

  /**
   * Initializes contact form.
   *
   * Listens to recaptcha actions.
   *
   * Sets language.
   */
  ngOnInit(): void {
    this.supportForm = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(5000)]],
      email: [null, [Validators.required, Validators.email, Validators.pattern(EMAIL_REG_EXP)]],
      family_name: [null, Validators.required],
      given_name: [null, Validators.required],
      recaptcha: [null, Validators.required],
      locale: [null, Validators.required]
    });

    this.recaptchaV3Service.onExecute.pipe(takeUntil(this.destroy$)).subscribe();

    const locale = this.cookies.get('locale') || 'en';

    this.supportForm.patchValue({ locale });
    this.isLoggedIn$ = this.authService.isLoggedIn$.subscribe(res => {
      if (res) {
        this.user$ = this.authService.getCurrentUser(true).subscribe(user => {
          this.supportForm.patchValue({
            given_name: user.given_name || null,
            family_name: user.family_name || null,
            email: user.email || null
          });
        });
      } else {
        this.supportForm.patchValue({
          given_name: null,
          family_name: null,
          email: null
        });
      }
    });
  }

  /**
   * Initializes recaptacha.
   */
  ngAfterViewInit(): void {
    this.checkRecaptcha('ticket')
      .pipe(takeUntil(this.destroy$))
      .subscribe(token => this.supportForm.patchValue({ recaptcha: token }));
  }

  /**
   * Executes recaptcha.
   */
  public checkRecaptcha(action: string): Observable<string> {
    return this.recaptchaV3Service.execute(action).pipe(
      tap(token => {
        if (token) {
          this.supportForm.patchValue({ recaptacha: token });
        }
      }),
      shareReplay()
    );
  }

  /**
   *  Sends ticket to support.
   */
  public submit(): void {
    this.loading = true;
    this.checkRecaptcha('ticket')
      .pipe(
        switchMap(() => this.supportService.sendSupportMessage(this.supportForm.value)),
        catchError(response => {
          this.loading = false;
          this.checkRecaptcha('ticket');
          this.supportError = response.error.error.errors;
          this.supportError?.map(err => {
            if (err['location'] === 'recaptcha') {
              err.message = 'Failed to validate if you are human';
            }
            return err;
          });

          return throwError(response);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe(data => {
        delete this.supportError;
        this.checkRecaptcha('ticket');
        this.message = data.message;
        this.router.navigate(['support/confirm-support']);
      });
  }

  /**
   * Helper for easy accessing form controls.
   */
  public control(control: string): AbstractControl {
    return this.supportForm.get(control) as AbstractControl;
  }

  /**
   * Unsubscribe from observables.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
    this.isLoggedIn$?.unsubscribe();
    this.user$?.unsubscribe();
  }
}
