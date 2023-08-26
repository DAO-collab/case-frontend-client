import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject, Subscription } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { TimeSelectorComponent } from '@ca/ui';
import { Role, RoleNames, Team } from '@app/interfaces';

import { FormModel } from '../models/FormModel';
import { UtilsService } from '../../../services/utils.service';
import { FormsService } from '../../../services/forms.service';
import { RolesService } from '../../../services/roles.service';
import { UserService } from '../../../services/user.service';
import { HostService } from '../../../services/host.service';
import { NotificationModel } from '../../../directives/component-directives/notification-field/models/NotificationModel';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.css']
})
export class CreateFormComponent implements OnInit {
  @Input() enabled?: boolean;
  @Output() afterChange = new EventEmitter<boolean>();
  @Output() afterSave = new EventEmitter();

  public formModel: FormModel = new FormModel();
  public pages = [];
  public isOpened = false;
  public caseId = '';
  public loading = true;
  public recurring = false;
  public validationErrors = [];
  public savingError = '';
  public blockFields = false;
  public initialParicipants: Role[] = [];
  public activeParticipants: Team[] = [];
  public formTouched = false;
  public answer_ct = 0;
  public rolesList: RoleNames[] = [];
  public saving = false;
  public roleNamesById: { [key: string]: string } = {};
  public activeDueTime?: string;
  public times: String[] = [];
  public formEditEnabled = true;
  public rruleStartDate = this.getDateForRrule();
  public rruleEndDate = this.getDateForRrule();
  public notifications?: NotificationModel;
  public unsubscribe$: Subject<void> = new Subject();

  private people: { id: string, text: string }[] = [];
  private subscribers: Subscription[] = [];
  private teamData: { [key: string]: Team } = {};
  private team: any = [];
  private defaultRrule = 'FREQ=DAILY;INTERVAL=1';

