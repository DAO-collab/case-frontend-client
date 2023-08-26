import { Injectable, ApplicationRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PopInNotificationConnectorService {
  private notificationSubject: Subject<Notification> = new Subject<Notification>();

  public notificationAddedSubscription: Observable<any> = this.notificationSubject.asObservable();

  constructor(private applicationRef: ApplicationRef) {}

  public addNotification(object: Notification) {
    this.notificationSubject.next(object);
    this.applicationRef.tick();

    return object;
  }

  public ok(object: Notification, text?: any) {
    object.status = 'success';
    object.text = text || object.text;

    this.addNotification(object);
  }

  public failed(object: Notification, err?: any) {
    object.status = 'error';
    object.text = err || object.text;

    this.addNotification(object);
  }
}

export interface Notification {
  title: string;
  text?: any;
  status?: string;
}
