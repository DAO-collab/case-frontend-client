import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subject, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { PopInNotificationConnectorService } from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { DomainsService } from '../domains.service';
import { AppsService } from '../../apps/apps.service';
import { INotification } from '../../../common/components/pop-in-notifications/notification.model';

@Component({
  selector: 'app-edit-domain',
  templateUrl: './edit-domain.component.html',
  styleUrls: ['./edit-domain.component.css']
})
export class EditDomainComponent implements OnInit, OnDestroy {
  loading = true;
  editEnterpriseHostIdForm!: UntypedFormGroup;
  editSsoForm!: UntypedFormGroup;
  enterpriseHostIdValues: { id: string; value: string }[] = [];
  forceSsoValues = [
    { id: 'Yes', value: true },
    { id: 'No', value: false }
  ];

  private unsubscribe$: Subject<void> = new Subject();
  private selectedDomain?: any;

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private notificationsService: PopInNotificationConnectorService,
    private domainsService: DomainsService,
    private appsService: AppsService
  ) {}

  ngOnInit(): void {
    this.editEnterpriseHostIdForm = this.fb.group({ enterprise_host_id: ['', [Validators.required]] });
    this.editSsoForm = this.fb.group({ metadata_base64_encoded: '', exclude: '', force_sso: '' });

    this.appsService
      .findStatusApps(true, 'active')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        res.forEach(item => {
          if (item.billing_plan === 'enterprise') {
            this.enterpriseHostIdValues.push({ id: item.host_id, value: item.host_id });
          }
        });

        this.loading = false;
      });

    this.domainsService
      .getDomains('active')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.selectedDomain = res.items.filter((item: any) => item.txt === this.route.snapshot.paramMap.get('id'))[0];

        this.editEnterpriseHostIdForm.patchValue({ enterprise_host_id: this.selectedDomain?.enterprise_host_id ?? '' });
        this.editSsoForm.patchValue({
          metadata_base64_encoded: this.selectedDomain?.sso?.metadata_base64_encoded ?? '',
          exclude: this.selectedDomain?.sso?.exclude?.join(',') ?? '',
          force_sso: this.selectedDomain?.sso?.force_sso ?? ''
        });
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  submitDomainUpdates(): void {
    const notification: INotification = this.notificationsService.addNotification({ title: `Editing Domain` });
    const editSsoFormValue = this.editSsoForm.value;
    let ssoData: any = {
      metadata_base64_encoded: editSsoFormValue.metadata_base64_encoded,
      exclude: editSsoFormValue.exclude.split(','),
      force_sso: editSsoFormValue.force_sso
    };
    ssoData = this.clearEmptyFields(ssoData);

    forkJoin([
      this.domainsService.putDomain(this.selectedDomain.domain, this.editEnterpriseHostIdForm.value.enterprise_host_id),
      this.domainsService.putSso(this.selectedDomain.domain, ssoData)
    ])
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.error.error.errors[0].message);
          return throwError(res);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, 'Domain Edited');
        this.redirectToDomains();
      });
  }

  redirectToDomains(): void {
    this.router.navigate(['domains']);
  }

  readXMLFile(e: Event): void {
    const file = (e.target as HTMLInputElement)?.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const xmlData = event.target?.result as string;

      this.editSsoForm.patchValue({ metadata_base64_encoded: btoa(xmlData) });
    };
    reader.readAsText(file);
  }

  private clearEmptyFields(obj: {[key: string]: string}) {
    for (const [key, value] of Object.entries(obj)) {
      if (value === '' || value === null || value === undefined) {
        delete obj[key];
      }
    }

    return obj;
  }
}
