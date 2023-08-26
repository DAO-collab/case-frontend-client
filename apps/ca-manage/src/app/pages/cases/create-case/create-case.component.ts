import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { combineLatest, throwError } from 'rxjs';

import { CasesService } from '../services/cases.service';
import { AdminService } from '../../../services/admin.service';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import { DesignService } from '../../../services/design.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { UnsubscriptionHandler } from '../../../shared/classes/unsubscription-handler';
import { ICaseAssignedUser, ICreateCaseRelation } from '../models/case.model';
import { UsersService } from '../../users/services/users.service';
import { IUser } from '../../users/models/user.model';
import { TimePipe } from '../../../common/pipes/time.pipe';

@Component({
  selector: 'app-create-case',
  templateUrl: './create-case.component.html',
  styleUrls: ['./create-case.component.css'],
  providers: [TimePipe]
})
export class CreateCaseComponent extends UnsubscriptionHandler implements OnInit {
  creatingCase = false;
  loading = true;
  validationErrors: any[] = [];
  extraFields: any[] = [];
  formTouched = false;
  canAssignUser = '';
  openDate = new Date().toISOString();

  assignUserArray: ICaseAssignedUser[] = [];
  statusSelectList: any[] = [
    { text: 'Active', id: '1' },
    { text: 'Closed', id: '0' }
  ];
  typeSelectList: any[] = [{ text: 'General', id: 'general' }];
  caseForm = this.formBuilder.group({
    about: ['', Validators.required],
    tag_id: ['', Validators.required],
    date_opened: ['', Validators.required],
    case_status: ['', Validators.required],
    case_type: ['', Validators.required],
    meta_data: this.formBuilder.group({})
  });
  schemaTimeIds: string[] = [];

  get tagId() {
    return this.caseForm.controls['tag_id'];
  }

  get metaData() {
    return this.caseForm.controls['meta_data'] as UntypedFormGroup;
  }

