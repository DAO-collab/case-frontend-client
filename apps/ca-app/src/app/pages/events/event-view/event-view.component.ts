import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CaseStatus } from '@app/types';
import { Team } from '@app/interfaces';
import { UtilsService } from '../../../services/utils.service';
import { EventsService, IEventAnswers } from '../../../services/events.service';
import { UserService } from '../../../services/user.service';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { CasesService } from '../../../services/cases.service';

@Component({
  selector: 'app-event-view',
  templateUrl: './event-view.component.html',
  styleUrls: ['./event-view.component.css']
})
export class EventViewComponent implements OnInit {
  @Input() event: any = null;
  @Input() teamData: { [key: string]: Team } | null = null;
  @Input() permissions: { [key: string]: string } | null = null;
  @Input() subscribers: Subscription[] | null = null;
  @Input() caseId: string | null = null;
  @Input() userId: string | null = null;
  @Input() shouldViewEventAttendingOpen = false;

  @Output() closeEventPreview: EventEmitter<boolean> = new EventEmitter();
  @Output() attendingEvent: EventEmitter<string> = new EventEmitter();

  public showAttending = false;
  public showAddToCalendar = false;
  public icsCalendarLink: any = null;
  public currentCaseStatus$: Observable<CaseStatus | undefined>;

  private privateCDN: string = environment.PRIVATE_CDN_URL;

  constructor(
    public utilsService: UtilsService,
    private eventsService: EventsService,
    private userService: UserService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private casesService: CasesService
  ) {
    this.currentCaseStatus$ = this.casesService.activeCaseObs$.pipe(map(data => data?.status));
  }

  ngOnInit(): void {
    this.closeDropdownOutside();
    //We need to generate link for iCal calendar, before user can download it, or he get an error
    this.addToCalendar('iCal');

    if (this.shouldViewEventAttendingOpen) {
      this.toggleAttendingDropdown();
    }
  }

  public calculateDuration(): string | void {
    const startTime = new Date(this.event.start_date).toLocaleTimeString('en-US', { hour12: false });
    const startTimeValues = startTime.split(':');
    const startTimeSeconds = +startTimeValues[0] * 60 * 60 + +startTimeValues[1] * 60 + +startTimeValues[2];

    const endTime = new Date(this.event.end_date).toLocaleTimeString('en-US', { hour12: false });
    const endTimeValues = endTime.split(':');
    const endTimeSeconds = +endTimeValues[0] * 60 * 60 + +endTimeValues[1] * 60 + +endTimeValues[2];

    const total = Number(endTimeSeconds - startTimeSeconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);

    if (hours && minutes) {
      return `${hours}h ${minutes}m`;
    } else if (hours && !minutes) {
      return `${hours}h`;
    } else if (!hours && minutes) {
      return `${minutes}m`;
    }
  }

  public closeEventPreviewModal() {
    this.closeEventPreview.emit(true);
    this.router.navigate(['events']);
  }

  // Attend on event
  public attendEvent(status: IEventAnswers['rsvp'], event: any): void {
    this.showAttending = false;

    const userResponse = 
      event.attending?.find((el: any) => el.user_id === this.userId) ||
      event.maybeattending?.find((el: any) => el.user_id === this.userId) ||
      event.notattending?.find((el: any) => el.user_id === this.userId);

    if (userResponse) {
      this.subscribers?.push(
        this.eventsService
          .updateEventConfirmation(this.caseId as string, event.event_id, userResponse.response_id, { rsvp: status })
          .subscribe(() => this.attendingEvent.emit(this.event))
      );
    } else {
      this.subscribers?.push(
        this.eventsService
          .postEventConfirmation(this.caseId as string, event.event_id, { rsvp: status })
          .subscribe(() => this.attendingEvent.emit(this.event))
      );
    }
  }

  public toggleAttendingDropdown(): void {
    this.showAttending = !this.showAttending;
  }

  public toggleCalendarDropdown(): void {
    this.showAddToCalendar = !this.showAddToCalendar;
  }

