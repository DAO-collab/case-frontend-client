import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TimeSelectorComponent } from '@ca/ui';

import { UtilsService } from '../../../services/utils.service';
import { NotificationModel } from '../../../directives/component-directives/notification-field/models/NotificationModel';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { TasksService } from '../../../services/tasks.service';
import { TaskModel } from '../models/task.model';

@Component({
  selector: 'app-create-task',
  templateUrl: './create-task.component.html',
  styleUrls: ['./create-task.component.css']
})
export class CreateTaskComponent implements OnInit, OnDestroy {
  @Output() afterChange = new EventEmitter<boolean>();
  @Output() afterSave = new EventEmitter();

  public taskModel: TaskModel = new TaskModel();
  public loading = true;
  public validationErrors: any = [];
  public times: String[] = [];
  public activeDueTime = '';
  public recurring = false;
  public formTouched = false;
  public rruleStartDate = this.getDateForRrule();
  public rruleEndDate = this.getDateForRrule();
  public notifications?: NotificationModel;
  public isOpened = false;
  public caseId?: string;

  private defaultRrule = 'FREQ=DAILY;INTERVAL=1';
  private unsubscribe$ = new Subject();

  constructor(
    private fb: UntypedFormBuilder,
    private utilsService: UtilsService,
    private notificationsService: PopInNotificationConnectorService,
    private tasksService: TasksService
  ) {}

