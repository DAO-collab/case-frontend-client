import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-create-announcement-modal',
  templateUrl: './create-announcement-modal.component.html',
  styleUrls: ['./create-announcement-modal.component.css']
})
export class CreateAnnouncementModalComponent implements OnInit {
  @Input() broadcast?: any;

  @Output() submitAnnouncement = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<void>();

  announcementForm: UntypedFormGroup = this.fb.group({
    message: [null, Validators.required],
    permissions: [null, Validators.required],
    title: [null, Validators.required],
    expire_on: null,
    expire_date: null,
    expire_time: null
  });
  formTouched = false;
  showPastDateOrTimeError: boolean =  false;
  validationErrors: any[] = [];
  activeStartTime?: string;
  times?: any[];
  usersTypesForNotAdmin = [
    { role_id: 'user', name: 'User' },
    { role_id: 'staff', name: 'Staff' },
    { role_id: 'manage', name: 'Manager' },
    { role_id: 'admin', name: 'Admin' }
  ];

  constructor(private fb: UntypedFormBuilder, private utilsService: UtilsService) {}

  ngOnInit(): void {
    this.times = this.utilsService.generateTimeArray();

    if (this.broadcast) {
      this.announcementForm.patchValue({
        message: this.broadcast.message ?? null,
        permissions: this.broadcast.permissions ?? null,
        title: this.broadcast.title ?? null
      });

      if (this.broadcast.expire_on) {
        const date = new Date(this.broadcast.expire_on);

        this.announcementForm.patchValue({ expire_date: date });
        this.setTimes(date);
      }
    } else {
      this.setTimes(this.timeTo30Minutes());
    }
  }

  close(): void {
    this.closeModal.emit();
  }

  saveNewAnnouncement(): void {
    const announcementForm = this.announcementForm.getRawValue();

    this.checkIfDateIsMoreThenNow(announcementForm.expire_date, announcementForm.expire_time);

    if (this.showPastDateOrTimeError) {
      return;
    }

    if (announcementForm.expire_time && announcementForm.expire_date) {
      let expireOn;

      if (this.broadcast) {
        const expireTime = this.utilsService.convertTime12to24(announcementForm.expire_time),
          expireDate =
            announcementForm.expire_date.toString().length > 10
              ? `${announcementForm.expire_date.getFullYear()}-${announcementForm.expire_date.getMonth() + 1}-${announcementForm.expire_date.getDate()}`
              : announcementForm.expire_date;

        expireOn = new Date(expireDate + ' ' + expireTime + ':' + '00').toISOString();

        this.announcementForm.patchValue({ expire_on: expireOn });
      } else {
        const expireTime = this.utilsService.convertTime12to24(announcementForm.expire_time);

        expireOn = new Date(announcementForm.expire_date + ' ' + expireTime + ':' + '00').toISOString();
      }

      this.announcementForm.patchValue({ expire_on: expireOn });
    }

    if (this.announcementForm.invalid) {
      this.formTouched = true;

      return;
    }

    this.submitAnnouncement.emit(this.announcementForm);
  }

  setPermissions(permissions: string[]) {
    this.announcementForm.patchValue({ permissions });
  }

  isInvalid(): boolean {
    return this.validationErrors.length > 0 || !this.announcementForm.value.permissions.length;
  }

  toggleDate(date: any): void {
    this.announcementForm.patchValue({ expire_date: date.dateString });

    this.checkIfDateIsMoreThenNow(date.dateString, this.announcementForm.value.expire_time);
  }

  toggleTime(time: any): void {
    this.announcementForm.patchValue({ expire_time: time });

    this.checkIfDateIsMoreThenNow(this.announcementForm.value.expire_date, time);
  }

  setDropDownSelectedPosition(event: any): void {}

  private setTimes(startDate: Date) {
    let activeStartTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (activeStartTime.length === 7) {
      activeStartTime = '0' + this.activeStartTime;
    }

    this.announcementForm.patchValue({ expire_time: activeStartTime });
  }

  private timeTo30Minutes(): Date {
    const date = new Date();

    if (date.getMinutes() >= 0 && date.getMinutes() < 30) {
      date.setMinutes(30);
    } else if (date.getMinutes() > 30 && date.getMinutes() <= 59) {
      date.setMinutes(0);
      date.setHours(date.getHours() + 1);
    }

    return date;
  }

  private checkIfDateIsMoreThenNow(date: string | any, time: string): void {
    if (date && time) {
      const todayDate = new Date(),
        restrictionDate = new Date(todayDate.getTime() + 60 * 60000),
        selectedDate = typeof(date) == 'string'
          ? new Date(date + ' ' + this.utilsService.convertTime12to24(time) + ':' + '00')
          : new Date(date.toISOString().slice(0, 10) + ' ' + this.utilsService.convertTime12to24(time) + ':' + '00')

      this.showPastDateOrTimeError = restrictionDate.getTime() >= selectedDate.getTime();
    } else {
      this.showPastDateOrTimeError = false;
    }
  }
}
