import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { UtilsService } from '../../../services/utils.service';
import { AdminService } from '../../../services/admin.service';
import { RolesService } from '../services/roles.service';
import { HostService } from '../../../services/host.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import {
  PopInNotificationConnectorService,
  Notification
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { throwError } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-role',
  templateUrl: './add-role.component.html',
  styleUrls: ['./add-role.component.css']
})
export class AddRoleComponent extends UnsubscriptionHandler implements OnInit {
  loading = true;
  caseFiledsLoading = true;
  moduleOptions: any = [];
  creating = false;
  validationErrors = [];
  formTouched = false;
  savingError = '';
  customFields = [
    {
      key: 'about',
      title: 'About'
    },
    {
      key: 'tag_id',
      title: 'Tag Id'
    },
    {
      key: 'date_opened',
      title: 'Date Opened'
    },
    {
      key: 'case_status',
      title: 'Status'
    }
  ];
  roleForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    case_read_fields: [['about', 'tag_id', 'date_opened', 'case_status'], Validators.required],
    case_write_fields: [],
    permissions: this.formBuilder.group({
      case: [['read']],
      posts: [['read_all', 'manage_own']]
    }),
    file_size: this.formBuilder.group({
      audios: [10, [Validators.required]],
      docs: [10, [Validators.required]],
      files: [10, [Validators.required]],
      images: [10, [Validators.required]],
      videos: [10, [Validators.required]]
    })
  });

  get permissionsGroup() {
    return this.roleForm.controls['permissions'] as UntypedFormGroup;
  }

  get roleName() {
    return this.roleForm.controls['name'];
  }

  get fileSize() {
    return this.roleForm.controls['file_size'] as UntypedFormGroup;
  }

  constructor(
    private router: Router,
    private rolesService: RolesService,
    private adminService: AdminService,
    private utils: UtilsService,
    private notificationsService: PopInNotificationConnectorService,
    private titleService: Title,
    private hostService: HostService,
    private formBuilder: UntypedFormBuilder,
    private errorD: LocalTranslationService
  ) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Roles`);

    this.adminService
      .getOptionsServerOnly(['/modules/all'], 'en')
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => {
          this.caseFiledsLoading = false;
          this.loading = false;
        })
      )
      .subscribe(resp => {
        resp[0]['map']((opt: any) => {
          this.permissionsGroup.addControl(opt.key, new UntypedFormControl([]));
          this.moduleOptions.push({
            key: opt.key,
            values: (() => Object.keys(opt.value).map(i => ({ key: i, value: opt.value[i] })))()
          });
        });
      });

    if (!this.hostService.caseSchema) {
      this.caseFiledsLoading = false;
    } else {
      const schema = this.hostService.caseSchema;
      const uiSchema: any = this.hostService.caseUiSchema;
      const properties = schema.properties;
      const keys = uiSchema.elements.map((item: any) => item.scope.split('/')[2]) || [];

      this.customFields = [...this.customFields, ...keys.map((v: any) => ({ key: v, title: properties[v].title }))];
      this.caseFiledsLoading = false;
    }

    this.roleName.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(value => this.roleName.setValue(this.utils.replaceSpaces(value), { emitEvent: false }));
  }

  toggleFieldPermission(formGroup: string, control: string, key: string) {
    const permissionField = this[formGroup as keyof AddRoleComponent].controls[control];

    if (permissionField.value && permissionField.value.includes(key)) {
      permissionField.setValue(permissionField.value.filter((value: string) => value !== key));
    } else {
      permissionField.setValue([...(permissionField.value ? permissionField.value : []), key]);
    }
  }

  create(): string | void {
    this.formTouched = true;
    const formValue = this.roleForm.value;

    if (!formValue.case_read_fields.length) {
      return (this.savingError = 'Choose at least one reading field.');
    }

    if (this.validationErrors.length) {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Creating role'
    });

    this.savingError = '';
    this.creating = true;

    Object.keys(formValue).forEach(fieldName => {
      if (!formValue[fieldName] || (formValue[fieldName] && formValue[fieldName].length === 0)) {
        delete formValue[fieldName];
      }
    });
    Object.keys(formValue.permissions).forEach(fieldName => {
      if (formValue.permissions[fieldName] && formValue.permissions[fieldName].length === 0) {
        delete formValue.permissions[fieldName];
      }
    });

    this.rolesService
      .createRole(formValue)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          if (res.error && res.error.error && res.error.error.message === 'RoleNameDupsOrLimitException') {
            this.showError(res.error.error.message, notification);
          } else {
            this.notificationsService.failed(notification, 'Something went wrong');
          }

          return throwError(res.error);
        }),
        finalize(() => {
          this.creating = false;
          this.loading = false;
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, 'Role created');
        this.router.navigate(['roles']);
      });
  }

  notInterested() {
    this.router.navigate(['roles']);
  }

  private showError(error: string, notification: Notification) {
    let errorMessage: string;

    if (this.errorD.errorsDictionary) {
      errorMessage = this.errorD.errorsDictionary[error] || error;
      this.notificationsService.failed(notification, errorMessage);
    } else {
      this.errorD
        .loadErrors()
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(() => {
          errorMessage = this.errorD?.errorsDictionary?.[error] || error;
          this.notificationsService.failed(notification, errorMessage);
        });
    }
  }
}