  ngOnInit(): void {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isOpened) {
        this.refreshModal();
        this.afterChangeEmit();
      }
    });

    this.times = this.utilsService.generateTimeArray();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public setDropDownSelectedPosition(dropDown: TimeSelectorComponent): void {
    const todayDate = new Date();
    const dueDate = new Date(this.taskModel.duration.due_date);

    const compareDates =
      todayDate.getFullYear() * todayDate.getMonth() * todayDate.getDate() ===
      dueDate.getFullYear() * dueDate.getMonth() * dueDate.getDate();
    const indexOfStartTime = this.times.indexOf(this.activeDueTime);

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
  public toggleTime(): void {
    setTimeout(() => {
      const dueDate = new Date(this.taskModel.duration.due_date);
      this.setTimeToDate(dueDate);
    });
  }

  public toggleRecurring(): void {
    this.rruleStartDate = this.getDateForRrule(this.taskModel.duration.due_date);
    this.rruleEndDate = this.getDateForRrule(this.taskModel.duration.due_date);
    if (!this.recurring) {
      this.taskModel.duration.rrule = this.defaultRrule;
      this.recurring = true;
    } else {
      this.taskModel.duration.rrule = null as any;
      this.recurring = false;
    }
  }

  public getDateForRrule(dueDate?: string): string {
    const date = dueDate ? new Date(dueDate) : new Date();
    date.setTime(date.getTime()); // + 7 * 24 * 60 * 60 * 1000
    return date.toISOString();
  }

  public togglePublished(event: any): void {
    this.taskModel.published = event.target.checked ? 1 : 0;
  }

  public onNotificationChange(notifications: NotificationModel): void {
    this.taskModel.notifications = notifications;
  }

  public onDefaultNotificationChange(): void {
    this.taskModel.instant_notify = false;
  }

  public isInvalid(): boolean {
    return this.validationErrors.length > 0 || !this.taskModel.notifications?.valid;
  }

  public afterChangeEmit(): void {
    this.afterChange.emit();
    this.afterSave.emit();
  }

  public sendTask(): void {
    this.formTouched = true;

    const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeDueTime).split(':');
    const dueDate = new Date(this.taskModel.duration.due_date);
    dueDate.setHours(+stHours, +stMinutes, 0, 0);

    if (dueDate.toString() == 'Invalid Date') {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving Task`
    });

    this.taskModel.duration.due_date = dueDate.toISOString();

    const taskModel = this.convertTaskObjectBeforeSending(this.utilsService.copy(this.taskModel as any));

    if (!taskModel.published) {
      delete taskModel.published;
    }

    if (!this.taskModel.task_id) {
      this.tasksService
        .postTask(this.caseId as any, taskModel)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(
          () => {
            this.afterChangeEmit();
            this.notificationsService.ok(notification, 'Task saved');
          },
          err => this.notificationsService.failed(notification, err.message)
        );
    } else {
      this.tasksService
        .putTask(this.caseId as any, taskModel.task_id, taskModel)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(
          () => {
            this.afterChangeEmit();
            this.notificationsService.ok(notification, 'Task Updated');
          },
          err => this.notificationsService.failed(notification, err.message)
        );
    }
  }

  private convertTaskObjectBeforeSending(taskModel: any): any {
    if (!taskModel.description) {
      delete taskModel.description;
    }

    if (!taskModel.task_id) {
      delete taskModel.task_id;
    }

    if (!taskModel.duration.rrule) {
      delete taskModel.duration.rrule;
    }

    if (taskModel.field_participants && Object.keys(taskModel.field_participants).length === 0) {
      delete taskModel.field_participants;
    }

    if (!taskModel.meta_data) {
      delete taskModel.meta_data;
    } else if (taskModel.meta_data && Object.keys(taskModel.meta_data).length === 0) {
      delete taskModel.meta_data;
    }

    if (!taskModel.media_asset_id) {
      delete taskModel.media_asset_id;
    }

    if (taskModel.notifications) {
      delete taskModel.notifications.valid;

      if (taskModel.notifications.names && !taskModel.notifications.names.length) {
        delete taskModel.notifications;
      }
    }

    return taskModel;
  }

  public loadOpenedTaskInformation(): void {
    if (this.taskModel.task_id) {
      this.tasksService
        .getTask(this.caseId as any, this.taskModel.task_id)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(
          taskModel => {
            this.taskModel.name = taskModel.name;
            this.taskModel.description = taskModel.description;
            this.taskModel.duration.due_date = new Date(taskModel.due_date).toISOString();

            if (taskModel.published === 0 || taskModel.published === 1) {
              this.taskModel.published = taskModel.published;
            }

            if (taskModel.rrule) {
              this.taskModel.duration.rrule = taskModel.rrule;
              this.recurring = true;
            } else {
              this.taskModel.duration.rrule = '';
              this.recurring = false;
            }

            this.notifications = { ...taskModel.notifications, valid: true };

            this.setTime(new Date(this.taskModel.duration.due_date));

            this.loading = false;
          },
          () => (this.loading = false)
        );
    } else {
      this.resetDueDateTime();

      this.loading = false;
    }
  }

  public resetDueDateTime(dueDate?: Date): void {
    if (!dueDate) {
      dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 1);
      dueDate.setMinutes(0);
    } else {
      const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeDueTime).split(':');
      dueDate.setHours(+stHours, +stMinutes, 0, 0);
    }

    this.taskModel.duration.due_date = dueDate.toISOString();
    this.setTime(dueDate);
  }

  public refreshModal(): void {
    this.taskModel = new TaskModel();
    this.taskModel.duration.due_date = this.getDateForRrule();
    this.notifications = new NotificationModel();
    this.recurring = false;
    this.rruleStartDate = this.getDateForRrule();
    this.rruleEndDate = this.getDateForRrule();
  }

  // Setting time to dates
  private setTimeToDate(dueDate: Date): void {
    const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeDueTime).split(':');

    dueDate.setHours(+stHours, +stMinutes, 0, 0);
    this.taskModel.duration.due_date = dueDate.toISOString();
  }

  private setTime(dueDate: Date): void {
    this.activeDueTime = dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.checkDateTimeOnLength();
  }

  private checkDateTimeOnLength(): void {
    if (this.activeDueTime.length === 7) {
      this.activeDueTime = '0' + this.activeDueTime;
    }
  }
}
