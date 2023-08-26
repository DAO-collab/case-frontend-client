import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder } from '@angular/forms';
import { DomSanitizer, Title } from '@angular/platform-browser';

import { FieldsFormBuilder } from '../../../../shared/classes/fields-form-building';
import { StylesService } from '../../../../services/styles.service';
import { FormsService } from '../../../../services/forms.service';
import { UtilsService } from '../../../../services/utils.service';
import { LocalTranslationService } from '../../../../services/local-translation.service';
import { HostService } from '../../../../services/host.service';
import { TimePipe } from '../../../../common/pipes/time.pipe';
import { PopInNotificationConnectorService } from '../../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { OptionsService } from '../../../../services/options.service';
import { SignsService } from '../../../../services/signs.service';
import { DriveService } from '../../../../services/drive.service';
import { AmazonService } from '../../../../services/amazon.service';
import { ContentMediaService } from '../../../../services/content-media.service';

@Component({
  selector: 'app-sign-builder',
  templateUrl: './sign-builder.component.html',
  styleUrls: ['./sign-builder.component.css'],
  providers: [TimePipe, DatePipe]
})
export class SignBuilderComponent extends FieldsFormBuilder implements OnInit {
  isPreview = false;
  selectedPopupMenu = -1;
  selectedItem = '';
  selectedElementPopupMenu = -1;
  public keyword: string = '';
  public isLongPressed: boolean = false;
  public longPressedKey: string = '';
  public caseId: string = '';

  get currentTime() {
    const currentTime = new Date().toLocaleTimeString();
    return currentTime.split(' ')[0].split(':');
  }

  constructor(
    public override timePipe: TimePipe,
    public override datePipe: DatePipe,
    public router: Router,
    public override sanitizer: DomSanitizer,
    public override stylesService: StylesService,
    public signsService: SignsService,
    public override utilsService: UtilsService,
    public errorD: LocalTranslationService,
    public route: ActivatedRoute,
    public override formBuilder: UntypedFormBuilder,
    public override optionService: OptionsService,
    public override contentMediaService: ContentMediaService,
    public override notificationsService: PopInNotificationConnectorService,
    public override driveService: DriveService,
    public override amazonService: AmazonService,
    private titleService: Title,
    public override hostService: HostService
  ) {
    super(
      timePipe,
      datePipe,
      signsService,
      utilsService,
      stylesService,
      errorD,
      route,
      formBuilder,
      () => {
        router.navigate(['/library/e-signs']);
      },
      sanitizer,
      optionService,
      contentMediaService,
      notificationsService,
      driveService,
      amazonService,
      hostService
    );
  }

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | E-signs`);
    this.initialize();
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

  public showPopupMenu(index: any): void {
    if (this.selectedPopupMenu === index) {
      this.selectedPopupMenu = -1;
    } else {
      this.selectedPopupMenu = index;
    }
  }

  public backToSigns(): void {
    this.router.navigate(['/library/e-signs']);
  }

  public previewSign(): void {
    this.refreshPreview();
    this.isPreview = !this.isPreview;
    setTimeout(() => {
      this.calcFieldPosition();
    });
  }

  public changeToogle($event: any) {
    this.editingField.required = $event;
  }

  public getElement(fieldType: string): string {
    return this.fieldsList.filter(item => item.id === fieldType)[0].element;
  }

  public onFieldTypeSelectChange({ id }: { id: string; text: string }) {
    this.newFieldType = id;
  }

  public onChangeSearch($event: any) {
    this.editingField.defaultValue = $event;
  }

  public selectEvent($event: any) {
    this.editingField.defaultValue = $event;
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  public onMouseUp(): void {

  }

  public fieldMoveStart(event: any): void {
    
  }

  changeStyle($event: Event, data: any) {
    this.selectedItem = $event.type == 'mouseover' ? data.key : '';
  }

  showElementPopupMenu(index: any): void {
    if (this.selectedElementPopupMenu === index) {
      this.selectedElementPopupMenu = -1;
    } else {
      this.selectedElementPopupMenu = index;
    }
  }
}
