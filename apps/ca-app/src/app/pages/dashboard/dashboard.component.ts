import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { combineLatest, Subject, throwError } from 'rxjs';
import { catchError, first, takeUntil, tap } from 'rxjs/operators';
import { AppLocation, Broadcast, Case, Ticket, IDefaultResponse, WhoAmIResponse, WhoAmI } from '@app/interfaces';

import { DashboardService } from '../../services/dashboard.service';
import { environment } from '../../../environments/environment';
import { PopInNotificationConnectorService } from '../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { UserService } from '../../services/user.service';
import { HostService } from '../../services/host.service';

export enum Statuses {
  Closed,
  Open
}

export enum ModuleNames {
  Support = 'support'
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  statuses = Statuses;
  moduleNames = ModuleNames;
  broadcasts: Broadcast[] = [];
  locations: AppLocation[] = [];
  cases: Case[] = [];
  tickets: Ticket[] = [];
  isLoading = true;
  broadcastForView: Broadcast | null = null;
  ticketForView: Ticket | null = null;
  selectedTicketStatus?: Statuses;
  selectedCasesStatus?: Statuses;
  ticketsCount: { open: number, openTickets: Ticket[], closed: number; closedTickets: Ticket[] } = { open: 0, openTickets: [], closed: 0, closedTickets: [] };
  casesCount: { open: number, openCases: Case[], closed: number; closedCases: Case[] } = { open: 0, openCases: [], closed: 0, closedCases: [] };
  locationSliderIndex = 0;
  ticketsSliderIndex = 0;
  search: any = { cases: '', tickets: '', broadcasts: '' };
  isCreateNewTicketModalOpened = false;
  currentUser!: WhoAmI;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private title: Title,
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private notificationsService: PopInNotificationConnectorService,
    private userService: UserService,
    private hostService: HostService
  ) {}

  ngOnInit(): void {
    this.selectedTicketStatus = this.statuses.Open;
    this.selectedCasesStatus = this.statuses.Open;

    combineLatest([
      this.dashboardService.getTickets(this.statuses.Open),
      this.dashboardService.getTickets(this.statuses.Closed),
      this.dashboardService.getBroadcasts(),
      this.dashboardService.getLocations(),
      this.dashboardService.getCases(this.statuses.Open),
      this.dashboardService.getCases(this.statuses.Closed),
      this.userService.getAuthStatus()
    ])
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(([openTickets, closedTickets, broadcasts, locations, openCases, closedCases, currentUser]) => {
          this.ticketsCount.open = (openTickets as IDefaultResponse<Ticket[]>).items.length;
          this.ticketsCount.closed = (closedTickets as IDefaultResponse<Ticket[]>).items.length;
          this.ticketsCount.openTickets = (openTickets as IDefaultResponse<Ticket[]>).items;
          this.ticketsCount.closedTickets = (closedTickets as IDefaultResponse<Ticket[]>).items;
          this.tickets = [...this.ticketsCount.openTickets];

          this.broadcasts = (broadcasts as IDefaultResponse<Broadcast[]>).items;

          this.locations = (locations as IDefaultResponse<AppLocation[]>).items;

          this.casesCount.open = (openCases as IDefaultResponse<Case[]>).items.length;
          this.casesCount.closed = (closedCases as IDefaultResponse<Case[]>).items.length;
          this.casesCount.openCases = (openCases as IDefaultResponse<Case[]>).items.map((item: Case) => ({
            ...item,
            name: item.case_tag_id.slice(item.case_tag_id.indexOf('::') + 2),
          }));
          this.casesCount.closedCases = (closedCases as IDefaultResponse<Case[]>).items.map((item: Case) => ({
            ...item,
            name: item.case_tag_id.slice(item.case_tag_id.indexOf('::') + 2),
          }));
          this.cases = [...this.casesCount.openCases];

          this.currentUser = (currentUser as WhoAmIResponse).data;

          this.isLoading = false;

          this.openDirectLink();
        })
      )
      .subscribe();

    this.title.setTitle(`${this.hostService.appName} | Dashboard`);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  showLocalDate(date: Date): Date | string {
    if (date) {
      return new Date(date);
    }
    return '';
  }

  getLocationMap(location: AppLocation): string {
    return (
      'https://maps.googleapis.com/maps/api/staticmap?center=' +
      location.address.split(', ').join(',').split(' ').join('+') +
      '&zoom=13&size=545x646&key=' +
      environment.GOOGLE_CLOUD_PUBLIC_API_KEY +
      `&markers=${location.address}`
    );
  }

  redirectGoogleMap(address: string): void {
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${address}&destination=${address}`, '_blank');
  }

  toggleLayout(event: Event, elClass: string, isLeftClick = true): void {
    const element = (event.target as HTMLElement)?.closest('.items-wrapper')?.querySelector(elClass) as HTMLElement;

    if (!element) {
      return;
    }

    const style = getComputedStyle(element),
      marginLeft = +style.marginLeft.slice(0, -2),
      width = +style.width.slice(0, -2),
      step = 50;

    if (isLeftClick && -(marginLeft + step) <= width + marginLeft) {
      this.renderer.setStyle(element, 'margin-left', marginLeft - step + 'px');
    } else if (!isLeftClick && marginLeft + step <= 0) {
      this.renderer.setStyle(element, 'margin-left', marginLeft + step + 'px');
    }
  }

  locationsSlider(isLeftClick = true): void {
    if (isLeftClick && this.locationSliderIndex > 0) {
      this.locationSliderIndex--;
    } else if (!isLeftClick && this.locationSliderIndex < this.locations.length - 1) {
      this.locationSliderIndex++;
    }
  }

  ticketsSlider(isLeftClick = true): void {
    const step = 4,
      selectedTickets = this.tickets.filter((ticket) => this.selectedTicketStatus === ticket.status);

    if (isLeftClick && this.ticketsSliderIndex - step >= 0) {
      this.ticketsSliderIndex -= step;
    } else if (!isLeftClick && this.ticketsSliderIndex + step < selectedTickets.length) {
      this.ticketsSliderIndex += step;
    }
  }

  selectCase(caseItem: Case): void {
    this.dashboardService.selectedCase.next(caseItem.name);
    this.router.navigate(['/feed']);
  }

  viewBroadcast(broadcast: Broadcast): void {
    this.broadcastForView = broadcast;
  }

  closeBroadcastModal(): void {
    this.broadcastForView = null;
  }

  viewTicket(ticket: Ticket): void {
    this.ticketForView = ticket;
  }

  closeTicketModal(): void {
    this.ticketForView = null;
  }

  filterValue(status: Statuses): void {
    if (status !== this.selectedTicketStatus) {
      this.selectedTicketStatus = status;
      this.ticketsSliderIndex = 0;

      this.tickets =
        this.selectedTicketStatus === this.statuses.Open
          ? [...this.ticketsCount.openTickets]
          : [...this.ticketsCount.closedTickets];
    }
  }

  updateSearchValue(value: string, category: string): void {
    this.search[category] = value;
  }

  filterItems(item: Ticket | Broadcast | Case, category: string): any {
    if (this.search[category].length < 1) {
      return item;
    }

    switch (category) {
      case 'tickets':
      case 'broadcasts':
        return (item as Broadcast | Ticket).title.includes(this.search[category].toLowerCase());
      case 'cases':
        return (item as Case).name.includes(this.search[category].toLowerCase());
    }
  }

  filterCases(status: Statuses): void {
    if (this.selectedCasesStatus !== status) {
      this.selectedCasesStatus = status;

      !this.selectedCasesStatus
        ? (this.cases = [...this.casesCount.closedCases])
        : (this.cases = [...this.casesCount.openCases]);
    }
  }

  postTicketComment(comment: string): void {
    const notification = this.notificationsService.addNotification({ title: 'Creating Comment' });

    this.dashboardService
      .postTicketComment(this.ticketForView!.ticket_id, { message: comment })
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(err => {
          this.notificationsService.failed(err.message);

          return throwError(err);
        }),
        tap(() => {
          this.getTickets();
          this.notificationsService.ok(notification, 'Comment Posted');
        })
      )
      .subscribe();
  }

  openCreateNewTicketModal(): void {
    this.isCreateNewTicketModalOpened = true;
  }

  closeCreateNewTicketModal(): void {
    this.isCreateNewTicketModalOpened = false;
  }

  saveNewTicket(ticket: UntypedFormGroup): void {
    const notification = this.notificationsService.addNotification({ title: 'Creating Ticket' });
    const data = ticket.getRawValue();

    this.dashboardService
      .postTicket(data)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(err => {
          this.notificationsService.failed(notification, err.error.message);

          return throwError(err.error);
        }),
        tap(() => {
          this.isCreateNewTicketModalOpened = false;
          this.notificationsService.ok(notification, 'Ticket Created');
          this.getTickets();
        })
      )
      .subscribe();
  }

  closeTicket(ticket: Ticket): void {
    const status = ticket.status ? 0 : 1;
    const notification = this.notificationsService.addNotification({ title: 'Updating Ticket' });

    this.dashboardService
      .putTicket(ticket.ticket_id, { status })
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(err => {
          this.notificationsService.failed(notification, err.error.message);

          return throwError(err);
        }),
        tap(() => {
          this.getTickets();
          if (status === this.statuses.Open) {
            setTimeout(() => {
              this.filterValue(status);
            }, 1000);
          }
          this.notificationsService.ok(notification, 'Ticket Updated');
        })
      )
      .subscribe();
  }

  private getTickets(): void {
    combineLatest([
      this.dashboardService.getTickets(this.statuses.Open),
      this.dashboardService.getTickets(this.statuses.Closed)
    ])
      .pipe(
        takeUntil(this.unsubscribe$),
        tap(([openTickets, closedTickets]) => {
          this.ticketsCount.open = openTickets.items.length;
          this.ticketsCount.closed = closedTickets.items.length;
          this.ticketsCount.openTickets = openTickets.items;
          this.ticketsCount.closedTickets = closedTickets.items;

          this.tickets =
            this.selectedTicketStatus === this.statuses.Open
              ? [...this.ticketsCount.openTickets]
              : [...this.ticketsCount.closedTickets];

          if (this.ticketForView) {
            this.ticketForView = this.tickets.filter((ticket) => ticket.ticket_id === this.ticketForView?.ticket_id)[0];
          }
        })
      )
      .subscribe();
  }

  private openDirectLink(): void {
    this.route.queryParams.pipe(takeUntil(this.unsubscribe$), first()).subscribe(params => {
      if (!(params['module_name'] && params['id'] && params['action'])) {
        return;
      }

      let itemForView!: Ticket;

      if (params['module_name'] === this.moduleNames.Support) {
        // @ts-ignore
        itemForView = { ...this.ticketsCount.openTickets.find(ticket => ticket.ticket_id === params['id']) } ?? {
          // @ts-ignore
          ...this.ticketsCount.closedTickets.find(ticket => ticket.ticket_id === params['id'])
        };
      }

      if (!itemForView) {
        return;
      }

      this.ticketForView = itemForView;

      if (params['index']) {
        (this.ticketForView as any).higlightIndex = params['index'];
      }
    });
  }
}
