import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { DomainsService } from './domains.service';
import { INotification } from '../../common/components/pop-in-notifications/notification.model';
import { PopInNotificationConnectorService } from '../../common/components/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-domains',
  templateUrl: './domains.component.html',
  styleUrls: ['./domains.component.css']
})
export class DomainsComponent implements OnInit, OnDestroy {
  domainStatus: 'active' | 'pending' = 'active';
  domains?: any;
  pendingCount = 0;
  isLoading = true;

  private unsubscribe$: Subject<void> = new Subject();

  constructor(
    private notificationsService: PopInNotificationConnectorService,
    private domainsService: DomainsService
  ) {}

  ngOnInit(): void {
    this.domainsService.updateDomainsSubject
      .asObservable()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.domainStatus = res;

        this.loadDomains(this.domainStatus);
        this.setPendingCounter();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loadDomains(status: 'active' | 'pending'): void {
    this.isLoading = true;
    this.domainStatus = status;

    this.domainsService
      .getDomains(this.domainStatus)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.isLoading = false;
          return throwError(res);
        })
      )
      .subscribe(res => {
        this.domains = res?.items ?? [];
        this.isLoading = false;
      });
  }

  deleteDomain(domainName: string): void {
    const notification: INotification = this.notificationsService.addNotification({ title: `Deleting domain` });

    this.domainsService
      .deleteDomain(this.domainStatus, domainName)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.error.error.errors[0].message);
          return throwError(res);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, 'Domain deleted');
        this.loadDomains(this.domainStatus);
        this.setPendingCounter();
      });
  }

  deleteSso(domainName: string): void {
    const notification: INotification = this.notificationsService.addNotification({ title: `Removing Sso` });

    this.domainsService
      .deleteSso(domainName)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.error.error.errors[0].message);
          return throwError(res);
        })
      )
      .subscribe(() => this.notificationsService.ok(notification, 'Sso Removed'));
  }

  copyTxt(text: string): void {
    navigator.clipboard.writeText(text).then(() => alert('Txt Copied'));
  }

  toggleSsoEnabled(domainName: string, value: boolean): void {
    const notification: INotification = this.notificationsService.addNotification({ title: `Editing Domain` });
    const data = { active: value };

    this.domainsService
      .putSso(domainName, data)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          res.status === 403
            ? this.notificationsService.failed(notification, 'Metadata is required to enable sso')
            : this.notificationsService.failed(notification, res.error.error.errors[0].message);

          return throwError(res);
        })
      )
      .subscribe(() => this.notificationsService.ok(notification, 'Domain Edited'));
  }

  private setPendingCounter(): void {
    this.domainsService
      .getDomains('pending')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => (this.pendingCount = res?.items?.length ?? 0));
  }
}
