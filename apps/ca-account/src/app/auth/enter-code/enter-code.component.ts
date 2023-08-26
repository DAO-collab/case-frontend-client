import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Subject, throwError } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';

import { CodeInputComponent } from 'angular-code-input';

import { AuthService, IOptRequest } from '../auth.service';
import { PopInNotificationConnectorService } from '../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { INotification } from '../../common/components/pop-in-notifications/notification.model';
import { DesignService } from '../../services/design.service';

@Component({
  selector: 'app-enter-code',
  templateUrl: './enter-code.component.html',
  styleUrls: ['./enter-code.component.css']
})
export class EnterCodeComponent implements OnInit, OnDestroy {
  @ViewChild('codeInput') codeInput?: CodeInputComponent;

  @Input() loginType = 'email';
  @Input() userName = '';

  @Output() backToEmailEvent: EventEmitter<void> = new EventEmitter();

  private requestData?: IOptRequest;
  private isSendPinAllowed = true;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private notificationsService: PopInNotificationConnectorService,
    private designService: DesignService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onCodeChanged(event: string) { };

  public onCodeCompleted($event: string) {
    if (this.authService.signUpInfo.sessionType === 'signup') {
      this.authService.signUpInfo.pin = $event;

      this.router.navigate(['/signup'], { queryParams: { coming_soon: false } });

      return;
    }

    this.requestData = {
      pin: $event,
      type: 'web',
      username: this.userName
    };

    this.authService
      .confirmPinCode(this.requestData)
      .pipe(
        takeUntil(this.destroy$),
        catchError(response => {
          let error = response?.error?.error?.message || 'Wrong Pin';

          if (error === 'LoginException' || !error) {
            error = 'Wrong Pin';
          }

          const notification: INotification = this.notificationsService.addNotification({
            title: 'Error'
          });

          this.notificationsService.failed(notification, error);
          this.codeInput?.reset();

          return throwError(error);
        }),
        tap(() => this.designService.updateDesign())
      )
      .subscribe();
  }

  public sendNewPin() {
    if (this.isSendPinAllowed) {
      const notification: INotification = this.notificationsService.addNotification({
        title: 'Sending New Pin'
      });
      const data = { username: this.userName };

      this.isSendPinAllowed = false;
      this.authService
        .sendPinCode(data)
        .pipe(
          takeUntil(this.destroy$),
          catchError(response => {
            const error = response?.error?.error?.message;

            this.notificationsService.failed(notification, error);
            this.isSendPinAllowed = true;

            return throwError(error);
          })
        )
        .subscribe(() => {
          this.notificationsService.ok(notification, 'Pin Sent');
          this.isSendPinAllowed = true;
        });
    }
  }

  public backToEmailPage() {
    this.backToEmailEvent.emit();
  }
}
