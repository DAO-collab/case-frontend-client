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
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { PinchZoomComponent } from 'ngx-pinch-zoom';
import { UntypedFormBuilder } from '@angular/forms';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { UserService } from '@manage/services/user.service';
import { LocalTranslationService } from './../../../../services/local-translation.service';
import { StylesService } from '../../../../services/styles.service';
import { DriveService } from './../../../../services/drive.service';
import { UploadFormBuilder } from './../../../../shared/classes/upload-form-building';
import { AmazonService } from '../../../../services/amazon.service';
import { OptionsService } from '../../../../services/options.service';
import { ContentMediaService } from '../../../../services/content-media.service';
import { FeedMediaService } from '../../../../services/feed-media.service';
import { TimePipe } from '../../../../common/pipes/time.pipe';
import { HostService } from '../../../../services/host.service';
import { SignsService } from '../../../../services/signs.service';
import { UtilsService } from '../../../../services/utils.service';
import { PopInNotificationConnectorService } from '../../../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { DesignService } from '../../../../services/design.service';
import { FormsService } from '../../../../services/forms.service';

@Component({
  selector: 'app-doc-signs-builder',
  templateUrl: './doc-signs-builder.component.html',
  styleUrls: ['./doc-signs-builder.component.css'],
  providers: [TimePipe]
})
export class DocSignsBuilderComponent extends UploadFormBuilder implements OnInit, OnDestroy, DoCheck {
  @ViewChild('myPinch') myPinch?: PinchZoomComponent;

  @ViewChild('pinchZoomWrapper', { static: false }) set content(content: ElementRef) {
    if (content) {
      this._pinchZoomWrapper = content;
    }
  }

  @ViewChild('backgroundImage', { static: false }) set backgroundContent(content: ElementRef) {
    if (content) {
      setTimeout(() => {
        this._backgroundImage = content;
        this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper!, content.nativeElement);
        this.bgImgLoaded = true;
      });
    }
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
  public keyword: string = '';
  public bgImgLoaded = false;
  public currentTime: any[] = [];
  selectedElementPopupMenu = -1;
  selectedElementPageMenu = -1;
  selectedPopupMenu = -1;

  public scale?: number;
  private isZoomed?: boolean;
  private _pinchZoomWrapper?: ElementRef;
  private prevDocUrl?: string;
  public selectedItemButtonIndex: number | null = null;

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
      this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage.nativeElement);
    }
  }

  constructor(
    public override notificationsService: PopInNotificationConnectorService,
    public override utilsService: UtilsService,
    public override timePipe: TimePipe,
    public override sanitizer: DomSanitizer,
    public override stylesService: StylesService,
    public override formsService: SignsService,
    public contentMediaService: ContentMediaService,
    public feedMediaService: FeedMediaService,
    public override amazonService: AmazonService,
    public errorD: LocalTranslationService,
    public override optionsService: OptionsService,
    public override changeDetector: ChangeDetectorRef,
    public override driveService: DriveService,
    public override route: ActivatedRoute,
    public override router: Router,
    public override date: DatePipe,
    public override formBuilder: UntypedFormBuilder,
    public override designService: DesignService,
    public formsBuilderService: FormsService,
    private titleService: Title,
    public hostService: HostService,
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
      date,
      formBuilder,
      designService,
      userService
    );
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | E-signs`);
    this.loading = true;
    this.formTouched = false;
    this.addFieldFormTouched = false;

    this.formsService.refreshPinchSubject.asObservable().subscribe(_ => {
      this.refreshScale();
    });

    this.loadOpenedInformation();

    this.subscribers.push(
      this.autoSaveObserver.subscribe(r => {
        clearTimeout(this.saveTimeoutId);

        this.saveTimeoutId = setTimeout(() => {
          this.save();
        }, 1000);
      })
    );

    this.formsService.refreshPinchSubject.asObservable().subscribe(_ => {
      if (this.documentLink !== this.prevDocUrl) {
        this.formsService.refreshScale(this.pinchZoomWrapper!);
        this.bgImgLoaded = false;
        this.prevDocUrl = this.documentLink;
      }
    });

    this.initializationComponents();
  }

  refreshScale() {
    if (this.backgroundImage && this.backgroundImage?.nativeElement?.currentSrc) {
      setTimeout(() => {
        this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage?.nativeElement);
      }, 500);
    } else {
      setTimeout(() => this.refreshScale(), 500);
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
  onBgImgLoad() {
    this.bgImgLoaded = true;
  }

  previewForm(): void {
    this.isPreview = !this.isPreview;
  }

  backToForms(): void {
    this.router.navigate(['/library/e-signs']);
  }

  toggleZoom(isZoomIn?: boolean) {
    if ((isZoomIn && !this.isZoomed) || (!isZoomIn && this.isZoomed)) {
      this.myPinch?.toggleZoom();
      this.formsService.zoomIn(this.pinchZoomWrapper!, this._backgroundImage?.nativeElement?.offsetHeight, isZoomIn);
      this.isZoomed = !this.isZoomed;
    }
  }

  ngDoCheck() {
    this.updateDocumentViewSizeDueToWindowWidth();
  }

  ngOnDestroy() {
    this.destroy = true;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  selectEvent($event: any) {
    this.editingField.defaultValue = $event;
  }

  onChangeSearch($event: any) {
    this.editingField.defaultValue = $event;
  }

  shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  changeStyle($event: Event, data: any) {
    this.selectedItem = $event.type == 'mouseover' ? data.key : '';
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

  public changeToggle(event: boolean): void {
    this.editingField!.require = event;
  }

  public changeDisplayTextToggle(event: boolean): void {
    this.editingField.displayText = event;
  }

  public changeReadOnlyToggle(event: boolean): void {
    this.editingField!.readonly = event;
  }

  public optionsChange(event: Event): void {
    if (this.editingField.fieldType === 'checkbox-options') {
      this.fieldValueField.setValue((event.target as HTMLInputElement).value);
    }
  }

  public sortTableColumns(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.editingField.cols, event.previousIndex, event.currentIndex);
  }

  public selectItem(data: any): void {
    this.selectedItem = data?.key || '';
    this.selectedItemButtonIndex = data?.positions ? data.childIndex : null;
  }
  
  @HostListener('document:click', ['$event'])
  private deselectDraggableItem(event: Event): void {
    event.target instanceof HTMLImageElement && ((this.selectedItem = ''), this.deselectDraggableItemField());
  }
}
