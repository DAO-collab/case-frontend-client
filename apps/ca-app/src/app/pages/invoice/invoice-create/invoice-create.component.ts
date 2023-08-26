import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

import { TimeSelectorComponent } from '@ca/ui';
import { Role } from '@app/interfaces/role.interface';

import { NotificationModel } from '../../../directives/component-directives/notification-field/models/NotificationModel';
import { InvoiceModel } from '../models/invoice-models';
import { InvoicesService } from '../../../services/invoices.service';
import { UtilsService } from '../../../services/utils.service';
import { RolesService } from '../../../services/roles.service';
import { UserService } from '../../../services/user.service';
import { HostService } from '../../../services/host.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { IStatusSelect } from '../models/status-select.model';
import {
  CREATE_STATUS_SELECT,
  PAID_VOID_STATUS_SELECT,
  PUBLISHED_STATUS_SELECT
} from '../constants/statuses-select.constant';

@Component({
  selector: 'app-invoice-create',
  templateUrl: './invoice-create.component.html',
  styleUrls: ['./invoice-create.component.css']
})
export class InvoiceCreateComponent implements OnInit {
  @Input() caseId: string = '';
  @Input() enabled: boolean = true;

  @Output() afterSave = new EventEmitter();
  @Output() afterChange = new EventEmitter<boolean>();

  public invoiceModel: InvoiceModel = new InvoiceModel();
  public validationErrors = [];
  public activeParticipants: any[] = [];
  public blockFields = false;
  public times: String[] = [];
  public activeDueTime?: string;
  public notifications?: NotificationModel;
  public savingError = '';
  public initialParticipants: Role[] = [];
  public formTouched = false;
  public roleNamesById: any = {};
  public answer_ct = 0;
  public loading = false;
  public recurring = false;
  public invoiceEditEnabled = true;
  public rruleStartDate = this.getDateForRrule();
  public rruleEndDate = this.getDateForRrule();
  public people: any[] = [];
  public subscribers: any[] = [];
  public isOpened = false;
  public rolesList: any[] = [];
  public statusSelect: IStatusSelect[] = CREATE_STATUS_SELECT;
  public isReadOnly: boolean = false;
  public resetSelectOptions$ = this.invoicesService.activateCreateInvoiceModal.pipe(
    tap(() => {
      this.setDropdownOptions();
    })
  );
  private defaultRrule = 'FREQ=DAILY;INTERVAL=1';
  private team: any = [];
  private teamData: any = {};
  private unsubscribe$: Subject<void> = new Subject();
  public initialEditStatusValue?: string;

