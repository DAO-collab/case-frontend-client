import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { catchError, takeUntil } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';

import { IntakeFormsService } from '../../../../services/intake-forms.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../../common/components/pop-in-notifications/pop-in-notification-connector.service';

export enum modalType {
  Create = 'Create',
  Edit = 'Edit'
}

@Component({
  selector: 'app-user-intake-modal',
  templateUrl: './user-intake-modal.component.html',
  styleUrls: ['./user-intake-modal.component.css']
})
export class UserIntakeModalComponent implements OnInit, OnDestroy {
  @Input() modeType = modalType.Create;
  @Input() hostUserIntake = null;

  @Output() updateTableInfo = new EventEmitter<void>();

  intakeModalForm?: UntypedFormGroup;
  isLoading = true;
  userDropdownFields = [
    { id: 'manage', value: 'Manage' },
    { id: 'staff', value: 'Staff' },
    { id: 'user', value: 'User' }
  ];
  modalType = modalType;
  intakeFormsId: any[] = [];

  private unsubscribe = new Subject<void>();

  constructor(
    private fb: UntypedFormBuilder,
    private intakeFormsService: IntakeFormsService,
    private notificationConnectorService: PopInNotificationConnectorService
  ) {}

  ngOnInit(): void {
    this.intakeModalForm = this.fb.group({
      user_type: ['', Validators.required],
      intake_id: ['', Validators.required],
      due_time: ['', Validators.required],
      due_date: ['', Validators.required]
    });

    if (this.hostUserIntake) {
      const objKeys = Object.keys(this.hostUserIntake);

      objKeys.forEach(field => {
        if (this.intakeFormsService.editPopupData?.key !== field) {
          const index = this.userDropdownFields.findIndex(item => {
            return item.id === field;
          });

          this.userDropdownFields.splice(index, 1);
        }
      });
    }

    if (this.intakeFormsService.editPopupData) {
      const date = new Date(this.intakeFormsService.editPopupData.value.complete_after);
      const dueDate = date.toLocaleDateString('en-US');

      this.intakeModalForm.patchValue({
        user_type: this.intakeFormsService.editPopupData.key,
        intake_id: this.intakeFormsService.editPopupData.value.intake_id,
        due_time: date,
        due_date: dueDate
      });
    }

    this.intakeFormsService
      .getIntakesForm()
      .pipe(
        takeUntil(this.unsubscribe),
        catchError(err => {
          return err;
        })
      )
      .subscribe(res => {
        res.items.forEach((item: any) => this.intakeFormsId.push({ id: item.asset_id, value: item.tag_id }));

        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  isDateMoreThenNow(): boolean | void {
    const formValues = this.intakeModalForm?.getRawValue();

    if (!formValues.due_time || !formValues.due_date) {
      return;
    }

    return this.convertSelectedTime(formValues.due_date, formValues.due_time).getTime() > new Date().getTime();
  }

  create(): void {
    const formValues = this.intakeModalForm?.getRawValue();
    let data = {
      [this.intakeModalForm?.value.user_type]: {
        complete_after: this.convertSelectedTime(formValues.due_date, formValues.due_time).toISOString(),
        intake_id: formValues.intake_id,
        active: this.intakeFormsService.editPopupData?.value?.active ?? true
      }
    };
    let notification: Notification;

    if (this.modeType === modalType.Create) {
      notification = this.notificationConnectorService.addNotification({ title: 'Creating Intake' });
      data = Object.assign(this.hostUserIntake ?? {}, data);
    } else {
      const obj = JSON.parse(JSON.stringify(this.hostUserIntake));

      delete obj[this.intakeFormsService.editPopupData?.key];

      data = Object.assign(obj ?? {}, data);
      notification = this.notificationConnectorService.addNotification({ title: 'Updating Intake' });
    }

    this.intakeFormsService
      .putIntakeSettings(data)
      .pipe(
        takeUntil(this.unsubscribe),
        catchError(err => {
          this.notificationConnectorService.failed(notification, err?.error?.message);
          return throwError(err?.error);
        })
      )
      .subscribe(() => {
        this.intakeFormsService.editPopupData = null;

        this.modeType === modalType.Create
          ? this.notificationConnectorService.ok(notification, 'Intake Created')
          : this.notificationConnectorService.ok(notification, 'Intake Updated');

        this.intakeFormsService.updateUserIntakesData.next();
        this.closeModal();
      });
  }

  closeModal(): void {
    this.intakeFormsService.editPopupData = null;

    this.intakeFormsService.activateUserIntakeModal.next(false);
  }

  private convertSelectedTime(date: Date, time: Date): Date {
    return new Date(date + ' ' + time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds());
  }
}
