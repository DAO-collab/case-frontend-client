import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { UsersService } from '../services/users.service';
import { AdminService } from '../../../services/admin.service';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { UserStatus, UserType } from '../models/user.model';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent extends UnsubscriptionHandler implements OnInit {
  loading = true;
  userId?: string;
  saving = false;
  notFound = false;
  validationErrors: any[] = [];
  languages: any[] = [];
  timezones: any[] = [];
  genders: any[] = [];
  countries: any[] = [];
  customFields: any[] = [];
  formTouched = false;
  disableNotifications = false;
  notificationList: any[] = [];

  statusSelectList: { id: number; text: UserStatus }[] = [
    { id: 1, text: UserStatus.Active },
    { id: 2, text: UserStatus.Disabled }
  ];
  userForm = this.formBuilder.group({
    given_name: '',
    family_name: '',
    birthdate: '',
    gender: '',
    email: [{ value: '', disabled: true }],
    phone: [{ value: '', disabled: true }],
    company: '',
    title: '',
    address1: '',
    address2: '',
    locality: '',
    region: '',
    country: '',
    postal_code: '',
    locale: '',
    zoneinfo: '',
    user_id: '',
    host_user_type: '',
    host_user_status: null,
    host_granted_status: null,
    host_meta_data: this.formBuilder.group({}),
    host_intake_data: this.formBuilder.group({}),
    host_tag_id: '',
    due_time: null,
    due_date: null
  });
  UserType = UserType;

  public notifications?: string[] | null;
  public usersTypeForAdmin: { id: string; text: string }[] = [{ id: UserType.Admin, text: 'Admin' }];
  public usersTypesForNotAdmin: { id: string; text: string }[] = [
    { id: UserType.User, text: 'User' },
    { id: 'staff', text: 'Staff' },
    { id: 'manage', text: 'Manager' }
  ];
  public hostIntakeDataFields: any[] = [];

  private isTagIdCameFromServer?: boolean;

  get hostMetaData() {
    return this.userForm.controls['host_meta_data'] as UntypedFormGroup;
  }

  get isViewMode() {
    return this.userForm.controls['host_user_type'].value === UserType.Admin;
  }

  get userTypesSelectList(): { id: string; text: string }[] {
    return this.isViewMode ? this.usersTypeForAdmin : this.usersTypesForNotAdmin;
  }

  constructor(
    private utils: UtilsService,
    private usersService: UsersService,
    private adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationsService: PopInNotificationConnectorService,
    private titleService: Title,
    private hostService: HostService,
    private formBuilder: UntypedFormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Users`);
    this.userId = this.route.snapshot.paramMap.get('user_id')!;

    this.usersService.getUserRelation(this.userId).subscribe(
      data => {
        this.notifications = data.host_muted_notifications || null;
        this.isTagIdCameFromServer = !!data.host_tag_id;

        if (data.host_user_type === UserType.Admin) {
          this.userForm.disable();
          this.disableNotifications = true;
        }

        if (data.host_tag_id) {
          this.userForm.controls['host_tag_id'].disable();
        }

        if (data.host_intake_completed_on) {
          const date = new Date(data.host_intake_completed_on);
          const dueDate = date.toLocaleDateString('en-US');

          this.userForm.patchValue({
            due_time: date,
            due_date: dueDate
          });
        }

        this.adminService.getOptionsServerOnly(['/notifications/all'], 'en').subscribe(
          resp => {
            resp[0].map((opt: any) => {
              let data = {
                key: opt.key,
                value: opt.value,
                checked: false
              };

              this.notificationList.push(data);
            });

            this.loading = false;
          },
          () => {
            this.loading = false;
          }
        );
        this.userForm.patchValue(data);

        if (data.host_intake_data) {
          const properties = data.host_intake_data?.schema[0]?.schema?.properties;

          for (const key in properties) {
            if (properties[key]?.readonly) {
              delete properties[key];
            }
          }

          Object.entries(properties).forEach(([key, value]) => {
            properties[key].id = key;

            this.hostIntakeDataFields.push(value);

            if ((value as any)?.readonly) {
              return;
            }

            this.getHostIntakeData().addControl(
              (value as any).title,
              new UntypedFormControl(
                (value as any).description?.replace(/"/g, '')
                  ? (value as any).description?.replace(/"/g, '')
                  : (value as any).defaultValue?.replace(/"/g, '')
              )
            );
          });
        }

        this.adminService
          .getOptions(
            ['/dropdowns/languages', '/dropdowns/timezones', '/dropdowns/genders', '/dropdowns/countries'],
            'en'
          )
          .subscribe((res: any[]) => {
            const language = res[0].find((l: any) => l.key === this.userForm.controls['locale'].value);

            this.languages = res[0];
            this.timezones = res[1];
            this.genders = res[2];
            this.countries = res[3];
            if (language) {
              this.userForm.controls['locale'].setValue(language.key);
            }
          });

        if (!this.hostService.userSchema) {
          this.loading = false;
        } else {
          const schema = this.hostService.userSchema;
          const uiSchema: any = this.hostService.userUiSchema;
          const properties = schema.properties;
          const requiredFields = schema.required;
          const keys = uiSchema.elements?.map((item: any) => item.scope.split('/')[2]) || [];

          for (const key in properties) {
            if (properties[key].readonly) {
              delete properties[key];
            }
          }

          this.customFields = keys
            ? keys.map((v: any) => {
                const changedProp = properties[v];
                changedProp.id = v;

                if (requiredFields) {
                  changedProp.required = requiredFields.includes(v);
                }

                this.hostMetaData.addControl(
                  (changedProp.id as any),
                  new UntypedFormControl(
                    data.host_meta_data &&
                    data.host_meta_data.content &&
                    data.host_meta_data.content[0] &&
                    data.host_meta_data.content[0][(changedProp.id as any)]
                      ? data.host_meta_data.content[0][(changedProp.id as any)]
                      : changedProp.defaultValue
                  )
                );

                return changedProp;
              })
            : [];

          this.loading = false;
        }
      },
      () => (this.notFound = true)
    );
  }

  public getHostIntakeData(): UntypedFormGroup {
    return this.userForm.controls['host_intake_data'] as UntypedFormGroup;
  }

  public customCheckboxChangeValue(customFieldId: string, option: string) {
    const customField = this.hostMetaData.controls[customFieldId];

    if (customField.value.includes(option)) {
      customField.setValue(customField.value.filter((value: string) => value !== option));
    } else {
      customField.setValue([...customField.value, option]);
    }
  }

  // Save user
  public saveUser(): void {
    this.formTouched = true;

    if (this.validationErrors.length) {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: `Updating ${this.usersService.userType} `
    });

    let userFormValue = this.userForm.getRawValue();
    userFormValue.host_user_status = userFormValue.host_user_status === 2 ? 0 : userFormValue.host_user_status;
    this.saving = true;

    if (Object.keys(this.hostMetaData.value).length > 0) {
      const hostMetaDataValue = this.utils.cleanObject(this.hostMetaData.value);
      userFormValue.host_meta_data = [this.utils.transformDropdownValues(hostMetaDataValue)];
    } else {
      delete userFormValue.host_meta_data;
    }

    if (Object.keys(this.getHostIntakeData().getRawValue()).length > 0) {
      const hostMetaDataValue = this.utils.cleanObject(this.getHostIntakeData().getRawValue());

      userFormValue.host_intake_data = [this.utils.transformDropdownValues(hostMetaDataValue)];
    } else {
      delete userFormValue.host_intake_data;
    }

    // If user set tagId before, we delete it from our form to avoid backend error, as tagId can be pushed only once
    if (this.isTagIdCameFromServer) {
      userFormValue.host_tag_id = null;
    }

    if (userFormValue.due_date && userFormValue.due_time) {
      userFormValue.host_intake_completed_on = new Date(
        userFormValue.due_date +
          ' ' +
          userFormValue.due_time.getHours() +
          ':' +
          userFormValue.due_time.getMinutes() +
          ':' +
          userFormValue.due_time.getSeconds()
      ).toISOString();
    }

    delete userFormValue.due_date;
    delete userFormValue.due_time;

    userFormValue = this.utils.cleanObject(userFormValue);
    userFormValue.host_muted_notifications = this.notifications;

    this.usersService.updateUserRelation(this.userId!, userFormValue).subscribe(
      () => {
        this.notificationsService.ok(notification, 'User updated');
        this.router.navigate(['/users']);

        this.saving = false;
      },
      err => {
        this.notificationsService.failed(notification, err);
        this.saving = false;
      }
    );
  }

  // Exit from edit user window to all users window
  public notInterested(): void {
    this.router.navigate(['users']);
  }

  public showCheckedOrUnchecked(value: string) {
    if (this.isViewMode) {
      return true;
    }

    let temp;

    this.notifications?.includes(value) ? (temp = false) : (temp = true);

    return temp;
  }

  public notificationUpdated(value: string) {
    if (this.notifications?.includes(value)) {
      const index = this.notifications.findIndex(item => item === value);

      this.notifications.splice(index, 1);
    } else {
      this.notifications?.push(value);
    }
  }
}
