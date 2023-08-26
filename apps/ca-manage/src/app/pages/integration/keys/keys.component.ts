import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { HostService } from '../../../services/host.service';
import { KeysService } from '../services/keys.service';
import { StylesService } from '../../../services/styles.service';
import { UtilsService } from './../../../services/utils.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { IKey } from '../models/key.model';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-keys',
  templateUrl: './keys.component.html',
  styleUrls: ['./keys.component.css']
})
export class KeysComponent extends UnsubscriptionHandler implements OnInit {
  loading = true;
  keys: IKey[] = [];
  editingKey?: IKey | null;
  activeKeyPopUp = false;
  activeSecretPopUp = false;
  formTouched = false;
  validationErrors: any[] = [];
  savingKey = false;
  secretKey = '';
  domainValues: { id: string; text: string }[] = [
    { id: 'app', text: 'app' },
    { id: 'manage', text: 'manage' }
  ];
  addKeyForm = this.fb.group({
    description: ['', Validators.required],
    active: false,
    source_cidr: [
      '',
      Validators.pattern(
        /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{3}|2[0-4][0-9]|25[0-5])(\/([0-9]{1,2}))$/
      )
    ],
    domain: ['', Validators.required]
  });
  startKey = '';

  constructor(
    private titleService: Title,
    private hostService: HostService,
    private keysService: KeysService,
    private stylesService: StylesService,
    private fb: UntypedFormBuilder,
    private notificationsService: PopInNotificationConnectorService,
    private utilsService: UtilsService
  ) {
    super();
  }

  ngOnInit() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.activeKeyPopUp) {
        this.refreshModal();
      }
    });

    this.titleService.setTitle(`${this.hostService.appName} | Keys`);

    this.keysService.activeKeyPopUp.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
      this.activeKeyPopUp = value;
      this.refreshModal(true);
    });

    this.fetchKeys();
  }

  fetchKeys() {
    this.keysService
      .fetchKeys()
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.loading = false))
      )
      .subscribe((res: any) => {
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        }
        this.keys = res.items;
      });
  }

  load_more() {
    this.keysService
      .fetchMoreKeys(this.startKey)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.loading = false))
      )
      .subscribe((res: any) => {
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        } else {
          this.startKey = '';
        }
        res.items.map((item: any) => {
          this.keys.push(item);
        });
      });
  }

  refreshModal(modalState?: boolean) {
    this.activeKeyPopUp = !!modalState;
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
    this.clearAddKeyModal();
  }

  refreshSecretModal(modalState: boolean) {
    this.activeSecretPopUp = !!modalState;
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
  }

  clearAddKeyModal() {
    this.addKeyForm.reset({ active: false });
    this.formTouched = false;
    this.savingKey = false;
    this.editingKey = null;
  }

  closeModal() {
    this.activeKeyPopUp = false;
    this.stylesService.popUpDisactivated();
    this.clearAddKeyModal();
    this.fetchKeys();
  }

  copySecretKey(inputElement: any) {
    const notification: Notification = this.notificationsService.addNotification({
      title: 'Secret Key copying'
    });
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
    this.notificationsService.ok(notification, 'Secret Key copied to your clipboard');
  }

  saveKey() {
    this.formTouched = true;

    if (this.addKeyForm.invalid) {
      return;
    }

    this.savingKey = true;
    let addKeyFormValue: any = this.utilsService.cleanObject(this.addKeyForm.value);

    if (this.editingKey) {
      const notification: Notification = this.notificationsService.addNotification({
        title: 'Key saving'
      });

      this.keysService
        .updateKey(this.editingKey?.asset_id!, addKeyFormValue)
        .pipe(
          takeUntil(this.unsubscribe$),
          finalize(() => this.closeModal())
        )
        .subscribe(
          () => this.notificationsService.ok(notification, 'Key saved'),
          () => this.notificationsService.failed(notification, 'Something went wrong')
        );
    } else {
      addKeyFormValue = {
        ...addKeyFormValue,
        ...(addKeyFormValue.source_cidr ? { source_cidr: addKeyFormValue.source_cidr } : {})
      };
      const notification: Notification = this.notificationsService.addNotification({
        title: 'Key adding'
      });

      this.keysService
        .saveKey(addKeyFormValue)
        .pipe(
          takeUntil(this.unsubscribe$),
          finalize(() => this.closeModal())
        )
        .subscribe(
          ({ token }) => {
            this.notificationsService.ok(notification, 'Key added');
            this.secretKey = token;
            this.refreshSecretModal(true);
          },
          ({ error }) => {
            const message = error.error.message === 'KeyLimitException' ? 'KeyLimitException' : 'Something went wrong';
            this.notificationsService.failed(notification, message);
          }
        );
    }
  }

  removeKey(keyId: string) {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Removing Key`
    });

    this.keysService
      .removeKey(keyId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.notificationsService.ok(notification, `Key removed`);
        this.fetchKeys();
      });
  }

  editKey(key: IKey) {
    this.refreshModal(true);
    this.editingKey = key;
    this.addKeyForm.patchValue(key);
  }
}
