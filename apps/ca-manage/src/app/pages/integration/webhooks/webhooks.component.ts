import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { HostService } from '../../../services/host.service';
import { StylesService } from '../../../services/styles.service';
import { UtilsService } from '../../../services/utils.service';
import { WebhooksService } from '../services/webhooks.service';
import { OptionsService } from '../../../services/options.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { IWebhook } from '../models/webhook.model';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-webhooks',
  templateUrl: './webhooks.component.html',
  styleUrls: ['./webhooks.component.css']
})
export class WebhooksComponent extends UnsubscriptionHandler implements OnInit {
  loading = true;
  webhooks: IWebhook[] = [];
  editingWebhook?: IWebhook | null;
  activeWebhookPopUp = false;
  activeSecretPopUp = false;
  formTouched = false;
  validationErrors: any[] = [];
  savingWebhook = false;
  secretWebhook = '';
  webhookEvents: any = {};
  webhookEventsOptions: { id: string; text: string }[] = [];
  addWebhookForm = this.fb.group({
    url: [
      '',
      [
        Validators.required,
        Validators.pattern(
          '^(http(s?):\\/\\/)' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$'
        )
      ]
    ],
    events: [[], Validators.required],
    description: '',
    active: false,
    source_cidr: [
      '',
      Validators.pattern(
        /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{3}|2[0-4][0-9]|25[0-5])(\/([0-9]{1,2}))$/
      )
    ]
  });
  startKey = '';

  constructor(
    private titleService: Title,
    private hostService: HostService,
    private webhooksService: WebhooksService,
    private stylesService: StylesService,
    private fb: UntypedFormBuilder,
    private notificationsService: PopInNotificationConnectorService,
    private utilsService: UtilsService,
    private optionsService: OptionsService
  ) {
    super();
  }

  ngOnInit() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.activeWebhookPopUp) {
        this.refreshModal();
      }
    });

    this.titleService.setTitle(`${this.hostService.appName} | Webhooks`);

    this.webhooksService.activeWebhookPopUp.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
      this.activeWebhookPopUp = value;
      this.refreshModal(true);
    });

    this.optionsService
      .webhookEventsList()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.webhookEvents = res;
        this.webhookEventsOptions = Object.keys(res).map(key => ({ id: key, text: res[key] }));
      });

    this.fetchWebhooks();
  }

  fetchWebhooks() {
    this.webhooksService
      .fetchWebhooks()
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.loading = false))
      )
      .subscribe((res: any) => {
        this.webhooks = res.items;
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        }
      });
  }

  load_more() {
    this.webhooksService
      .fetchMoreWebhooks(this.startKey)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.loading = false))
      )
      .subscribe((res: any) => {
        res.items.map((item: any) => {
          this.webhooks.push(item);
          if (res.startKey) {
            this.startKey = encodeURIComponent(res.startKey);
          } else {
            this.startKey = '';
          }
        });
      });
  }

  refreshModal(modalState?: boolean) {
    this.activeWebhookPopUp = !!modalState;
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
    this.clearAddWebhookModal();
  }

  refreshSecretModal(modalState: boolean) {
    this.activeSecretPopUp = !!modalState;
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
  }

  clearAddWebhookModal() {
    this.addWebhookForm.reset({ active: false });
    this.formTouched = false;
    this.savingWebhook = false;
    this.editingWebhook = null;
  }

  closeModal() {
    this.activeWebhookPopUp = false;
    this.stylesService.popUpDisactivated();
    this.clearAddWebhookModal();
    this.fetchWebhooks();
  }

  copySecretWebhook(inputElement: any) {
    const notification: Notification = this.notificationsService.addNotification({
      title: 'Secret Webhook copying'
    });
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
    this.notificationsService.ok(notification, 'Secret Webhook copied to your clipboard');
  }

  saveWebhook() {
    this.formTouched = true;

    if (this.addWebhookForm.invalid) {
      return;
    }

    this.savingWebhook = true;
    let addWebhookFormValue: any = this.utilsService.cleanObject(this.addWebhookForm.value);

    if (this.editingWebhook) {
      const notification: Notification = this.notificationsService.addNotification({
        title: 'Webhook saving'
      });

      this.webhooksService
        .updateWebhook(this.editingWebhook?.asset_id!, addWebhookFormValue)
        .pipe(
          takeUntil(this.unsubscribe$),
          finalize(() => this.closeModal())
        )
        .subscribe(
          () => this.notificationsService.ok(notification, 'Webhook saved'),
          () => this.notificationsService.failed(notification, 'Something went wrong')
        );
    } else {
      addWebhookFormValue = {
        ...addWebhookFormValue,
        ...(addWebhookFormValue.source_cidr ? { source_cidr: addWebhookFormValue.source_cidr } : {})
      };
      const notification: Notification = this.notificationsService.addNotification({
        title: 'Webhook adding'
      });

      this.webhooksService
        .saveWebhook(addWebhookFormValue)
        .pipe(
          takeUntil(this.unsubscribe$),
          finalize(() => this.closeModal())
        )
        .subscribe(
          ({ private_key }) => {
            this.notificationsService.ok(notification, 'Webhook added');
            this.secretWebhook = private_key;
            this.refreshSecretModal(true);
          },
          ({ error }) => {
            const message =
              error.error.message === 'WebhookLimitException' ? 'WebhookLimitException' : 'Something went wrong';
            this.notificationsService.failed(notification, message);
          }
        );
    }
  }

  removeWebhook(webhookId: string) {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Removing Webhook`
    });

    this.webhooksService
      .removeWebhook(webhookId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.notificationsService.ok(notification, `Webhook removed`);
        this.fetchWebhooks();
      });
  }

  editWebhook(webhook: IWebhook) {
    this.refreshModal(true);
    this.editingWebhook = webhook;
    this.addWebhookForm.patchValue(webhook);
  }
}
