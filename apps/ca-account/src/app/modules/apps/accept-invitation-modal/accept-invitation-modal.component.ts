import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { combineLatest, Subject, throwError } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';

import { Stripe } from '@stripe/stripe-js';
import { StripeElements } from '@stripe/stripe-js/types/stripe-js/elements-group';

import { AppsService } from '@acc/modules/apps/apps.service';
import { SettingsService } from '@acc/core/settings.service';
import { UtilsService } from '../../../services/utils.service';
import { UserService } from '../../../services/user.service';
import { PopInNotificationConnectorService } from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';

import { HostUserType, IApp, IUserFields } from '../app.model';
import { INotification } from '../../../common/components/pop-in-notifications/notification.model';
import { environment } from '../../../../environments/environment';
import { LocalTranslationService } from '../../../core/local-translation.service';
import { StripeService } from '../../../services/stripe.service';

export enum SETTING_MODE {
  PAYMENT = 1,
  PERMISSION = 2,
  NOTIFICATIONS = 3,
  COMPANY_INFO = 4
}

/**
 * Accept app invitation modal.
 */
@Component({
  selector: 'app-accept-invitation-modal',
  templateUrl: './accept-invitation-modal.component.html',
  styleUrls: ['./accept-invitation-modal.component.css']
})
export class AcceptInvitationModalComponent implements OnInit, OnDestroy {
  @Input() app?: IApp;

  SETTING_MODE = SETTING_MODE;
  tabNumber = SETTING_MODE.COMPANY_INFO;
  userFields?: string[];
  acceptInvitationStatus = 1;
  revokeInvitationStatus = 0;
  environment = environment;
  card?: any;
  address?: string;
  cardHolder?: any;
  paymentSaving = false;
  HostUserType = HostUserType;
  cardBrand = '';
  cardExpires = '';
  isEdit = false;

  public display_notification = [
    {
      label: 'Posts',
      value: ['app_updated_feed']
    },
    {
      label: 'Forms',
      value: ['app_requested_forms', 'app_submission_forms']
    },
    {
      label: 'Signs',
      value: ['app_requested_signs', 'app_submission_signs']
    },
    {
      label: 'Invoices',
      value: ['app_requested_invoices', 'app_submission_invoices']
    },
    {
      label: 'Events',
      value: ['app_confirmation_events', 'app_submission_events']
    },
    {
      label: 'Tasks',
      value: ['app_requested_tasks', 'app_submission_tasks']
    }
  ];
  public notificationsValue?: { id: string; text: string }[];
  public notifications: string[] = [];
  public requestPaymentError = {
    show: false,
    errorMessage: ''
  };
  public paymentPlans: any[] = [];
  public planForm!: UntypedFormGroup;
  public planDefaultValue = 'free';

  private destroy$ = new Subject<void>();
  private stripe: any;
  private stripeElements?: StripeElements;
  public clientSecret?: string;

  constructor(
    public appsService: AppsService,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private utilsService: UtilsService,
    private settingsService: SettingsService,
    private notificationsService: PopInNotificationConnectorService,
    private userService: UserService,
    private localTranslationService: LocalTranslationService,
    private stripeService: StripeService
  ) {}

