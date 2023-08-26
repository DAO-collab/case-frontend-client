import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { AdminService } from '../../../services/admin.service';
import { RolesService } from '../services/roles.service';
import { HostService } from '../../../services/host.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-edit-role',
  templateUrl: './edit-role.component.html',
  styleUrls: ['./edit-role.component.css']
})
export class EditRoleComponent extends UnsubscriptionHandler implements OnInit {
  public roleId?: string;
  public loading = true;
  public caseFiledsLoading = true;
  public moduleOptions: any = [];
  public creating = false;
  public message = '';
  public saving = false;
  public validationErrors = [];
  public formTouched = false;
  public serverErrors = null;
  public savingError = '';
  public customFields = [
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
  public roleForm = this.formBuilder.group({
    name: { value: '', disabled: true },
    case_read_fields: [[], Validators.required],
    case_write_fields: [],
    role_type: '',
    permissions: this.formBuilder.group({}),
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

  get fileSize() {
    return this.roleForm.controls['file_size'] as UntypedFormGroup;
  }

  constructor(
    private router: Router,
    private rolesService: RolesService,
    private route: ActivatedRoute,
    private errorD: LocalTranslationService,
    private adminService: AdminService,
    private notificationsService: PopInNotificationConnectorService,
    private titleService: Title,
    private hostService: HostService,
    private formBuilder: UntypedFormBuilder
  ) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Roles`);
    this.roleId = this.route.snapshot.paramMap.get('role_id')!;

    this.rolesService
      .getRole(this.roleId)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.message = 'Error';
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe(data => {
        this.roleForm.patchValue(data);

        this.adminService.getOptionsServerOnly(['/modules/all'], 'en').subscribe(
          resp => {
            resp[0]['map']((opt: any) => {
              this.permissionsGroup.addControl(
                opt.key,
                new UntypedFormControl(data?.permissions?.[opt.key] ? data.permissions[opt.key] : [])
              );
              this.moduleOptions.push({
                key: opt.key,
                values: (() => Object.keys(opt.value).map(i => ({ key: i, value: opt.value[i] })))()
              });
            });

            this.loading = false;
            this.caseFiledsLoading = false;
          },
          () => {
            this.loading = false;
            this.caseFiledsLoading = false;
          }
        );
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
  }

  toggleFieldPermission(formGroup: string, control: string, key: string) {
    const permissionField = this[formGroup as keyof EditRoleComponent].controls[control];

    if (permissionField.value && permissionField.value.includes(key)) {
      permissionField.setValue(permissionField.value.filter((value: string) => value !== key));
    } else {
      permissionField.setValue([...(permissionField.value ? permissionField.value : []), key]);
    }
  }

  public save(): string | void {
    this.serverErrors = null;
    this.formTouched = true;
    const formValue = this.roleForm.value;

    if (!formValue.case_read_fields.length) {
      return (this.savingError = 'Choose at least one reading field.');
    }

    if (this.validationErrors.length) {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Updating role'
    });

    this.savingError = '';
    this.creating = true;

    Object.keys(formValue).forEach(fieldName => {
      if (!formValue[fieldName]) {
        delete formValue[fieldName];
      }
    });
    Object.keys(formValue.permissions).forEach(fieldName => {
      if (formValue.permissions[fieldName] && formValue.permissions[fieldName].length === 0) {
        delete formValue.permissions[fieldName];
      }
    });

    this.rolesService
      .updateRole(this.roleId!, formValue)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          this.saving = false;
          this.creating = false;
          this.loading = false;
          this.message = res.message;
          this.showError();
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, 'Role updated');
        this.saving = false;
        this.creating = false;
        this.loading = false;
        this.message = '';
        this.router.navigate(['roles']);
      });
  }

  private showError() {
    if (this.errorD.errorsDictionary) {
      this.message = this.errorD.errorsDictionary[this.message];
    } else {
      this.errorD.loadErrors().subscribe(() => (this.message = this.errorD?.errorsDictionary![this.message as any]));
    }
  }

  public notInterested() {
    this.router.navigate(['roles']);
  }
}
