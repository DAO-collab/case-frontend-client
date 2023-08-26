import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  DoCheck,
  ElementRef,
  HostListener,
  HostBinding
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { PinchZoomComponent } from 'ngx-pinch-zoom';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { FormsService } from './../../../../services/forms.service';
import { StylesService } from './../../../../services/styles.service';
import { DriveService } from './../../../../services/drive.service';
import { HostService } from '../../../../services/host.service';
import { LocalTranslationService } from '../../../../services/local-translation.service';
import { AmazonService } from '../../../../services/amazon.service';
import { OptionsService } from '../../../../services/options.service';
import { ContentMediaService } from '../../../../services/content-media.service';
import { FeedMediaService } from '../../../../services/feed-media.service';
import { DocFormBuilder } from './../../../../shared/classes/doc-form-building';
import { DesignService } from '../../../../services/design.service';
import { UtilsService } from '../../../../services/utils.service';
import { UserService } from '../../../../services/user.service';
import { TimePipe } from '../../../../common/pipes/time.pipe';
import { PopInNotificationConnectorService } from '../../../../common/components/pop-in-notifications/pop-in-notification-connector.service';

@Component({
  selector: 'app-create-doc-form',
  templateUrl: './create-doc-form.component.html',
  styleUrls: ['./create-doc-form.component.css'],
  providers: [TimePipe]
})
export class CreateDocFormComponent extends DocFormBuilder implements OnInit, OnDestroy, DoCheck {
  @ViewChild('myPinch') myPinch?: PinchZoomComponent;
  @ViewChild('pageContentWithToolbar') pageContentWithToolbar?: ElementRef;

  @ViewChild('pinchZoomWrapper', { static: false }) set content(content: ElementRef) {
    if (content) {
      this._pinchZoomWrapper = content;
    }
  }

