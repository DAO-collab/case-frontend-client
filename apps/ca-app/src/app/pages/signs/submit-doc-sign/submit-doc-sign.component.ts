import { DatePipe } from '@angular/common';
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
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { Observable, Subject, forkJoin } from 'rxjs';
import { first, take, takeUntil, tap } from 'rxjs/operators';
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
import { TimePipe } from '../../../pipes/time.pipe';
import { environment } from '../../../../environments/environment';
import { PinchZoomComponent } from 'ngx-pinch-zoom';
import { FormsService } from '../../../services/forms.service';
import { OptionsService } from '../../../services/options.service';

@Component({
  selector: 'app-submit-doc-sign',
  templateUrl: './submit-doc-sign.component.html',
  styleUrls: ['./submit-doc-sign.component.css'],
  providers: [TimePipe, DatePipe]
})
export class SubmitDocSignComponent implements OnInit, OnDestroy {
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
      });
    }
  }

  @ViewChildren('fld', { read: ElementRef }) set HTMLFormFieldsContent(content: QueryList<ElementRef>) {
    if (content) {
      this._HTMLFormFields = content;

      if (typeof this.scrollToFieldIndex === 'number') {
        this.scrollToField(this.scrollToFieldIndex);

        this.scrollToFieldIndex = null;
      }
    }
  }

  @Input() caseId?: string;
  @Input() sign?: any;
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
  saveModel: any = {};
  documentLink?: any;
  media_ct = 0;
  metaData: any = {};
  fieldsList: any[] = [];
  privateCDN = environment.PRIVATE_CDN_URL + '/';
  userField: any = [];
  realVariable: any = [];
  bgImgLoaded = false;
  scrollToFieldIndex?: number | null;
  scale = 1;
  highlightFiled: { index: number | null; timeout: any } = { index: null, timeout: null };

  get HTMLFormFields(): QueryList<ElementRef> {
    return this._HTMLFormFields!;
  }

  private signId?: string;
  private docData: any = {};
  private userId = '';
  private userData: any = {};
  private typesByField: any = {};
  private unsubscribe$: Subject<void> = new Subject();
  private isZoomed?: boolean;
  private _pinchZoomWrapper?: ElementRef;
  private _backgroundImage?: ElementRef;
  private _HTMLFormFields?: QueryList<ElementRef>;
  private destroy$ = new Subject<void>();

  private get pinchZoomWrapper() {
    return this._pinchZoomWrapper;
  }

  private get backgroundImage() {
    return this._backgroundImage;
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

  public get radioButtonSize(): string {
    // multiplier value is calculated according to 'blank page' width and height
    return this._backgroundImage?.nativeElement?.offsetWidth * 0.0354 + 'px';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.backgroundImage) {
      this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage.nativeElement);
    }
  }

  protected timeoutId = null;

  constructor(
    public datePipe: DatePipe,
    public timePipe: TimePipe,
    public userService: UserService,
    public optionsService: OptionsService,
    public signsService: SignsService,
    public formsService: FormsService,
    private notificationsService: PopInNotificationConnectorService,
    private casesService: CasesService,
    private utilsService: UtilsService,
    private feedsMediaService: FeedMediaService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private feedMediaService: FeedMediaService,
    private hostService: HostService,
    private titleService: Title,
    private cd: ChangeDetectorRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | E-signs`);
    this.typesByField = this.utilsService.generateTypesByFields();
    this.userId = this.userService.userData.user_id;
    this.fieldsList = this.generateFieldsList();

    if (!this.userId) {
      this.userService.getUserData.pipe(takeUntil(this.unsubscribe$)).subscribe(resp => {
        this.userData = resp;
        this.userId = this.userData.user_id;
      });
    }

    if (this.caseId) {
      this.loadOpenedFormInformation();
    } else {
      this.casesService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
        this.caseId = res['case_id'];
        this.loadOpenedFormInformation();
      });
    }

    this.optionsService
      .userFields()
      .pipe(takeUntil(this.destroy$))
      .subscribe(userFields => {
        this.userField = userFields;
      });

    this.userService.getAuthStatus().subscribe(res => {
      this.realVariable = res.data;
    });
  }

  onBgImgLoad() {
    setTimeout(() => {
      this.scale = this.formsService.scaleBuilder(this.pinchZoomWrapper!, this.backgroundImage?.nativeElement);
      this.bgImgLoaded = true;
    });
  }

  public backToSigns(): void {
    this.router.navigate(['/e-signs']);
    this.close.emit();
  }

  private loadOpenedFormInformation() {
    if (this.sign) {
      this.signId = this.sign.sign_id;
      this.prepareShowingSign(this.sign);
    } else {
      this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
        this.signId = params['id'];
        if (this.signId) {
          this.blockFields = true;

          this.signsService
            .getFormInfo(this.caseId as any, this.signId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(sign => this.prepareShowingSign(sign));
        }
      });
    }
  }

  private prepareShowingSign(sign: any) {
    this.pages = sign.pages || [];
    this.saveModel = this.loadDefaultAnswer(this.pages);
    this.title = sign.name;
    this.blockFields = false;
    const pages = () => {
      let returnPages = Array();
      const pages = sign.pages;
      if (typeof pages == 'object' && sign.pages_ct !== 0) {
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
    const answers = sign.responses;
    if (Object.keys(answers || {}).length) {
      this.loadUserAnswer(sign.responses);
    } else {
      this.loading = false;
    }
    this.cd.detectChanges();
  }

  public elementTrackBy(index: number, item: any) {
    return item.id;
  }

  public getSchemaListFromUiList(pageNumber: number = this.activeDocPage): any[] {
    const elements = this.pages[pageNumber - 1]?.ui_schema?.elements || [];
    const properties = this.pages[pageNumber - 1]?.schema?.properties || [];
    const requiredList = this.pages[pageNumber - 1]?.schema?.required || [];
    const participants: { [key: string]: string[] } = this.pages[pageNumber - 1]?.participants || {};
    const res: any[] = [];
    let id = 0;

    elements.forEach((item: any) => {
      const result = properties[item.scope.split('/')[2]];
      result.require = requiredList.indexOf(result.key) >= 0;
      result.readonly = !participants[result.key].includes(this.userId);
      if ((result.fieldType === 'options' || result.fieldType === 'checkbox-options') && result.positions) {
        result.positions.forEach((pos: any, index: number) => {
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

  private loadUserAnswer(answers: { [key: string]: string }) {
    // const answer = answers[(Object.keys(answers) as any).find((user_id: any) => user_id !== this.userId)];

    this.blockFields = false;
    this.loading = false;
    const answers$: Observable<FormSignResponse['data']>[] = [];
    for (const value of Object.values(answers)) {
      answers$.push(this.signsService.getSignAnswers(this.caseId!, this.signId!, value));
    } 
    forkJoin(answers$).pipe(take(1)).subscribe(responses => {
      for (let i = 0; i < responses.length; i++) {
        const convertedModel = this.utilsService.convertResponseArrayToObject(responses[i].response);
        for (const key of Object.keys(convertedModel)) {
          if (this.saveModel[key]) {
            this.saveModel[key] = convertedModel[key];
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
        const rows = page.schema.properties[key].rows;
        const cols = page.schema.properties[key].cols;
        description = JSON.parse(description);
        result[key] = description;
        if (page.schema.properties[key].fieldType === 'date') {
          if (description) {
            result[key] = this.datePipe.transform(String(description), 'YYYY-MM-dd');
          } else {
            const d = new Date();
            result[key] = this.datePipe.transform(String(d), 'YYYY-MM-dd');
          }
          // result[key] = this.datePipe.transform(String(description), 'YYYY-MM-dd');
        } else if (page.schema.properties[key].fieldType === 'time') {
          if (description) {
            result[key] = this.timePipe.transform(String(description), true);
          } else {
            const d = new Date();
            const time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
            result[key] = this.timePipe.transform(String(time), true);
          }
          // result[key] = this.timePipe.transform(String(description), true);
        }

        if (page.schema.properties[key].fieldType === 'table') {
          // Array of data as backend needs 'Type = array' only. Index 0 -> cols, index 1 -> rows
          result[key] = [[...cols], [...rows]];
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
    return this.fieldsList.filter(item => item.id === fieldType)[0].element;
  }

  private generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text' },
      { id: 'multi-text', text: 'Multi Text', element: 'Multi Text' },
      { id: 'dropdown', text: 'Multiple choice', element: 'Multiple choice' },
      { id: 'options', text: 'Multiple choice', element: 'Multiple choice' },
      { id: 'multidropdown', text: 'Checkboxes', element: 'Checkboxes' },
      { id: 'checkboxes', text: 'Checkboxes', element: 'Checkboxes' },
      { id: 'date', text: 'Date', element: 'Date' },
      { id: 'time', text: 'Time', element: 'Time' },
      { id: 'number', text: 'Number', element: 'Number' },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text' },
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

  save() {
    let isSuccessSend = false;
    const answers = this.saveModel;
    const answersKeys = this.utilsService.convertObjectKeysToArray(answers);
    let page_responses: { [key: string]: any }[] = [];

    const result: any = {};
    this.pages.map((page, pageIndex) => {
      page_responses[pageIndex] = {};
      Object.keys(page.schema.properties).map(key => {
        if (page.schema.properties[key].require === true) {
          result[key] = key;
        }

        if (page.schema.properties[key].fieldType === 'image') {
          this.saveModel[key] = page.schema.properties[key].description;
        }
        page_responses[pageIndex][key] = this.saveModel[key];
      });
    });
    Object.keys(result).map(a => {
      if (this.saveModel[a] === '' || this.saveModel[a].length === 0) {
        isSuccessSend = true;
      }
    });

    if (isSuccessSend) {
      const notification: Notification = this.notificationsService.addNotification({
        title: `Submit Sign`
      });

      this.notificationsService.failed(notification, 'Fields can not be empty!');
      return;
    }
    this.signsService
      .postFormConfirmation(this.caseId as string, this.signId as string, {
        page_responses: page_responses.length > 0 ? page_responses : null,
        user_id: this.userService?.userData?.user_id
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.router.navigate(['/e-signs'], { queryParams: { tab: 'completed' } });
        this.submit.emit();
      });
  }

  addSignatureImage(imageSrc: string): void {
    this.signsService.isSignaturePopupOpened$
      .asObservable()
      .pipe(
        takeUntil(this.unsubscribe$),
        first(),
        tap(res => {
          this.saveModel[res.key] = imageSrc;

          this.closeSignatureModal();
        })
      )
      .subscribe();
  }

  closeSignatureModal(): void {
    this.signsService.isSignaturePopupOpened$.next(null);
  }

  onNextButtonClicked(): void {
    for (let i = 0; i < this.pages.length; i++) {
      const fields = this.prepareShowingPage(i);

      if (fields.length) {
        const index = fields.findIndex((field: any) => !this.isFieldFilled(field) && field.require);

        if (index !== -1) {
          if (this.activeDocPage !== i + 1) {
            this.scrollToFieldIndex = index;

            this.switchDocumentPage(i + 1);
          } else {
            this.scrollToField(index);
          }

          break;
        }
      }
    }
  }

  isFieldFilled(field: any): boolean {
    return this.saveModel[field.key] !== null && this.saveModel[field.key] !== ' ' && this.saveModel[field.key]?.length !== 0;
  }

  scrollToField(index: number): void {
    const element = this.HTMLFormFields.toArray()[index].nativeElement;
    element.scrollIntoView({ block: 'center' });

    clearTimeout(this.highlightFiled.timeout);

    this.highlightFiled.index = index;
    this.highlightFiled.timeout = setTimeout(() => (this.highlightFiled.index = null), 3000);
  }

  areAllFieldsFilled(): boolean {
    let fieldNotFilled = false;

    for (let i = 0; i < this.pages.length; i++) {
      const fields = this.prepareShowingPage(i);

      if (fields.length) {
        fieldNotFilled = !!fields.find((field: any) => !this.isFieldFilled(field) && field.require);

        if (fieldNotFilled) {
          break;
        }
      }
    }

    return !fieldNotFilled;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
