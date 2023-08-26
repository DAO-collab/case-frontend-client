import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';

import { AnnouncementsService } from '../../services/announcements.service';
import { PopInNotificationConnectorService } from '../../common/components/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.css']
})
export class AnnouncementsComponent implements OnInit, OnDestroy {
  isLoading = true;
  announcements: any[] = [];
  hostId?: string;
  announcementForEdit?: any;

  private destroy = new Subject<void>();

  constructor(
    public announcementsService: AnnouncementsService,
    private notificationConnectorService: PopInNotificationConnectorService
  ) {}

  ngOnInit(): void {
    this.hostId = window.location.host.slice(0, window.location.host.indexOf('.'));

    this.getAnnouncements();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  getAnnouncements(): void {
    this.announcementsService
      .getBroadcasts(this.hostId!)
      .pipe(
        takeUntil(this.destroy),
        tap(res => {
          this.announcements = res?.items;
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  deleteAnnouncement(announcement: any): void {
    const notification = this.notificationConnectorService.addNotification({ title: 'Deleting Announcement' });

    this.announcementsService
      .deleteBroadcast(this.hostId!, announcement.broadcast_id)
      .pipe(
        takeUntil(this.destroy),
        catchError(err => {
          this.notificationConnectorService.failed(notification, err.error.message);

          return throwError(err.error);
        }),
        tap(() => {
          this.notificationConnectorService.ok(notification, 'Announcement Deleted');
          this.getAnnouncements();
        })
      )
      .subscribe();
  }

  saveNewAnnouncement(announcement: UntypedFormGroup): void {
    const data = announcement.getRawValue();

    if (!data.expire_time || !data.expire_date) {
      delete data.expire_on;
    }

    delete data.expire_time;
    delete data.expire_date;

    if (this.announcementForEdit) {
      const notification = this.notificationConnectorService.addNotification({ title: 'Updating Announcement' });

      this.announcementsService
        .putBroadcast(this.hostId!, data, this.announcementForEdit.broadcast_id)
        .pipe(
          takeUntil(this.destroy),
          catchError(err => {
            this.notificationConnectorService.failed(notification, err.error.message);

            return throwError(err.error);
          }),
          tap(() => {
            this.notificationConnectorService.ok(notification, 'Announcement Updated');
            this.getAnnouncements();
            this.closeModal();
          })
        )
        .subscribe();
    } else {
      const notification = this.notificationConnectorService.addNotification({ title: 'Creating Announcement' });

      this.announcementsService
        .postBroadcast(this.hostId!, data)
        .pipe(
          takeUntil(this.destroy),
          catchError(err => {
            this.notificationConnectorService.failed(notification, err.error.message);

            return throwError(err.error);
          }),
          tap(() => {
            this.notificationConnectorService.ok(notification, 'Announcement Created');
            this.getAnnouncements();
            this.closeModal();
          })
        )
        .subscribe();
    }
  }

  closeModal(): void {
    this.announcementsService.isCreatePopupOpened.next(false);
    this.announcementForEdit = null;
  }

  showLocalDate(date: Date): Date | string {
    if (date) {
      return new Date(date);
    }
    return '';
  }

  editAnnouncement(announcement: any): void {
    this.announcementForEdit = announcement;

    this.announcementsService.isCreatePopupOpened.next(true);
  }
}
