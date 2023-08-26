import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { take } from 'rxjs/operators';

import { TimeSelectorComponent } from '@ca/ui';

import { SignsService } from '../../../services/signs.service';
import { RolesService } from '../../../services/roles.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { FormModel } from '../../forms/models/FormModel';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { NotificationModel } from '../../../directives/component-directives/notification-field/models/NotificationModel';
import { isEmptyValue } from '../../../utils/utils';

@Component({
  selector: 'app-create-sign',
  templateUrl: './create-sign.component.html',
  styleUrls: ['./create-sign.component.css']
})
export class CreateSignComponent implements OnInit {
  @Output() afterChange = new EventEmitter<boolean>();
  @Output() afterSave = new EventEmitter();

  public signModel: FormModel = new FormModel();
  public pages: any[] = [];
  public isOpened = false;
  public caseId = '';
  public loading = true;
  public recurring = false;
  public validationErrors = [];
  public savingError = '';
  public rolesList: any[] = [];
  public saving = false;
  public answer_ct = 0;
  public formTouched = false;
  public blockFields = false;
  public roleNamesById: any = {};
  public signEditEnabled = true;
  public rruleStartDate = this.getDateForRrule();
  public rruleEndDate = this.getDateForRrule();
  public notifications?: NotificationModel;

  public activeDueTime: string = '';
  public times: String[] = [];

  private subscribers: any[] = [];
  private signRelevance = true;
  private defaultRrule = 'FREQ=DAILY;INTERVAL=1';

  constructor(
    private notificationsService: PopInNotificationConnectorService,
    private utils$: UtilsService,
    private signsService: SignsService,
    private rolesService: RolesService,
    private errorD: LocalTranslationService,
    public router: Router,
    private hostService: HostService,
    private titleService: Title
  ) {}

