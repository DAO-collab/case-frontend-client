import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, takeUntil, tap } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';

import { StripeElements } from '@stripe/stripe-js/types/stripe-js/elements-group';
import { Stripe } from '@stripe/stripe-js';

import { AccountService } from '../../profile/account.service';
import { AppsService } from '../apps.service';
import { PopInNotificationConnectorService } from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { LocalTranslationService } from '../../../core/local-translation.service';
import { CacheService } from '../../../core/cache/cache.service';
import { SettingsService } from '../../../core/settings.service';
import { UtilsService } from '../../../services/utils.service';
import { INotification } from '../../../common/components/pop-in-notifications/notification.model';
import { environment } from '../../../../environments/environment';
import { StripeService } from '../../../services/stripe.service';

@Component({
  selector: 'app-create-app-modal',
  templateUrl: './create-app-modal.component.html',
  styleUrls: ['./create-app-modal.component.css']
})
export class CreateAppModalComponent implements OnInit, OnDestroy {
  @ViewChild('cardholderElement', { static: false }) set content(content: ElementRef) {
    // initially setter gets called with undefined
    if (content) {
      this.cardholderElement = content;

      // this.paymentLoad(this.cardholderElement.nativeElement.id);
    }
  }

  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();

  public newAppForm!: UntypedFormGroup;
  public creatingApp = false;
  public createAppError: string[] = [];
  public loading = false;
  public paymentPlans: { id: string; text: string }[] = [];
  public isCustomCreateApp = false;
  public value = '';

  public card?: any;
  public cardHolder?: any;
  public cardBrand = '';
  public cardExpires = '';
  public isEdit = false;
  public paymentSaving = false;
  public host_id = '';
  public message?: string;
  public tabNumber = 0;
  public planForm!: UntypedFormGroup;
  public planDefaultValue = 'free';

