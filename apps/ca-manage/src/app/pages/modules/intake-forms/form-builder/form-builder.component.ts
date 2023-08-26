import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder } from '@angular/forms';
import { DomSanitizer, Title } from '@angular/platform-browser';

import { StylesService } from '../../../../services/styles.service';
import { UtilsService } from '../../../../services/utils.service';
import { LocalTranslationService } from '../../../../services/local-translation.service';
import { HostService } from '../../../../services/host.service';
import { TimePipe } from '../../../../common/pipes/time.pipe';
import { PopInNotificationConnectorService } from '../../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { OptionsService } from '../../../../services/options.service';
import { DriveService } from '../../../../services/drive.service';
import { AmazonService } from '../../../../services/amazon.service';
import { ContentMediaService } from '../../../../services/content-media.service';
import { FieldsIntakeFormBuilder } from '../../../../shared/classes/fields-intake-form-building';
import { IntakeFormsService } from '../../../../services/intake-forms.service';

@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.css'],
  providers: [TimePipe, DatePipe]
})
export class FormBuilderComponent extends FieldsIntakeFormBuilder implements OnInit, OnDestroy {
  isPreview = false;
  selectedPopupMenu = -1;
  isLongPressed = false;
  longPressedKey = '';
  selectedItem = '';
  list?: any;
  public keyword: string = '';
  public caseId: string = '';

  constructor(
    public override timePipe: TimePipe,
    public override datePipe: DatePipe,
    public router: Router,
    public override sanitizer: DomSanitizer,
    public override stylesService: StylesService,
    public override utilsService: UtilsService,
    public errorD: LocalTranslationService,
    public route: ActivatedRoute,
    public override formBuilder: UntypedFormBuilder,
    public override optionService: OptionsService,
    public override hostService: HostService,
    public override contentMediaService: ContentMediaService,
    public override notificationsService: PopInNotificationConnectorService,
    public override driveService: DriveService,
    public override amazonService: AmazonService,
    public override intakeFormsService: IntakeFormsService,
    private titleService: Title
  ) {
    super(
      timePipe,
      datePipe,
      utilsService,
      stylesService,
      errorD,
      route,
      formBuilder,
      () => {
        router.navigate(['/settings/intake-forms']);
      },
      sanitizer,
      optionService,
      contentMediaService,
      notificationsService,
      driveService,
      amazonService,
      hostService,
      intakeFormsService
    );
  }

  ngOnInit(): void {
    this.list = this.generateFieldTypeValues();
    this.titleService.setTitle(`${this.hostService.appName} | Intake Forms`);
    this.initialize();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public duplicatePage(index: any): void {
    const lastIndex = Object.keys(this.pageData).length;
    const tempPageData = JSON.parse(JSON.stringify(this.pageData));
    tempPageData[lastIndex] = tempPageData[index];
    this.pageData = tempPageData;
    this.selectedPopupMenu = -1;
    this.save();
  }

  public deletePage(index: any): void {
    delete this.pageData[index];
    const tempPageData = JSON.parse(JSON.stringify(this.pageData));
    this.pageData = {};
    Object.values(tempPageData).map((item: any) => {
      this.pageData[index] = item;
    });
    this.selectedPopupMenu = -1;
    this.save();
  }

  public moveUpPage(index: any): void {
    if (index > 0) {
      const tempPageData = JSON.parse(JSON.stringify(this.pageData));
      const upItem = tempPageData[index - 1];
      const downItem = tempPageData[index];
      tempPageData[index] = upItem;
      tempPageData[index - 1] = downItem;
      this.pageData = tempPageData;
    }
    this.selectedPopupMenu = -1;
    this.save();
  }

  public moveDownPage(index: any): void {
    const lastIndex = Object.keys(this.pageData).length - 1;
    if (index < lastIndex) {
      const tempPageData = JSON.parse(JSON.stringify(this.pageData));
      const upItem = tempPageData[index];
      const downItem = tempPageData[index + 1];
      tempPageData[index] = downItem;
      tempPageData[index + 1] = upItem;
      this.pageData = tempPageData;
    }
    this.selectedPopupMenu = -1;
    this.save();
  }

  fieldMoveStart(fieldKey: any) {
    this.isLongPressed = true;
    this.longPressedKey = fieldKey;
  }

  onMouseUp() {
    if (this.isLongPressed) {
      this.save();
    }
    this.isLongPressed = false;
  }

  public showPopupMenu(index: any): void {
    if (this.selectedPopupMenu === index) {
      this.selectedPopupMenu = -1;
    } else {
      this.selectedPopupMenu = index;
    }
  }

  public backToForms(): void {
    this.router.navigate(['/settings/intake-forms']);
  }

  public previewForm(): void {
    this.refreshPreview();
    this.isPreview = !this.isPreview;
    setTimeout(() => {
      this.calcFieldPosition();
    });
  }

  public changeToogle($event: any) {
    this.editingField.required = $event;
  }

  public getElement(fieldType: any): string {
    return this.fieldsList.filter(item => item.id === fieldType)[0].element;
  }

  public onFieldTypeSelectChange(value: any) {
    if (value.id === 'addCustomField') {
      const url = this.router.serializeUrl(this.router.createUrlTree(['/settings/userform']));

      window.open(url, '_blank');

      this.newFieldType = null;
      this.selectedCustomField = null;
    } else if (value.isCustomField) {
      this.newFieldType = value.id;
      this.selectedCustomField = value;
    } else {
      this.newFieldType = value.id;
      this.selectedCustomField = null;
    }
  }

  public onChangeSearch($event: any) {
    this.editingField.defaultValue = $event;
  }

  public selectEvent($event: any) {
    this.editingField.defaultValue = $event;
  }

  public currentTime() {
    const currentTime = new Date().toLocaleTimeString();
    return currentTime.split(' ')[0].split(':');
  }

  private generateFieldTypeValues() {
    const schema: any = this.hostService.userSchema;
    const arr = [];
    const noFieldsValue = {
      id: 'addCustomField',
      text: 'Add custom field',
      element: 'Add custom field'
    };

    if (!schema.properties) {
      arr.push(noFieldsValue);
    } else {
      schema.required = schema.required ? schema.required : [];
      schema.header = schema.header ? schema.header : [];

      Object.entries(schema.properties).forEach((field: any) => {
        const property: any = {
          id: field[1].fieldType,
          text: field[1].title,
          element: field[1].fieldType.charAt(0).toUpperCase() + field[1].fieldType.slice(1),
          defaultValue: field[1].defaultValue,
          isCustomField: true,
          required: schema.required.includes(field[0])
        };

        if (property.id === 'dropdown' || property.id === 'multidropdown') {
          property['enum'] = field[1].items.enum;
        }

        arr.push(property);
      });

      if (!arr?.length) {
        arr.push(noFieldsValue);
      }
    }

    return arr.concat(this.generateIntakeFormsList());
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  changeStyle($event: any, data: any) {
    this.selectedItem = $event.type == 'mouseover' ? data.key : '';
  }
}
