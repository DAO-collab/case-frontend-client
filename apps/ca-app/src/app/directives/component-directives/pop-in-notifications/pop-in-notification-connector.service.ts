import { Injectable, ApplicationRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PopInNotificationConnectorService {
  private notificationSubject: Subject<Notification> = new Subject<Notification>();

  public notificationAddedSubscription: Observable<Notification> = this.notificationSubject.asObservable();

  constructor(private applicationRef: ApplicationRef) {}

  public addNotification(object: Notification) {
    this.notificationSubject.next(object);
    this.applicationRef.tick();

    return object;
  }

  public ok(object: Notification, text?: string) {
    object.status = 'success';
    object.text = text || object.text;

    this.addNotification(object);
  }

  public failed(object: Notification, err?: string) {
    object.status = 'error';
    object.text = err || object.text;

    this.addNotification(object);
  }
}

export interface Notification {
  title: string;
  text?: string;
  status?: string;
  width?: string;
}
