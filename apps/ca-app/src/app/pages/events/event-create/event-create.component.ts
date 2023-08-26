import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Team, Role } from '@app/interfaces';

import { TimeSelectorComponent } from '@ca/ui';

import { EventsService } from '../../../services/events.service';
import { UtilsService } from '../../../services/utils.service';
import { UserService } from '../../../services/user.service';
import { RolesService } from '../../../services/roles.service';
import { LocationsService } from '../../../services/locations.service';
import { HostService } from '../../../services/host.service';
import { LocationTypeModel } from '../models/LocationTypeModel';
import { NotificationModel } from '../../../directives/component-directives/notification-field/models/NotificationModel';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.css']
})
export class EventCreateComponent implements OnInit, OnDestroy {
  @Input() caseId?: string;
  @Input() eventId?: string;
  @Output() afterSave = new EventEmitter();

  @ViewChild('selectStartTime') selectStartTime?: NgSelectComponent;
  @ViewChild('selectEndTime') selectEndTime?: NgSelectComponent;

  public isOpened = false;
  public isEventEdit = true;
  public eventRecurring = false;
  public saving = false;
  public loading = true;
  public validationErrors: string[] = [];
  public initialParicipants: Role[] = [];
  public activeParticipants: Team[] = [];
  public rolesList: { name: string; role_id: string }[] = [];
  public activeStartTime?: string;
  public activeEndTime?: string;
  public formTouched = false;
  public savingError?: string;
  public locations: { address: string, name: string }[] = [];
  public roleNamesById: { [key: string]: string } = {};
  public locationTypes: LocationTypeModel[] = [
    {
      type: 'No Location',
      id: 'no_location'
    },
    {
      type: 'Suggested Locations',
      id: 'suggested_address'
    },
    {
      type: 'CaseActive Convo',
      id: 'caseactive_convo'
    },
    {
      type: 'Video Conference',
      id: 'video_conference'
    },
    {
      type: 'Add Location',
      id: 'custom_address'
    }
  ];
  public eventForm?: UntypedFormGroup;
  public defaultStartDate = new UntypedFormControl('');
  public defaultEndDate = new UntypedFormControl('');
  public notifications?: NotificationModel;

  private times: string[] = [];
  private unsubscribe$: Subject<void> = new Subject();
  private teamData: { [key: string]: Team } = {};
  private defaultRrule = 'FREQ=DAILY;INTERVAL=1';
  private people: { id: string; text: string }[] = [];
  private team: any = [];
  private locationSubscription?: Subscription;
  public rruleStartDate = this.getDateForRrule();
  public rruleEndDate = this.getDateForRrule();

  get duration() {
    return this.eventForm?.controls['duration'] as UntypedFormGroup;
  }

  get location() {
    return this.eventForm?.controls['location'] as UntypedFormGroup;
  }

  constructor(
    public router: Router,
    public locationsService: LocationsService,
    public utilsService: UtilsService,
    private notificationsService: PopInNotificationConnectorService,
    private eventsService: EventsService,
    private userService: UserService,
    private rolesService: RolesService,
    private hostService: HostService,
    private titleService: Title,
    private formBuilder: UntypedFormBuilder
  ) {}

