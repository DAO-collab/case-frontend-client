import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AppsService } from '../apps.service';
import { LocalTranslationService } from '../../../core/local-translation.service';
import { PopInNotificationConnectorService } from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { IApp, IUserFields } from '../app.model';
import { SettingsService } from '../../../core/settings.service';

@Component({
  selector: 'app-join-app-modal',
  templateUrl: './join-app-modal.component.html',
  styleUrls: ['./join-app-modal.component.css']
})
export class JoinAppModalComponent implements OnInit, AfterViewInit, OnDestroy {
  public tabNumber = 0;
  public inputValue = '';
  public selectedApp?: IApp;
  public userFields?: string[];
  public errorMessage?: string;

  constructor(
    private appsService: AppsService,
    private localTranslationService: LocalTranslationService,
    private notificationsService: PopInNotificationConnectorService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.appsService.isSelectOptionModalDisabled = true;

    if (this.appsService.joinAppModalData?.length) {
      this.inputValue = this.appsService.joinAppModalData;
    }
  }

  ngAfterViewInit() {
    if (this.appsService.joinAppModalData?.length) {
      this.joinApp();
    }
  }

  ngOnDestroy() {
    if (this.appsService.joinAppModalData) {
      this.appsService.joinAppModalData = null;
    }
  }

  public closeModal() {
    this.appsService.isJoinAppModalShowed = false;
  }

  public joinApp() {
    const hostId = 'ca-' + this.inputValue;

    this.appsService
      .joinApp(hostId)
      .pipe(
        catchError(error => {
          if (
            error?.error?.error?.message === 'HostSignupNotEnabled' ||
            error?.error?.error?.message === 'FieldUsernameDupsException'
          ) {
            this.localTranslationService.loadErrorsJSON().subscribe(() => {
              this.errorMessage = this.localTranslationService.errors[error.error.error.message];
            });
          } else {
            this.errorMessage = 'This APP ID is not correct';
          }

          return throwError(error);
        })
      )
      .subscribe(() => {
        this.appsService.findStatusApps(true, 'invites').subscribe(res => {
          const app = res.filter(item => item.host_id === 'ca-' + this.inputValue)[0];

          this.selectedApp = app;

          this.appsService.acceptInvitationSubject.next();
          this.settingsService.userFields().subscribe((userFields: { [key: string]: string }) => { // IUserFields
            this.userFields = this.selectedApp?.require_userfields?.map(userFieldKey => userFields[userFieldKey]);
            this.tabNumber = 1;

            if (this.selectedApp) {
              this.inputValue = '';
            }
          });
        });
      });
  }

  public acceptAppInvitation(): void {
    this.appsService.acceptApp(this.selectedApp!.host_id, 1).subscribe(() => {
      this.appsService.acceptInvitationSubject.next();
      this.closeModal();
    });
  }
}
