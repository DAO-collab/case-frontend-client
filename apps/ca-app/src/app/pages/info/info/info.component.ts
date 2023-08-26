import { Component, OnInit, OnDestroy } from '@angular/core';
import { CasesService } from '../../../services/cases.service';
import { UserService } from '../../../services/user.service';
import { Title } from '@angular/platform-browser';
import { HostService } from '../../../services/host.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { AppsService } from '../../../services/apps.service';
import { Observable, Subscription } from 'rxjs';
import { IApp } from '../../../interfaces/app.interface';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css']
})
export class InfoComponent implements OnInit, OnDestroy {
  public loading = true;
  public permissions?: any;
  public caseData: any = {};
  public case_read_fields: { [key: string]: string } = {};
  public case_write_fields: { [key: string]: string } = {};
  public statusChanged = false;
  public noPermissionToReadCase = false;
  public caseId: string = '';
  public currentApp: any;
  public showCopiedTipForInviteLink = false;

  private subscribers: Subscription[] = [];
  private apps?: IApp[];

  constructor(
    private casesService: CasesService,
    private userService: UserService,
    private hostService: HostService,
    private titleService: Title,
    private notificationsService: PopInNotificationConnectorService,
    private appsService: AppsService
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Info`);

    this.noPermissionToReadCase = false;

    /**
     *  Subscribe to caseId change
     *  - if changed, all content should be reloaded, due to selected case
     */
    this.subscribers.push(
      this.casesService.getCaseId
        .pipe(
          tap(res => (this.caseId = res['case_id'])),
          switchMap(() => this.loadApps())
        )
        .subscribe(res => {
          this.loadCaseInfo();
        })
    );

    /**
     * Subscribe to permissions data
     * - helps to identify right user has to manipulate content
     */
    this.subscribers.push(
      this.userService.getCasePermissionsData.subscribe(data => {
        this.permissions = {};

        if (data.role.permissions.case) {
          data.role.permissions.case.map((v) => {
            this.permissions[v] = v;
          });
        }

        if (data.role.case_read_fields) {
          data.role.case_read_fields.map((v) => {
            this.case_read_fields[v] = v;
          });
        }

        if (data.role.case_write_fields) {
          data.role.case_write_fields.map((v) => {
            this.case_write_fields[v] = v;
          });
        }
      })
    );

    this.appsService.acceptInvitationSubject
      .asObservable()
      .pipe(switchMap(() => this.loadApps()))
      .subscribe();
  }

  /**
   * Runs when out of route
   */
  ngOnDestroy(): void {
    this.subscribers.map((ev) => {
      ev.unsubscribe();
    });
    this.caseData = [];
  }

  private loadApps(): Observable<IApp[]> {
    return this.appsService.getApps().pipe(
      map(({ items }) => {
        this.apps = items;

        return this.apps;
      })
    );
  }

  loadCaseInfo() {
    this.casesService.getCaseData(this.caseId).subscribe(
      r => {
        const jsn = r.data;

        this.loading = false;
        this.caseData = jsn;
        this.apps?.map(item => {
          if (item.host_id === this.caseData.tag_id) this.currentApp = item;
        });
      },
      (err: any) => {
        if (err.error.message === 'CaseModulePermissionModuleNotFoundException') {
          this.noPermissionToReadCase = true;
        }

        this.loading = false;
      }
    );
  }

  changeStatus(statusIs: any) {
    this.casesService.updateCaseData(this.caseId, statusIs.toString()).subscribe(() => {
      this.caseData.case_status = statusIs;
      this.statusChanged = true;
    });
  }

  objLength(obj: {[key: string]: string}) {
    return Object.keys(obj).length;
  }

  copyText(): void {
    navigator.clipboard.writeText(this.caseData.case_id).then();
    const notification: Notification = this.notificationsService.addNotification({
      title: `Copied`
    });
    this.notificationsService.ok(notification, '');
  }
}