  /**
   * Initializes accept invitation fields.
   */
  ngOnInit(): void {
    this.planForm = this.fb.group({
      plan: [null, [Validators.required]]
    });

    this.settingsService
      .appPaymentPlans()
      .pipe(
        catchError(error => {
          return throwError(error);
        })
      )
      .subscribe(plans => {
        for (const [key, value] of Object.entries(plans)) {
          if (value.key !== this.planDefaultValue) {
            this.paymentPlans.push({ id: value.key, text: (value as any).text.name });
          }
        }

        // If there is no item selected for plan, ng-select says: no items found, even if there are items.
        // Next string fix this issue and update items
        this.paymentPlans = [...this.paymentPlans];
      });

    if (this.app?.host_granted_status !== 0) {
      if (this.appsService.selectedModalTab) {
        this.tabNumber = this.appsService.selectedModalTab;
        this.appsService.selectedModalTab = null;
      } else {
        this.tabNumber =
          (this.app?.host_user_type === HostUserType.Admin || this.app?.host_user_type === HostUserType.Manage) &&
          this.app.host_id === `ca-${this.route.snapshot.queryParamMap.get('addPayment')}`
            ? SETTING_MODE.PAYMENT
            : SETTING_MODE.COMPANY_INFO;
      }
    } else {
      this.tabNumber = SETTING_MODE.PERMISSION;
    }

    if (this.app?.host_user_type === HostUserType.Manage || this.app?.host_user_type === HostUserType.Admin) {
      combineLatest([
        this.stripeService.getStripe(this.app.host_id, true),
        this.stripeService.postStripe(this.app.host_id)
      ])
        .pipe(
          takeUntil(this.destroy$),
          tap(([getStripe, postStripe]) => {
            if (postStripe.client_secret) {
              this.clientSecret = postStripe.client_secret;
            }

            if (getStripe.billing_plan && getStripe.card) {
              this.planForm.patchValue({ plan: getStripe.billing_plan });
              this.isEdit = true;
              this.cardBrand = getStripe.card.card_brand.toUpperCase() + ' ... ' + getStripe.card.last_4;
              this.cardExpires = getStripe.card.exp_month + '/' + getStripe.card.exp_year;
            } else if (this.tabNumber === SETTING_MODE.PAYMENT) {
              this.loadStripe(postStripe.client_secret);
            }
          })
        )
        .subscribe();
    }

    this.settingsService
      .userFields()
      .pipe(takeUntil(this.destroy$))
      .subscribe((userFields: { [key: string]: string }) => { // IUserFields
        this.userFields = this.app?.require_userfields.map(userFieldKey => userFields[userFieldKey]);
      });

    this.userService
      .getOptionsServerOnly(['/notifications/all'], 'en')
      .subscribe(resp => (this.notificationsValue = resp[0]));

    this.appsService
      .findAllApps(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.notifications = [];

        res.forEach((app: IApp) => {
          if (app.host_id === this.app?.host_id && this.app?.host_revoked_notifications) {
            app.host_revoked_notifications.forEach(item => {
              this.notifications.push(item.notification);
            });
          }
        });
      });
  }

  public switchTabs(tab: number): void {
    this.tabNumber = tab;

    if (this.tabNumber === SETTING_MODE.PAYMENT && !this.planForm.value.plan) {
      this.loadStripe(this.clientSecret!);
    }
  }

  public editPaymentClicked(): void {
    this.isEdit = false;

    setTimeout(() => this.loadStripe(this.clientSecret!), 0);
  }

  /**
   *  Shows accept invitation pop-up.
   */
  public acceptAppInvitation(): void {
    this.appsService
      .acceptApp(this.app!.host_id, this.acceptInvitationStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appsService.acceptInvitationSubject.next(true);
        this.appsService.showModal = false;
      });
  }

  /**
   * Revoke app invitation.
   */
  public revokeAppInvitation(): void {
    this.appsService
      .acceptApp(this.app!.host_id, this.revokeInvitationStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appsService.acceptInvitationSubject.next(true);
        this.appsService.showModal = false;
      });
  }

  /**
   *  Close modal.
   */
  public closeModal(): void {
    this.appsService.showModal = false;
  }

  public showCheckedOrUnchecked(value: string) {
    let temp;

    this.notifications?.includes(value) ? (temp = false) : (temp = true);

    return temp;
  }

  public notificationUpdated(value: string) {
    if (this.notifications.includes(value)) {
      const index = this.notifications.findIndex(item => item === value);

      this.notifications.splice(index, 1);
    } else {
      this.notifications.push(value);
    }
  }

  public submitNotifications() {
    const hostRevokedNotifications: any[] = [];

    this.notifications.forEach(item => {
      const notificationData = {
        notification: item,
        reason: 'temporary'
      };

      hostRevokedNotifications.push(notificationData);
    });

    const data = {
      host_granted_status: this.app?.host_granted_status,
      host_revoked_notifications: hostRevokedNotifications
    };

    this.appsService
      .updateNotifications(this.app!.host_id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appsService.showModal = false;
      });
  }

  public async submitStripe(): Promise<any> {
    const elements = this.stripeElements;
    const { error } = await this.stripe.confirmSetup({
      elements,
      redirect: 'if_required'
      // confirmParams: {
      //   return_url: 'https://example.com/account/payments/setup-complete',
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
        .putStripe(this.app!.host_id, request)
        .pipe(
          takeUntil(this.destroy$),
          tap(() => {
            this.appsService.showModal = false;
            this.appsService.acceptInvitationSubject.next();
            this.notificationsService.ok(notification, 'Payment Saved');
          }),
          catchError(err => {
            this.notificationsService.failed(notification, 'Payment Error');

            return throwError(err);
          })
        )
        .subscribe();
    }
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

  /**
   * Unsubscribe from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
