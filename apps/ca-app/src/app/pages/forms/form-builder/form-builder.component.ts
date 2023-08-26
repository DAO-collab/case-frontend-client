import { ApplicationRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { PinchZoomComponent } from 'ngx-pinch-zoom';

import { PopInNotificationConnectorService } from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { StylesService } from '../../../services/styles.service';
import { UserService } from '../../../services/user.service';
import { CasesService } from '../../../services/cases.service';
import { FeedMediaService } from '../../../services/feed-media.service';
import { FeedsService } from '../../../services/feeds.service';
import { FormsService } from '../../../services/forms.service';
import { SignsService } from '../../../services/signs.service';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import { OptionsService } from '../../../services/options.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { FormBuilder } from '../../../shared/form-builder';
import { TimePipe } from '../../../pipes/time.pipe';

@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.css'],
  providers: [TimePipe, DatePipe]
})
export class FormBuilderComponent extends FormBuilder implements OnInit, OnDestroy {
  @ViewChild('myPinch') myPinch?: PinchZoomComponent;
  @Input() currentCaseId?: string;
  @Input() selectedForm?: any;
  @Input() teamData?: any;

  private isZoomed?: boolean;
  isLongPressed = false;
  longPressedKey = '';
  selectedPopupMenu = -1;
  selectedElementPopupMenu = -1;
  validationErrors: any = [];
  isPreview = false;
  public selectedItem = '';
  public keyword: string = '';

  get currentTime() {
    const currentTime = new Date().toLocaleTimeString();
    return currentTime.split(' ')[0].split(':');
  }

  constructor(
    timePipe: TimePipe,
    datePipe: DatePipe,
    notificationsService: PopInNotificationConnectorService,
    translationService: LocalTranslationService,
    public override stylesService: StylesService,
    public override changeDetector: ApplicationRef,
    public override route: ActivatedRoute,
    public override router: Router,
    public override sanitizer: DomSanitizer,
    public override userService: UserService,
    public override casesService: CasesService,
    public override feedsMediaService: FeedMediaService,
    public override feedsService: FeedsService,
    public override contentMediaService: FeedMediaService,
    public override formsService: FormsService,
    public override signsService: SignsService,
    public override utilsService: UtilsService,
    public override optionsService: OptionsService,
    private hostService: HostService,
    private titleService: Title
  ) {
    super(
      timePipe,
      datePipe,
      notificationsService,
      translationService,
      stylesService,
      formsService,
      signsService,
      contentMediaService,
      changeDetector,
      sanitizer,
      route,
      router,
      casesService,
      feedsService,
      feedsMediaService,
      userService,
      utilsService,
      optionsService
    );
  }

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Forms`);
    this.builderService = this.formsService;
    this.afterUpdateNavigation = '/forms/';
    this.initializationComponents();
  }

  ngOnDestroy() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  duplicatePage(index: any): void {
    const lastIndex = Object.keys(this.pageData).length;
    let tempPageData = JSON.parse(JSON.stringify(this.pageData));
    tempPageData[lastIndex] = tempPageData[index];
    this.pageData = tempPageData;
    this.selectedPopupMenu = -1;
    this.save();
  }

  deletePage(index: any): void {
    delete this.pageData[index];
    let tempPageData = JSON.parse(JSON.stringify(this.pageData));
    this.pageData = {};
    Object.values(tempPageData).map((item: any, index: any) => {
      this.pageData[index] = item;
    });
    this.selectedPopupMenu = -1;
    this.save();
  }

  moveUpPage(index: any): void {
    if (index > 0) {
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      const upItem = tempPageData[index - 1];
      const downItem = tempPageData[index];
      tempPageData[index] = upItem;
      tempPageData[index - 1] = downItem;
      this.pageData = tempPageData;
    }
    this.selectedPopupMenu = -1;
    this.save();
  }

  moveDownPage(index: any): void {
    const lastIndex = Object.keys(this.pageData).length - 1;
    if (index < lastIndex) {
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      const upItem = tempPageData[index];
      const downItem = tempPageData[index + 1];
      tempPageData[index] = downItem;
      tempPageData[index + 1] = upItem;
      this.pageData = tempPageData;
    }
    this.selectedPopupMenu = -1;
    this.save();
  }

  showPopupMenu(index: any): void {
    if (this.selectedPopupMenu === index) {
      this.selectedPopupMenu = -1;
    } else {
      this.selectedPopupMenu = index;
    }
  }

  showElementPopupMenu(index: any): void {
    if (this.selectedElementPopupMenu === index) {
      this.selectedElementPopupMenu = -1;
    } else {
      this.selectedElementPopupMenu = index;
    }
  }

  backToForms(): void {
    //this.router.navigate(['/forms/']);
    this.router.navigate(['/forms'], { queryParams: { tab: 'published' } });
  }

  previewForm(): void {
    this.refreshPreview();
    this.isPreview = !this.isPreview;
    setTimeout(() => {
      this.calcFieldPosition();
    });
  }

  getElement(fieldType: any): string {
    return this.fieldsList?.filter(item => item.id === fieldType)[0].element;
  }

  toggleZoom(isZoomIn?: boolean) {
    if ((isZoomIn && !this.isZoomed) || (!isZoomIn && this.isZoomed)) {
      this.myPinch?.toggleZoom();
      this.isZoomed = !this.isZoomed;
    }
  }

  onFieldTypeSelectChange({ id }: { id: string; text: string }) {
    this.newFieldType = id;
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

  changeToogle($event: any) {
    this.editingField!.require = $event;
  }

  changeReadOnlyToogle($event: any) {
    this.editingField!.readonly = $event;
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  selectEvent($event: any) {
    this.editingField!.defaultValue = $event;
  }

  onChangeSearch($event: any) {
    this.editingField!.defaultValue = $event;
  }

  changeStyle($event: any, data: any) {
    this.selectedItem = $event.type == 'mouseover' ? data.key : '';
  }
}
