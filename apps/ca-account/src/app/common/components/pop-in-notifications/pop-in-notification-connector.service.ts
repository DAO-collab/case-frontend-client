import { Injectable, ApplicationRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { LocalTranslationService } from '@acc/core/local-translation.service';
import { INotification } from './notification.model';

/**
 * Pop In Notification service.
 */
@Injectable({
  providedIn: 'root'
})
export class PopInNotificationConnectorService {
  private notificationSubject: Subject<INotification> = new Subject<INotification>();

  public notificationAddedSubscription: Observable<INotification> = this.notificationSubject.asObservable();

  constructor(private applicationRef: ApplicationRef, private errorDictionary: LocalTranslationService) {}

  /**
   * Ads notification.
   */
  public addNotification(notification: INotification): INotification {
    this.notificationSubject.next(notification);
    this.applicationRef.tick();

    return notification;
  }

  /**
   * Success notification.
   */
  public ok(notification: INotification, text?: string): void {
    notification.status = 'success';
    notification.text = text || notification.text;

    this.addNotification(notification);
  }

  /**
   * Fail notification.
   */
  public failed(notification: INotification, err?: string): void {
    notification.status = 'error';
    notification.text = err || notification.text;

    this.errorDictionary.showError(err!).then((errorMessage: string) => {
      notification.text = errorMessage || notification.text;
      this.addNotification(notification);
    });
  }
}
