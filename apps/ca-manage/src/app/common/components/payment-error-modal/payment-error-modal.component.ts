import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { catchError, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/index';

import { AppsService } from '../../../services/apps.service';
import { IApp } from '../../../interfaces/app.model';
import { environment } from '../../../../environments/environment';
import { UtilsService } from '../../../services/utils.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-payment-error-modal',
  templateUrl: './payment-error-modal.component.html',
  styleUrls: ['./payment-error-modal.component.css']
})
export class PaymentErrorModalComponent implements OnInit, OnDestroy {
  public app?: IApp;
  public card?: any;
  public cardHolder?: any;
  public cardBrand = '';
  public cardExpires = '';
  public isEdit = false;
  public environment = environment;
  public paymentSaving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private cd: ChangeDetectorRef,
    private appsService: AppsService,
    private notificationsService: PopInNotificationConnectorService,
    private utilsService: UtilsService
  ) {}

  ngOnInit(): void {
    this.appsService
      .getApps()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        const startIndex = window.location.href.indexOf('ca-');
        const endIndex = window.location.href.indexOf('.');
        const currentHost = window.location.href.slice(startIndex, endIndex);

        this.app = res.items.filter(item => item.host_id === currentHost)[0];

        this.appsService
          .getPaymentCard(this.app.host_id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(data => {
            if (data.square?.card) {
              this.cardHolder = data.square.card.cardholder_name;
              this.cardBrand = `${data.square.card.card_brand} ⋯ ${data.square.card.last_4}`;
              this.cardExpires = `Expires: ${data.square.card.exp_month}/${data.square.card.exp_year
                .toString()
                .substr(2, 2)}`;
              this.isEdit = true;
            } else {
              this.cardBrand = '';
              this.cardExpires = '';
              this.isEdit = false;

              this.cd.detectChanges();
              this.paymentLoad();
            }
          });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  private async paymentLoad() {
    if ((window as any).Square === undefined) {
      return;
    }

    if (!(window as any).Square) {
      throw new Error('Square.js failed to load properly');
    }

    let payments;

    try {
      payments = (window as any).Square.payments(environment.SQUARE_APPLICATION_ID, '');
    } catch (e) {
      console.error('Initializing Payment failed', e);
      return;
    }

    try {
      this.card = await this.initializeCard(payments);
    } catch (e) {
      console.error('Initializing Card failed', e);
      return;
    }
  }

  async initializeCard(payments: any) {
    const card = await payments.card();
    await card.attach('#card-container');
    return card;
  }

  async cardButtonClicked(hostId: string) {
    this.tokenize(this.card)
      .then(async () => {
        const isError = this.card?.errorList ? !!Array.from(this.card.errorList).length : true;
        if (!isError && this.cardHolder) {
          await this.handlePaymentMethodSubmission(event, this.card, hostId);
        }
      })
      .catch(e => {
        console.log('tokenize error');
      });
  }

  async tokenize(paymentMethod: any) {
    const tokenResult = await paymentMethod.tokenize();
    if (tokenResult.status === 'OK') {
      return tokenResult.token;
    } else {
      let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;

      if (tokenResult.errors) {
        errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
      }

      throw new Error(errorMessage);
    }
  }

  private async handlePaymentMethodSubmission(event: any, paymentMethod: any, hostId: string) {
    event.preventDefault();

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Saving Payment Card'
    });

    try {
      this.paymentSaving = true;
      const token = await this.tokenize(paymentMethod);
      const payload = {
        cardholder_name: this.cardHolder,
        token
      };

      this.appsService
        .updatePaymentCard((this.utilsService.cleanObject(payload) as any), hostId)
        .pipe(
          takeUntil(this.destroy$),
          catchError(res => {
            this.notificationsService.failed(notification, res.error.reason || res.error.message);
            return res.error;
          })
        )
        .subscribe(() => {
          this.appsService.showModal = false;
          this.notificationsService.ok(notification, 'Payment Card Saved');
        });
    } catch (e: any) {
      this.notificationsService.failed(notification, e.message);
    } finally {
      this.paymentSaving = false;
    }
  }

  public editPaymentClicked(event: any): void {
    event.preventDefault();

    this.isEdit = false;
    this.cd.detectChanges();
    this.paymentLoad();
  }

  public isCardInvalid(): boolean {
    return this.card?.errorList ? !!Array.from(this.card.errorList).length : true;
  }

  public backToPayment() {
    const endIndex = window.location.hostname.indexOf('.'),
      suffix = `?addPayment=${window.location.hostname.slice(3, endIndex)}`;

    location.href = environment.IS_LOCAL
      ? `http://localhost:4201/apps${suffix}`
      : `${environment.ACCOUNT_CLIENT_URL}/apps${suffix}`;
  }
}
