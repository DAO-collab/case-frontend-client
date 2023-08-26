import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { catchError, takeUntil, tap } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';

import { CookieService } from 'ngx-cookie-service';

import { AuthService } from '../../auth/auth.service';
import { INotification } from '../../common/components/pop-in-notifications/notification.model';
import { PopInNotificationConnectorService } from '../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { UnsubscribeFromEmailService } from '../../services/unsubscribe-from-email.service';

export enum pageIndexes {
  SelectOption,
  ThankYouPage
}

@Component({
  selector: 'app-unsubscribe-from-email',
  templateUrl: './unsubscribe-from-email.component.html',
  styleUrls: ['./unsubscribe-from-email.component.css']
})
export class UnsubscribeFromEmailComponent implements OnInit, OnDestroy {
  public unsubscribeReasons: { type: string; message: string }[] = [];
  public checkedRadioValue = '';
  public pageIndexes = pageIndexes;
  public pageIndex = pageIndexes.SelectOption;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationsService: PopInNotificationConnectorService,
    private unsubscribeFromEmailService: UnsubscribeFromEmailService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    if (this.router.url.indexOf('?t=') === -1 || this.router.url.indexOf('&n=') === -1) {
      this.router.navigate(['/']);
    }

    this.unsubscribeFromEmailService
      .getDataFromJSON(this.cookieService.get('locale') ?? 'en')
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(res => Object.keys(res).forEach(key => this.unsubscribeReasons.push({ type: key, message: res[key] })))
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public onSelectRadio(input: { value: string }) {
    this.checkedRadioValue = input.value;
  }

  public getCompanyName() {
    const startIndex = this.router.url.indexOf('&n=') + 3;
    const endIndex = this.router.url.length;

    return this.router.url.slice(startIndex, endIndex).replace(/%20/g, ' ');
  }

  public onSubmit() {
    const startIndex = this.router.url.indexOf('?t=') + 3;
    const endIndex = this.router.url.indexOf('&n=');
    const data = {
      payload: this.router.url.slice(startIndex, endIndex),
      reason: this.checkedRadioValue
    };
    const notification: INotification = this.notificationsService.addNotification({
      title: 'Unsubscribing'
    });

    this.authService
      .unsubscribeFromEmail(data)
      .pipe(
        catchError(response => {
          const error = response?.error?.error?.message || 'Failed';

          this.notificationsService.failed(notification, error);

          return throwError(error);
        })
      )
      .subscribe(() => {
        this.pageIndex = pageIndexes.ThankYouPage;

        this.notificationsService.ok(notification, 'Unsubscribed successfully');
      });
  }
}