  constructor(
    private timePipe: TimePipe,
    private utils: UtilsService,
    private router: Router,
    private casesService: CasesService,
    private adminService: AdminService,
    private userService: UsersService,
    private notificationsService: PopInNotificationConnectorService,
    private titleService: Title,
    private hostService: HostService,
    private designService: DesignService,
    private formBuilder: UntypedFormBuilder,
    private errorD: LocalTranslationService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Cases`);
    this.tagId.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(value => this.tagId.setValue(this.utils.replaceSpaces(value), { emitEvent: false }));
    this.designService.getCompanyInfo().subscribe(response => {
      const savedTypeList = response?.case_types || [];
      this.typeSelectList = (savedTypeList.length ? savedTypeList : ['general']).map((element: any) => {
        return { text: `${element.charAt(0).toUpperCase()}${element.slice(1)}`, id: element };
      });
    });
    if (!this.hostService.caseSchema || !this.hostService.caseSchema.properties) {
      this.loading = false;
    } else {
      const schema = this.hostService.caseSchema;
      const uiSchema = this.hostService.caseUiSchema;
      const properties = schema.properties;
      const requiredFields = schema.required;
      const keys = uiSchema?.elements.map(item => item.scope.split('/')[2]) || [];

      this.extraFields = keys
        ? keys.map(fieldId => {
            const changedProp = properties[fieldId];
            changedProp.id = fieldId;

            if (requiredFields) {
              changedProp.required = requiredFields.includes(fieldId);
            }

            if (changedProp.fieldType === 'time') {
              this.schemaTimeIds.push(changedProp.id);
            }

            this.metaData.addControl(
              changedProp.id,
              new UntypedFormControl(
                changedProp.fieldType === 'time'
                  ? this.convertUTCDateToLocalDate(changedProp.defaultValue)
                  : changedProp.defaultValue
              )
            );

            return changedProp;
          })
        : [];

      this.loading = false;
    }
  }

  public convertUTCDateToLocalDate(time: any) {
    const todayDate = new Date().toLocaleDateString();
    const [days, month, year] = [todayDate.slice(0, 2), todayDate.slice(3, 5), todayDate.slice(6, 10)];
    const timeZoneDate = new Date(`${month}-${days}-${year} ${time}`);

    return timeZoneDate;
  }

  customCheckboxChangeValue(customFieldId: string, option: string) {
    const customField = this.metaData.controls[customFieldId];

    if (customField.value.includes(option)) {
      customField.setValue(customField.value.filter((value: any) => value !== option));
    } else {
      customField.setValue([...customField.value, option]);
    }
  }

  /**
   * Create case.
   */
  createCase(): void {
    this.formTouched = true;

    if (this.validationErrors.length) {
      this.creatingCase = false;
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Creating case'
    });
    const caseFormValue = this.caseForm.value;
    this.creatingCase = true;

    if (Object.keys(this.metaData.value).length > 0) {
      const metaDataValue = this.utils.cleanObject(this.metaData.value);

      if (this.schemaTimeIds.length) {
        this.schemaTimeIds.forEach(id => {
          metaDataValue[id] = this.timePipe.formatInTimeZone(metaDataValue[id], 'kk:mm:ssxxx', 'UTC');
        });
      }

      caseFormValue.meta_data = [this.utils.transformDropdownValues(metaDataValue)];
    } else {
      delete caseFormValue.meta_data;
    }

    this.casesService
      .createCase(caseFormValue)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(res => {
          if (res.error && res.error.error && res.error.error.message === 'FieldTagDupsException') {
            this.showError(res.error.error.message || res.message, notification);
          } else {
            this.notificationsService.failed(notification, 'Something went wrong');
          }

          return throwError(res.error);
        }),
        finalize(() => {
          this.creatingCase = false;
          this.loading = false;
        })
      )
      .subscribe(res => {
        if (this.assignUserArray && this.assignUserArray.length) {
          const calls = this.assignUserArray.map(el => {
            const request: ICreateCaseRelation = {
              // case_role_id: '',
              case_notify: (null as any),
              ...el,
              case_id: res.case_id
            };
            return this.casesService.addCaseRelation(request);
          });
          combineLatest(calls).subscribe(
            response => {
              this.creatingCase = false;
              this.notificationsService.ok(notification, 'Case created');
              this.router.navigate(['cases']);
            },
            error => {
              if (error && error.error && error.error.message) {
                this.errorD
                  .showError(error.error.message)
                  .pipe(takeUntil(this.unsubscribe$))
                  .subscribe(errorMessage => this.notificationsService.failed(notification, errorMessage));
              } else {
                this.notificationsService.failed(notification, 'Something went wrong');
              }
            }
          );
        } else {
          this.notificationsService.ok(notification, 'Case created');
          this.router.navigate(['cases']);
        }
      });
  }

  /**
   * Exit without create case page
   */
  notInterested(): void {
    this.formTouched = false;
    this.router.navigate(['cases']);
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

  setUserDetails(event: { request: ICreateCaseRelation; userData: any }) {
    const { request } = event;
    if (request && request.user_id) {
      this.userService.getUserRelation(request.user_id).subscribe((user: IUser) => {
        if (user) {
          let data: ICaseAssignedUser | null = null;
          const index = this.assignUserArray.find(el => el.user_id === user.user_id);
          if (!index) {
            data = {
              // family_name: '',
              // given_name: '',
              host_user_status: 0,
              ...request,
              ...user
            };
            this.assignUserArray = [...this.assignUserArray, data];
          }
        }
      });
    }
  }

  setAssignUserList(list: ICaseAssignedUser[]) {
    this.assignUserArray = list;
  }

  onSubmit() {
    this.creatingCase = true;
    this.createCase();
  }

  public openImportsModal(): void {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/integration']));

    sessionStorage.setItem('importsType', 'post_case');
    window.open(url, '_blank');
    sessionStorage.removeItem('importsType');
  }
}
