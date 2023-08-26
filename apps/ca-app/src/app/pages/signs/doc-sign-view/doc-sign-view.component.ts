import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { Observable, Subject, forkJoin } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { FormSignResponse } from '@app/interfaces/form-sign-response.interface';
import { CasesService } from '../../../services/cases.service';
import { SignsService } from '../../../services/signs.service';
import { UserService } from '../../../services/user.service';
import { FeedMediaService } from '../../../services/feed-media.service';
import { UtilsService } from '../../../services/utils.service';
import { SrcRequest } from '../../../models/SrcRequest';
import { HostService } from '../../../services/host.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { DatePipe } from '@angular/common';
import { TimePipe } from '../../../pipes/time.pipe';
import { environment } from '../../../../environments/environment';
import { PinchZoomComponent } from 'ngx-pinch-zoom';
import { FormsService } from '../../../services/forms.service';

@Component({
  selector: 'app-doc-sign-view',
  templateUrl: './doc-sign-view.component.html',
  styleUrls: ['./doc-sign-view.component.css'],
  providers: [TimePipe, DatePipe]
})
export class DocSignViewComponent implements OnInit, OnDestroy {
  @ViewChild('myPinch') myPinch?: PinchZoomComponent;
  @ViewChild('pinchZoomWrapper', { static: false }) set content(content: ElementRef) {
    if (content) {
      this._pinchZoomWrapper = content;
    }
  }

  @ViewChild('backgroundImage', { static: false }) set backgroundContent(content: ElementRef) {
    if (content) {
      this._backgroundImage = content;
    }
  }

  @Input() caseId?: string;
  @Input() form?: any;
  @Output() close = new EventEmitter();
  @Output() submit = new EventEmitter();

  loading = true;
  title?: string;
  pages: any[] = [];
  activeDocPage = 0;
  documentKey = '';
  attachedDoc: any = null;
  displayCount?: any;
  formUpdated = false;
  blockFields = false;
  savingError = '';
  docThumbnails: string[] = [];
  message = '';
  errorMessage = '';
  components = [];
  mediaList = [];
  properties: any = [];
  requiredCustomFields: any = [];
  noFields = false;
  saveModel: any = {};
  pre_saveModel: { [key: string]: unknown } = {};
  documentLink?: any;
  media_ct = 0;
  activeSidebarTab = 1;
  metaData: any = {};
  fieldsList: any[] = [];
  privateCDN = environment.PRIVATE_CDN_URL + '/';
  is_preview = false;
  bgImgLoaded = false;

  private formId?: string;
  private docData: any = {};
  private userId = '';
  private userData: any = {};
  private typesByField: any = {};
  private unsubscribe$: Subject<void> = new Subject();
  private isZoomed?: boolean;
  private _pinchZoomWrapper?: ElementRef;
  private _backgroundImage?: ElementRef;
  private previewId?: string;

  private get pinchZoomWrapper() {
    return this._pinchZoomWrapper;
  }

  private get backgroundImage() {
    return this._backgroundImage;
  }

  public get fieldDefaultFontSize(): string {
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.01625 + 'px';
  }

  public get fieldBackgroundSize(): number {
    return this._backgroundImage?.nativeElement?.offsetHeight;
  }

  public get fieldBackgroundWidth(): number {
    return this._backgroundImage?.nativeElement?.offsetWidth;
  }

  public get fieldDefaultTableCellHeight(): string {
    return this._backgroundImage?.nativeElement?.offsetHeight * 0.0325 + 'px';
  }

