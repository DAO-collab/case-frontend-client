import {
  Component,
  OnInit,
  ApplicationRef,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  HostListener,
  HostBinding
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { PinchZoomComponent } from 'ngx-pinch-zoom';
import { take, tap } from 'rxjs/operators';

import { UploadSignBuilder } from '../../../shared/document-sign-builder';
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
import { RolesService } from '../../../services/roles.service';
import { TimePipe } from '../../../pipes/time.pipe';

@Component({
  selector: 'app-create-doc-sign',
  templateUrl: './create-doc-sign.component.html',
  styleUrls: ['./create-doc-sign.component.css'],
  providers: [TimePipe, DatePipe]
})
export class CreateDocSignComponent extends UploadSignBuilder implements OnInit, OnDestroy {
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
        this.formsService.scaleBuilder(this.pinchZoomWrapper!, content.nativeElement);
        this.bgImgLoaded = true;
      });
    }
  }

  @Input() currentCaseId?: string;
  @Input() selectedSign?: any;
  @Input() teamData?: any;
  @Output() close = new EventEmitter();

  public selectedItem = '';
  public selectedItemButtonIndex: number | null = null;
  public keyword: string = '';
  isPreview = false;
  scale?: number;
  selectedElementPopupMenu = -1;
  selectedElementPageMenu = -1;
  selectedPopupMenu = -1;
  prevDocUrl?: string;
  convertingImgSrc = 'images/form-image-converting.svg';

  private isZoomed?: boolean;
  private _pinchZoomWrapper?: ElementRef;
  public bgImgLoaded = false;
  public previewSignatureImg?: string;
  
  public editorForm = {
    components: [
      {
        type: 'textarea',
        defaultValue: '',
        label: '',
        key: 'dsad',
        wysiwyg: true,
        editor: 'ckeditor'
      }
    ]
  };

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
    changeDetector: ApplicationRef,
    route: ActivatedRoute,
    router: Router,
    sanitizer: DomSanitizer,
    userService: UserService,
    roleService: RolesService,
    casesService: CasesService,
    feedsMediaService: FeedMediaService,
    feedsService: FeedsService,
    contentMediaService: FeedMediaService,
    formsService: FormsService,
    signsService: SignsService,
    utilsService: UtilsService,
    optionsService: OptionsService,
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
      roleService,
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
    this.titleService.setTitle(`${this.hostService.appName} | E-signs`);

    this.caseId = this.casesService?.activeCase?.case_id || '';
    if (this.currentCaseId) {
      this.caseId = this.currentCaseId;
    }
    if (this.selectedSign) {
      this.sign = { ...this.selectedSign, sign_id: this.selectedSign.sign_id };
    }
    if (this.teamData) {
      this.people = this.teamData;
    }

    this.signsService.refreshPinchSubject.asObservable().subscribe(_ => {
      if (this.documentLink !== this.prevDocUrl) {
        this.formsService.refreshScale(this.pinchZoomWrapper!);
        this.bgImgLoaded = false;
      }

      this.prevDocUrl = this.documentLink;

      let i = 0;
      const resizeInterval = setInterval(() => {
        i++;
        if (i > 25) {
          clearInterval(resizeInterval);
        }
        this.onResize();
      }, 50);
    });

    this.builderService = this.signsService;
    this.afterUpdateNavigation = '/e-signs/';
    this.initializationComponents();
  }

  // refreshScale() {
  //   if (this.backgroundImage && this.backgroundImage?.nativeElement?.currentSrc) {
  //     setTimeout(() => {
  //       this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper, this.backgroundImage.nativeElement);
  //     }, 500)
  //   } else {
  //     setTimeout(() => this.refreshScale(), 500)
  //   }
  // }

  onBgImgLoad() {}

  toggleZoom(isZoomIn?: boolean) {
    if ((isZoomIn && !this.isZoomed) || (!isZoomIn && this.isZoomed)) {
      this.myPinch?.toggleZoom();
      this.formsService.zoomIn(this.pinchZoomWrapper!, this._backgroundImage?.nativeElement?.offsetHeight, isZoomIn);
      this.isZoomed = !this.isZoomed;
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

  public sortTableColumns(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.editingField?.cols!, event.previousIndex, event.currentIndex);
  }
  
  previewSign(): void {
    this.isPreview = !this.isPreview;
  }

  backToSigns(): void {
    this.router.navigate(['/e-signs'], { queryParams: { tab: 'published' } });
  }

  onFieldTypeSelectChange({ id }: { id: string; text: string }) {
    this.newFieldType = id;
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  public toggleMenuClass(event: any): void {
    event.target.classList.toggle('expanded');
  }

  changeToogle($event: any) {
    this.editingField!.require = $event;
  }

  changeDisplayTextToogle($event: any) {
    this.editingField!.displayText = $event;
  }

  changeReadOnlyToogle($event: any) {
    this.editingField!['readonly'] = $event;
  }

  ngOnDestroy() {
    if (this.myPinch) {
      this.myPinch.destroy();
    }
    this.destroy = true;
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

  showElementPopupMenu(page: any, index: any): void {
    if (this.selectedElementPopupMenu === index) {
      this.selectedElementPopupMenu = -1;
      this.selectedElementPageMenu = -1;
    } else {
      this.selectedElementPopupMenu = index;
      this.selectedElementPageMenu = page;
    }
  }
  
  public handleChange(event: any): void {
    if (event?.changed?.value) {
      this.editingField!.defaultValue = event.changed.value;
      this.editingField!.description = event.changed.value;
      this.editingField!.title = this.htmltoText(event.changed.value);
    }
  }

  htmltoText(html: string)  {
    let text = html;
    text = text.replace(/\n/gi, "");
    text = text.replace(/<style([\s\S]*?)<\/style>/gi, "");
    text = text.replace(/<script([\s\S]*?)<\/script>/gi, "");
    text = text.replace(/<a.*?href="(.*?)[\?\"].*?>(.*?)<\/a.*?>/gi, " $2 $1 ");
    text = text.replace(/<\/div>/gi, "\n\n");
    text = text.replace(/<\/li>/gi, "\n");
    text = text.replace(/<li.*?>/gi, "\n");
    text = text.replace(/<\/ul>/gi, "\n\n");
    text = text.replace(/<\/p>/gi, "\n\n");
    text = text.replace(/<br\s*[\/]?>/gi, "\n");
    text = text.replace(/<[^>]+>/gi, "");
    text = text.replace(/^\s*/gim, "");
    text = text.replace(/ ,/gi, ",");
    text = text.replace(/ +/gi, " ");
    text = text.replace(/\n+/gi, "\n\n");

    if (text.length > 30) {
      text = text.slice(0, 30);
    }

    return text;
  }

  public editEditor(): void {
    if (this.editingField?.fieldType === 'text-only') {
      this.editorForm.components[0].key = this.editingField?.key as any;
      this.editorForm.components[0].defaultValue = this.editingField?.description as any;
    }
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
