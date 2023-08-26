import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators, AbstractControl, UntypedFormBuilder } from '@angular/forms';
import { AuthService } from '../auth.service';
import { IOptions, SettingsService } from '@acc/core/settings.service';
import { PasswordValidationComponent } from '@acc/common/components/password-validation/password-validation.component';
import { PopInNotificationConnectorService } from '@acc/common/components/pop-in-notifications/pop-in-notification-connector.service';
import { CONTACT_US_URL, EMAIL_REG_EXP, PASSWORD_REG_EXP, TERMS_OF_USE_URL } from '@acc/utils/constants.utils';
import { MustMatch } from '@acc/common/validators/must-match.validators';
import { Subject, throwError } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { INotification } from '@acc/common/components/pop-in-notifications/notification.model';
import { environment } from '@acc-envs/environment';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { DesignService } from '../../services/design.service';

/**
 * Sign Up component.
 */
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit, OnDestroy {
  @ViewChild('passwordFieldNewPassword') passwordFieldNewPassword?: PasswordValidationComponent;
  @ViewChild('passwordValidationConfirmPassword') passwordValidationConfirmPassword?: PasswordValidationComponent;
  isComingSoon?: boolean;
  comingSoon?: boolean;
  loading = false;
  signupError: string[] = [];
  currentYear: number = new Date().getFullYear();
  termsOfUseUrl = TERMS_OF_USE_URL;
  contactUs = CONTACT_US_URL;
  options!: IOptions;
  signUpForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_REG_EXP)]],
      given_name: ['', Validators.required],
      family_name: ['', Validators.required],
      // password: ['', [Validators.required, Validators.pattern(PASSWORD_REG_EXP)]],
      password: [''],
      // confirm_password: ['', [Validators.required, Validators.pattern(PASSWORD_REG_EXP)]],
      confirm_password: [''],
      locale: [null, Validators.required],
      zoneinfo: [null, Validators.required],
      agreed: ['', Validators.required]
    },
    { validator: MustMatch('password', 'confirm_password') }
  );
  signUpFormProd = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_REG_EXP)]],
    given_name: ['', Validators.required],
    family_name: ['', Validators.required],
    company_name: ['', Validators.required],
    locale: [null, Validators.required],
    recaptcha: ['']
  });
  isShowNewPassword = false;
  isShowConfirmPassword = false;
  isProd = environment.PRODUCTION;
  // showConfirmCode = false;

  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private settingsService: SettingsService,
    private notificationsService: PopInNotificationConnectorService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private designService: DesignService,
    private router: Router
  ) {}

  /**
   * Initializes signup form
   */
  ngOnInit(): void {
    if (!this.authService.signUpInfo.email || !this.authService.signUpInfo.pin) {
      this.router.navigate(['/login']);
    }

    setTimeout(() => {
      Array.prototype.slice.call(document.getElementsByTagName('ng-select')).map(item => {
        const suffix = item.id.slice(-4) || 'none';
        if (suffix === '_sel') {
          const autoComplete = item.id.substring(0, item.id.length - 4);
          item.getElementsByTagName('input')[0].setAttribute('id', autoComplete);
          item.getElementsByTagName('input')[0].setAttribute('name', autoComplete);
          item.getElementsByTagName('input')[0].setAttribute('autocomplete', autoComplete);
        } else {
          const autoComplete = 'nope';
          item.getElementsByTagName('input')[0].setAttribute('autocomplete', autoComplete);
        }
      });
    }, 1000);
    this.settingsService
      .profileOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => {
        this.options = options;

        const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
        const locale = navigator.language.split('-')[0];
        const userLocale = this.options.languages.find(lang => lang.id === locale);

        this.signUpForm.patchValue({ locale: userLocale?.id, zoneinfo: timeZone });
        this.signUpFormProd.patchValue({ locale: userLocale?.id });
      });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['coming_soon'] === undefined) {
        this.isComingSoon = false;
        this.isProd = environment.PRODUCTION && !params['preview'];
      } else {
        this.isComingSoon = true;
        this.comingSoon = params['coming_soon'] !== 'false';
        this.isProd = this.comingSoon;
      }
    });

    this.signUpForm.patchValue({ email: this.authService.signUpInfo.email });
  }

  /**
   * Helper for easy accessing form controls.
   */
  public control(control: string): AbstractControl {
    return (this.isProd ? this.signUpFormProd : this.signUpForm).get(control) as AbstractControl;
  }

  /**
   * Sign up user.
   */
  public signup(): void {
    this.loading = true;

    if (this.isProd) {
      const notification: INotification = this.notificationsService.addNotification({
        title: 'Notify Me'
      });

      this.recaptchaV3Service
        .execute('prospect')
        .pipe(takeUntil(this.destroy$))
        .subscribe(token => {
          if (token) {
            this.control('recaptcha').setValue(token);
          }
          this.authService
            .sendUsersNotification(this.signUpFormProd.value)
            .pipe(
              catchError(error => {
                let message =
                  error.error.error.message === 'Failed to create item. Condition failed or item already exist'
                    ? 'Failed to create. Account already exists.'
                    : error.error.error.message;

                if (this.isComingSoon && this.comingSoon) {
                  message = 'You are already on the list :)';
                }

                this.notificationsService.failed(notification, message);

                return throwError(error);
              }),
              finalize(() => (this.loading = false))
            )
            .subscribe(() => {
              if (this.isComingSoon && this.comingSoon) {
                this.notificationsService.ok(notification, 'You have been added to the list :)');
              } else {
                this.notificationsService.ok(notification, 'Sent successfully');
              }
            });
        });
    } else {
      const notification: INotification = this.notificationsService.addNotification({
        title: 'Creating account'
      });

      const data = {
        create_app: this.router.url.includes('?create_app=true'),
        email: this.signUpForm.value.email.trim(),
        family_name: this.signUpForm.value.family_name.trim(),
        given_name: this.signUpForm.value.given_name.trim(),
        locale: this.signUpForm.value.locale,
        zoneinfo: this.signUpForm.value.zoneinfo,
        pin: this.authService.signUpInfo.pin
      };
      // const username = {
      //   username: data.email
      // };

      this.authService
        .signup(data)
        .pipe(
          takeUntil(this.destroy$),
          catchError(response => {
            let error = response.error.error.message;

            if (error === 'EmailExistsException' || error === 'UsernameExistsException') {
              error = 'User already exists';

              if (this.isComingSoon && this.comingSoon) {
                error = 'You are already on the list :)';
              }
            }

            if (error === 'CodeInvalidException') {
              error = 'Wrong Pin';

              this.authService.signUpInfo.redirectToEnterCode = true;

              this.router.navigate(['/login']);
            }

            this.notificationsService.failed(notification, error);

            return throwError(error);
          }),
          finalize(() => {
            this.loading = false;

            this.designService.updateDesign();
          })
        )
        .subscribe(() => {
          if (this.isComingSoon && this.comingSoon) {
            this.notificationsService.ok(notification, 'You have been added to the list :)');
          } else {
            this.notificationsService.ok(notification, 'Account created');
          }

          // this.authService
          //   .login(this.control('email').value, this.control('password').value)
          //   .pipe(takeUntil(this.destroy$))
          //   .subscribe();

          // this.authService.sendPinCode(username).subscribe();
          // this.showConfirmCode = true;
        });
    }
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
            this.passwordFieldNewPassword?.checkRegularExpression(passwordType);
          }
          break;
        case 'confirmPassword':
          const isValidConfirmPassword = PASSWORD_REG_EXP.test(this.control('confirm_password').value);

          this.isShowConfirmPassword = isValidConfirmPassword ? false : true;
          break;
      }

      if (comparePasswords) {
        this.passwordValidationConfirmPassword?.checkRegularExpression(passwordType, true);
      } else {
        this.passwordValidationConfirmPassword?.checkRegularExpression(passwordType, false);
      }
    });
  }

  /**
   * Unsubscribe from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
