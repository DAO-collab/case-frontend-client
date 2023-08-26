import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Observable, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { FormsService, IForm } from '../../../services/forms.service';
import { StylesService } from '../../../services/styles.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { HostService } from '../../../services/host.service';
import { RolesService } from '../../roles/services/roles.service';
import { FeedPostStatus, MediaStatus } from '../media/models/media.model';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { IntakeFormsService, CreateFormType } from '../../../services/intake-forms.service';
import { FormModalMode } from './intake-modal/intake-modal.component';

@Component({
  selector: 'app-intake-forms',
  templateUrl: './intake-forms.component.html',
  styleUrls: ['./intake-forms.component.css']
})
export class IntakeFormsComponent extends UnsubscriptionHandler implements OnInit {
  public loading = true;
  public saving = false;
  public forms: IForm[] = [];
  public form?: IForm | null;
  public shownPopUp = false;
  public openedId?: string;
  public createFormType?: CreateFormType;
  public formModalMode?: FormModalMode;
  public roles$?: Observable<any>;
  public roles: any[] = [];
  public startKey = '';
  public showUploadModal = false;
  public uploadingForm?: any;
  public caseId: string = '';

  constructor(
    private formsService: FormsService,
    private stylesService: StylesService,
    private router: Router,
    private notificationsService: PopInNotificationConnectorService,
    private titleService: Title,
    private hostService: HostService,
    private rolesService: RolesService,
    private intakeFormsService: IntakeFormsService
  ) {
    super();
    this.rolesService
      .getRoles()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(value => {
        this.roles = value.items.filter(v => v.role_id !== 'role::bots');
      });
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Library`);

    this.roles$ = this.rolesService.getRoles();

    this.intakeFormsService.activateFormModal
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(value => this.activateNewFormPopUp(value));

    this.getForms();
  }

  public getForms() {
    this.intakeFormsService
      .getIntakesForm()
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe(res => {
        if (res.items?.length) {
          if (res?.startKey) {
            this.startKey = encodeURIComponent(res.startKey);
          }

          this.forms = res?.items
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

                    if (item.status !== FeedPostStatus.Ready) {
                      break;
                    }
                  }

                  if (item.status !== FeedPostStatus.Ready) {
                    break;
                  }
                }
              }

              return item;
            })
            .sort((a: any, b: any) => +(new Date(a.updated_on) < new Date(b.updated_on)));
        } else {
          this.forms = [];
        }

        this.loading = false;
      });
  }

  public load_more() {
    this.formsService
      .getMoreForms(this.startKey)
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

                  if (item.status !== FeedPostStatus.Ready) {
                    break;
                  }
                }

                if (item.status !== FeedPostStatus.Ready) {
                  break;
                }
              }
            }

            return this.forms.push(item);
          })
          .sort((a: any, b: any) => +(new Date(a.updated_on) < new Date(b.updated_on)));

        this.loading = false;
        console.log('forms =>', this.forms);
      });
  }

  openDocIntakeBuilder(form: any): void {
    this.router.navigate([`settings/intake-forms/doc-form-builder/${form.asset_id}`]);
  }

  public openFormBuilder(form: any) {
    if (!form.media_ct && form.type === CreateFormType.FileUpload) {
      this.openUploadModal(form);
    } else {
      switch (form.type) {
        case CreateFormType.FormBuilder:
          this.router.navigate([`settings/intake-forms/form-builder/${form.asset_id}`]);
          break;
        case CreateFormType.FileUpload:
          this.router.navigate([`settings/intake-forms/doc-form-builder/${form.asset_id}`]);
          break;
      }
    }
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

  public activateNewFormPopUp(docType: CreateFormType) {
    this.openedId = '';
    this.form = null;
    this.createFormType = docType;
    this.formModalMode = FormModalMode.Create;
    this.shownPopUp = true;
    this.stylesService.popUpActivated();
  }

  public editForm(form: IForm) {
    this.openedId = form.asset_id;
    this.form = form;
    this.formModalMode = FormModalMode.Edit;
    this.shownPopUp = true;
    this.stylesService.popUpActivated();
  }

  public cancelAddingForm() {
    this.shownPopUp = false;
    this.stylesService.popUpDisactivated();
  }

  public saveNewForm(formValue: any) {
    const notification: Notification = this.notificationsService.addNotification({ title: '' });

    if (!this.openedId) {
      notification.title = 'Form creating ';

      this.intakeFormsService
        .postIntakesForm(formValue)
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError(res => {
            this.notificationsService.failed(notification, res.message);
            return throwError(res.error);
          })
        )
        .subscribe(res => {
          this.notificationsService.ok(notification, ' Form created ');
          if (this.createFormType == CreateFormType.FileUpload) {
            this.router.navigate([`settings/doc-intake-forms/form-builder/${res.asset_id}`]);
          } else if (this.createFormType == CreateFormType.FormBuilder) {
            this.router.navigate([`settings/intake-forms/form-builder/${res.asset_id}`]);
          }
          this.stylesService.popUpDisactivated();
        });
    } else {
      notification.title = 'Form updating ';

      this.intakeFormsService
        .putIntakeForm(formValue, this.openedId)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(
          () => {
            this.notificationsService.ok(notification, ' Form updated ');
            this.saving = false;
            this.getForms();
            this.cancelAddingForm();
            this.stylesService.popUpDisactivated();
          },
          err => this.notificationsService.failed(notification, err.message)
        );
    }
  }

  public deleteForm(forms: IForm[], index: number) {
    const form = forms[index];
    const removedForm: any = forms.splice(index, 1);

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Removing form '
    });

    this.intakeFormsService
      .deleteIntakesForm(form?.asset_id!)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          forms.unshift(removedForm);
          return throwError(res.error);
        })
      )
      .subscribe(() => this.notificationsService.ok(notification, ' Form removed'));
  }
}
