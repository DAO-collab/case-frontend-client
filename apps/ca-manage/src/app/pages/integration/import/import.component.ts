import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HostService } from '../../../services/host.service';
import { ImportsService } from '../services/imports.service';
import { OptionsService } from '../../../services/options.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { IImportItem } from '../models/import.model';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.css']
})
export class ImportComponent extends UnsubscriptionHandler implements OnInit {
  loading = true;
  importId?: string;
  notFound = false;
  importItems?: IImportItem[];
  importTypes: any = {};
  isRetryAvailable = true;
  retryImportIndex?: number | null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title,
    private hostService: HostService,
    private importsService: ImportsService,
    private optionsService: OptionsService,
    private notificationsService: PopInNotificationConnectorService
  ) {
    super();
  }

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Import`);
    this.importId = this.route.snapshot.paramMap.get('importId')!;

    this.optionsService
      .importTypesList()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => (this.importTypes = res));
    this.importsService
      .getImport(this.importId)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.loading = false))
      )
      .subscribe(
        ({ items }) => (this.importItems = items),
        () => (this.notFound = true)
      );

    this.importsService
      .fetchImports()
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => (this.loading = false))
      )
      .subscribe(({ items }) => {
        items
          .filter(item => item.import_id === this.importId)
          .map(v => {
            this.importsService.updateImportTitle(v.name);
          });
      });
  }

  hasAllImportsPassed() {
    let temp;

    this.importItems?.forEach(item => {
      if (item.schema_errors) {
        temp = false;
      }
    });

    if (temp === undefined) {
      temp = true;
    }

    return temp;
  }

  retryImport(importId: string, uniqueId: string, index: number): void {
    const notification: Notification = this.notificationsService.addNotification({
      title: 'Retrying Import'
    });

    this.retryImportIndex = index;
    this.isRetryAvailable = false;
    this.importsService.retryImport(importId, uniqueId).subscribe(
      res => {
        this.notificationsService.ok(notification, 'Retrying Finished');

        setTimeout(() => {
          this.isRetryAvailable = true;

          window.location.reload();
        }, 5000);
      },
      error => {
        this.isRetryAvailable = true;
        this.retryImportIndex = null;

        this.notificationsService.failed(notification, 'Error occurred');
      }
    );
  }

  navigateBack(): void {
    this.router.navigate(['integration']);
  }
}
