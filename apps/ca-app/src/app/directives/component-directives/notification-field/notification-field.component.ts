import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NotificationModel } from './models/NotificationModel';

interface INotificationType {
  id: string;
  text: string;
}

interface INotification {
  type: string;
  count: number;
  period: string;
}

interface Period {
  period: string;
  id: string;
};

interface MinutesInPeriods {
  weeks: number;
  days: number;
  hours: number;
  mins: number;
};

interface Result {
  names: string[];
  values: number[];
  valid: boolean;
};

@Component({
  selector: 'app-notification-field',
  templateUrl: './notification-field.component.html',
  styleUrls: ['./notification-field.component.css']
})
export class NotificationFieldComponent implements OnChanges {
  @Input() notitficationsList?: NotificationModel;
  @Input() enabled?: boolean;
  @Output() changed: EventEmitter<NotificationModel> = new EventEmitter();
  @Output() defaultNofify: EventEmitter<any> = new EventEmitter();

  public defaultShow: boolean = true;

  public notificationTypes: INotificationType[] = [
    {
      text: 'Notify Before',
      id: 'notification'
    }
  ];
  public repeatItems: Period[] = [
    {
      period: 'minutes',
      id: 'mins'
    },
    {
      period: 'hours',
      id: 'hours'
    },
    {
      period: 'days',
      id: 'days'
    },
    {
      period: 'weeks',
      id: 'weeks'
    }
  ];
  public notificationsForm = this.formBuilder.group({
    notifications: this.formBuilder.array([])
  });

  public defaultNotification: INotification = {
    type: 'notification',
    count: 1,
    period: 'mins'
  };
  private minutesInPeriods: MinutesInPeriods = {
    weeks: 10080,
    days: 1440,
    hours: 60,
    mins: 1
  };

  get notifications(): UntypedFormArray {
    return this.notificationsForm.get('notifications') as UntypedFormArray;
  }

  get notificationsControls(): UntypedFormGroup[] {
    return this.notifications.controls as UntypedFormGroup[];
  }

  constructor(private formBuilder: UntypedFormBuilder) {}

  ngOnChanges(change: any) {
    this.notifications.controls = [];

    if (
      change.notitficationsList &&
      change.notitficationsList.currentValue &&
      change.notitficationsList.currentValue.names
    ) {
      this.inputObjectToPeriodsArray();
    }
    if (change.enabled && change.enabled.currentValue) {
      change.enabled.currentValue ? this.notificationsForm.enable() : this.notificationsForm.disable();
    }
  }

  addNotification(): void {
    this.notifications.push(this.buildNotificationForm());
    this.triggerChange();
  }

  removeNotification(index: number) {
    if (this.enabled) {
      this.notifications.removeAt(index);
      this.triggerChange();
    }
  }

  removeDefaultNotification() {
    this.defaultShow = false;
    this.defaultNofify.emit();
  }

  triggerChange() {
    this.changed.emit(this.periodsArrayToObject(this.notifications.value));
  }

  private buildNotificationForm(notification?: INotification) {
    return this.formBuilder.group(notification ? notification : this.defaultNotification);
  }

  private minutesToPeriod(minutes: number, period: string): number {
    return Math.abs(minutes) / this.minutesInPeriods[period as keyof MinutesInPeriods];
  }

  private inputObjectToPeriodsArray() {
    const notifications: INotification[] = this.notitficationsList!.names!.map((period, index) => ({
      type: 'notification',
      count: this.minutesToPeriod(this.notitficationsList?.values?.[index]!, period),
      period
    }));

    notifications.forEach(notification => this.notifications.push(this.buildNotificationForm(notification)));
    this.triggerChange();
  }

  private periodToMinutes(count: number, period: string): number {
    return count * this.minutesInPeriods[period as keyof MinutesInPeriods] * -1;
  }

  private periodsArrayToObject(notifications: INotification[]): NotificationModel {
    const result: any = {
      names: [],
      values: [],
      valid: !notifications.some(notif => notif.period === 'mins' && notif.count < 1)
    };

    notifications.forEach((notification) => {
      result.names.push(notification.period);
      result.values.push(this.periodToMinutes(notification.count, notification.period));
    });

    return result;
  }
}