  public get radioButtonSize(): string {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetWidth * 0.0354 + 'px';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.backgroundImage) {
      this.formsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage.nativeElement);
    }
  }

  protected timeoutId = null;

  constructor(
    public datePipe: DatePipe,
    public timePipe: TimePipe,
    public userService: UserService,
    public formsService: FormsService,
    public router: Router,
    private notificationsService: PopInNotificationConnectorService,
    private casesService: CasesService,
    private signsService: SignsService,
    private utilsService: UtilsService,
    private feedsMediaService: FeedMediaService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private feedMediaService: FeedMediaService,
    private hostService: HostService,
    private titleService: Title,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | E-signs`);
    this.typesByField = this.utilsService.generateTypesByFields();
    this.userId = this.userService?.userData?.user_id;
    this.fieldsList = this.generateFieldsList();

    if (!this.userId) {
      this.userService.getUserData.pipe(takeUntil(this.unsubscribe$)).subscribe(resp => {
        this.userData = resp;
        this.userId = this.userData.user_id;
      });
    }

    this.route.params.subscribe(params => {
      this.is_preview = params['preview'] === '1' ? false : true;
      this.previewId = params['preview'];
    });

    if (this.caseId) {
      this.loadOpenedFormInformation();
    } else {
      this.casesService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
        this.caseId = res['case_id'];
        this.loadOpenedFormInformation();
      });
    }
  }

  onBgImgLoad() {
    setTimeout(() => {
      this.formsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage?.nativeElement);
      this.bgImgLoaded = true;
    });
  }

  public backToSigns(): void {
    const tab: string = this.signsService.currentTab$.value;
    this.router.navigate(['/e-signs'], { queryParams: { tab } });
    this.close.emit();
  }

  private loadOpenedFormInformation() {
    if (this.form) {
      this.formId = this.form.form_id;
      this.prepareShowingForm(this.form);
    } else {
      this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
        this.formId = params['id'];
        if (this.formId) {
          this.blockFields = true;

          this.signsService
            .getFormInfo(this.caseId as any, this.formId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(form => this.prepareShowingForm(form));
        }
      });
    }
  }

  private prepareShowingForm(form: any) {
    this.pages = form.pages || [];
    this.saveModel = this.loadDefaultAnswer(this.pages);
    this.pre_saveModel = this.loadDefaultAnswer(this.pages);
    this.title = form.name;
    this.blockFields = false;
    const pages = () => {
      let returnPages = Array();
      const pages = form.pages;
      if (typeof pages == 'object' && form.pages_ct !== 0) {
        Object.values(pages).map((item: any, index: any) => {
          if (item.schema.properties === undefined) {
            pages[index].schema.properties = {};
          } else {
            Object.keys(item.schema.properties).map(key => {
              if (item.schema.properties[key].description) {
                pages[index].schema.properties[key].description = JSON.parse(
                  item.schema.properties[key].description || ''
                );
              }
            });
          }
        });
        returnPages = pages;
      }
      return returnPages;
    };

    const pageContent = pages();
    if (pageContent) {
      this.docThumbnails = [];
      Object.assign(this.pages, pageContent);
      this.displayCount = pageContent.length || 0;
      pageContent.forEach(page => {
        const backgroundId = page.background_id || '';
        this.docThumbnails.push(backgroundId ? backgroundId.split('&&')[1] : '/images/fancybox/blank.gif');
      });
    }
    if (Object.keys(pageContent).length) this.switchDocumentPage(this.activeDocPage || 1);

    const answers = form.responses;
    if (Object.keys(answers || {}).length) {
      this.loadUserAnswer(form.responses);
    } else {
      this.loading = false;
    }
    this.cd.detectChanges();
  }

  public getSchemaListFromUiList(pageNumber: number = this.activeDocPage): any[] {
    const elements = this.pages[pageNumber - 1]?.ui_schema?.elements || [];
    const properties = this.pages[pageNumber - 1]?.schema?.properties || [];
    const requiredList = this.pages[pageNumber - 1]?.schema?.required || [];
    const res = new Array();
    let id = 0;
    elements.forEach((item: any) => {
      const result = properties[item.scope.split('/')[2]];
      result.require = requiredList.indexOf(result.key) >= 0;
      if ((result.fieldType === 'options' || result.fieldType === 'checkbox-options') && result.positions) {
        (result.positions || []).forEach((pos: any, index: number) => {
          res.push({ id: id, ...result, ...pos, childIndex: index });
          id++;
        });
      } else {
        res.push({ id: id, ...result });
        id++;
      }
    });
    return res;
  }

  public elementTrackBy(index: number, item: any) {
    return item.id;
  }

  private loadUserAnswer(answers: { [key: string]: string }) {
    // const answer = answers[(Object.keys(answers) as any).find((user_id: any) => user_id === this.userId)];
    this.blockFields = false;
    this.loading = false;
    if (this.previewId === '3') return;
    const answers$: Observable<FormSignResponse['data']>[] = [];
    for (const value of Object.values(answers)) {
      answers$.push(this.signsService.getSignAnswers(this.caseId!, this.formId!, value));
    } 
    forkJoin(answers$).pipe(take(1)).subscribe(responses => {
      for (let i = 0; i < responses.length; i++) {
        const convertedModel = this.utilsService.convertResponseArrayToObject(responses[i].response);
        for (const key of Object.keys(convertedModel)) {
          if (this.saveModel[key]) {
            this.saveModel[key] = convertedModel[key];
          }
          if (this.pre_saveModel[key]) {
            this.pre_saveModel[key] = convertedModel[key];
          }
        }
      }
    });
  }

  private loadDefaultAnswer(pages: any): any {
    const result: any = {};
    pages.map((page: any) => {
      Object.keys(page.schema?.properties || []).map(key => {
        let description = page.schema.properties[key].description;
        description = JSON.parse(description);
        result[key] = description;
        if (page.schema.properties[key].fieldType === 'date' && description !== '') {
          result[key] = this.datePipe.transform(String(description), 'YYYY-MM-dd');
        } else if (page.schema.properties[key].fieldType === 'time' && description !== '') {
          result[key] = this.timePipe.transform(String(description), true);
        }
      });
    });
    return result;
  }

  public prepareShowingPage(pageNumber: any): any {
    const currentPage = this.pages[pageNumber] || {};
    const elements = currentPage.ui_schema?.elements || [];
    const properties = currentPage.schema?.properties || [];
    const requiredList = currentPage.schema?.required || [];
    return elements.map((item: any) => {
      let result = properties[item.scope.split('/')[2]];
      result.require = requiredList.indexOf(result.key) >= 0;
      return result;
    });
  }

  public handleSubmission(event: any) {
    Object.assign(this.saveModel, event);
  }

  public getElement(fieldType: string): string {
    return this.fieldsList.filter(item => item.id === fieldType)[0]?.element;
  }

  private generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text' },
      { id: 'dropdown', text: 'Single Choice', element: 'Single Choice' },
      { id: 'options', text: 'Single Choice', element: 'Single Choice' },
      { id: 'list', text: 'List', element: 'Single Choice' },
      { id: 'multidropdown', text: 'Multi Choice', element: 'Multi Choice' },
      { id: 'checkboxes', text: 'Multi Choice', element: 'Multi Choice' },
      { id: 'date', text: 'Date', element: 'Date' },
      { id: 'time', text: 'Time', element: 'Time' },
      { id: 'number', text: 'Number', element: 'Number' },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text' },
      { id: 'table', text: 'Table', element: 'Table' },
      { id: 'docs', text: 'Upload Pdf', element: 'Pdf' },
      { id: 'images', text: 'Upload Image', element: 'Image' },
      { id: 'blank', text: 'Blank new page', element: 'Blank new page' },
      { id: 'signature-box', text: 'Signature Box', element: 'Signature Box' }
    ];
  }

  public switchDocumentPage(pageNumber: number) {
    if (pageNumber > this.displayCount) {
      this.activeDocPage = this.displayCount;
    } else if (pageNumber == 0) {
      this.activeDocPage = 1;
    } else {
      this.activeDocPage = pageNumber;
    }
    const bgId = this.pages[this.activeDocPage - 1].background_id || '';
    this.documentLink = bgId ? bgId.split('&&')[0] : '/images/fancybox/a4.png';
    this.loading = false;
  }

  // Checking object keys
  public checkObjectKeys = (v: {[key: string]: string}) => Object.keys(v);

  // Checking object values
  public checkObjectValues = (v: {[key: string]: string}) => Object.values(v);

  private loadMediaSrcInfo(media: any, item: any) {
    const mediaInfo = media[item.fieldType]?.items[item.description] || null;
    if (mediaInfo && mediaInfo.execution_status === 'SUCCEEDED') {
      const displaySizes = mediaInfo.display_sizes || [];
      const ext = mediaInfo.display_formats && mediaInfo.display_formats[0];
      const url_key = mediaInfo.alias_display_start
        ? mediaInfo.alias_display_start
        : mediaInfo.display_start
        ? mediaInfo.display_start
        : '';

      if (item.fieldType === 'docs') {
        let result = [];
        for (let i = 0; i < mediaInfo.display_count; i++) {
          result.push(
            this.getImageSrc({
              ext,
              url_key,
              height: '0',
              width: Math.max.apply(null, displaySizes),
              page: i + 1
            })
          );
        }
        return result;
      } else {
        const i = 0;
        return this.getImageSrc({
          ext,
          url_key,
          height: '0',
          width: Math.max.apply(null, displaySizes),
          page: i + 1
        });
      }
    } else {
      return '';
    }
  }

  private getImageSrc(request: SrcRequest): any {
    let mediaLink = `${this.privateCDN}${request.url_key
      .replace('${display_size}', request.width as any)
      .replace('${display_format}', request.ext)}`;
    if (~mediaLink.indexOf('${display_count}')) {
      mediaLink = mediaLink.replace('${display_count}', `${request.page}`);
    }
    return mediaLink;
  }

  public previousDoc() {
    this.switchDocumentPage((this.activeDocPage === 1 ? this.activeDocPage + 1 : this.activeDocPage) - 1);
  }

  public nextDoc() {
    this.switchDocumentPage((this.activeDocPage || 0) + 1);
  }

  toggleZoom(isZoomIn?: boolean) {
    if ((isZoomIn && !this.isZoomed) || (!isZoomIn && this.isZoomed)) {
      this.myPinch?.toggleZoom();
      this.formsService.zoomIn(this.pinchZoomWrapper!, this._backgroundImage?.nativeElement?.offsetHeight, isZoomIn);
      this.isZoomed = !this.isZoomed;
    }
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
