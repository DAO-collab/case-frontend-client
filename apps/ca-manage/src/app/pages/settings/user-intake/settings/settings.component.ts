import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { HostService } from '../../../../services/host.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { IntakeFormsService } from '../../../../services/intake-forms.service';
import { modalType } from '../user-intake-modal/user-intake-modal.component';

@Component({
  selector: 'app-user-intake',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  isLoading = true;
  userHostSettings?: any;
  modalType = modalType.Create;
  intakesForm?: any;

  private unsubscribe = new Subject<void>();

  constructor(
    public intakeFormsService: IntakeFormsService,
    private hostService: HostService,
    private notificationConnectorService: PopInNotificationConnectorService
  ) {}

  ngOnInit(): void {
    this.getHostInfo();

    this.intakeFormsService.updateUserIntakesData
      .asObservable()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => this.getHostInfo());

    this.intakeFormsService
      .getIntakesForm()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(res => {
        this.intakesForm = res.items;
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  isObjectEmpty(obj: {[key: string]: string}): boolean {
    return !obj || Object.keys(obj)?.length === 0;
  }

  showUserTimeZoneDate(date: Date): Date {
    return new Date(date);
  }

  showIntakeFormTagId(id: string): string {
    return this.intakesForm.filter((form: any) => form?.asset_id === id)[0]?.tag_id ?? '';
  }

  toggleActive(data: any, value: any): void {
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: 'Updating Intake'
    });
    let requestData = {
      [data.key]: {
        intake_id: data.value.intake_id,
        complete_after: data.value.complete_after,
        active: value
      }
    };

    requestData = Object.assign(this.userHostSettings.host_userintake ?? {}, requestData);

    this.intakeFormsService
      .putIntakeSettings(requestData)
      .pipe(
        takeUntil(this.unsubscribe),
        catchError(err => {
          this.notificationConnectorService.failed(notification, err?.error?.message);
          return throwError(err?.error);
        })
      )
      .subscribe(() => {
        this.notificationConnectorService.ok(notification, 'Intake Updated');
        this.intakeFormsService.updateUserIntakesData.next();
      });
  }

  deleteIntake(key: any): void {
    const notification: Notification = this.notificationConnectorService.addNotification({
      title: 'Deleting Intake'
    });

    delete this.userHostSettings?.host_userintake[key];

    this.intakeFormsService
      .putIntakeSettings(this.userHostSettings?.host_userintake)
      .pipe(
        takeUntil(this.unsubscribe),
        catchError(err => {
          this.isLoading = false;
          this.notificationConnectorService.failed(notification, err?.error?.message);
          return throwError(err?.error);
        })
      )
      .subscribe(() => {
        this.notificationConnectorService.ok(notification, 'Intake Deleted');
        this.intakeFormsService.updateUserIntakesData.next();
      });
  }

  openUserIntakeModal(data: any): void {
    this.modalType = modalType.Edit;
    this.intakeFormsService.editPopupData = data;

    this.intakeFormsService.activateUserIntakeModal.next(true);
  }

  private getHostInfo(): void {
    this.isLoading = true;

    this.hostService
      .getHostInfo()
      .pipe(
        takeUntil(this.unsubscribe),
        catchError(err => {
          this.isLoading = false;
          return throwError(err?.error);
        })
      )
      .subscribe(res => {
        this.userHostSettings = res;
        this.isLoading = false;
      });
  }
}
