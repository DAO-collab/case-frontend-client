import { Injectable, ApplicationRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { INotification } from './notification.model';

/**
 * Pop In Notification service.
 */
@Injectable({
  providedIn: 'root'
})
export class PopInNotificationConnectorService {
  private notificationSubject: Subject<INotification> = new Subject<INotification>();

  public notificationAddedSubscription: Observable<any> = this.notificationSubject.asObservable();

  constructor(private applicationRef: ApplicationRef) {}

  /**
   * Ads notification.
   */
  public addNotification(notification: INotification) {
    this.notificationSubject.next(notification);
    this.applicationRef.tick();

    return notification;
  }

  /**
   * Success notification.
   */
  public ok(notification: INotification, text?: string) {
    notification.status = 'success';
    notification.text = text || notification.text;

    this.addNotification(notification);
  }

  /**
   * Fail notification.
   */
  public failed(notification: INotification, err?: string) {
    notification.status = 'error';
    notification.text = err || notification.text;

    this.addNotification(notification);
  }
}
