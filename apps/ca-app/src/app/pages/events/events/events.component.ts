import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Observable, Subscription } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { CaseStatus } from '@app/types';

import { environment } from '../../../../environments/environment';
import { EventsService } from '../../../services/events.service';
import { CasesService } from '../../../services/cases.service';
import { UserService } from '../../../services/user.service';
import { GarbageCollectorService } from '../../../services/garbage-collector.service';
import { StylesService } from '../../../services/styles.service';
import { UtilsService } from '../../../services/utils.service';
import { EventCreateComponent } from '../event-create/event-create.component';
import { HostService } from '../../../services/host.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css'],
  providers: [DatePipe]
})
export class EventsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(EventCreateComponent)
  public eventCreateComponent?: EventCreateComponent;
  public upcomingEvents: any = [];
  public showPendingEvents = true;
  public showConfirmedEvents = false;
  public showAllEvents = false;
  public showMyEvents = false;
  public teamData: any = {};
  public loading = true;
  public permissions: { [key: string]: string } = {};
  public showModal = false;
  public locationLink: string[] = [];
  public modalTitle = 'Add Event';
  public myEventChecked = false;
  public caseId: string = '';
  public eventId: string = '';
  public showCreatedByMe = false;
  public isEventViewOpened = false;
  public selectedEventForView = null;
  public subscribers: Subscription[] = [];
  public userId: string = '';
  public viewEventId = null;
  public shouldViewEventAttendingOpen = false;
  public currentCaseStatus$: Observable<CaseStatus | undefined>;
  public showLoadMore: boolean = false;
  public newElementsSectionIsLoading = false;

  private privateCDN: string = environment.PRIVATE_CDN_URL;
  private componentActive = true;
  private contentOnloadFnList: any[] = [];
  private userData: any;
  private isFirstOpenFromEmail = false;
  private routeCaseId = '';
  private routeEventId = '';
  private limitIncrease: number = 50;
  private limit: number = this.limitIncrease;
  private loadedResponseIds: string[] = [];

  day?: string;
  date?: number;

  constructor(
    public utilsService: UtilsService,
    private eventsService: EventsService,
    private casesService: CasesService,
    private userService: UserService,
    private garbageCollectorService: GarbageCollectorService,
    private stylesService: StylesService,
    private hostService: HostService,
    private titleService: Title,
    private activateRoute: ActivatedRoute,
    private router: Router
  ) {
    this.currentCaseStatus$ = this.casesService.activeCaseObs$.pipe(map(data => data?.status));
  }

  ngOnInit(): void {
    const d = new Date();
    const weekday = new Array(7);
    weekday[0] = 'SUN';
    weekday[1] = 'MON';
    weekday[2] = 'TUE';
    weekday[3] = 'WED';
    weekday[4] = 'THU';
    weekday[5] = 'FRI';
    weekday[6] = 'SAT';
    this.day = weekday[d.getDay()];
    this.date = d.getDate();
    this.titleService.setTitle(`${this.hostService.appName} | Events`);
    this.stylesService.popUpDisactivated();
    this.subscribers.push(
      this.casesService.getCaseId.subscribe(res => {
        if (!this.componentActive) {
          return;
        }
        this.caseId = res['case_id'];
        this.activateRoute.queryParams.subscribe(params => {
          this.routeCaseId = params['case'] || '';
          this.routeEventId = params['event'] || '';

          const elementsForChecking = ['case=', 'id=', 'action='];
          const resultValue = elementsForChecking.every(item => this.router.url.includes(item));

          // prevent initial download of events, when we have direct link
          if (!resultValue) {
            if (this.routeEventId) {
              this.isFirstOpenFromEmail = true;
              this.loadPendingEvents();
            } else {
              this.loadEvents();
            }
          }
        });
      })
    );

    if (this.userService.rolesPermissions[this.caseId]) {
      this.permissions = {};
      this.userService.rolesPermissions[this.caseId].data.permissions.events.map((v: any) => {
        this.permissions[v] = v;
      });
    }

    if (this.userService.casePermissionsData) {
      this.permissions = {};

      this.userService.casePermissionsData.role.permissions.events.map((v) => {
        this.permissions[v] = v;
      });
    }

    this.subscribers.push(
      this.userService.getCasePermissionsData.subscribe(data => {
        this.permissions = {};

        data.role.permissions.events.map((v) => {
          this.permissions[v] = v;
        });
      })
    );

    this.subscribers.push(
      this.userService.getTeamData.subscribe(data => {
        data?.items.map((usr) => {
          this.teamData[usr.user_id] = usr;
        });
      })
    );

    this.subscribers.push(
      this.eventsService.createEventModalState.subscribe(r => {
        this.openModal(true, '', 'Add Event');
      })
    );

    this.subscribers.push(
      this.garbageCollectorService.destroyCommand.subscribe(() => {
        this.ngOnDestroy();
      })
    );

    this.userData = this.userService.userData;
    this.userId = this.userData.user_id;

    if (!this.userData) {
      this.subscribers.push(
        this.userService.getUserData.subscribe(resp => {
          if (!this.componentActive) {
            return;
          }

          this.userData = resp;
          this.userId = this.userData.user_id;
        })
      );
    }

    // add global click event listener, to close all feeds context menus
    document.addEventListener('click', event => {
      if (!(event.target as HTMLElement)['closest']('.event-settings')) {
        this.closeMenus('.event-settings');
      }
      if (!(event.target as HTMLElement)['closest']('.event-attending')) {
        this.closeMenus('.event-attending');
      }
    });
  }

  ngAfterViewInit() {
    this.subscribers.push(
      this.eventsService.eventDirectLinkSubject
        .asObservable()
        .pipe(delay(1000))
        .subscribe(res => {
          if (res?.id) {
            if (res?.action === 'submit') {
              this.shouldViewEventAttendingOpen = true;
            }

            this.loadAllEvents(res.id);
            this.eventsService.eventDirectLinkSubject.next(null);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.componentActive = false;
    this.subscribers.map((ev) => {
      ev.unsubscribe();
    });

    this.upcomingEvents = [];
  }

  private closeMenus(menuClass: string) {
    const allMenus = document.querySelectorAll(menuClass);

    for (let i = 0; i < allMenus.length; i++) {
      allMenus[i].classList.remove('expanded');
    }
  }

  // Loading pending events
  public loadPendingEvents(): void {
    this.loading = true;
    this.renderEvents(this.caseId, 'upcoming');
    this.showPendingEvents = true;
    this.showConfirmedEvents = false;
    this.showAllEvents = false;
    this.showMyEvents = false;
    this.limit = this.limitIncrease;
  }

  // Loading confirmed events
  public loadConfirmedEvents(): void {
    this.loading = true;
    this.renderEvents(this.caseId, 'past');
    this.showConfirmedEvents = true;
    this.showPendingEvents = false;
    this.showAllEvents = false;
    this.showMyEvents = false;
    this.limit = this.limitIncrease;
  }

  // Loading all events
  public loadAllEvents(id?: any): void {
    this.loading = true;
    this.renderEvents(this.caseId, 'all', id);
    this.showAllEvents = true;
    this.showConfirmedEvents = false;
    this.showPendingEvents = false;
    this.showMyEvents = false;
    this.limit = this.limitIncrease;
  }

  // Loading my events
  public loadMyEvents(): void {
    this.loading = true;
    this.renderEvents(this.caseId, 'all');
    this.showMyEvents = true;
    this.showAllEvents = true;
    this.showConfirmedEvents = false;
    this.showPendingEvents = false;
    this.limit = this.limitIncrease;
  }

  public loadMoreEvents(): void {
    this.limit += this.limitIncrease;
    this.newElementsSectionIsLoading = true;

    if (this.showAllEvents) {
      this.renderEvents(this.caseId, 'all')
    } else if (this.showConfirmedEvents) {
      this.renderEvents(this.caseId, 'past')
    } else if (this.showPendingEvents) {
      this.renderEvents(this.caseId, 'upcoming')
    }
  }

  loadingComboEvents() {
    this.myEventChecked = !this.myEventChecked;
    this.myEventChecked ? this.loadMyEvents() : this.loadAllEvents();
  }

  // Deleting event
  public deleteEvent(eventsGroup: any, ind: number, group: any, pid: any): void {
    const event = eventsGroup.dayEvents[ind],
      removedEvent = eventsGroup.dayEvents.splice(ind, 1);

    let removedGroup: any;

    if (eventsGroup.dayEvents.length === 0) {
      removedGroup = group.splice(pid, 1);
    }

    this.subscribers.push(
      this.eventsService.deleteEvent(this.caseId, event.event_id).subscribe(
        () => {},
        err => {
          if (removedGroup) {
            group.unshift(removedGroup);
          }

          eventsGroup.dayEvents.unshift(removedEvent);
        }
      )
    );
  }

  // Attend on event
  public attendEvent(status: any, event: any, e: any): void {
    e.stopPropagation();
    e.preventDefault();

    const userResponse = 
      event.attending?.find((el: any) => el.user_id === this.userId) ||
      event.maybeattending?.find((el: any) => el.user_id === this.userId) ||
      event.notattending?.find((el: any) => el.user_id === this.userId);

    if (userResponse) {
      this.subscribers.push(
        this.eventsService
          .updateEventConfirmation(this.caseId, event.event_id, userResponse.response_id, { rsvp: status })
          .subscribe(() => window.location.reload())
      );
    } else {
      this.subscribers.push(
        this.eventsService
          .postEventConfirmation(this.caseId, event.event_id, { rsvp: status })
          .subscribe(() => window.location.reload())
      );
    }
  }

  // Handling render loaded events by type
  public loadEvents(): void {
     if (this.showPendingEvents) {
      this.loadPendingEvents();
    } else if (this.showConfirmedEvents) {
      this.loadConfirmedEvents();
    } else if (this.showAllEvents) {
      this.loadAllEvents();
    } else if (this.showMyEvents) {
      this.loadMyEvents();
    }
  }

  loadEventAnswers($event: boolean, event: any, isSkipCheck = false): void {
    if ((!$event || this.loadedResponseIds.includes(event.event_id)) && !isSkipCheck) {
      return;
    }

    this.loadedResponseIds.push(event.event_id);
    this.subscribers.push(
      this.eventsService.getEventConfirmation(this.caseId, event.event_id).subscribe(res => {
        event.attending = [];
        event.notattending = [];
        event.maybeattending = [];
        event.userAnswered = false;

        if (res?.items && Object.keys(res.items).length) {
          res?.items.forEach((element: any) => {
            if (element.response.rsvp === 'yes') {
              event.attending.push(element);
            } else if (element.response.rsvp === 'maybe') {
              event.maybeattending.push(element);
            } else if (element.response.rsvp === 'no') {
              event.notattending.push(element);
            } else {
              event.userAnswered = false;
            }
          });
        }
      })
    );
  }


  // Rendering events
  private renderEvents(caseId: string, filterValue: string, id?: number): void {
    const onsuccess = (events: any) => {
      this.showLoadMore = !!events?.nextLink;
      let renderdEventsList: any = this.renderEventsListByDays(events.items);
      renderdEventsList = renderdEventsList
        .map((dg: any, i: number) => {
          return dg.dayEvents.length ? dg : null;
        })
        .filter((v: any) => v);
      if (renderdEventsList.length) {
        this.showCreatedByMe = true;
      }
      this.upcomingEvents = renderdEventsList;
      this.loading = false;
      this.newElementsSectionIsLoading = false;

      // Load tasks
      this.upcomingEvents.map((eventsGroup: any) => {
        eventsGroup.dayEvents.map((event: any) => {
          event.createdOwn = event.user_id === this.userId;

          if (this.viewEventId && this.viewEventId === event.event_id) {
            this.selectedEventForView = event;
          }

          if (id === event.event_id) {
            this.openEventViewModal(event);
          }
        });
      });

      this.contentOnloadFnList = [];
    };

    this.contentOnloadFnList.map((v, i) => {
      this.contentOnloadFnList[i].canRun = false;
    });

    const ln = this.contentOnloadFnList.length,
      obj = {
        canRun: true,
        fn: (events: any) => {
          if (obj.canRun) {
            onsuccess(events);
          }
        }
      };

    this.contentOnloadFnList.push(obj);

    this.subscribers.push(
      this.eventsService.getEvents(caseId, filterValue, this.limit).subscribe(
        (events: any) => {
          if (!this.componentActive) {
            return;
          }

          this.loadedResponseIds = [];
          this.upcomingEvents = [];
          this.contentOnloadFnList[ln].fn(events);

          if (this.isFirstOpenFromEmail) {
            setTimeout(() => {
              let linkedEvent = null;
              this.upcomingEvents.map((eventGroup: any) => {
                eventGroup.dayEvents.map((event: any) => {
                  if (event.event_id === this.routeEventId) {
                    linkedEvent = event;
                  }
                });
              });
              this.isFirstOpenFromEmail = false;
              if (linkedEvent) {
                this.openModal(false, linkedEvent, 'View Event');
              }
            }, 1500);
          }
        },
        () => {
          this.loading = false;
          this.upcomingEvents = [];
        }
      )
    );
  }

  //Open event view modal
  public openEventViewModal(event: any) {
    this.isEventViewOpened = true;
    this.selectedEventForView = event;
  }

  public closeEventViewModal() {
    this.isEventViewOpened = false;
    this.viewEventId = null;
    this.selectedEventForView = null;
    this.shouldViewEventAttendingOpen = false;
  }

  // Open event modal window
  public openModal(isEventEdit: any, event?: any, title?: string): void {
    this.eventCreateComponent?.refreshModal();
    this.eventCreateComponent!.isEventEdit = isEventEdit;

    if (event) {
      this.eventId = event.event_id;
      this.eventCreateComponent?.editEvent(event);

      if (!isEventEdit) {
        this.eventCreateComponent?.disableForm();
      }
    } else {
      this.eventCreateComponent?.createEventForm();
      this.eventCreateComponent?.setFormDefaults();
      this.eventCreateComponent?.resetStartDateTime();
    }

    this.eventCreateComponent?.loadLocations(this.caseId);
    this.modalTitle = title || 'Add Event';
    this.showModal = true;
    this.eventCreateComponent!.isOpened = this.showModal;
  }

  // Close event modal window
  public closeModal(): void {
    this.stylesService.popUpDisactivated();
    this.showModal = false;
    this.eventCreateComponent!.isOpened = this.showModal;
    this.eventId = '';
    this.modalTitle = 'Add Event';
  }

  // Sort and rendering events by days
  private renderEventsListByDays(items: any): any[] {
    const returnRecentEventsList: any[] = [],
      eventsByDate: any = {};

    items
      .sort((a: any, b: any) => {
        const aD = new Date(a),
          bD = new Date(b);

        return aD < bD ? -1 : 1;
      })
      .map((r: any) => {
        const createdDate = r.start_date.split('T')[0];

        if (!eventsByDate[createdDate]) {
          eventsByDate[createdDate] = [];
        }

        eventsByDate[createdDate].push(r);
      });

    const keys = Object.keys(eventsByDate);

    // Push events ARRAYS grouped by day to events array
    keys.map(k => {
      const dayGroup = {
        day: k,
        dayEvents: eventsByDate[k]
      };

      returnRecentEventsList.push(dayGroup);
    });

    return returnRecentEventsList;
  }

  public toggleMenuClass(event: MouseEvent): void {
    this.closeMenus('.event-settings');
    this.closeMenus('.event-attending');
    (event.currentTarget as HTMLElement).classList.toggle('expanded');
  }

  // Generate image for map link
  public formatMapLink(event: any): string {
    if (event.map_key) {
      return this.privateCDN + '/' + event.map_key;
    } else {
      return (
        'https://maps.googleapis.com/maps/api/staticmap?center=' +
        event.location.address.split(', ').join(',').split(' ').join('+') +
        '&zoom=13&size=260x140&key=' +
        environment.GOOGLE_CLOUD_PUBLIC_API_KEY
      );
    }
  }

  // Generation link for click event map (Google Places)
  public formatLocationLink(address: any): string {
    return `https://www.google.com/maps/dir/?api=1&origin=${address}&destination=${address}`;
  }

  // Redirect to the GoogleMap
  public redirectGoogleMap(address: any): void {
    // window.open(`https://www.google.com/maps/dir/?api=1&origin=${address}&destination=${address}`, '_blank');
    window.open(`https://maps.google.com/?q=${address}`, '_blank');
  }

  public openLink(link: any): void {
    link.startsWith('http://') || link.startsWith('https://')
      ? window.open(link, '_blank')
      : window.open(`http://${link}`, '_blank');
  }

  // Comparing event start and end dates for type showing
  public compareEventDates(startDateTime: any, endDateTime: any): boolean {
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return startDate.getTime() === endDate.getTime() ? true : false;
  }

  //We need to update event, after user change attending in event view
  public updateEvents(event: any) {
    this.viewEventId = event.event_id;

    this.loadEventAnswers(true, event, true);
  }
}