  ngOnInit() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isOpened) {
        this.refreshModal();
        this.afterChangeEmit();
      }
    });

    this.titleService.setTitle(`${this.hostService.appName} | E-signs`);

    this.times = this.utils$.generateTimeArray();
    this.rolesList = this.rolesService.rolesList;

    // Get user roles
    this.subscribers.push(
      this.rolesService.rolesGetSub.subscribe(item => {
        this.rolesList = item;

        item.map((v: any) => {
          this.roleNamesById[v.role_id] = v.name;
        });
      })
    );
  }

  // Show form information
  public loadOpenedSignInformation(signLibrary?: any): void {
    if (this.signModel.sign_id) {
      this.signRelevance = false;
      this.blockFields = true;
      this.subscribers.push(
        this.signsService.getFormInfo(this.caseId, this.signModel.sign_id).subscribe(
          signModel => {
            this.signModel.name = signModel.name;
            this.signModel.description = signModel.description;
            this.signModel.published = signModel.published;
            this.signModel.duration.due_date = new Date(signModel.due_date).toISOString();

            if (signModel.rrule) {
              this.signModel.duration.rrule = signModel.rrule;
              this.recurring = true;
            } else {
              this.signModel.duration.rrule = '';
              this.recurring = false;
            }

            signModel.meta_data ? (this.signModel.meta_data = signModel.meta_data) : delete this.signModel.meta_data;
            // this.signModel.permissions = signModel.permissions || [];
            this.signModel.field_participants = signModel.field_participants || {};
            this.notifications = { ...signModel.notifications, valid: true };

            if (signModel.schema && signModel.schema.schema) {
              this.signModel.schema = {
                schema: {
                  properties: signModel.schema.properties,
                  type: signModel.schema.type
                }
              };
            }

            this.setTime(new Date(this.signModel.duration.due_date));

            this.answer_ct = Object.keys(signModel.responses).length;
            this.blockFields = !!this.answer_ct;
            this.loading = false;
          },
          () => (this.loading = false)
        )
      );
    } else {
      if (signLibrary) {
        this.signModel.name = signLibrary.name;
        this.signModel.media_asset_id = signLibrary.media_asset_id;
        this.signModel.description = signLibrary.description;
        this.signModel.published = signLibrary.published;
        this.signModel.duration.due_date = signLibrary.due_date;
        this.pages = signLibrary.pages;

        if (signLibrary.duration.rrule) {
          this.signModel.duration.rrule = signLibrary.duration.rrule;
          this.recurring = true;
        } else {
          this.signModel.duration.rrule = '';
          this.recurring = false;
        }

        // this.signModel.permissions = signLibrary.permissions || [];
        this.notifications = { ...signLibrary.notifications, valid: true };

        this.setTime(new Date(this.signModel.duration.due_date));

        if (signLibrary.schema) {
          this.signModel.schema = {
            schema: {
              properties: signLibrary.schema.properties || {},
              type: signLibrary.schema.type
            }
          };
        }
      } else {
        this.resetDueDateTime();
      }

      this.loading = false;
      this.signRelevance = true;
    }
  }

  public onNotificationChange(notifications: NotificationModel) {
    this.signModel.notifications = notifications;
  }

  public onDefaultNotificationChange() {
    this.signModel.instant_notify = false;
  }

  // Preparation sign model for send
  private convertSignObjectBeforeSending(signModel: any): any {
    if (this.signRelevance && !signModel.description) {
      delete signModel.description;
    }

    if (!signModel.duration.rrule) {
      delete signModel.duration.rrule;
    }

    if (signModel.field_participants && Object.keys(signModel.field_participants).length === 0) {
      delete signModel.field_participants;
    }

    if (!signModel.meta_data) {
      delete signModel.meta_data;
    } else if (signModel.meta_data && Object.keys(signModel.meta_data).length === 0) {
      delete signModel.meta_data;
    }

    if (!signModel.sign_id) {
      delete signModel.sign_id;
    }

    if (!signModel.form_id) {
      delete signModel.form_id;
    }

    if (!signModel.permissions.length) {
      delete signModel.permissions;
    }

    if (!signModel.participants_ids.length) {
      delete signModel.participants_ids;
    }

    if (!signModel.media_asset_id) {
      delete signModel.media_asset_id;
    }

    if (signModel.notifications) {
      delete signModel.notifications.valid;

      if (signModel.notifications.names && !signModel.notifications.names.length) {
        delete signModel.notifications;
      }
    }

    if (
      isEmptyValue(signModel.schema.schema.schema) &&
      isEmptyValue(signModel.schema.schema.meta_data) &&
      isEmptyValue(signModel.schema.schema.tabs)
    ) {
      delete signModel.schema;
    }

    return signModel;
  }

  public togglePublished(event: any) {
    const published = event.target.checked ? 1 : 0;
    this.signModel.published = published;
  }

  public isInvalid(): boolean {
    return this.validationErrors.length > 0 || !this.signModel.notifications?.valid;
  }

  // Handling sending new or exists sign model on server
  public sendSign(): void {
    this.formTouched = true;

    const [stHours, stMinutes] = this.utils$.convertTime12to24(this.activeDueTime)?.split(':');
    const dueDate = new Date(this.signModel.duration.due_date);
    dueDate.setHours(+stHours, +stMinutes, 0, 0);

    if (dueDate.toString() == 'Invalid Date') {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving e-sign`
    });

    this.signModel.duration.due_date = dueDate.toISOString();
    const signModel = this.convertSignObjectBeforeSending(this.utils$.copy(this.signModel as any));

    if (!this.signModel.sign_id) {
      this.signsService.createForm(this.caseId, signModel).subscribe(
        ({ sign_id }) => {
          this.afterChangeEmit();

          this.signsService.toggleSignBuilder(0);
          if (signModel.type === 'builder') {
            this.router.navigate([`/e-signs/e-sign-builder/${sign_id}`]);
          } else if (signModel.type === 'document') {
            this.router.navigate([`/e-signs/doc-e-sign-builder/${sign_id}`]);
          }
          if (this.pages[0]) {
            this.pages[0].participants = {};
          }
          if (this.pages.length > 0) {
            const pagesModel = this.convertSignObjectBeforeSending(
              this.utils$.copy({ ...this.signModel, pages: this.pages })
            );
            this.signsService.updateForm(this.caseId, pagesModel, sign_id).subscribe(
              () => {
                this.afterChangeEmit();
                this.notificationsService.ok(notification, 'E-sign Updated');
              },
              err => this.notificationsService.failed(notification, err.message)
            );
          }

          this.notificationsService.ok(notification, 'E-sign saved');
        },
        err => this.notificationsService.failed(notification, err.message)
      );
    } else {
      signModel.schema = {
        schema: signModel.schema
      };
      this.signsService.updateFormWithoutSchema(this.caseId, signModel, signModel.sign_id).pipe(take(1)).subscribe(
        () => {
          this.afterChangeEmit();
          this.notificationsService.ok(notification, 'E-sign Updated');
        },
        err => this.notificationsService.failed(notification, err.message)
      );
    }
  }

  public resetDueDateTime(dueDate?: Date) {
    if (!dueDate) {
      dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 1);
      dueDate.setMinutes(0);
    } else {
      const [stHours, stMinutes] = this.utils$.convertTime12to24(this.activeDueTime).split(':');
      dueDate.setHours(+stHours, +stMinutes, 0, 0);
    }

    this.signModel.duration.due_date = dueDate.toISOString();
    this.setTime(dueDate);
  }

  // Set values in time fields for selected event
  private setTime(dueDate: Date) {
    this.activeDueTime = dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.checkDateTimeOnLength();
  }

  // Checking active start and active end times on length and set 2-digit
  private checkDateTimeOnLength() {
    if (this.activeDueTime.length === 7) {
      this.activeDueTime = '0' + this.activeDueTime;
    }
  }

  // Set center position selected element in dropdown
  public setDropDownSelectedPosition(dropDown: TimeSelectorComponent) {
    const todayDate = new Date();
    const dueDate = new Date(this.signModel.duration.due_date);

    const compareDates =
      todayDate.getFullYear() * todayDate.getMonth() * todayDate.getDate() ===
      dueDate.getFullYear() * dueDate.getMonth() * dueDate.getDate();
    const indexOfStartTime = this.times.indexOf(this.activeDueTime);

    compareDates
      ? (this.times = this.times.splice(indexOfStartTime, this.times.length))
      : (this.times = this.utils$.generateTimeArray());

    setTimeout(() => {
      const options = Array.prototype.slice.call(
        dropDown.element.nativeElement.querySelectorAll('.time-selector-option')
      );
      const scrollPanel: HTMLElement = dropDown.element.nativeElement.querySelector('.time-selector-dropdown');
      const activeTime: HTMLElement | null = scrollPanel.querySelector('.time-selector-option-active');
      const indexOf = options.indexOf(activeTime);

      if (activeTime) {
        scrollPanel.scrollTop = (indexOf - 2) * activeTime.offsetHeight;
      }
    });
  }

  // Handling time change click
  public toggleTime() {
    setTimeout(() => {
      const dueDate = new Date(this.signModel.duration.due_date);
      this.setTimeToDate(dueDate);
    });
  }

  // Setting time to dates
  private setTimeToDate(dueDate: Date) {
    const [stHours, stMinutes] = this.utils$.convertTime12to24(this.activeDueTime).split(':');

    dueDate.setHours(+stHours, +stMinutes, 0, 0);
    this.signModel.duration.due_date = dueDate.toISOString();
  }

  // Get convert date to DateTime for rrule
  public getDateForRrule(dueDate?: string): string {
    const date = dueDate ? new Date(dueDate) : new Date();
    date.setTime(date.getTime()); // + 7 * 24 * 60 * 60 * 1000
    return date.toISOString();
  }

  public dueDateChanged($event: any) {
    this.signsService.publishDueDate($event.dateString);
  }

  // Handling click sign repeat
  public toggleRecurring() {
    this.rruleStartDate = this.getDateForRrule(this.signModel.duration.due_date);
    this.rruleEndDate = this.getDateForRrule(this.signModel.duration.due_date);
    if (!this.recurring) {
      this.signModel.duration.rrule = this.defaultRrule;
      this.recurring = true;
    } else {
      this.signModel.duration.rrule = null;
      this.recurring = false;
    }
  }

  // Set default values for form
  public refreshModal(): void {
    this.signModel = new FormModel();
    this.signModel.duration.due_date = this.getDateForRrule();
    this.notifications = new NotificationModel();
    this.recurring = false;
    this.savingError = '';
    this.rruleStartDate = this.getDateForRrule();
    this.rruleEndDate = this.getDateForRrule();
  }

  // Detect changes on event
  public afterChangeEmit(): void {
    this.afterChange.emit();
    this.afterSave.emit();
  }

  // Show error with requests failed
  // private showError(errorVariable, error): void {
  //   if (this.errorD.errorsDictionary) {
  //     this[errorVariable] = this.errorD.errorsDictionary[error] ? this.errorD.errorsDictionary[error] : error;
  //   } else {
  //     this.errorD.loadErrors().subscribe(() => {
  //       this[errorVariable] = this.errorD.errorsDictionary[error] ? this.errorD.errorsDictionary[error] : error;
  //     });
  //   }
  // }
}