  constructor(
    private invoicesService: InvoicesService,
    public utilsService: UtilsService,
    private userService: UserService,
    private titleService: Title,
    private hostService: HostService,
    private rolesService: RolesService,
    private notificationsService: PopInNotificationConnectorService,
    private errorD: LocalTranslationService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.enabled = true;
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isOpened) {
        this.refreshModal();
        this.afterChangeEmit();
      }
    });

    this.titleService.setTitle(`${this.hostService.appName} | Invoices`);

    this.times = this.utilsService.generateTimeArray();
    this.rolesList = this.rolesService.rolesList;
    this.rolesList.map(v => (this.roleNamesById[v.role_id] = v.name));
    this.validationErrors = [];
    this.invoiceModel.duration.due_date = this.setDefaultDate() as any;
    this.activeDueTime = this.setDefaultTime(this.invoiceModel.duration.due_date);
    this.formTouched = false;

    // Get user roles
    this.rolesService.rolesGetSub.pipe(takeUntil(this.unsubscribe$)).subscribe(items => {
      this.rolesList = items;
      items.map((v: any) => (this.roleNamesById[v.role_id] = v.name));
    });

    // Get case team
    this.subscribers.push(
      this.userService.getTeamData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
        this.people = [];
        data?.items
          .filter((v) => v.case_role_id !== 'role::bots')
          .map((usr: any) => {
            this.teamData[usr.user_id] = usr;

            this.people.push({
              id: usr.user_id,
              text: usr.sync_info
                ? usr.sync_info.given_name + ' ' + usr.sync_info.family_name
                : usr.given_name + ' ' + usr.family_name
            });
          });

        this.initialParticipant();
        data ? (this.team = data.items) : (this.team = [this.userService.userData]);
      })
    );
  }

  //Show invoice information
  public loadOpenedInvoiceInformation(invoiceLibrary?: any): void {
    if (this.invoiceModel.invoice_id) {
      this.blockFields = true;

      this.subscribers.push(
        this.invoicesService.getInvoice(this.caseId, this.invoiceModel.invoice_id).subscribe(
          invoice => {
            this.invoiceModel.name = invoice.name;
            this.invoiceModel.description = invoice.description;
            this.invoiceModel.published = invoice.published;
            this.invoiceModel.duration.due_date = new Date(invoice.due_date) as any;
            if (invoice.rrule) {
              this.invoiceModel.duration.rrule = invoice.rrule;
              this.recurring = true;
            } else {
              this.invoiceModel.duration.rrule = '';
              this.recurring = false;
            }
            this.activeDueTime = new Date(invoice.due_date).toLocaleTimeString();
            this.invoiceModel.invoice_number = invoice.invoice_number;
            this.invoiceModel.status = invoice.status;
            this.setDropdownOptions();
            this.invoiceModel.participants_ids = invoice.participants_ids || [];
            this.activeParticipants = this.invoiceModel.participants_ids?.map(r =>
              this.team.find((pl: any) => pl.user_id === r)
            ) as any;
            this.notifications = { ...invoice.notifications, valid: true };

            this.setTime(new Date(this.invoiceModel.duration.due_date));

            this.answer_ct = Object.keys(invoice.answers || {}).length;
            this.blockFields = !!this.answer_ct;
            this.loading = false;
          },
          () => (this.loading = false)
        )
      );
    } else {
      this.refreshModal();
      if (invoiceLibrary) {
        this.invoiceModel.name = invoiceLibrary.name;
        this.invoiceModel.description = invoiceLibrary.description;
        this.invoiceModel.published = invoiceLibrary.published;
        this.setDropdownOptions();
        this.invoiceModel.duration.due_date = invoiceLibrary.due_date;
        this.notifications = { ...invoiceLibrary.notifications, valid: true };
        if (invoiceLibrary.duration.rrule) {
          this.invoiceModel.duration.rrule = invoiceLibrary.duration.rrule;
          this.recurring = true;
        } else {
          this.invoiceModel.duration.rrule = '';
          this.recurring = false;
        }
        this.setTime(new Date(this.invoiceModel.duration.due_date));
      } else {
        this.resetDueDateTime();
      }

      this.loading = false;
    }
  }

  // Set values in time fields for selected event
  private setTime(dueDate: Date) {
    this.activeDueTime = dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.checkDateTimeOnLength();
  }

  private checkDateTimeOnLength() {
    if (this.activeDueTime?.length === 7) {
      this.activeDueTime = '0' + this.activeDueTime;
    }
  }

  // Handling click repeat
  public toggleRecurring() {
    this.rruleStartDate = this.getDateForRrule(this.invoiceModel.duration.due_date);
    this.rruleEndDate = this.getDateForRrule(this.invoiceModel.duration.due_date);
    if (!this.recurring) {
      this.invoiceModel.duration.rrule = this.defaultRrule;
      this.recurring = true;
    } else {
      this.invoiceModel.duration.rrule = null as any;
      this.recurring = false;
    }
  }

  // Set default values for time fields
  public resetDueDateTime(dueDate?: Date) {
    if (!dueDate) {
      dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 1);
      dueDate.setMinutes(0);
    } else {
      const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeDueTime as string).split(':');
      dueDate.setHours(+stHours, +stMinutes, 0, 0);
    }

    this.invoiceModel.duration.due_date = dueDate.toISOString();
    this.setTime(dueDate);
  }

  public onStatusChange(item: string) {
    this.invoiceModel.status = item;
  }

  public onNotificationChange(notifications: NotificationModel) {
    this.invoiceModel.notifications = { names: notifications.names ? notifications.names : null, values: notifications.values ? notifications.values : null };
  }

  public onDefaultNotificationChange() {
    this.invoiceModel.instant_notify = false;
  }

  public dueDateChanged($event: any) {
    this.invoicesService.publishDueDate($event.dateString);
  }

  public setParticipant(participant: string[]) {
    this.invoiceModel.participants_ids = [];
    this.activeParticipants = [];

    participant.map(item => {
      this.invoiceModel.participants_ids?.push(item);
      this.activeParticipants.push(this.team.filter((t: any) => t.user_id === item)[0]);
    });
  }

  public removeParticipant(index: any) {
    this.invoiceModel.participants_ids?.splice(index, 1);
    this.activeParticipants = [];
    this.invoiceModel.participants_ids?.map((item: any) => {
      this.activeParticipants.push(this.team.filter((t: any) => t.user_id === item)[0]);
    });
  }

  public isInvalid(): boolean {
    return this.blockFields || this.validationErrors.length > 0 || !this.activeParticipants.length;
  }

  public setDropDownSelectedPosition(dropDown: TimeSelectorComponent) {
    const todayDate = new Date();
    const dueDate = new Date(this.invoiceModel.duration.due_date);

    const compareDates =
      todayDate.getFullYear() * todayDate.getMonth() * todayDate.getDate() ===
      dueDate.getFullYear() * dueDate.getMonth() * dueDate.getDate();
    const indexOfStartTime = this.times.indexOf(this.activeDueTime as string);

    compareDates
      ? (this.times = this.times.splice(indexOfStartTime, this.times.length))
      : (this.times = this.utilsService.generateTimeArray());

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

  // Handling time change click
  public toggleTime() {
    setTimeout(() => {
      const dueDate = new Date(this.invoiceModel.duration.due_date);
      this.setTimeToDate(dueDate);
    });
  }

  // Setting time to dates
  private setTimeToDate(dueDate: Date) {
    const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeDueTime as string).split(':');

    dueDate.setHours(+stHours, +stMinutes, 0, 0);
    this.invoiceModel.duration.due_date = dueDate.toISOString();
  }

  // Get convert date to DateTime for rrule
  public getDateForRrule(dueDate?: string): string {
    const date = dueDate ? new Date(dueDate) : new Date();
    date.setTime(date.getTime()); // + 7 * 24 * 60 * 60 * 1000
    return date.toISOString();
  }

  // Set default values for invoice
  public refreshModal(): void {
    this.invoiceModel = new InvoiceModel();
    // this.invoiceModel.duration.due_date = this.getDateForRrule();
    this.notifications = new NotificationModel();
    this.activeParticipants = [];
    this.savingError = '';
    this.invoiceModel.duration.due_date = this.setDefaultDate() as any;
    this.activeDueTime = this.setDefaultTime(this.invoiceModel.duration.due_date);
    this.recurring = false;
    this.rruleStartDate = this.getDateForRrule();
    this.rruleEndDate = this.getDateForRrule();
  }

  public initialParticipant(): void {
    this.initialParticipants = [];
    this.people.map(pl => {
      this.initialParticipants.push({
        role_id: pl.id,
        name: pl.text
      });
    });
  }

  public togglePublished(event: any) {
    this.invoiceModel.published = event.target.checked ? 1 : 0;
  }

  // Detect changes on event
  public afterChangeEmit(): void {
    this.afterChange.emit();
    this.afterSave.emit();
  }

  public sendInvoice(): void {
    this.formTouched = true;

    const [stHours, stMinutes] = this.utilsService.convertTime12to24(this.activeDueTime as string).split(':');
    const dueDate = new Date(this.invoiceModel.duration.due_date);
    dueDate.setHours(+stHours, +stMinutes, 0, 0);

    if (dueDate.toString() == 'Invalid Date') {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving invoice`
    });

    if (!this.invoiceModel.participants_ids || !this.invoiceModel.participants_ids.length) {
      this.notificationsService.failed(notification, 'Choose At Least One Recipient.');
      return;
    }

    this.invoiceModel.duration.due_date = dueDate.toISOString();

    const invoiceModel = this.convertFormObjectBeforeSending(this.invoiceModel);

    if (!this.invoiceModel.invoice_id) {
      this.invoicesService.postInvoices(this.caseId, invoiceModel).subscribe(
        ({ data }) => {
          const invoice_id = data.invoice_id;
          this.afterChangeEmit();
          this.invoicesService.toggleFormBuilder(0);
          // Remove to redirect to all tabs
          // this.router.navigate([`/invoices/invoice-builder/${invoice_id}`]);
          this.notificationsService.ok(notification, 'Invoice saved');
        },
        err => this.notificationsService.failed(notification, err.message)
      );
    } else {
      const isStatusChanged: boolean = this.initialEditStatusValue !== this.invoiceModel.status;
      this.invoicesService
        .updateInvoice(
          this.caseId,
          this.convertFormObjectBeforeSending(invoiceModel),
          invoiceModel.invoice_id,
          'status',
          isStatusChanged
        )
        .subscribe(
          () => {
            this.afterChangeEmit();
            this.notificationsService.ok(notification, 'Invoice Updated');
          },
          err => {
            this.errorD
              .showError(err.error.error.message)
              .pipe(takeUntil(this.unsubscribe$))
              .subscribe(errorMessage => this.notificationsService.failed(notification, errorMessage));
          }
        );
    }
  }

  private setDefaultTime(selectedDate?: any) {
    const date = new Date();
    let hours;
    let minutes;

    if (date.getMinutes() > 29) {
      hours = date.getHours() + 1;
      minutes = '00';
    } else {
      hours = date.getHours();
      minutes = '30';
    }

    if (selectedDate) {
      selectedDate = new Date(selectedDate);
      selectedDate.setHours(hours);
      selectedDate.setMinutes(minutes);
      selectedDate.setSeconds(0);
      this.invoiceModel.duration.due_date = selectedDate.toISOString();
    }

    return hours + ':' + minutes;
  }

  private setDefaultDate() {
    const date = new Date();
    date.setHours(date.getHours() + 1);

    return date.toISOString();
  }

  private convertFormObjectBeforeSending(invoiceModel: any): any {
    if (!invoiceModel.terms?.length) {
      delete invoiceModel.terms;
    }

    if (!invoiceModel.notes?.length) {
      delete invoiceModel.notes;
    }

    if (!invoiceModel.invoice_id?.length) {
      delete invoiceModel.invoice_id;
    }

    if (!invoiceModel.description?.length) {
      delete invoiceModel.description;
    }

    if (!invoiceModel.participants_ids?.length) {
      delete invoiceModel.participants_ids;
    }

    if (!invoiceModel.duration.rrule) {
      delete invoiceModel.duration.rrule;
    }

    if (!invoiceModel.po_number?.length) {
      delete invoiceModel.po_number;
    }

    if (!invoiceModel.reference_id?.length) {
      delete invoiceModel.reference_id;
    }

    if (!invoiceModel.invoice_number?.length) {
      delete invoiceModel.invoice_number;
    }

    if (!invoiceModel.transactions?.discount?.length && invoiceModel.transactions) {
      delete invoiceModel.transactions.discount;
    }

    if (!invoiceModel.transactions?.tax?.length && invoiceModel.transactions) {
      delete invoiceModel.transactions.tax;
    }

    if (!invoiceModel.invoice_id?.length) {
      delete invoiceModel.invoice_id;
    }

    if (!invoiceModel.notifications?.names?.length || !invoiceModel.notifications?.values?.length) {
      delete invoiceModel.notifications;
    }

    if (invoiceModel.transactions?.transactions?.length) {
      let index = -1;

      invoiceModel.transactions.transactions.forEach((transaction: any) => {
        index++;

        if (!transaction.description || !transaction.transaction_type || !transaction.value) {
          delete invoiceModel.transactions;
        }
      });
    }

    return invoiceModel;
  }

  private setDropdownOptions(): void {
    this.initialEditStatusValue = this.invoiceModel.status;
    if (this.invoiceModel.published === 0) {
      this.statusSelect = CREATE_STATUS_SELECT;
    } else {
      if (this.invoiceModel.status === 'paid' || this.invoiceModel.status === 'void') {
        this.statusSelect = PAID_VOID_STATUS_SELECT;
      } else {
        this.statusSelect = PUBLISHED_STATUS_SELECT;
      }
    }
  }
}
