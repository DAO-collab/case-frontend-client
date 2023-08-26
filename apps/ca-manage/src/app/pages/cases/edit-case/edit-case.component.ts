import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';

import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { CasesService } from '../services/cases.service';
import { AdminService } from '../../../services/admin.service';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import { DesignService } from '../../../services/design.service';
import {
  PopInNotificationConnectorService,
  Notification
} from './../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { TimePipe } from '../../../common/pipes/time.pipe';

@Component({
  selector: 'app-edit-case',
  templateUrl: './edit-case.component.html',
  styleUrls: ['./edit-case.component.css'],
  providers: [DatePipe, TimePipe]
})
export class EditCaseComponent implements OnInit {
  public caseId?: string;
  public saving = false;
  public loading = true;
  public notFound = false;
  public formTouched = false;
  public validationErrors = [];
  public extraFields: any[] = [];
  public statusSelectList: any[] = [
    { text: 'Active', id: '1' },
    { text: 'Closed', id: '0' }
  ];
  public typeSelectList: any[] = [{ text: 'General', id: 'general' }];
  public serverErrors: any = null;
  public caseForm = this.formBuilder.group({
    about: ['', Validators.required],
    tag_id: [{ value: '', disabled: true }, Validators.required],
    date_opened: ['', Validators.required],
    case_status: ['', Validators.required],
    case_type: ['', Validators.required],
    meta_data: this.formBuilder.group({})
  });
  schemaTimeIds: string[] = [];

  get metaData() {
    return this.caseForm.controls['meta_data'] as UntypedFormGroup;
  }

  constructor(
    public utils: UtilsService,
    private router: Router,
    private route: ActivatedRoute,
    private casesService: CasesService,
    private date: DatePipe,
    private adminService: AdminService,
    private notificationsService: PopInNotificationConnectorService,
    private titleService: Title,
    private designService: DesignService,
    private hostService: HostService,
    private formBuilder: UntypedFormBuilder,
    private timePipe: TimePipe
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Cases`);
    this.caseId = this.route.snapshot.paramMap.get('case_id')!;
    this.designService.getCompanyInfo().subscribe(response => {
      const savedTypeList = response?.case_types || [];
      this.typeSelectList = (savedTypeList.length ? savedTypeList : ['general']).map((element: any) => {
        return { text: `${element.charAt(0).toUpperCase()}${element.slice(1)}`, id: element };
      });
    });
    this.casesService
      .getCase(this.caseId)
      .pipe(
        catchError(res => {
          this.notFound = true;
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe(caseData => {
        this.caseForm.patchValue({
          about: caseData.about,
          tag_id: caseData.tag_id,
          date_opened: this.date.transform(caseData.date_opened, 'MM/dd/yyyy'),
          case_status: `${caseData.case_status}`,
          case_type: `${caseData.case_type}`
        });

        if (this.hostService.caseSchema && this.hostService.caseSchema.properties == null) {
          this.loading = false;
        } else {
          const schema: any = this.hostService.caseSchema;
          const uiSchema: any = this.hostService.caseUiSchema;
          const properties = schema.properties;
          const requiredFields = schema.required;
          const keys = uiSchema.elements.map((item: any) => item.scope.split('/')[2]) || [];

          this.extraFields = keys
            ? keys.map((fieldId: any) => {
                const changedProp = properties[fieldId];
                changedProp.id = fieldId;

                if (requiredFields) {
                  changedProp.required = requiredFields.includes(fieldId);
                }

                if (changedProp.fieldType === 'time') {
                  this.schemaTimeIds.push(changedProp.id);
                  if (caseData?.meta_data?.content[0][fieldId]) {
                    caseData!.meta_data!.content[0][fieldId] = this.timePipe.transform(
                      String(caseData?.meta_data?.content[0][fieldId]),
                      true
                    );
                  }
                }

                this.metaData.addControl(
                  fieldId,
                  new UntypedFormControl(
                    caseData.meta_data &&
                    caseData.meta_data.content &&
                    caseData.meta_data.content[0] &&
                    caseData.meta_data.content[0][fieldId]
                      ? caseData.meta_data.content[0][fieldId]
                      : changedProp.defaultValue
                  )
                );

                return changedProp;
              })
            : [];

          this.loading = false;
        }
      });
  }

  public customCheckboxChangeValue(customFieldId: string, option: string) {
    const customField = this.metaData.controls[customFieldId];

    if (customField.value.includes(option)) {
      customField.setValue(customField.value.filter((value: any) => value !== option));
    } else {
      customField.setValue([...customField.value, option]);
    }
  }

  public save() {
    this.serverErrors = null;
    this.formTouched = true;

    if (this.validationErrors.length) {
      return;
    }

    const notification: Notification = this.notificationsService.addNotification({
      title: 'Updating case'
    });
    const caseFormValue = this.caseForm.getRawValue();
    delete caseFormValue.tag_id;
    this.saving = true;

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
      .updateCase(this.caseId!, caseFormValue)
      .pipe(
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          this.serverErrors = {};
          this.utils.fetchErrorsTo(res, this.serverErrors);
          this.saving = false;
          this.loading = false;
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.notificationsService.ok(notification, 'Case updated');
        this.saving = false;
        this.loading = false;
        this.router.navigate(['cases'], { queryParams: { caseUpdated: true } });
      });
  }

  public notInterested() {
    this.formTouched = false;
    this.router.navigate(['cases']);
  }
}