  @ViewChild('backgroundImage', { static: false }) set backgroundContent(content: ElementRef) {
    if (content) {
      setTimeout(() => {
        this._backgroundImage = content;
        this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage?.nativeElement);
        this.bgImgLoaded = true;
      });
    }
  }
  public subMenuPopupStyle = {
    top: 0,
    left: 0,
    scroll: 0
  }
  public optionsSupport: any = {
    dropdown: true,
    multidropdown: true,
    checkboxes: true,
    options: true,
    table: true,
    list: true,
    'checkbox-options': true
  };
  public isPreview = false;
  public selectedItem = '';
  public bgImgLoaded = false;
  selectedElementPopupMenu = -1;
  selectedElementPageMenu = -1;
  selectedPopupMenu = -1;
  public selectedItemButtonIndex: number | null = null;
  public keyword: string = '';

  public scale?: number;
  private isZoomed?: boolean;
  private _pinchZoomWrapper?: ElementRef;
  private prevDocUrl?: string;

  private get pinchZoomWrapper() {
    return this._pinchZoomWrapper;
  }

  private get backgroundImage() {
    return this._backgroundImage;
  }

  public get isCurrentNewFieldTypeCorrect(): boolean {
    return this.newFieldType === 'text-only';
  }

  public get fieldDefaultWidth(): string {
    return this._backgroundImage?.nativeElement?.offsetWidth / 2 - this.pageMargin - this.initialFieldsGap + 'px';
  }

  public get fieldDefaultBigHeight(): number {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.1125;
  }

  public get fieldDefaultMiddleHeight(): number {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.085;
  }

  public get fieldDefaultSmallHeight(): number {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.05;
  }

  public get fieldBackgroundSize(): number {
    return this._backgroundImage?.nativeElement?.offsetHeight;
  }

  public get fieldBackgroundWidth(): number {
    return this._backgroundImage?.nativeElement?.offsetWidth;
  }

  public get radioButtonSize(): string {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetWidth * 0.0354 + 'px';
  }

  public get fieldDefaultFontSize(): string {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.01625 + 'px';
  }

  public get fieldDefaultTableCellHeight(): string {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.0325 + 'px';
  }

  public get pageMargin(): number {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetWidth * 0.118;
  }

  public get initialFieldsGap(): number {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetWidth * 0.0071;
  }

  @HostBinding('style.--moving-lines-size')
  private get movingLinesSize(): number {
    return this._backgroundImage?.nativeElement?.offsetWidth * 0.0018;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if (this.backgroundImage) {
      setTimeout(() => {
        this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage?.nativeElement);
      });
    }
  }

  constructor(
    public override notificationsService: PopInNotificationConnectorService,
    public override utilsService: UtilsService,
    public override timePipe: TimePipe,
    public errorD: LocalTranslationService,
    public override changeDetector: ChangeDetectorRef,
    public override stylesService: StylesService,
    public override driveService: DriveService,
    public override route: ActivatedRoute,
    public override router: Router,
    public override sanitizer: DomSanitizer,
    public datePipe: DatePipe,
    public override optionsService: OptionsService,
    public override formsService: FormsService,
    public contentMediaService: ContentMediaService,
    public feedMediaService: FeedMediaService,
    public override amazonService: AmazonService,
    public override formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private hostService: HostService,
    public override designService: DesignService,
    public override userService: UserService
  ) {
    super(
      notificationsService,
      utilsService,
      timePipe,
      stylesService,
      formsService,
      contentMediaService,
      feedMediaService,
      amazonService,
      errorD,
      optionsService,
      driveService,
      changeDetector,
      sanitizer,
      route,
      router,
      datePipe,
      formBuilder,
      designService,
      userService
    );
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Forms`);
    this.loading = true;
    this.formTouched = false;
    this.addFieldFormTouched = false;

    this.loadOpenedInformation();
    this.loadExtesions();

    this.subscribers.push(
      this.autoSaveObserver.subscribe(r => {
        clearTimeout(this.saveTimeoutId);
        this.saveTimeoutId = setTimeout(() => {
          this.save(true);
        }, 1000);
      })
    );

    this.formsService.refreshPinchSubject.asObservable().subscribe(_ => {
      if (this.documentLink !== this.prevDocUrl) {
        this.formsService.refreshScale(this.pinchZoomWrapper!);
        this.bgImgLoaded = false;
        this.prevDocUrl = this.documentLink;

        let i = 0;
        const resizeInterval = setInterval(() => {
          i++;
          if (i > 35) {
            clearInterval(resizeInterval);
          }
          this.onResize('' as any);
        }, 50);
      }
    });

    this.initializationComponents();
  }

  // refreshScale() {
  //   if (this.backgroundImage && this.backgroundImage?.nativeElement?.currentSrc) {
  //     setTimeout(() => {
  //       this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper, this.backgroundImage.nativeElement);
  //     }, 500);
  //   } else {
  //     setTimeout(() => this.refreshScale(), 500);
  //   }
  // }
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
  showPopupMenu(index: any, event: any): void {
    if (this.selectedPopupMenu === index) {
      this.selectedPopupMenu = -1;
    } else {
      const htmlEl = event.target.closest('.page-menu-item').querySelector('.remove-box-shadow');
      const element = htmlEl.getBoundingClientRect();
      const docPage = htmlEl.closest('.doc-page');

      this.subMenuPopupStyle.top = (docPage.offsetHeight + +getComputedStyle(docPage).marginBottom.slice(0, -2)) * index;
      this.subMenuPopupStyle.left = element.left + element.width + 10;
      this.selectedPopupMenu = index;
    }
  }
  pageMenuItemOnScroll(event: any): void {
    this.subMenuPopupStyle.scroll = event.target.scrollTop
  }
  onBgImgLoad() {}

  previewForm(): void {
    this.isPreview = !this.isPreview;
  }

  toggleZoom(isZoomIn?: boolean) {
    if ((isZoomIn && !this.isZoomed) || (!isZoomIn && this.isZoomed)) {
      this.myPinch?.toggleZoom();
      this.formsService.zoomIn(this.pinchZoomWrapper!, this._backgroundImage?.nativeElement?.offsetHeight, isZoomIn);
      this.isZoomed = !this.isZoomed;
    }
  }

  backToForms(): void {
    this.router.navigate(['/library/forms']);
  }

  ngDoCheck() {
    this.updateDocumentViewSizeDueToWindowWidth();
  }

  ngOnDestroy() {
    this.destroy = true;
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  selectEvent($event: any) {
    this.editingField.defaultValue = $event;
  }

  public changeToggle(event: boolean): void {
    this.editingField!.require = event;
  }

  public changeDisplayTextToggle(event: boolean): void {
    this.editingField.displayText = event;
  }

  public changeReadOnlyToggle(event: boolean): void {
    this.editingField!.readonly = event;
  }

  onChangeSearch($event: any) {
    this.editingField.defaultValue = $event;
  }

  shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  changeStyle($event: any, data: any) {
    this.selectedItem = $event.type == 'mouseover' ? data.key : '';
    this.selectedItemButtonIndex = $event.type === 'mouseover' && data?.positions ? data.childIndex : null;
  }

  public selectItem(data: any): void {
    this.selectedItem = data?.key || '';
    this.selectedItemButtonIndex = data?.positions ? data.childIndex : null;
  }

  showElementPopupMenu(page: any, index: any): void {
    if (this.selectedElementPopupMenu === index) {
      this.selectedElementPopupMenu = -1;
      this.selectedElementPageMenu = -1;
    } else {
      this.selectedElementPopupMenu = index;
      this.selectedElementPageMenu = page;
    }
  }

  uploadImage(fieldData: any, target: any): void {
    const file: File = target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      fieldData.defaultValue = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  public optionsChange(event: Event): void {
    if (this.editingField.fieldType === 'checkbox-options') {
      this.fieldValueField.setValue((event.target as HTMLInputElement).value);
    }
  }

  public sortTableColumns(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.editingField.cols, event.previousIndex, event.currentIndex);
  }

  @HostListener('document:click', ['$event'])
  private deselectDraggableItem(event: Event): void {
    event.target instanceof HTMLImageElement && ((this.selectedItem = ''), this.deselectDraggableItemField());
  }
}
