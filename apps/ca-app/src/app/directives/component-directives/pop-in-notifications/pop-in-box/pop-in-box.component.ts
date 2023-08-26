import { Component, OnInit, ApplicationRef } from '@angular/core';
import { PopInNotificationConnectorService, Notification } from './../pop-in-notification-connector.service';
import { LocalTranslationService } from '../../../../services/local-translation.service';

@Component({
  selector: 'app-pop-in-box',
  templateUrl: './pop-in-box.component.html',
  styleUrls: ['./pop-in-box.component.css']
})
export class PopInBoxComponent implements OnInit {
  public notificationList: Notification[] = [];

  constructor(
    private popInNotificationConnectorService: PopInNotificationConnectorService,
    private applcationRef: ApplicationRef,
    private errorDictionary: LocalTranslationService
  ) {}

  ngOnInit() {
    this.popInNotificationConnectorService.notificationAddedSubscription.subscribe((notification: Notification) => {
      if (!~this.notificationList.indexOf(notification)) {
        if (this.notificationList.length) {
          this.notificationList.shift();
        }

        this.notificationList.push(notification);
      } else {
        setTimeout(() => {
          this.notificationList.splice(this.notificationList.indexOf(notification), 1);
          this.applcationRef.tick();
        }, 3000);

        if (notification.status === 'error') {
          if (!notification.text) {
            this.errorDictionary.showError(notification?.text!).subscribe((r: string) => {
              notification.text = r;
            });
          }
        }
      }
    });
  }

  removeNotification(i: number, notificationList: Notification[]) {
    notificationList.splice(i, 1);
  }
}
