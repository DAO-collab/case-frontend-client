import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormBuilder } from '@angular/forms';
import { Subject, throwError } from 'rxjs';
import { takeUntil, catchError, finalize, tap } from 'rxjs/operators';

import { AuthService } from '../auth.service';
import { CONTACT_US_URL, TERMS_OF_USE_URL } from '@acc/utils/constants.utils';
import { AppsService } from '../../modules/apps/apps.service';
import { DesignService } from '../../services/design.service';

export enum UsernameType {
  Email = 'email',
  Phone = 'phone'
}

/**
 * Log In component.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('usernameTypesMenu', { static: true }) usernameTypesMenu?: ElementRef;
  @ViewChild('usernameTypesMenuToggle', { static: true }) usernameTypesMenuToggle?: ElementRef;

  public loading = false;
  public message = '';
  public signInError: string[] = [];
  public currentYear: number = new Date().getFullYear();
  public termsOfUseUrl = TERMS_OF_USE_URL;
  public contactUs = CONTACT_US_URL;
  public showUsernameTypeFilter = false;
  public usernameType = UsernameType.Email;
  public UsernameType = UsernameType;
  public form!: UntypedFormGroup;
  public showConfirmCode = false;
  public saveButtonPressed = false;

  private destroy$ = new Subject<void>();
  private rendererListenerFn?: () => void;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private renderer: Renderer2,
    private fb: UntypedFormBuilder,
    private appsService: AppsService,
    private designService: DesignService
  ) {}

  /**
   * Initializes login form
   */
  ngOnInit(): void {
    const startString = 'ca-';
    const startIndex = this.router.url.indexOf(startString);
    const appDataFromRout = this.router.url.slice(startIndex, this.router.url.length);

    appDataFromRout.includes(startString) && !this.route.snapshot.queryParams['redirectApp']
      ? (this.appsService.joinAppModalData = appDataFromRout.slice(3, appDataFromRout.length))
      : this.designService.updateDesign();

    this.appsService.isLogInOrSignUp.next(true);

    this.form = this.fb.group({
      username: ['', Validators.compose([Validators.required, this.emailOrPhoneValidator])]
    });

    this.form
      .get('username')
      ?.valueChanges.pipe(tap(value => this.form.get('username')?.setValue(value.toLowerCase(), { emitEvent: false })))
      .subscribe();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.message = params['message'];
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

    if (this.authService.signUpInfo.redirectToEnterCode) {
      this.form.value.username = this.authService.signUpInfo.email;
      this.showConfirmCode = true;
      this.authService.signUpInfo.redirectToEnterCode = false;
    }
  }

  /**
   * Logs in user.
   */
  public login(): void {
    this.saveButtonPressed = true;
    this.loading = true;

    const username = {
      username: this.form.value.username.trim()
    };

    this.authService
      .sendPinCode(username)
      .pipe(
        catchError(response => {
          if (response && response.error && response.error.error) {
            this.signInError = response.error.error.errors || [response.error.error];
          }

          if (response.error.error.message === 'SsoDomainPassThroughRequiredErrorException') {
            const startIndex = username.username.indexOf('@') + 1;
            const domainName = username.username.slice(startIndex);

            this.router.navigate([`/sso/${domainName}`]).then();
          }

          this.showConfirmCode = false;
          this.loading = false;
          return throwError(response);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe(res => {
        this.authService.signUpInfo.sessionType = res.data.otp_type;
        this.showConfirmCode = true;

        if (this.authService.signUpInfo.sessionType === 'signup') {
          this.authService.signUpInfo.email = this.form.value.username.trim();
        }
      });
  }

  public backToEmailEvent() {
    this.showConfirmCode = false;
  }

  private emailOrPhoneValidator(control: UntypedFormControl): { [key: string]: boolean } | null {
    const validPhoneRegexp = /^(?!0+$)(?:\(?\+\d{1,3}\)?[- ]?|0)?\d{10}$/;
    const emailRegexp =
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    if (control.value && !emailRegexp.test(control.value) && !validPhoneRegexp.test(control.value)) {
      return { invalidEmailOrPhoneValue: true };
    }
    return null;
  }

  /**
   * Unsubscribe from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