  constructor(
    public utilsService: UtilsService,
    private notificationsService: PopInNotificationConnectorService,
    private router: Router,
    private formsService: FormsService,
    private rolesService: RolesService,
    private userService: UserService,
    private hostService: HostService,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.enabled = true;
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isOpened) {
        this.refreshModal();
        this.afterChangeEmit();
      }
    });

    this.titleService.setTitle(`${this.hostService.appName} | Forms`);

    this.times = this.utilsService.generateTimeArray();
    this.rolesList = this.rolesService.rolesList;
    this.rolesList.map(v => (this.roleNamesById[v.role_id] = v.name));
    this.validationErrors = [];
    this.activeDueTime = '';
    this.formTouched = false;

    // Get user roles
    this.subscribers.push(
      this.rolesService.rolesGetSub.subscribe(item => {
        this.rolesList = item;

        item.map((v) => {
          this.roleNamesById[v.role_id] = v.name;
        });
      })
    );

    // Get case team
    this.subscribers.push(
      this.userService.getTeamData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
        this.people = [];
        data?.items
          .filter((v) => v.case_role_id !== 'role::bots')
          .map((usr) => {
            this.teamData[usr.user_id] = usr;

            this.people.push({
              id: usr.user_id,
              text: usr.sync_info
                ? usr.sync_info.given_name + ' ' + usr.sync_info.family_name
                : usr.given_name + ' ' + usr.family_name
            });
          });

        this.initialParticipant();
        data ? (this.team = data.items) : (this.team = [this.userService.userData]);
      })
    );
  }

  public onNotificationChange(notifications: NotificationModel) {
    this.formModel.notifications = notifications;
  }

  public onDefaultNotificationChange() {
    this.formModel.instant_notify = false;
  }

  // Show form information
  public loadOpenedFormInformation(formLibrary?: any): void {
    if (this.formModel.form_id) {
      this.blockFields = true;

      this.subscribers.push(
        this.formsService.getFormInfo(this.caseId, this.formModel.form_id).subscribe(
          form => {
            this.formModel.name = form.name;
            this.formModel.description = form.description;
            this.formModel.published = form.published;
            this.formModel.duration.due_date = new Date(form.due_date).toISOString();

            if (form.rrule) {
              this.formModel.duration.rrule = form.rrule;
              this.recurring = true;
            } else {
              this.formModel.duration.rrule = '';
              this.recurring = false;
            }

            this.formModel.participants_ids = form.participants_ids || [];
            this.activeParticipants = this.formModel.participants_ids?.map(r => {
              return this.team.find((pl: any) => {
                return pl.user_id === r;
              });
            }) as any;

            form.meta_data ? (this.formModel.meta_data = form.meta_data) : delete this.formModel.meta_data;
            // this.formModel.permissions = formModel.permissions || [];
            this.notifications = { ...form.notifications, valid: true };

            if (form.schema && form.schema.schema) {
              this.formModel.schema = {
                schema: {
                  properties: form.schema.schema.properties || {}
                }
              };
            } else {
              this.formModel.schema = null as any;
            }

            if (form.pages) {
              this.formModel.pages = form.pages;
              this.formModel.pages_ct = form.pages_ct;
            }

            if (form.media) {
              this.formModel.media = form.media;
              this.formModel.media_ct = form.media_ct;
            }

            this.setTime(new Date(this.formModel.duration.due_date));

            this.answer_ct = Object.keys(form.responses || {}).length;
            this.blockFields = !!this.answer_ct;
            this.loading = false;
          },
          () => (this.loading = false)
        )
      );
    } else {
      if (formLibrary) {
        this.formModel.name = formLibrary.name;
        this.formModel.media_asset_id = formLibrary.media_asset_id;
        this.formModel.description = formLibrary.description;
        this.formModel.published = formLibrary.published;
        this.formModel.duration.due_date = formLibrary.due_date;
        this.pages = formLibrary.pages;

        if (formLibrary.duration.rrule) {
          this.formModel.duration.rrule = formLibrary.duration.rrule;
          this.recurring = true;
        } else {
          this.formModel.duration.rrule = '';
          this.recurring = false;
        }

        // this.formModel.permissions = formLibrary.permissions || [];
        this.notifications = { ...formLibrary.notifications, valid: true };

        if (formLibrary.schema) {
          this.formModel.schema = {
            schema: {
              properties: formLibrary.schema.properties || {},
              type: formLibrary.schema.type
            }
          };
        }

        this.setTime(new Date(this.formModel.duration.due_date));
      } else {
        this.resetDueDateTime();
      }

      this.loading = false;
    }
  }

  public initialParticipant(): void {
    this.initialParicipants = [];
    this.people.map(pl => {
      this.initialParicipants.push({
        role_id: pl.id,
        name: pl.text
      });
    });
  }

  public setParticipant(participant: string[]) {
    this.formModel.participants_ids = [];
    this.activeParticipants = [];

    participant.map(item => {
      this.formModel.participants_ids?.push(item);
      this.activeParticipants.push(this.team.filter((t: any) => t.user_id === item)[0]);
    });
  }

  public removeParticipant(index: number) {
    this.formModel.participants_ids?.splice(index, 1);
    this.activeParticipants = [];
    this.formModel.participants_ids?.map((item: any) => {
      this.activeParticipants.push(this.team.filter((t: any) => t.user_id === item)[0]);
    });
  }

  // Preparation form model for send
  private convertFormObjectBeforeSending(formModel: any): any {
    if (!this.formModel.form_id && !formModel.description) {
      delete formModel.description;
    }

    if (formModel.participants_ids?.length === 0) {
      delete formModel.participants_ids;
    }

    if (!formModel.duration.rrule) {
      delete formModel.duration.rrule;
    }

    if (!formModel.meta_data) {
      delete formModel.meta_data;
    } else if (formModel.meta_data && Object.keys(formModel.meta_data).length === 0) {
      delete formModel.meta_data;
    }

    if (!formModel.form_id) {
      delete formModel.form_id;
    }

    if (!formModel.media_asset_id) {
      delete formModel.media_asset_id;
    }

    if (formModel.notifications) {
      delete formModel.notifications.valid;
      if (formModel.notifications.names && !formModel.notifications.names.length){
        delete formModel.notifications;
      }
    }

    return formModel;
  }

  public isInvalid(): boolean {
    return this.validationErrors.length > 0 || !this.formModel.notifications?.valid || !this.activeParticipants.length;
  }

  // Handling sending new or exists form model on server
  public sendForm(): void {
    this.formTouched = true;

    const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeDueTime as string).split(':');
    const dueDate = new Date(this.formModel.duration.due_date);
    dueDate.setHours(+stHours, +stMinutes, 0, 0);

    if (dueDate.toString() == 'Invalid Date') {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving form`
    });

    if (!this.formModel.participants_ids || !this.formModel.participants_ids.length) {
      this.notificationsService.failed(notification, 'Choose At Least One Recipient.');
      return;
    }

    this.formModel.duration.due_date = dueDate.toISOString();
    const formModel = this.convertFormObjectBeforeSending(this.formModel);
    if (!this.formModel.form_id) {
      this.formsService.createForm(this.caseId, formModel).subscribe(
        ({ form_id }) => {
          this.afterChangeEmit();

          this.formsService.toggleFormBuilder(0);
          if (formModel.type === 'builder') {
            this.router.navigate([`/forms/form-builder/${form_id}`]);
          } else if (formModel.type === 'document') {
            this.router.navigate([`/forms/doc-form-builder/${form_id}`]);
          }

          if (this.pages.length > 0) {
            const pagesModel = this.convertFormObjectBeforeSending({ ...this.formModel, pages: this.pages });

            this.formsService.updateForm(this.caseId, pagesModel, form_id).subscribe(
              () => {
                this.afterChangeEmit();
                this.notificationsService.ok(notification, 'Form Updated');
              },
              err => {
                this.notificationsService.failed(notification, err.message);
              }
            );
          }

          this.notificationsService.ok(notification, 'Form saved');
        },
        err => this.notificationsService.failed(notification, err.message)
      );
    } else {
      this.formsService.updateFormWithoutSchema(this.caseId, formModel, formModel.form_id).pipe(take(1)).subscribe(
        () => {
          this.afterChangeEmit();
          this.notificationsService.ok(notification, 'Form Updated');
        },
        err => {
          this.notificationsService.failed(notification, err.message);
        }
      );
    }
  }

  // Set default values for time fields
  public resetDueDateTime(dueDate?: Date) {
    if (!dueDate) {
      dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 1);
      dueDate.setMinutes(0);
    } else {
      const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeDueTime as string).split(':');
      dueDate.setHours(+stHours, +stMinutes, 0, 0);
    }

    this.formModel.duration.due_date = dueDate.toISOString();
    this.setTime(dueDate);
  }

  // Set values in time fields for selected event
  private setTime(dueDate: Date) {
    this.activeDueTime = dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.checkDateTimeOnLength();
  }

  // Checking active start and active end times on length and set 2-digit
  private checkDateTimeOnLength() {
    if (this.activeDueTime?.length === 7) {
      this.activeDueTime = '0' + this.activeDueTime;
    }
  }

  public togglePublished(event: Event) {
    const published = (event.target as HTMLInputElement).checked ? 1 : 0;
    this.formModel.published = published;
  }

  // Set center position selected element in dropdown
  public setDropDownSelectedPosition(dropDown: TimeSelectorComponent) {
    const todayDate = new Date();
    const dueDate = new Date(this.formModel.duration.due_date);

    const compareDates =
      todayDate.getFullYear() * todayDate.getMonth() * todayDate.getDate() ===
      dueDate.getFullYear() * dueDate.getMonth() * dueDate.getDate();
    const indexOfStartTime = this.times.indexOf(this.activeDueTime as string);

    compareDates
      ? (this.times = this.times.splice(indexOfStartTime, this.times.length))
      : (this.times = this.utilsService.generateTimeArray());

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
      const dueDate = new Date(this.formModel.duration.due_date);
      this.setTimeToDate(dueDate);
    });
  }

  // Setting time to dates
  private setTimeToDate(dueDate: Date) {
    const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeDueTime as string).split(':');

    dueDate.setHours(+stHours, +stMinutes, 0, 0);
    this.formModel.duration.due_date = dueDate.toISOString();
  }

  // Get convert date to DateTime for rrule
  public getDateForRrule(dueDate?: string): string {
    const date = dueDate ? new Date(dueDate) : new Date();
    date.setTime(date.getTime()); // + 7 * 24 * 60 * 60 * 1000
    return date.toISOString();
  }

  public dueDateChanged($event: any) {
    this.formsService.publishDueDate($event.dateString);
  }

  // Handling click sign repeat
  public toggleRecurring() {
    this.rruleStartDate = this.getDateForRrule(this.formModel.duration.due_date);
    this.rruleEndDate = this.getDateForRrule(this.formModel.duration.due_date);
    if (!this.recurring) {
      this.formModel.duration.rrule = this.defaultRrule;
      this.recurring = true;
    } else {
      this.formModel.duration.rrule = null;
      this.recurring = false;
    }
  }

  // Set default values for form
  public refreshModal(): void {
    this.formModel = new FormModel();
    this.formModel.duration.due_date = this.getDateForRrule();
    this.notifications = new NotificationModel();
    this.recurring = false;
    this.activeParticipants = [];
    this.savingError = '';
    this.rruleStartDate = this.getDateForRrule();
    this.rruleEndDate = this.getDateForRrule();
  }

  // Detect changes on event
  public afterChangeEmit(): void {
    this.afterChange.emit();
    this.afterSave.emit();
  }
}
