import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  PopInNotificationConnectorService,
  Notification
} from './../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { DatePipe } from '@angular/common';
import { LogsService } from '../../../services/logs.service';
import { CasesService } from '../../cases/services/cases.service';
import { LogsRequest, QueryRequest } from '../../../interfaces/services/logs.model';
import { StylesService } from '../../../services/styles.service';
import { UtilsService } from '../../../services/utils.service';
import { PrivateFilesHelperService } from '../../../services/helpers/private-files-helper.service';
import { Title } from '@angular/platform-browser';
import { HostService } from '../../../services/host.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { PRIVATE_CDN_URL } from '../../../shared/constants.utils';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent extends UnsubscriptionHandler implements OnInit, OnDestroy {
  public formTouched = false;
  public activeLogsPopUp = false;
  public allLogs: any[] = [];
  public validationErrors: string[] = [];
  public serverErrors: any = {};
  public loading = true;
  public requested = false;
  public blockButtons = false;
  public notFound = false;
  public today: Date = new Date();
  public selectionLists: any;
  public logsRequest: LogsRequest = new LogsRequest();
  public entityList?: any[];

  private queryRequest: QueryRequest = new QueryRequest();
  private suceededLogs?: any[];
  private queuedLogs?: any[];
  private runningLogs?: any[];
  private canceledLogs?: any[];
  private timedOutLogs?: any[];
  private subscribers: any[] = [];
  private entityProcessors: any;

  private logsRequest$ = this.logsService.getQueue();

  constructor(
    private logsService: LogsService,
    private casesService: CasesService,
    private stylesService: StylesService,
    private utilsService: UtilsService,
    private privateFilesHelperService: PrivateFilesHelperService,
    private datePipe: DatePipe,
    private notificationsService: PopInNotificationConnectorService,
    public hostService: HostService,
    private titleService: Title,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Settings`);

    this.selectionLists = this.generateSelectList();
    this.logsRequest.domain = 'app';

    this.entityProcessors = {
      case_id: (entitiesList: any, entitieName: any) => {
        this.casesService
          .fetchCases()
          .pipe(
            takeUntil(this.unsubscribe$),
            catchError(res => {
              entitiesList[entitieName] = [];
              return throwError(res.error);
            })
          )
          .subscribe(data => {
            entitiesList[entitieName] = data.items.map(caseData => {
              return {
                id: caseData.case_id,
                text: caseData.tag_id.split('::')[1]
              };
            });
          });
      }
    };

    this.loadLogs();

    this.entityProcessors['case_id'](this.selectionLists.entities, 'case_id');

    this.logsService.modalActivatedSub.subscribe(() => {
      this.activeLogsPopUp = true;
      this.stylesService.popUpActivated();
    });
  }

  override ngOnDestroy(): void {
    this.subscribers.forEach(s => s.unsubscribe());
    this.subscribers = [];
  }

  // Load logs
  public loadLogs(shadowedLoading?: any): void {
    this.loading = shadowedLoading ? false : true;

    of(null)
      .pipe(switchMap(() => this.logsRequest$))
      .subscribe(
        logs => {
          logs = logs.data.items.sort((a: any, b: any) => new Date(a.created_on) < new Date(b.created_on));

          this.loading = false;
          this.requested = logs.length ? true : false;
          this.queuedLogs = [];
          this.runningLogs = [];
          this.canceledLogs = [];
          this.suceededLogs = [];
          this.timedOutLogs = [];

          logs.forEach((log: any) => {
            log.items = [];

            switch (log.status) {
              case 'QUEUED':
                this.queuedLogs?.push(log);
                break;

              case 'RUNNING':
                this.runningLogs?.push(log);
                break;

              case 'SUCCEEDED':
                this.suceededLogs?.push(log);
                break;

              case 'CANCELLED':
                this.canceledLogs?.push(log);
                break;

              case 'TIMED_OUT':
                this.timedOutLogs?.push(log);
                break;
            }
          });

          this.allLogs = [
            ...this.runningLogs,
            ...this.suceededLogs,
            ...this.queuedLogs,
            ...this.canceledLogs,
            ...this.timedOutLogs
          ];
          this.suceededLogs.forEach(log => {
            log.loading = true;
            this.getLogs(log);
          });

          // Auto download log file when log in route params have additional parameters
          this.route.queryParams.subscribe(params => {
            if (params['log']) {
              const log = this.allLogs.filter(l => l.log_id === params['log'])[0];

              if (log) {
                if (log.status === 'SUCCEEDED') {
                  this.downloadFile(log.log_id, log.query_id);
                }
              }
            }
          });
        },
        () => {
          this.loading = false;
          this.requested = false;
        }
      );
  }

  // Cancell logs
  public cancelLogs(logId: string): void {
    this.logsService.changeLogsStatus(logId).subscribe(() => this.loadLogs(true));
  }

  // Filter entitie by select items
  public loadEntitie(entitiesList: any, entityType: any) {
    if (entityType.id) {
      this.logsRequest.filter.entity_field_name = entityType.id;
      this.entityList = entitiesList[entityType.id];
    }
  }

  // Create log
  public sendLogsRequest(logsRequest: any): void {
    this.serverErrors = {};
    this.formTouched = true;

    if (this.validationErrors.length) {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Requesting logs'
    });

    const requestCopy = JSON.parse(JSON.stringify(logsRequest)),
      startDate = this.datePipe.transform(requestCopy.start_date, 'MM-dd-yyyy') + 'T23:00:00',
      endDate = this.datePipe.transform(requestCopy.end_date, 'MM-dd-yyyy') + 'T23:00:00';

    requestCopy.start_date = startDate;
    requestCopy.end_date = endDate;

    if (!requestCopy.filter.entity) {
      delete requestCopy.filter;
    }

    this.blockButtons = true;
    requestCopy.domain_type = 'api';

    this.logsService
      .requestLogs(requestCopy)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          this.loading = false;
          this.blockButtons = false;
          this.serverErrors = {};
          this.utilsService.fetchErrorsTo(res, this.serverErrors);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, ' Logs are requested');
        this.loadLogs(true);
        this.logsRequest = new LogsRequest();
        this.blockButtons = false;
        this.canceNewLogsPopUpData();
        this.formTouched = false;
      });
  }

  // Get logs
  private getLogs(log: any): void {
    const request = JSON.parse(JSON.stringify(this.queryRequest));

    request.log = log.log_id;

    delete request.where_clause;

    this.logsService
      .getLogs(request)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          log.loading = false;
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe(logs => {
        log.items = logs.processed;
        log.loading = false;
        this.loading = false;
      });
  }

  // Hide popup
  public canceNewLogsPopUpData(): void {
    this.activeLogsPopUp = false;
    this.logsRequest = new LogsRequest();
    this.stylesService.popUpDisactivated();
  }

  // Download log file
  public downloadFile(logId: string, queryId: string): void {
    this.privateFilesHelperService.downloadFile(
      PRIVATE_CDN_URL('/logs/queries/' + logId + '/' + queryId + '.csv'),
      logId + '.csv'
    );
  }

  /**
   * Added to remove error from html template.
   * @todo refactor
   */
  public onLogType(event: any): void {
    this.logsRequest.domain = event.id;
  }

  /**
   * Added to remove error from html template.
   * @todo refactor
   */
  public onCaseSelect(event: any): void {
    this.logsRequest.filter.entity = event.id;
  }

  // Generate items for select list
  private generateSelectList(): any {
    return {
      appTypes: [
        {
          id: 'app',
          text: 'App'
        },
        {
          id: 'manage',
          text: 'Manage'
        }
      ],
      manageFilterTypes: [
        {
          id: 'all',
          text: 'No Filter'
        },
        {
          id: 'email',
          text: 'By Email'
        }
      ],
      appFilterTypes: [
        {
          id: 'all',
          text: 'No Filter'
        },
        {
          id: 'email',
          text: 'By Email'
        },
        {
          id: 'case_id',
          text: 'By Case'
        }
      ],
      entities: {
        case_id: []
      }
    };
  }
}
