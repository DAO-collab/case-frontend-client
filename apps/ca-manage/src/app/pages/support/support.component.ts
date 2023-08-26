import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, first, switchMap, takeUntil, tap } from 'rxjs/operators';

import { PopInNotificationConnectorService } from '../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { TicketsService } from '../../services/tickets.service';
import { AdminService } from '../../services/admin.service';
import { UsersService } from '../users/services/users.service';
import { IUser } from '../users/models/user.model';

export enum Statuses {
  Closed,
  Open
}

export enum ModuleNames {
  Support = 'support'
}

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit, OnDestroy {
  isLoading = true;
  tickets: any[] = [];
  hostId?: string;
  ticket?: any;
  users: IUser[] = [];
  ticketStatus: Statuses = Statuses.Open;
  status = Statuses;
  moduleNames = ModuleNames;

  private destroy = new Subject<void>();
  private getItems$ = new BehaviorSubject(this.ticketStatus);

  constructor(
    public ticketsService: TicketsService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private notificationConnectorService: PopInNotificationConnectorService,
    private adminService: AdminService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.hostId = window.location.host.slice(0, window.location.host.indexOf('.'));

    this.getTickets();

    this.usersService
      .fetchUsers()
      .pipe(
        takeUntil(this.destroy),
        tap(res => (this.users = res?.items))
      )
      .subscribe();

    this.route.queryParams.pipe(first()).subscribe(params => {
      if (params['module_name'] && params['id'] && params['action']) {
        this.getAllTickets(params);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  saveNewTicket(ticket: UntypedFormGroup): void {
    const notification = this.notificationConnectorService.addNotification({ title: 'Creating Ticket' });
    const data = ticket.getRawValue();

    delete data.phone_number;

    this.ticketsService
      .postTicket(this.hostId!, data)
      .pipe(
        takeUntil(this.destroy),
        catchError(err => {
          this.notificationConnectorService.failed(notification, err.error.message);

          return throwError(err.error);
        }),
        tap(() => {
          this.ticketsService.isCreatePopupOpened.next(false);
          this.notificationConnectorService.ok(notification, 'Ticket Created');
          this.getItems$.next(this.ticketStatus);
        })
      )
      .subscribe();
  }

  closeModal(): void {
    this.ticketsService.isCreatePopupOpened.next(false);
  }

  showLocalDate(date: Date): Date {
    return new Date(date);
  }

  getUserAvatar(userId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.adminService.getAvatarUrl('30', userId));
  }

  showUserName(userId: string): string | void {
    if (!this.users.length) {
      return;
    }

    const userInfo = this.users.filter(user => user.user_id === userId)[0];

    return userInfo.given_name + ' ' + userInfo.family_name;
  }

  showUserEmail(userId: string): string | void {
    if (!this.users.length) {
      return;
    }

    const userInfo = this.users.filter(user => user.user_id === userId)[0];

    return userInfo.email;
  }

  viewTicket(ticket: any): void {
    this.ticket = ticket;
  }

  closeViewTicketModal(): void {
    this.ticket = null;
  }

  postTicketComment(comment: string): void {
    const notification = this.notificationConnectorService.addNotification({ title: 'Creating Comment' });

    this.ticketsService
      .postTicketComment(this.hostId!, this.ticket.ticket_id, { message: comment })
      .pipe(
        takeUntil(this.destroy),
        catchError(err => {
          this.notificationConnectorService.failed(err.message);

          return throwError(err);
        }),
        tap(() => {
          this.getItems$.next(this.ticketStatus);
          this.notificationConnectorService.ok(notification, 'Comment Posted');
        })
      )
      .subscribe();
  }

  closeTicket(ticket: any): void {
    const status = ticket.status ? 0 : 1;
    const notification = this.notificationConnectorService.addNotification({ title: 'Updating Ticket' });

    this.ticketsService
      .putTicket(this.hostId!, ticket.ticket_id, { status })
      .pipe(
        takeUntil(this.destroy),
        catchError(err => {
          this.notificationConnectorService.failed(notification, err.error.message);

          return throwError(err);
        }),
        tap(() => {
          ticket.status = status;
          this.notificationConnectorService.ok(notification, 'Ticket Updated');
          if (status === this.status.Open) {
            this.ticketStatus = status;
          }
          this.isLoading = true;
          this.getItems$.next(this.status.Open);
        })
      )
      .subscribe();
  }

  toggleTicketStatus(status: any): void {
    if (status !== this.ticketStatus) {
      this.ticketStatus = status;
      this.isLoading = true;

      this.getItems$.next(status);
    }
  }

  private getTickets(): void {
    this.getItems$
      .asObservable()
      .pipe(
        takeUntil(this.destroy),
        debounceTime(200),
        switchMap(status => this.getTickets$(status))
      )
      .subscribe();
  }

  private getTickets$(status: any): Observable<any> {
    return this.ticketsService.getTickets(this.hostId!, status).pipe(
      takeUntil(this.destroy),
      tap(res => {
        this.tickets = res?.items;
        this.isLoading = false;

        if (this.ticket) {
          this.ticket = this.tickets.filter(ticket => ticket.ticket_id === this.ticket.ticket_id)[0];
        }
      })
    );
  }

  private getAllTickets(params: any): void {
    combineLatest([
      this.ticketsService.getTickets(this.hostId!, (this.status.Open as any)),
      this.ticketsService.getTickets(this.hostId!, (this.status.Closed as any))
    ])
      .pipe(
        takeUntil(this.destroy),
        tap(([openTickets, closedTickets]) => this.openDirectLink([openTickets.items, closedTickets.items], params))
      )
      .subscribe();
  }

  private openDirectLink([openTickets, closedTickets]: any, params: any): void {
    let itemForView;

    if (params.module_name === this.moduleNames.Support) {
      itemForView = { ...openTickets.find((ticket: any) => ticket.ticket_id === params.id) } ?? {
        ...closedTickets.find((ticket: any) => ticket.ticket_id === params.id)
      };
    }

    if (!itemForView) {
      return;
    }

    this.ticket = itemForView;

    if (params.index) {
      this.ticket.higlightIndex = params.index;
    }
  }
}
