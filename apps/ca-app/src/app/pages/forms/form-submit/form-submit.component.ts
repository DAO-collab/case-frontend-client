import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { CasesService } from '../../../services/cases.service';
import { FormsService } from '../../../services/forms.service';
import { UserService } from '../../../services/user.service';
import { FeedMediaService } from '../../../services/feed-media.service';
import { UtilsService } from '../../../services/utils.service';
import { SrcRequest } from '../../../models/SrcRequest';
import { HostService } from '../../../services/host.service';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { TimePipe } from '../../../pipes/time.pipe';
import { environment } from '../../../../environments/environment';
import { OptionsService } from '../../../services/options.service';

@Component({
  selector: 'app-form-submit',
  templateUrl: './form-submit.component.html',
  styleUrls: ['./form-submit.component.css'],
  providers: [TimePipe, DatePipe]
})
export class FormSubmitComponent implements OnInit, OnDestroy {
  @Input() caseId?: string;
  @Input() form?: any;
  @Output() close = new EventEmitter();
  @Output() submit = new EventEmitter();

  loading = true;
  message = '';
  errorMessage = '';
  formUpdated = false;
  pages: any[] = [];
  components: any[] = [];
  mediaList = [];
  properties: any = [];
  title?: string;
  requiredCustomFields: any = [];
  savingError = '';
  noFields = false;
  saveModel: any = {};
  blockFields = false;
  documentLink?: any;
  media_ct = 0;
  activeSidebarTab = 1;
  metaData: any = {};
  displayCount?: any;
  activeDocPage = 0;
  fieldsList: any[] = [];
  privateCDN = environment.PRIVATE_CDN_URL + '/';
  userField: any = [];
  realVariable: any = [];

  private formId?: string;
  private docData: any = {};
  private userId = '';
  private userData: any = {};
  private typesByField: any = {};
  private unsubscribe$: Subject<void> = new Subject();
  private destroy$ = new Subject<void>();

