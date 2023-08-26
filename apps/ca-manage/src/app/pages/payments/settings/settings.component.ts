import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';

import { SettingsService } from '../../../services/settings.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  isLoading = true;
  stripe$?: Observable<any>;

  private destroy$ = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private notificationsService: PopInNotificationConnectorService
  ) {}

  ngOnInit(): void {
    this.stripe$ = this.getStripe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeStripeStatus(status: any): void {
    this.isLoading = true;

    const notification: Notification = this.notificationsService.addNotification({ title: 'Updating Stripe' });

    this.settingsService
      .putStripe({ stripe_connect_active: !status })
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.notificationsService.failed(notification, err?.error?.message);
          this.isLoading = false;
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok({ title: 'Stripe Updated' });
        this.stripe$ = this.getStripe();
      });
  }

  openLink(link: string): void {
    window.open(link, '_blank');
  }

  private getStripe(): Observable<any> {
    return this.settingsService.getStripe().pipe(tap(() => (this.isLoading = false)));
  }
}
