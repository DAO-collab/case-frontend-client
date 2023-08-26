import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { catchError, takeUntil } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';

import { DomainsService, IDomains } from '../domains.service';
import { AppsService } from '../../apps/apps.service';
import { PopInNotificationConnectorService } from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { INotification } from '../../../common/components/pop-in-notifications/notification.model';

@Component({
  selector: 'app-domains-modal',
  templateUrl: './domains-modal.component.html',
  styleUrls: ['./domains-modal.component.css']
})
export class DomainsModalComponent implements OnInit, OnDestroy {
  enterpriseHostIdValues: { id: string; value: string }[] = [];
  domainsForm!: UntypedFormGroup;
  loading = true;

  private unsubscribe$: Subject<void> = new Subject();

  constructor(
    private notificationsService: PopInNotificationConnectorService,
    private domainsService: DomainsService,
    private appsService: AppsService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.appsService
      .findStatusApps(true, 'active')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        res.forEach(item => {
          if (item.billing_plan === 'enterprise') {
            this.enterpriseHostIdValues.push({
              id: item.host_id,
              value: item.host_id
            });
          }

          this.loading = false;
        });
      });

    this.domainsForm = this.fb.group({
      enterprise_host_id: ['', Validators.required],
      domain_name: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:.[a-zA-Z]{2,})+$')]
      ]
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  closeModal(): void {
    this.domainsService.isDomainsModalShowed = false;
  }

  addDomain(): void {
    const notification: INotification = this.notificationsService.addNotification({
      title: `Creating domain`
    });
    const data: IDomains = {
      domain_name: this.domainsForm.value.domain_name,
      enterprise_host_id: this.domainsForm.value.enterprise_host_id
    };

    this.domainsService
      .postDomain(data)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.error.error.errors[0].message);
          return throwError(res);
        })
      )
      .subscribe(() => {
        this.domainsService.updateDomainsSubject.next('pending');
        this.notificationsService.ok(notification, 'Domain created');
        this.closeModal();
      });
  }
}
