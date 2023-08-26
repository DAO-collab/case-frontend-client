import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AccountService } from '../../profile/account.service';
import { AppsService } from '../apps.service';
import { PopInNotificationConnectorService } from '@acc/common/components/pop-in-notifications/pop-in-notification-connector.service';
import { LocalTranslationService } from '@acc/core/local-translation.service';
import { CacheService } from '@acc/core/cache/cache.service';
import { INotification } from '@acc/common/components/pop-in-notifications/notification.model';
import { SettingsService } from '@acc/core/settings.service';
import { IApp } from '../app.model';
import { environment } from '../../../../environments/environment';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-create-app',
  templateUrl: './create-app.component.html',
  styleUrls: ['./create-app.component.css']
})
export class CreateAppComponent implements OnInit {
  @ViewChild('cardholderElement', { static: false }) set content(content: ElementRef) {
    // initially setter gets called with undefined
    if (content) {
      this.cardholderElement = content;

      this.paymentLoad(this.cardholderElement.nativeElement.id);
    }
  }

  public newAppForm?: FormGroup;
  public creatingApp = false;
  public createAppError: string[] = [];
  public loading = false;
  public paymentPlans: any[] = [];
  public isCustomCreateApp = false;
  public value = '';

  public app?: IApp;
  public card?: any;
  public cardHolder?: any;
  public cardBrand = '';
  public cardExpires = '';
  public isEdit = false;
  public environment = environment;
  public paymentSaving = false;
  public host_id = '';
  // temporary
  public message?: string;
  public tabNumber = 0;
  public planForm?: FormGroup;
  public planDefaultValue = 'free';

  private cardholderElement?: ElementRef;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private appsService: AppsService,
    private notificationsService: PopInNotificationConnectorService,
    private errorDictionary: LocalTranslationService,
    private cache: CacheService,
    private settingsService: SettingsService,
    private cd: ChangeDetectorRef,
    private utilsService: UtilsService
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
          if ((value as any).key !== this.planDefaultValue) {
            this.paymentPlans.push({ id: (value as any).key, text: (value as any).text.name });
          }
        }
      });
  }

  /**
   * Creates new application.
   */
  public createApp(): void {
    const notification: INotification = this.notificationsService.addNotification({
      title: `Creating app `
    });
    const data = {
      company: this.newAppForm?.value.company.trim(),
      website: this.newAppForm?.value.website.trim()
    };

    this.creatingApp = true;

    this.appsService
      .createApp(data)
      .pipe(
        catchError(response => {
          this.errorDictionary.showError(notification?.text!).then((r: string) => {
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
      });
  }

  public addPaymentToApp() {
    const notification: INotification = this.notificationsService.addNotification({ title: `Adding Payment` });

    this.tokenize(this.card)
      .then(async () => {
        const isError = this.card?.errorList ? !!Array.from(this.card.errorList).length : true;
        if (!isError && this.cardHolder) {
          await this.handlePaymentMethodSubmission(this.card, this.host_id, notification);
        }
      })
      .catch(e => {
        console.log('tokenize error');
      });
  }

  public chooseSubmitRequest() {
    switch (this.tabNumber) {
      case 0:
        this.createApp();
        break;
      case 1: {
        this.hideCardField() ? this.handleFreePlanSubmission() : this.addPaymentToApp();
        break;
      }
      default:
        break;
    }
  }

  private async paymentLoad(paymentCard: any) {
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
      this.card = await this.initializeCard(payments, paymentCard);
    } catch (e) {
      console.error('Initializing Card failed', e);
      return;
    }
  }

  async initializeCard(payments: any, paymentCard: any) {
    const card = await payments.card();
    await card.attach('#' + paymentCard);
    return card;
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

  private handleFreePlanSubmission() {
    const notification: INotification = this.notificationsService.addNotification({ title: `Adding Payment` });

    try {
      this.paymentSaving = true;

      const payload = { plan: this.planForm?.value.plan };

      this.appsService
        .updatePaymentCard(this.utilsService.cleanObject(payload), this.host_id)
        .pipe(
          catchError(error => {
            this.notificationsService.failed(notification, 'Payment Error');

            return throwError(error);
          })
        )
        .subscribe(() => {
          this.notificationsService.ok(notification, 'Payment Added');
          this.router.navigate(['apps'], { queryParams: { creatingApp: true } });
        });
    } catch (error) {
      this.notificationsService.failed(notification, 'Payment Error');
    } finally {
      this.paymentSaving = false;
    }
  }

  private async handlePaymentMethodSubmission(paymentMethod: any, hostId: string, notification: any) {
    try {
      this.paymentSaving = true;

      const token = await this.tokenize(paymentMethod);
      const payload = {
        plan: this.planForm?.value.plan,
        card: {
          cardholder_name: this.cardHolder,
          token
        }
      };

      this.appsService
        .updatePaymentCard(this.utilsService.cleanObject(payload), hostId)
        .pipe(
          catchError(error => {
            this.notificationsService.failed(notification, 'Payment Error');

            return throwError(error);
          })
        )
        .subscribe(() => {
          this.notificationsService.ok(notification, 'Payment Added');
          this.router.navigate(['apps'], { queryParams: { creatingApp: true } });
        });
    } catch (error) {
      this.notificationsService.failed(notification, 'Payment Error');
    } finally {
      this.paymentSaving = false;
    }
  }

  public editPaymentClicked(event: Event): void {
    event.preventDefault();

    this.isEdit = false;
    this.cd.detectChanges();
    this.paymentLoad(this.cardholderElement?.nativeElement.id);
  }

  public isCardInvalid(): boolean {
    return this.card?.errorList ? !!Array.from(this.card.errorList).length : true;
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

  public hideCardField(): boolean {
    return this.planForm?.value.plan === this.planDefaultValue;
  }

  public disableCardSubmitButton(): boolean {
    if (this.planForm?.value.plan === this.planDefaultValue) {
      return false;
    } else {
      return this.planForm?.value.plan !== this.planDefaultValue && !this.cardHolder;
    }
  }
}
