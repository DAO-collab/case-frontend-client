import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { HostService } from '../../../services/host.service';
import {
  PopInNotificationConnectorService,
  Notification
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { UsersService } from '../services/users.service';
import { IUserCase } from '../models/user-case.interface';
import { ECaseStatus } from '../enums/case-status.enum';

@Component({
  selector: 'app-view-cases',
  templateUrl: './view-cases.component.html',
  styleUrls: ['./view-cases.component.css']
})
export class ViewCasesComponent implements OnInit, OnDestroy {
  public userId$: Observable<string | null> = this.activatedRoute.paramMap.pipe(
    map(param => {
      const userId = param.get('user_id');
      this.userId = userId!;
      return userId;
    })
  );
  public userCases$: Observable<IUserCase[]> = this.userId$.pipe(
    switchMap(userId => this.usersService.getCaseByUserId(userId!)),
    tap(() => {
      this.loading$.next(false);
    }),
    catchError(res => {
      this.loading$.next(false);
      return throwError(res.error);
    })
  );
  public loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  public caseStatuses: ECaseStatus[] = [ECaseStatus.Closed, ECaseStatus.Active];

  private userId?: string;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private hostService: HostService,
    private usersService: UsersService,
    private notificationConnectorService: PopInNotificationConnectorService
  ) {}

  public ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Users`);
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public removeCase(userCase: IUserCase): void {
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: 'Removing User'
    });

    this.usersService
      .deleteCaseRelation(userCase.case_id, this.userId!)
      .pipe(
        takeUntil(this.destroy$),
        catchError(res => {
          this.loading$.next(false);
          this.notificationConnectorService.failed(notification, 'Failed.');
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.loading$.next(false);
        this.notificationConnectorService.ok(notification, 'Done.');
      });
  }

  copyText(): void {
    navigator.clipboard.writeText(this.userId!).then();
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: `User ID Copied`
    });
    this.notificationConnectorService.ok(notification, 'ok');
  }
  copyCaseId(selCase: any) {
    navigator.clipboard.writeText(selCase.case_id).then();
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: `Case ID Copied`
    });
    this.notificationConnectorService.ok(notification, 'ok');
  }
}