  constructor(
    public datePipe: DatePipe,
    public timePipe: TimePipe,
    public userService: UserService,
    public optionsService: OptionsService,
    private notificationsService: PopInNotificationConnectorService,
    private casesService: CasesService,
    private formsService: FormsService,
    private utilsService: UtilsService,
    private feedsMediaService: FeedMediaService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private feedMediaService: FeedMediaService,
    private hostService: HostService,
    private titleService: Title,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | Forms`);
    this.typesByField = this.utilsService.generateTypesByFields();
    this.userId = this.userService.userData?.user_id;
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

  public handleSubmission(event: any) {
    this.pages.map(page => {
      Object.keys(page.schema.properties).map(key => {
        if (page.schema.properties[key].fieldType === 'time' && event.data[key] === '') {
          delete event.data[key];
        } else if (page.schema.properties[key].fieldType === 'date' && event.data[key] === '') {
          delete event.data[key];
        }
      });
    });

    Object.assign(this.saveModel, event.data);
  }

  save() {
    let isSuccessSend = false;
    const answers = this.saveModel;
    const answersKeys = this.utilsService.convertObjectKeysToArray(answers);
    const result: any = {};
    this.pages.map(page => {
      Object.keys(page.schema.properties).map(key => {
        if (page.schema.properties[key].require === true) {
          result[key] = key;
        }
      });
    });
    Object.keys(result).map(a => {
      if (this.saveModel[a] === '' || this.saveModel[a].length === 0) {
        isSuccessSend = true;
      }
    });
    if (isSuccessSend) {
      const notification: Notification = this.notificationsService.addNotification({
        title: `Submit form`
      });

      this.notificationsService.failed(notification, 'Fields can not be empty!');
      return;
    }
    this.formsService
      .postFormConfirmation(this.caseId as string, this.formId as string, {
        page_responses: this.saveModel.length > 0 ? this.saveModel : null,
        user_id: this.userService.userData?.user_id
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.router.navigate(['/forms'], { queryParams: { tab: 'completed' } });
        this.submit.emit();
      });
  }

  // Switching page for document builder
  public switchDocumentPage = (pageNumber: any) => {
    const fieldList = this.prepareShowingPage(pageNumber);
    this.convertToComponents(fieldList);
  };

  // Redirect to forms page
  public backToForms(): void {
    this.router.navigate(['/forms']);
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

          this.formsService
            .getFormInfo(this.caseId as any, this.formId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(form => this.prepareShowingForm(form));
        }
      });
    }
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

  public getElement(fieldType: string): string {
    return this.fieldsList.filter(item => item.id === fieldType)[0].element;
  }

  // Generate fields list
  private generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text' },
      { id: 'multi-text', text: 'Multi Text', element: 'Multi Text' },
      { id: 'dropdown', text: 'Single Choice', element: 'Single Choice' },
      { id: 'list', text: 'List', element: 'Single Choice' },
      { id: 'multidropdown', text: 'Multi Choice', element: 'Multi Choice' },
      { id: 'checkboxes', text: 'Multi Choice', element: 'Multi Choice' },
      { id: 'date', text: 'Date', element: 'Date' },
      { id: 'time', text: 'Time', element: 'Time' },
      { id: 'number', text: 'Number', element: 'Number' },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text' },
      { id: 'docs', text: 'Upload Pdf', element: 'Pdf' },
      { id: 'images', text: 'Upload Image', element: 'Image' },
      { id: 'blank', text: 'Blank new page', element: 'Blank new page' }
    ];
  }

  // Checking object keys
  public checkObjectKeys = (v: {[key: string]: string}) => Object.keys(v);

  // Checking object values
  public checkObjectValues = (v: {[key: string]: string}) => Object.values(v);

  private convertToComponents(fieldList: any): void {
    this.components = [];
    fieldList.map((field: any) => {
      const item = { ...field };
      const componentItem: any = {};
      item.description = JSON.parse(item.description || '');
      componentItem['key'] = item.key;
      componentItem['label'] = item.title;
      componentItem['defaultValue'] = item.description;
      if (item.format) {
        componentItem['format'] = item.format || '';
      }
      if (item.readonly) {
        componentItem['disabled'] = true;
      }
      switch (item.fieldType) {
        case 'text':
          componentItem['type'] = 'textfield';
          break;
        case 'multi-text':
          componentItem['type'] = 'textarea';
          break;
        case 'dropdown':
          componentItem['type'] = 'select';
          componentItem['valueProperty'] = 'value';
          componentItem['dataType'] = 'string';
          componentItem['data'] = {
            values: item.enum.map((option: any) => ({
              value: option,
              label: option
            }))
          };
          break;
        case 'checkboxes':
          componentItem['type'] = 'selectboxes';
          componentItem['values'] = item.items.enum.map((option: any) => ({
            value: option,
            label: option
          }));
          componentItem['defaultValue'] = item.items.enum.reduce((acc: any, cur: any) => {
            return { ...acc, [cur]: item.description.includes(cur) };
          }, {});
          break;
        case 'multidropdown':
          componentItem['type'] = 'select';
          componentItem['valueProperty'] = 'value';
          componentItem['dataType'] = 'string';
          componentItem['multiple'] = true;
          componentItem['data'] = {
            values: item.items.enum.map((option: any) => ({
              value: option,
              label: option
            }))
          };
          break;
        case 'date':
          componentItem['type'] = 'datetime';
          componentItem['enableTime'] = false;

          if (item.description) {
            componentItem['defaultValue'] = this.datePipe.transform(String(item.description), 'YYYY-MM-dd');
          } else {
            const d = new Date();
            componentItem['defaultValue'] = this.datePipe.transform(String(d), 'YYYY-MM-dd');
          }

          break;
        case 'time':
          componentItem['type'] = 'textfield';
          componentItem['time'] = 'time';

          if (item.description) {
            componentItem['defaultValue'] = this.timePipe.transform(String(item.description), true);
          } else {
            const d = new Date();
            const time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
            componentItem['defaultValue'] = this.timePipe.transform(String(time), true);
          }

          break;
        case 'number':
          componentItem['type'] = 'number';
          break;
        case 'text-only':
          componentItem['type'] = 'content';
          componentItem['label'] = '';
          componentItem['html'] = '<p class="multiline-text">' + item.description + '</p>';
          break;
        case 'docs':
          componentItem['type'] = 'content';
          componentItem['html'] = '';
          this.loadMediaSrcInfo(this.mediaList, item).map((imagePath: string) => {
            componentItem['html'] += "<div><img src='" + imagePath + "' alt='Form Docs Image'/></div>";
          });
          break;
        case 'images':
          componentItem['type'] = 'content';
          componentItem['html'] =
            "<img src='" + this.loadMediaSrcInfo(this.mediaList, item) + "' alt='Image not uploaded successfully'/>";
          break;
        default:
          componentItem['type'] = 'textfield';
          break;
      }
      this.components.push(componentItem);
    });
  }

  private prepareShowingForm(form: any) {
    this.pages = form.pages || [];
    this.saveModel = this.loadDefaultAnswer(this.pages);
    this.title = form.name;
    this.blockFields = false;
    this.mediaList = form.media || {};
    this.media_ct = form.media_ct;
    this.displayCount = this.pages.length;
    this.switchDocumentPage(this.activeDocPage);

    const answers = form.answers;
    if (Object.keys(answers || {}).length) {
      this.loadUserAnswer(form.answers);
    } else {
      this.loading = false;
    }
    this.cd.detectChanges();
  }

  private loadDefaultAnswer(pages: any): any {
    const result: any = {};
    pages.map((page: any) => {
      Object.keys(page.schema.properties).map(key => {
        let description = page.schema.properties[key].description;
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
        } else if (
          page.schema.properties[key].fieldType === 'text-only' &&
          JSON.parse(page.schema.properties[key].description) === ''
        ) {
          delete result[key];
        }
      });
    });
    return result;
  }

  private loadUserAnswer(answers: any) {
    const answer = answers[(Object.keys(answers) as any).find((user_id: any) => user_id === this.userId)];

    this.blockFields = answer || false;

    Object.assign(this.saveModel, answer && answer.page_answers[0]);
    this.loading = false;
  }

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

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
