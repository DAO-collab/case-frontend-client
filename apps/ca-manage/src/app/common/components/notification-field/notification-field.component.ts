import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray } from '@angular/forms';

interface ISelectListData {
  id: string;
  text: string;
}

interface INotificationData {
  names: string[];
  values: number[];
}

interface INotification {
  type: string;
  count: number;
  period: string;
}
@Component({
  selector: 'app-notification-field',
  templateUrl: './notification-field.component.html',
  styleUrls: ['./notification-field.component.css']
})
export class NotificationFieldComponent implements OnInit {
  @Input() defaultNotifications?: INotificationData;
  @Output() changed: EventEmitter<INotificationData> = new EventEmitter();

  public notificationTypes: ISelectListData[] = [
    {
      text: 'Notification',
      id: 'notification'
    }
  ];
  public repeatItems: ISelectListData[] = [
    {
      text: 'weeks',
      id: 'weeks'
    },
    {
      text: 'days',
      id: 'days'
    },
    {
      text: 'hours',
      id: 'hours'
    },
    {
      text: 'minutes',
      id: 'mins'
    }
  ];
  public defaultNotification: INotification = {
    type: 'notification',
    count: 1,
    period: 'days'
  };
  public notificationsForm?: UntypedFormGroup;

  private minutesInPeriods: any = {
    weeks: 10080,
    days: 1440,
    hours: 60,
    mins: 1
  };

  get notifications(): UntypedFormArray {
    return this.notificationsForm?.get('notifications') as UntypedFormArray;
  }
  get notificationsControls(): UntypedFormGroup[] {
    return this.notifications.controls as UntypedFormGroup[];
  }

  constructor(private formBuilder: UntypedFormBuilder) {}

  ngOnInit() {
    this.initNotificationForm();
    if (this.defaultNotifications) {
      const notifications: INotification[] = this.defaultNotifications.names?.map((period, index) => ({
        type: 'notification',
        count: this.minutesToPeriod(this.defaultNotifications?.values[index], period),
        period
      }));
      notifications?.forEach(notification => this.notifications.push(this.buildNotificationForm(notification)));
    }
  }

  initNotificationForm() {
    this.notificationsForm = this.formBuilder.group({
      notifications: this.formBuilder.array([])
    });
    // It's true to make empty at the begining
    // if (!this.defaultNotifications || this.defaultNotifications.names.length <= 0) {
    //   this.notifications.push(this.buildNotificationForm());
    // }
  }

  addNotification() {
    this.notifications.push(this.buildNotificationForm());
    this.triggerChange();
  }

  removeNotification(index: number) {
    this.notifications.removeAt(index);
    this.triggerChange();
  }

  triggerChange(index?: number) {
    if ((index as any) >= 0) {
      if (
        this.notifications.value &&
        this.notifications.value.length &&
        this.notifications.value[(index as any)]['period'] === 'mins'
      ) {
        this.notifications.at((index as any)).patchValue({
          count:
            this.notifications.value[(index as any)]['count'] && this.notifications.value[(index as any)]['count'] >= 1
              ? this.notifications.value[(index as any)]['count']
              : 1
        });
      } else {
        this.notifications.at((index as any)).patchValue({
          count: this.notifications.value[(index as any)]['count'] ? this.notifications.value[(index as any)]['count'] : 1
        });
      }
    }

    this.changed.emit(this.notificationsArrayToObject(this.notifications.value));
  }

  private buildNotificationForm(notification?: any) {
    return this.formBuilder.group(notification ? notification : this.defaultNotification);
  }

  private minutesToPeriod(minutes: any, period: any): number {
    return Math.abs(minutes) / this.minutesInPeriods[period];
  }

  private periodToMinutes(count: any, period: any): number {
    return count * this.minutesInPeriods[period] * -1;
  }

  private notificationsArrayToObject(notifications: INotification[]): INotificationData {
    const result: any = {
      names: [],
      values: []
    };

    notifications.forEach(notification => {
      result.names.push(notification.period);
      result.values.push(this.periodToMinutes(notification.count, notification.period));
    });

    return result;
  }

  onKeyPress(event: any, index: number) {
    const value = event.target.value + event.key;
    if (
      this.notifications.value &&
      this.notifications.value.length &&
      this.notifications.value[index]['period'] === 'mins'
    ) {
      if (value && value < 1) {
        event.preventDefault();
      }
    }
  }
}
