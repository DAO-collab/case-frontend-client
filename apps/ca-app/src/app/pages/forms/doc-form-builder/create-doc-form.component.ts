import {
  Component,
  OnInit,
  ApplicationRef,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef,
  HostListener,
  HostBinding
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { PinchZoomComponent } from 'ngx-pinch-zoom';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { take, tap } from 'rxjs/operators';

import { UploadFormBuilder } from '../../../shared/document-forms-builder';
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
import { PopInNotificationConnectorService } from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { TimePipe } from '../../../pipes/time.pipe';

@Component({
  selector: 'app-create-doc-form',
  templateUrl: './create-doc-form.component.html',
  styleUrls: ['./create-doc-form.component.css'],
  providers: [TimePipe, DatePipe]
})
export class CreateDocFormComponent extends UploadFormBuilder implements OnInit, OnDestroy {
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
        this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper!, content.nativeElement);
        this.bgImgLoaded = true;
      });
    }
  }

  @Input() currentCaseId?: string;
  @Input() selectedForm?: any;
  @Input() teamData?: any;

  convertingImgSrc = 'images/form-image-converting.svg';
  selectedItem = '';
  public selectedItemButtonIndex: number | null = null;
  isPreview = false;
  scale?: number;
  selectedElementPopupMenu = -1;
  selectedElementPageMenu = -1;
  selectedPopupMenu = -1;

  private isZoomed?: boolean;
  private _pinchZoomWrapper?: ElementRef;
  private prevDocUrl?: string;
  public bgImgLoaded = false;
  public insertFieldType: null | string = null;
  public previewSignatureImg?: string;
  public keyword: string = '';

  public get fieldDefaultWidth(): string {
    return this._backgroundImage?.nativeElement?.offsetWidth / 2 - this.pageMargin - this.initialFieldsGap + 'px';
  }

  public get fieldDefaultBigHeight(): number {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.1175;
  }

  public get fieldDefaultMiddleHeight(): number {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.09;
  }

  public get fieldDefaultSmallHeight(): number {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.055;
  }

  public get fieldDefaultFontSize(): string {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.01625 + 'px';
  }

  public get fieldBackgroundSize(): number {
    return this._backgroundImage?.nativeElement?.offsetHeight;
  }

  public get fieldBackgroundWidth(): number {
    return this._backgroundImage?.nativeElement?.offsetWidth;
  }

  public get fieldDefaultTableCellHeight(): string {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.0325 + 'px';
  }

  public get pageMargin(): number {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetWidth * 0.118;
  }

  public get radioButtonSize(): string {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetWidth * 0.0354 + 'px';
  }

  public get initialFieldsGap(): number {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetWidth * 0.0071;
  }

  private get pinchZoomWrapper() {
    return this._pinchZoomWrapper;
  }

  private get backgroundImage() {
    return this._backgroundImage;
  }

  public get isCurrentNewFieldTypeCorrect(): boolean {
    return this.newFieldType === 'text-only';
  }

  @HostBinding('style.--moving-lines-size')
  private get movingLinesSize(): number {
    return this._backgroundImage?.nativeElement?.offsetWidth * 0.0018;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.backgroundImage) {
      setTimeout(() => {
        this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage?.nativeElement);
      });
    }
  }

  constructor(
    public override timePipe: TimePipe,
    public override datePipe: DatePipe,
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

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Forms`);

    this.caseId = this.casesService?.activeCase?.case_id || '';
    if (this.currentCaseId) {
      this.caseId = this.currentCaseId;
    }
    if (this.selectedForm) {
      this.form = this.selectedForm;
    }
    if (this.teamData) {
      this.people = this.teamData;
    }

    this.formsService.refreshPinchSubject.asObservable().subscribe(_ => {
      if (this.documentLink !== this.prevDocUrl) {
        this.prevDocUrl = this.documentLink;
        this.formsService.refreshScale(this.pinchZoomWrapper!);
        this.bgImgLoaded = false;

        let i = 0;
        const resizeInterval = setInterval(() => {
          i++;
          if (i > 25) {
            clearInterval(resizeInterval);
          }
          this.onResize();
        }, 50);
      }
    });

    this.builderService = this.formsService;
    this.afterUpdateNavigation = '/forms/';
    this.initializationComponents();
  }

  onBgImgLoad() {}

  previewForm(): void {
    this.selectedItem = '';
    setTimeout(() => {
      this.isPreview = !this.isPreview;
    }, 10);
  }

  backToForms(): void {
    this.router.navigate(['/forms'], { queryParams: { tab: 'published' } });
  }

  toggleZoom(isZoomIn?: boolean) {
    if ((isZoomIn && !this.isZoomed) || (!isZoomIn && this.isZoomed)) {
      this.myPinch?.toggleZoom();
      this.formsService.zoomIn(this.pinchZoomWrapper!, this._backgroundImage?.nativeElement?.offsetHeight, isZoomIn);
      this.isZoomed = !this.isZoomed;
    }
  }

  onFieldTypeSelectChange({ id }: { id: string; text: string }) {
    this.newFieldType = id;
    id === 'text-only' ? (this.insertFieldType = null) : (this.insertFieldType = id);
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  public toggleMenuClass(event: Event): void {
    (event.target as HTMLElement).classList.toggle('expanded');
  }

  public changeToggle(event: boolean): void {
    this.editingField!.require = event;
  }

  public changeDisplayTextToggle(event: boolean): void {
    this.editingField!.displayText = event;
  }

  public changeReadOnlyToggle(event: boolean): void {
    this.editingField!.readonly = event;
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

  changeStyle($event: any, data: any) {
    this.selectedItem = $event.type == 'mouseover' ? data.key : '';
    this.selectedItemButtonIndex = $event.type === 'mouseover' && data?.positions ? data.childIndex : null;
  }

  public selectItem(data: any): void {
    this.selectedItem = data?.key || '';
    this.selectedItemButtonIndex = data?.positions ? data.childIndex : null;
  }

  selectEvent($event: any) {
    this.editingField!.defaultValue = $event;
  }

  onChangeSearch($event: any) {
    this.editingField!.defaultValue = $event;
  }
  duplicatePage(index: number): void {
    const lastIndex = Object.keys(this.pageData).length;
    let tempPageData = JSON.parse(JSON.stringify(this.pageData));
    tempPageData[lastIndex] = tempPageData[index];
    this.pageData = tempPageData;
    this.selectedPopupMenu = -1;
    this.save();
  }

  deletePage(index: number): void {
    delete this.pageData[index];
    let tempPageData = JSON.parse(JSON.stringify(this.pageData));
    this.pageData = {};
    Object.values(tempPageData).map((item: any, index: number) => {
      this.pageData[index] = item;
    });
    this.selectedPopupMenu = -1;
    this.save();
  }

  moveUpPage(index: number): void {
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

  moveDownPage(index: number): void {
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
  showPopupMenu(index: number): void {
    if (this.selectedPopupMenu === index) {
      this.selectedPopupMenu = -1;
    } else {
      this.selectedPopupMenu = index;
    }
  }
  showElementPopupMenu(page: any, index: number): void {
    if (this.selectedElementPopupMenu === index) {
      this.selectedElementPopupMenu = -1;
      this.selectedElementPageMenu = -1;
    } else {
      this.selectedElementPopupMenu = index;
      this.selectedElementPageMenu = page;
    }
  }

  public sortTableColumns(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.editingField?.cols!, event.previousIndex, event.currentIndex);
  }

  public addSignatureImage(imageSrc: string): void {
    this.formsService.isSignaturePopupOpened$
      .asObservable()
      .pipe(
        take(1),
        tap(res => {
          this.previewSignatureImg = imageSrc;
          this.closeSignatureModal();
        })
      )
      .subscribe();
  }

  public closeSignatureModal(): void {
    this.formsService.isSignaturePopupOpened$.next(null);
  }

  @HostListener('document:click', ['$event'])
  private deselectDraggableItem(event: Event): void {
    event.target instanceof HTMLImageElement && ((this.selectedItem = ''), this.deselectDraggableItemField());
  }
}
