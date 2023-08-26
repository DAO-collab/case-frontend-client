import { Title } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { catchError, takeUntil } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { AdminService } from '../../../services/admin.service';
import { OptionsService } from '../../../services/options.service';
import { HostService } from '../../../services/host.service';
import { PopInNotificationConnectorService } from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { IUserFields } from '@manage/pages/users/models/user.model';

@Component({
  selector: 'app-profile-information',
  templateUrl: './profile-information.component.html',
  styleUrls: ['./profile-information.component.css']
})
export class ProfileInformationComponent extends UnsubscriptionHandler implements OnInit {
  public loading: boolean = true;
  public message: boolean = false;
  public saving: boolean = false;
  public formError: string = '';
  public selectedInfo?: any;
  public allInfo: { formControl: string; name: string }[] = [];
  public infoForm: UntypedFormGroup = this.formBuilder.group({});

  private readonly excludedFields: string[] = ['given_name', 'locale', 'zoneinfo', 'family_name'];

  constructor(
    private errorD: LocalTranslationService,
    private adminService: AdminService,
    private optionsService: OptionsService,
    private titleService: Title,
    private hostService: HostService,
    private formBuilder: UntypedFormBuilder,
    private notificationsService: PopInNotificationConnectorService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Profile Info`);

    this.optionsService
      .userFields()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        Object.keys(res).forEach(key => {
          this.infoForm.addControl(key, new UntypedFormControl(false));
          this.allInfo.push({ formControl: key, name: res[key as keyof IUserFields] });
        });
        this.selectedInfo = this.hostService.requireUserFields;
        this.selectedInfo.forEach((infoName: string) => {
          this.infoForm.get(infoName)?.setValue(true);
          if (this.excludedFields.includes(infoName)) {
            this.infoForm.get(infoName)?.disable();
          }
        });

        this.disableEmailField();
        this.loading = false;
      });
  }

  public save(): void {
    this.message = false;
    this.formError = '';
    const formValue = this.infoForm.value;
    const profileInfos: string[] = Object.keys(formValue).reduce(
      (acc: any, cur) => [...acc, ...(!!formValue[cur] ? [cur] : [])],
      []
    );
    const temp_profileInfos = profileInfos.length ? profileInfos : null;
    const notification = this.notificationsService.addNotification({
      title: 'Updating settings'
    });

    this.saving = true;
    this.adminService
      .updateProfileInfo({ require_userfields: temp_profileInfos })
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.saving = false;
          this.errorD.showError(res.message).subscribe(errorMessage => {
            this.formError = errorMessage;
          });
          this.notificationsService.failed(notification, res.message);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.message = true;
        this.saving = false;
        this.notificationsService.ok(notification, 'Profile information settings updated');
      });
  }

  private disableEmailField(): void {
    this.infoForm.get('email')?.setValue(true);
    this.infoForm.get('email')?.disable();
  }
}