  private cardholderElement?: ElementRef;
  private stripe: any;
  private stripeElements?: StripeElements;
  private clientSecret?: string;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private appsService: AppsService,
    private notificationsService: PopInNotificationConnectorService,
    private errorDictionary: LocalTranslationService,
    private cache: CacheService,
    private settingsService: SettingsService,
    private utilsService: UtilsService,
    private stripeService: StripeService
  ) {}

  /**
   * Initializes new app data form.
   */
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isCustomCreateApp = params['creatingApp'] || false;
    });

    this.planForm = this.fb.group({
      plan: [null, [Validators.required]]
    });

    this.newAppForm = this.fb.group({
      company: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9 ]*')]],
      website: [
        '',
        [
          Validators.required,
          Validators.pattern(
            '^(https://|http://)' +
              '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
              '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
              '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
              '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
              '(\\#[-a-z\\d_]*)?' +
              '(\\s*)?$'
          )
        ]
      ]
    });

    this.loading = true;

    this.settingsService
      .appPaymentPlans()
      .pipe(
        catchError(error => {
          this.loading = false;
          return throwError(error);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe(plans => {
        for (const [key, value] of Object.entries(plans)) {
          if (value.key !== this.planDefaultValue) {
            this.paymentPlans.push({ id: value.key, text: (value as any).text.name });
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Creates new application.
   */
  public createApp(): void {
    const notification: INotification = this.notificationsService.addNotification({
      title: `Creating app `
    });
    const data = {
      company: this.newAppForm.value.company.trim(),
      website: this.newAppForm.value.website.trim()
    };

    this.creatingApp = true;

    this.appsService
      .createApp(data)
      .pipe(
        catchError(response => {
          this.errorDictionary.showError(notification.text!).then((r: string) => {
            notification.text = r;
          });

          this.notificationsService.failed(notification, response.error.error.errors[0].message);
          this.creatingApp = false;

          return throwError(response);
        })
      )
      .subscribe(res => {
        this.cache.delete(res.selfLink);
        this.notificationsService.ok(notification, 'App created');
        this.appsService.acceptInvitationSubject.next(true);
        this.host_id = res.host_id;
        this.creatingApp = false;
        this.tabNumber++;

        this.addPayment();
      });
  }

  public chooseSubmitRequest() {
    switch (this.tabNumber) {
      case 0:
        this.createApp();
        break;
      case 1:
        this.submitStripe();
        break;
      default:
        break;
    }
  }

  public editPaymentClicked(): void {
    this.isEdit = false;

    setTimeout(() => this.loadStripe(this.clientSecret!), 0);
  }

  /**
   * Cancels creating app.
   */
  public notInterested(): void {
    if (this.isCustomCreateApp) {
      this.accountService
        .deleteValuesByAttributeNames(['meta.create_app'])
        .pipe(
          catchError(e => {
            const jsn = e.json();
            this.createAppError = jsn.data && jsn.data.error.errors;
            return throwError(e);
          })
        )
        .subscribe();
    }
    this.router.navigate(['apps'], { queryParams: { creatingApp: false } });
  }

  prependProtocol(event: any): void {
    if (!this.value.includes('https://') && !this.value.includes('http://') && event.target.value.length > 0) {
      this.value = 'https://' + this.value;
    }
  }

  // public hideCardField(): boolean {
  //   return this.planForm.value.plan === this.planDefaultValue;
  // }
  //
  // public disableCardSubmitButton(): boolean {
  //   if (this.planForm.value.plan === this.planDefaultValue) {
  //     return false;
  //   } else {
  //     return this.planForm.value.plan !== this.planDefaultValue && !this.cardHolder;
  //   }
  // }

  public close(): void {
    this.closeModal.next();
  }

  private async submitStripe(): Promise<any> {
    const elements = this.stripeElements;
    const { error } = await this.stripe.confirmSetup({
      elements,
      redirect: 'if_required'
      // confirmParams: {
      //   return_url: '',
      // }
    });

    if (error) {
      const messageContainer = document.querySelector('#error-message');
      messageContainer!.textContent = error.message;
    } else {
      this.paymentSaving = true;

      const request = { plan: this.planForm.value.plan };
      const notification: INotification = this.notificationsService.addNotification({
        title: 'Saving Payment Card'
      });

      this.stripeService
        .putStripe(this.host_id, request)
        .pipe(
          takeUntil(this.destroy$),
          catchError(err => {
            this.notificationsService.failed(notification, 'Payment Error');

            return throwError(err);
          }),
          tap(() => {
            this.notificationsService.ok(notification, 'Payment Saved');
            this.appsService.showModal = false;

            this.appsService.acceptInvitationSubject.next();
            this.router.navigate(['apps'], { queryParams: { creatingApp: true } });
          })
        )
        .subscribe();
    }
  }

  private addPayment(): void {
    this.stripeService
      .postStripe(this.host_id)
      .pipe(
        takeUntil(this.destroy$),
        tap(res => this.loadStripe(res.client_secret))
      )
      .subscribe();
  }

  private loadStripe(clientSecret: string): void {
    // @ts-ignore
    this.stripe = Stripe(environment.STRIPE_PUBLIC_API_KEY);

    const options = {
      clientSecret,
      appearance: {
        variables: {
          colorText: '#667074',
          fontFamily: 'Proxima, Arial, Helvetica, sans-serif',
          borderRadius: '4px',
          fontSizeBase: '14px',
          fontSizeSm: '14px',
          focusBoxShadow: '0 0 5px #16b0c5',
          colorIconTabSelected: '#16B0C5',
          colorPrimary: '#16B0C5',
          colorBackground: '#F8FAFB'
        },
        rules: {
          '.Input:focus': {
            border: '1px solid #16B0C5'
          },
          '.Tab--selected': {
            border: '1px solid #16B0C5',
            boxShadow: '0 0 5px #16b0c5'
          },
          '.TabIcon--selected': {
            color: '#16B0C5'
          },
          '.TabLabel--selected': {
            color: '#16B0C5'
          }
        }
      }
    };

    this.stripeElements = this.stripe.elements(options as any);

    const paymentElement = this.stripeElements?.create('payment' as any);

    paymentElement?.mount('#payment-element');
  }
}
