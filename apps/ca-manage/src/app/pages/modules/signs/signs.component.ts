import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { catchError, takeUntil } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { SignsService, ISign } from '../../../services/signs.service';
import { RolesService } from '../../roles/services/roles.service';
import { StylesService } from '../../../services/styles.service';
import { HostService } from '../../../services/host.service';
import { CreateFormType } from '../../../services/forms.service';
import {
  PopInNotificationConnectorService,
  Notification
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { FeedPostStatus, IMediaItem, MediaStatus } from '../media/models/media.model';
import { FormModalMode } from '../../../common/components/form-modal/form-modal.component';

@Component({
  selector: 'app-signs',
  templateUrl: './signs.component.html',
  styleUrls: ['./signs.component.css']
})
export class SignsComponent extends UnsubscriptionHandler implements OnInit {
  public loading = true;
  public saving = false;
  public signs: ISign[] = [];
  public sign?: ISign | null;
  public shownPopUp = false;
  public openedId?: string;
  public createFormType?: CreateFormType;
  public formModalMode?: FormModalMode;
  public roles: any[] = [];
  public startKey = '';
  public showUploadModal = false;
  public uploadingForm?: any;
  public caseId: string = '';

  private rolesNamesById: any = {};

  constructor(
    private signsService: SignsService,
    private stylesService: StylesService,
    private rolesService: RolesService,
    private router: Router,
    private notificationsService: PopInNotificationConnectorService,
    private titleService: Title,
    private hostService: HostService
  ) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Library`);

    this.signsService.createSignModalState.pipe(takeUntil(this.unsubscribe$)).subscribe(e => {
      this.activateNewSignPopUp(e);
    });

    this.rolesService.getRoles().subscribe(({ items }) => {
      // this.roles = items.filter(v => v.role_id !== 'role::bots');
      this.roles = items;
      items.forEach((role: any) => (this.rolesNamesById[role.role_id] = role.name));
    });

    this.getSigns();
  }

  public getSigns() {
    this.signsService
      .getSigns()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((res: any) => {
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        }
        this.signs = res.items
          .map((item: any) => {
            item.status = FeedPostStatus.Ready;
            const mediaKeys = item.media ? Object.keys(item.media) : [];

            for (const key of mediaKeys) {
              if (item.media[key].ct) {
                for (const mediaItemKey of Object.keys(item.media[key].items)) {
                  item.status =
                    item.media[key].items[mediaItemKey].execution_status === MediaStatus.Failed
                      ? FeedPostStatus.Failed
                      : item.media[key].items[mediaItemKey].execution_status === MediaStatus.Running
                      ? FeedPostStatus.Processing
                      : FeedPostStatus.Ready;

                  if (item.status !== FeedPostStatus.Ready) break;
                }

                if (item.status !== FeedPostStatus.Ready) break;
              }
            }

            return item;
          })
          .sort((a: any, b: any) => +(new Date(a.updated_on) < new Date(b.updated_on)));

        this.loading = false;
      });
  }

  public load_more() {
    this.signsService
      .getMoreSigns(this.startKey)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe((res: any) => {
        if (res.startKey) {
          this.startKey = encodeURIComponent(res.startKey);
        } else {
          this.startKey = '';
        }
        res.items
          .map((item: any) => {
            item.status = FeedPostStatus.Ready;
            const mediaKeys = item.media ? Object.keys(item.media) : [];

            for (const key of mediaKeys) {
              if (item.media[key].ct) {
                for (const mediaItemKey of Object.keys(item.media[key].items)) {
                  item.status =
                    item.media[key].items[mediaItemKey].execution_status === MediaStatus.Failed
                      ? FeedPostStatus.Failed
                      : item.media[key].items[mediaItemKey].execution_status === MediaStatus.Running
                      ? FeedPostStatus.Processing
                      : FeedPostStatus.Ready;

                  if (item.status !== FeedPostStatus.Ready) break;
                }

                if (item.status !== FeedPostStatus.Ready) break;
              }
            }

            return this.signs.push(item);
          })
          .sort((a: any, b: any) => +(new Date(a.updated_on) < new Date(b.updated_on)));

        this.loading = false;
      });
  }

  openDocSignBuilder(form: any): void {
    this.router.navigate([`library/e-signs/doc-e-signs-builder/${form.asset_id}`]);
  }

  openUploadModal(form: any): void {
    this.showUploadModal = true;
    this.uploadingForm = form;
    this.stylesService.popUpActivated();
  }

  closeUploadModal(): void {
    this.stylesService.popUpDisactivated();
    this.showUploadModal = false;
  }

  public openSignBuilder(form: any) {
    // if (!form.media_ct && form.type === CreateFormType.FileUpload) {
    //   this.openUploadModal(form);
    // } else {
    switch (form.type) {
      case CreateFormType.FormBuilder:
        this.router.navigate([`library/e-signs/e-signs-builder/${form.asset_id}`]);
        break;

      case CreateFormType.FileUpload:
        this.router.navigate([`library/e-signs/doc-e-signs-builder/${form.asset_id}`]);
        break;
    }
    // }
  }

  public activateNewSignPopUp(docType: CreateFormType) {
    this.openedId = '';
    this.sign = null;
    this.createFormType = docType;
    this.formModalMode = FormModalMode.Create;
    this.shownPopUp = true;
    this.stylesService.popUpActivated();
  }

  public editSign(sign: ISign) {
    this.openedId = sign.asset_id;
    this.sign = sign;
    this.formModalMode = FormModalMode.Edit;
    this.shownPopUp = true;
    this.stylesService.popUpActivated();
  }

  public cancelAddingSign() {
    this.shownPopUp = false;
    this.stylesService.popUpDisactivated();
  }

  saveNewSign(formValue: ISign) {
    const notification: Notification = this.notificationsService.addNotification({
      title: ''
    });
    if (!this.openedId) {
      notification.title = 'Sign creating ';

      if (formValue.notifications && formValue.notifications.names && formValue.notifications.names.length === 0) {
        delete formValue.notifications;
      }

      this.signsService
        .createSign(formValue)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.notificationsService.failed(notification, res.message);
            return throwError(res.error);
          })
        )
        .subscribe(res => {
          this.notificationsService.ok(notification, ' Sign created ');
          if (this.createFormType == CreateFormType.FileUpload) {
            this.router.navigate([`library/e-signs/doc-e-signs-builder/${res.asset_id}`]);
          } else if (this.createFormType == CreateFormType.FormBuilder) {
            this.router.navigate([`library/e-signs/e-signs-builder/${res.asset_id}`]);
          }
          this.stylesService.popUpDisactivated();
        });
    } else {
      notification.title = 'Sign updating ';

      if (formValue.notifications && formValue.notifications.names && formValue.notifications.names.length === 0) {
        formValue.notifications = null as any;
      }

      this.signsService
        .updateForm(formValue, this.openedId)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(
          () => {
            this.notificationsService.ok(notification, ' Sign updated ');
            this.saving = false;
            this.getSigns();
            this.cancelAddingSign();
            this.stylesService.popUpDisactivated();
          },
          err => this.notificationsService.failed(notification, err.message)
        );
    }
  }

  public deleteSign(signs: ISign[], index: number) {
    const sign = signs[index];
    const removedSign: any = signs.splice(index, 1);

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Removing sign '
    });

    this.signsService
      .deleteSign(sign.asset_id!)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          signs.unshift(removedSign);
          return throwError(res.error);
        })
      )
      .subscribe(() => this.notificationsService.ok(notification, ' Form removed'));
  }

  public normilizeRolesList = (permissions: any) =>
    permissions ? permissions.map((v: any) => this.rolesNamesById[v]).join(', ') : 'All';
}