  public closeDropdownOutside() {
    window.onclick = event => {
      if (
        (event.target as HTMLElement).className !==
          'primary-outline custom-color-builder-button event-view-button event-open-attending-button' &&
        (event.target as HTMLElement).className !== 'ins event-attending-item-custom-color-div' &&
        (event.target as HTMLElement).className !== 'attending-arrow'
      ) {
        this.showAttending = false;
      }

      if (
        (event.target as HTMLElement).className !==
          'primary-outline custom-color-builder-button event-view-button event-view-calendar' &&
        (event.target as HTMLElement).className !== 'ins event-attending-item-custom-color-div event-calendar-dropdown-content'
      ) {
        this.showAddToCalendar = false;
      }
    };
  }

  public addToCalendar(calendar: string) {
    this.showAddToCalendar = false;

    if (calendar === 'google') {
      let url = `https://calendar.google.com/calendar/r/eventedit?text=${this.event.name}`;

      if (this.event.description) {
        url += `&details=${this.event.description}`;
      }

      if (this.event.location?.address) {
        url += `&location=${this.event.location.address}`;
      }

      if (this.event.start_date && this.event.end_date) {
        url += `&dates=${this.convertDateForCalendar(this.event.start_date)}/${this.convertDateForCalendar(
          this.event.end_date
        )}`;
      }

      window.open(url);
    } else if (calendar === 'iCal') {
      this.createIcsFile();
    }
  }

  //20220427T120000 - format needed for calendars, so we convert our format here
  private convertDateForCalendar(date: Date) {
    let localDate = new Date(date).toLocaleDateString();
    let localTime = new Date(date).toLocaleTimeString();
    const stringArray = localDate.split(/\./g);

    localDate = stringArray[2] + stringArray[1] + stringArray[0];
    localTime = localTime.split(/:/g).join('');

    return localDate + 'T' + localTime;
  }

  private createIcsFile() {
    const location = this.event?.location?.address || '';
    const description = this.event?.description || '';
    const iCalEvent =
      'BEGIN:VCALENDAR\n' +
      'CALSCALE:GREGORIAN\n' +
      'METHOD:PUBLISH\n' +
      'PRODID:-//Test Cal//EN\n' +
      'VERSION:2.0\n' +
      'BEGIN:VEVENT\n' +
      'UID:test-1\n' +
      'DTSTART;VALUE=DATE:' +
      this.convertDateForCalendar(this.event.start_date) +
      '\n' +
      'DTEND;VALUE=DATE:' +
      this.convertDateForCalendar(this.event.end_date) +
      '\n' +
      'SUMMARY:' +
      this.event.name +
      '\n' +
      'DESCRIPTION:' +
      description +
      '\n' +
      'LOCATION:' +
      location +
      '\n' +
      'END:VEVENT\n' +
      'END:VCALENDAR';
    const data = new Blob([iCalEvent], { type: 'text/plain' });

    if (this.icsCalendarLink !== null) {
      window.URL.revokeObjectURL(this.icsCalendarLink);
    }

    this.icsCalendarLink = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(data));
  }

  // Generate image for map link
  public formatMapLink(event: any): string {
    if (event.map_key) {
      return this.privateCDN + '/' + event.map_key;
    } else {
      return (
        'https://maps.googleapis.com/maps/api/staticmap?center=' +
        event.location.address.split(', ').join(',').split(' ').join('+') +
        '&zoom=13&size=600x300&key=' +
        environment.GOOGLE_CLOUD_PUBLIC_API_KEY
      );
    }
  }

  // Redirect to the GoogleMap
  public redirectGoogleMap(address: string): void {
    // window.open(`https://www.google.com/maps/dir/?api=1&origin=${address}&destination=${address}`, '_blank');
    window.open(`https://maps.google.com/?q=${address}`, '_blank');
  }

  public openLink(link: string): void {
    link.startsWith('http://') || link.startsWith('https://')
      ? window.open(link, '_blank')
      : window.open(`http://${link}`, '_blank');
  }
}