  ngOnInit() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isOpened) {
        this.refreshModal();
        this.afterChangeEmit();
      }
    });

    this.titleService.setTitle(`${this.hostService.appName} | Events`);

    this.createEventForm();
    this.times = this.utilsService.generateTimeArray();
    this.rolesList = this.rolesService.rolesList;
    this.rolesList.map(v => (this.roleNamesById[v.role_id] = v.name));

    this.rolesService.rolesGetSub.pipe(takeUntil(this.unsubscribe$)).subscribe(items => {
      this.rolesList = items;
      items.map((v) => (this.roleNamesById[v.role_id] = v.name));
    });

    this.userService.getTeamData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.people = [];
      data?.items.map((usr) => (this.teamData[usr.user_id] = usr));

      this.people = data!.items
        .filter((v) => v.case_role_id !== 'role::bots')
        .map((usr) => ({
          id: usr.user_id,
          text: usr.sync_info
            ? usr.sync_info.given_name + ' ' + usr.sync_info.family_name
            : usr.given_name + ' ' + usr.family_name
        }));

      this.initialParticipant();
      if (data) {
        this.team = data.items ? data.items : [];
      } else {
        this.team = [this.userService.userData];
      }
    });
  }

  public setPermissions(permissions: string[]) {
    this.eventForm?.patchValue({ permissions });
  }

  public setRrule(rrule: string) {
    this.duration.patchValue({ rrule });
  }

  public setNotifications(notifications: NotificationModel) {
    this.eventForm?.patchValue({ notifications });
  }

  public onDefaultNotificationChange() {
    this.eventForm?.patchValue({ instant_notify: false });
  }

  public togglePublished(event: Event) {
    const published = (event.target as HTMLInputElement).checked ? 1 : 0;
    this.eventForm?.patchValue({ published });
  }

  // Loading location and sending in create event component
  public loadLocations(caseId: string) {
    this.locationsService
      .getLocations(caseId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(({ items }) => (this.locations = items.map((item) => ({ address: item.address, name: item.tag_id }))));
  }

  // Create event
  public createEvent() {
    const event = this.convertEventObjectBeforeSaving(this.eventForm?.value);
    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving event`
    });

    if (!(event.participants_ids && event.participants_ids.length)) {
      delete event.participants_ids;
    }

    if (event.location.location_type === 'caseactive_convo') {
      event.location.address = this.showCaseactiveConvosLink();
    }

    this.saving = true;

    this.eventsService
      .createEvent(this.caseId as string, event)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          this.afterSave.emit();
          this.saving = false;
          this.notificationsService.ok(notification, 'Event saved');
        },
        err => {
          this.saving = false;
          this.notificationsService.failed(notification, err.message);
        }
      );
  }

  public isInvalid(): boolean {
    return (
      this.saving ||
      this.validationErrors.length > 0 ||
      !this.activeParticipants.length ||
      (this.location.controls['location_type'].value !== 'no_location' &&
        this.location.controls['location_type'].value !== 'caseactive_convo' &&
        !this.location.controls['address'].value) ||
      !this.activeStartTime ||
      !this.activeEndTime
    );
  }

  // Update event
  public updateEvent() {
    const editingEvent = this.convertEventObjectBeforeSaving(this.eventForm?.value);
    const notification: Notification = this.notificationsService.addNotification({
      title: `Updating event`
    });

    if (!editingEvent.participants_ids) {
      delete editingEvent.participants_ids;
    }

    if (editingEvent.location.location_type === this.locationTypes[0].id) {
      delete editingEvent.location.address;
    } else if (editingEvent.location.location_type === 'caseactive_convo') {
      editingEvent.location.address = this.showCaseactiveConvosLink();
    }

    this.saving = true;

    this.eventsService
      .updateEvent(this.caseId as string, this.eventId as string, editingEvent)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          this.afterSave.emit();
          this.notificationsService.ok(notification, 'Event updated');
        },
        err => {
          this.saving = false;
          this.notificationsService.failed(notification, err.message);
        }
      );
  }

  // Handling click event repeat
  public toggleRepeatData() {
    this.rruleStartDate = this.getDateForRrule(this.duration.controls['start_date'].value);
    this.rruleEndDate = this.getDateForRrule(this.duration.controls['end_date'].value);
    if (!this.eventRecurring) {
      this.eventRecurring = true;
      this.duration.controls['rrule'].setValue(this.defaultRrule);
    } else {
      this.eventRecurring = false;
      this.duration.controls['rrule'].setValue('');
    }
  }

  public initialParticipant(): void {
    this.initialParicipants = [];
    this.people.map(pl => {
      this.initialParicipants.push({
        role_id: pl.id,
        name: pl.text
      });
    });
  }

  public setParticipant(participant: string[]) {
    this.activeParticipants = [];
    let participantsIds: any[] = [];

    participant.map(item => {
      this.eventForm?.controls['participants_ids'].setValue([...participantsIds, item]);
      this.activeParticipants.push(this.team.filter((t: any) => t.user_id === item)[0]);
      this.eventForm?.controls['active_participant'].reset();
      participantsIds = this.eventForm?.controls['participants_ids'].value;
    });
  }

  public removeParticipant(index: number) {
    let participantsIds = this.eventForm?.controls['participants_ids'].value;
    participantsIds.splice(index, 1);

    this.eventForm?.controls['participants_ids'].setValue(participantsIds);
    this.activeParticipants = [];
    participantsIds.map((item: any) => {
      this.activeParticipants.push(this.team.filter((t: any) => t.user_id === item)[0]);
    });
  }

  // Set default values for event
  public refreshModal() {
    this.formTouched = false;
    this.notifications = new NotificationModel();
    this.loading = false;
    this.activeParticipants = [];
    this.eventRecurring = false;
    this.savingError = '';
    this.saving = false;
    this.enableForm();
  }

  public enableForm() {
    this.eventForm?.enable();
    this.defaultStartDate.enable();
    this.defaultEndDate.enable();
  }

  public disableForm() {
    this.eventForm?.disable();
    this.defaultStartDate.disable();
    this.defaultEndDate.disable();
  }

  public setFormDefaults() {
    this.eventForm?.patchValue({ permissions: this.rolesList.map(role => role.role_id) });
    this.location.patchValue({ location_type: this.locationTypes[0].id });
  }

  // Handling address change value
  public handleAddressChange(address: any) {
    this.location.patchValue({ address: address.formatted_address });
  }

  // Handling date change click
  public toggleDate(dateType: string, event: any) {
    const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeStartTime as string).split(':');
    const [endHours, endMinutes] = this.utilsService.convertTime12to24(this.activeEndTime as string).split(':');

    const startDate = new Date(
      dateType === 'start_date' && event.dateString
        ? event.selectedDates[0].setHours(+stHours, +stMinutes, 0, 0)
        : this.duration.controls['start_date'].value
    );
    let endDate = new Date(
      dateType === 'end_date' && event.dateString
        ? event.selectedDates[0].setHours(+stHours, +stMinutes, 0, 0)
        : this.duration.controls['end_date'].value
    );

    if (dateType === 'end_date') {
      this.eventsService.publishEndDate(event.dateString);
    }

    if (startDate > endDate) {
      endDate = new Date(startDate.getTime());
      endDate.setTime(startDate.getTime());
    }

    const compareDates =
      startDate.getFullYear() * startDate.getMonth() * startDate.getDate() ===
      endDate.getFullYear() * endDate.getMonth() * endDate.getDate();

    const indexOfStartTime = this.times.indexOf(this.activeStartTime as string);
    const indexOfEndTime = this.times.indexOf(this.activeEndTime as string);

    this.setTimeToDates(startDate, endDate);

    if (compareDates && indexOfEndTime <= indexOfStartTime) {
      this.resetStartDateTime(startDate, endDate);
    }
  }

  // Handling time change click
  public toggleTime() {
    const startDate = new Date(this.duration.controls['start_date'].value);
    const endDate = new Date(this.duration.controls['end_date'].value);

    const compareDates =
      startDate.getFullYear() * startDate.getMonth() * startDate.getDate() ===
      endDate.getFullYear() * endDate.getMonth() * endDate.getDate();
    const indexOfStartTime = this.times.indexOf(this.activeStartTime as string);
    const indexOfEndTime = this.times.indexOf(this.activeEndTime as string);

    this.setTimeToDates(startDate, endDate);

    if (compareDates && indexOfEndTime <= indexOfStartTime) {
      this.resetStartDateTime(startDate, endDate);
    }
  }

  // Set center position selected element in dropdown
  public setDropDownSelectedPosition(dropDown: TimeSelectorComponent) {
    const startDate = new Date(this.duration.controls['start_date'].value);
    const endDate = new Date(this.duration.controls['end_date'].value);
    const compareDates =
      startDate.getFullYear() * startDate.getMonth() * startDate.getDate() ===
      endDate.getFullYear() * endDate.getMonth() * endDate.getDate();

    if (compareDates) {
      this.times = this.utilsService.generateTimeArray();
    }

    setTimeout(() => {
      const options = Array.prototype.slice.call(
        dropDown.element.nativeElement.querySelectorAll('.time-selector-option')
      );
      const scrollPanel: HTMLElement = dropDown.element.nativeElement.querySelector('.time-selector-dropdown');
      const activeTime: HTMLElement | null = scrollPanel.querySelector('.time-selector-option-active');
      const indexOf = options.indexOf(activeTime);

      if (activeTime) {
        scrollPanel.scrollTop = (indexOf - 2) * activeTime.offsetHeight;
      }
    });
  }

  // Show event information
  public editEvent(event: any) {
    this.locationSubscription?.unsubscribe();
    this.eventForm?.patchValue(
      {
        ...event,
        permissions: event.permissions ? event.permissions : this.rolesList.map(role => role.role_id),
        duration: {
          start_date: event.start_date,
          end_date: event.end_date,
          rrule: event.rrule
        },
        location: {
          location_type: event.location.location_type,
          address: event.location.address ?? ''
        }
      },
      { emitEvent: false }
    );

    this.notifications = { ...event.notifications, valid: true };

    if (this.team && this.team.length) {
      this.activeParticipants = event.participants_ids
        ? event.participants_ids.map((r: any) => this.team.find((pl: any) => pl.user_id === r))
        : [];
    }
    event.rrule ? (this.eventRecurring = true) : (this.eventRecurring = false);

    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    this.setTimes(startDate, endDate);
    this.defaultStartDate.setValue(startDate.toISOString());
    this.defaultEndDate.setValue(endDate.toISOString());

    // this.loading = false;
  }

  public createEventForm() {
    this.eventForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      permissions: [[], Validators.required],
      description: '',
      published: 1,
      duration: this.formBuilder.group({
        start_date: ['', Validators.required],
        end_date: ['', Validators.required],
        rrule: ''
      }),
      location: this.formBuilder.group({
        location_type: { value: null },
        address: ''
      }),
      active_participant: { value: null },
      participants_ids: [],
      notifications: {
        names: [],
        values: [],
        valid: true
      },
      instant_notify: true
    });

    this.locationSubscription = this.location.controls['location_type'].valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => this.location.controls['address'].setValue(''));
  }

  // Set default values for time fields
  public resetStartDateTime(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) {
      startDate = new Date();
      startDate.setHours(startDate.getHours() + 1);
      startDate.setMinutes(0);

      endDate = new Date();
      endDate.setHours(endDate.getHours() + 2);
      endDate.setMinutes(0);
    } else {
      const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeStartTime as string).split(':');

      startDate?.setHours(+stHours, +stMinutes, 0, 0);
      endDate?.setHours(startDate!.getHours() + 1, +stMinutes);
    }

    this.defaultStartDate.setValue(startDate?.toISOString());
    this.defaultEndDate.setValue(endDate?.toISOString());
    this.duration.patchValue({
      start_date: startDate?.toISOString(),
      end_date: endDate?.toISOString()
    });

    this.setTimes(startDate as Date, endDate as Date);
  }

  // Preparation editingEvent model for send
  private convertEventObjectBeforeSaving(event: any) {
    if (event.notifications) {
      delete event.notifications.valid;

      if (event.notifications.names && !event.notifications.names.length) {
        delete event.notifications;
      }
    }
    if (!this.eventRecurring) {
      delete event.duration.rrule;
    }
    if (!event.permissions) {
      delete event.permissions;
    }
    if (event.location && event.location.address === '') {
      delete event.location.address;
    }
    if (!this.eventId && !event.description) {
      delete event.description;
    }

    return event;
  }

  // Set values in time fields for selected event
  private setTimes(startDate: Date, endDate: Date) {
    this.activeStartTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.activeEndTime = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    this.checkDateTimeOnLength();
  }

  // Checking active start and active end times on length and set 2-digit
  private checkDateTimeOnLength() {
    if (this.activeStartTime?.length === 7) {
      this.activeStartTime = '0' + this.activeStartTime;
    }
    if (this.activeEndTime?.length === 7) {
      this.activeEndTime = '0' + this.activeEndTime;
    }
  }

  // Get convert date to DateTime for rrule
  public getDateForRrule(dueDate?: string): string {
    const date = dueDate ? new Date(dueDate) : new Date();
    date.setTime(date.getTime()); // + 7 * 24 * 60 * 60 * 1000
    return date.toISOString();
  }

  // Setting time to dates
  private setTimeToDates(startDate: Date, endDate: Date) {
    const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeStartTime as string).split(':');
    const [endHours, endMinutes] = this.utilsService.convertTime12to24(this.activeEndTime as string).split(':');

    startDate.setHours(+stHours, +stMinutes, 0, 0);
    endDate.setHours(+endHours, +endMinutes, 0, 0);

    this.rruleStartDate = startDate.toISOString();
    this.rruleEndDate = endDate.toISOString();
    this.defaultStartDate.setValue(startDate.toISOString());
    this.defaultEndDate.setValue(endDate.toISOString());
    this.duration.patchValue({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });
  }

  // Detect changes on event
  afterChangeEmit(): void {
    this.afterSave.emit();
  }

  public showCaseactiveConvosLink(): string {
    const host = window.location.host.split('.')[0];

    return environment.APP_CLIENT_URL.replace('*', host) + '/convos';
  }

  deleteAddress(): void {
    this.location.patchValue({ address: null });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
