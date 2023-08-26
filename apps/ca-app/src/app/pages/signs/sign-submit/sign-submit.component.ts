import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { CasesService } from '../../../services/cases.service';
import { SignsService } from '../../../services/signs.service';
import { UserService } from '../../../services/user.service';
import { FeedMediaService } from '../../../services/feed-media.service';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import { SrcRequest } from '../../../models/SrcRequest';
import {
  PopInNotificationConnectorService,
  Notification
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { environment } from '../../../../environments/environment';
import { TimePipe } from '../../../pipes/time.pipe';
import { OptionsService } from '../../../services/options.service';

@Component({
  selector: 'app-sign-submit',
  templateUrl: './sign-submit.component.html',
  styleUrls: ['./sign-submit.component.css'],
  providers: [DatePipe, TimePipe]
})
export class SignSubmitComponent implements OnInit, OnDestroy {
  @Input() caseId?: string;
  @Input() sign?: any;
  @Output() close = new EventEmitter();
  @Output() submit = new EventEmitter();

  loading = true;
  message = '';
  errorMessage = '';
  signUpdated = false;
  blockFields = false;
  documentLink?: any;
  pages: any[] = [];
  components: any[] = [];
  mediaList = [];
  properties: any = [];
  title?: any;
  requiredCustomFields: any = [];
  savingError = '';
  noFields = false;
  saveModel: any = {};
  media_ct = 0;
  activeSidebarTab = 1;
  metaData: any = {};
  displayCount?: any;
  activeDocPage = 0;
  fieldsList: any[] = [];
  privateCDN = environment.PRIVATE_CDN_URL + '/';
  userField: any = [];
  realVariable: any = [];

  private signId?: string;
  private participants: any;
  private docData: any = {};
  private userId = '';
  private userData: any = {};
  private typesByField: any = {};
  private unsubscribe$: Subject<void> = new Subject();
  private destroy$ = new Subject<void>();

  constructor(
    public datePipe: DatePipe,
    public timePipe: TimePipe,
    public optionsService: OptionsService,
    private notificationsService: PopInNotificationConnectorService,
    private utilsService: UtilsService,
    private feedsMediaService: FeedMediaService,
    private casesService: CasesService,
    private signsService: SignsService,
    public userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private feedMediaService: FeedMediaService,
    private hostService: HostService,
    private titleService: Title,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | E-signs`);
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
      this.loadOpenedSignInformation();
    } else {
      this.casesService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
        this.caseId = res['case_id'];
        this.loadOpenedSignInformation();
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

  // Generate fields list
  private generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text' },
      { id: 'multi-text', text: 'Multi Text', element: 'Multi Text' },
      { id: 'dropdown', text: 'Multiple choice', element: 'Multiple choice' },
      { id: 'multidropdown', text: 'Checkboxes', element: 'Checkboxes' },
      { id: 'checkboxes', text: 'Checkboxes', element: 'Checkboxes' },
      { id: 'date', text: 'Date', element: 'Date' },
      { id: 'time', text: 'Time', element: 'Time' },
      { id: 'number', text: 'Number', element: 'Number' },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text' },
      { id: 'docs', text: 'Upload Pdf', element: 'Pdf' },
      { id: 'images', text: 'Upload Image', element: 'Image' },
      { id: 'blank', text: 'Blank new page', element: 'Blank new page' }
    ];
  }

  public prepareShowingPage(pageNumber: any): any {
    const currentPage: any = this.pages[pageNumber] || {};
    const elements = currentPage.ui_schema?.elements || [];
    const properties = currentPage.schema?.properties || [];
    const requiredList = currentPage.schema?.required || [];
    return elements.map((item: any) => {
      let result = properties[item.scope.split('/')[2]];
      result.require = requiredList.indexOf(result.key) >= 0;
      return result;
    });
  }

  save() {
    let isSuccessSend = false;
    const answers = this.saveModel;
    const answersKeys = this.utilsService.convertObjectKeysToArray(answers);
    answersKeys.forEach(a => {
      if (!this.participants[a].users.includes(this.userId)) {
        isSuccessSend = true;
      }
    });

    const result: any = {};
    this.pages.map((page: any) => {
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
        title: `Submit sign`
      });

      this.notificationsService.failed(notification, 'Fields can not be empty!');
      return;
    }

    const saveModelKeys = Object.keys(this.saveModel);
    const saveModleClone = Object.assign({}, this.saveModel);
    saveModelKeys.forEach(element => {
      if (!this.checkOnFieldParticipant(element)) {
        delete saveModleClone[element];
      }
    });

    this.signsService
      .postFormConfirmation(this.caseId as any, this.signId as any, {
        page_responses: saveModleClone.length > 0 ? saveModleClone : null,
        user_id: this.userService?.userData?.user_id
      })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.router.navigate(['/e-signs'], { queryParams: { tab: 'completed' } });
        this.submit.emit();
      });
  }

  private checkOnFieldParticipant(fieldName: string): boolean {
    const participantIds: string[] = this.participants[fieldName].users || [];
    return participantIds && participantIds.includes(this.userId);
  }

  // Switching page for document builder
  public switchDocumentPage = (pageNumber: any) => {
    const fieldList = this.prepareShowingPage(pageNumber);
    this.convertToComponents(fieldList);
  };

  // Redirect to signs page
  public backToSigns(): void {
    this.router.navigate(['/e-signs']);
    this.close.emit();
  }

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
            values: item.enum.map((option: string) => ({
              value: option,
              label: option
            }))
          };
          break;
        case 'checkboxes':
          componentItem['type'] = 'selectboxes';
          componentItem['values'] = item.items.enum.map((option: string) => ({
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
          componentItem['multiple'] = true;
          componentItem['dataType'] = 'string';
          componentItem['data'] = {
            values: item.items.enum.map((option: string) => ({
              value: option,
              label: option
            }))
          };
          break;
        case 'date':
          componentItem['type'] = 'datetime';
          componentItem['enableTime'] = false;
          componentItem['defaultValue'] = this.datePipe.transform(String(item.description), 'YYYY-MM-dd');
          break;
        case 'time':
          componentItem['type'] = 'textfield';
          componentItem['defaultValue'] = this.timePipe.transform(String(item.description), true);
          componentItem['time'] = 'time';
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

  private loadOpenedSignInformation() {
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
    this.participants = this.pages[0].participants || [];
    this.title = sign.name;
    this.blockFields = false;
    this.mediaList = sign.media || {};
    this.media_ct = sign.media_ct;
    this.displayCount = this.pages.length;
    this.switchDocumentPage(this.activeDocPage);

    const answers = sign.answers;
    if (Object.keys(answers || {}).length) {
      this.loadUserAnswer(sign.answers);
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
          // result[key] = this.timePipe.transform(String(description), true)
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
    Object.keys(answers).map(user_id => {
      Object.assign(this.saveModel, answers[user_id].page_answers[0]);
    });
    const answer = answers[(Object.keys(answers) as any).find((user_id: any) => user_id === this.userId)];

    this.blockFields = answer || false;
    this.loading = false;
  }

  public getElement(fieldType: string): string {
    return this.fieldsList.filter(item => item.id === fieldType)[0].element;
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

  // Checking object keys
  public checkObjectKeys = (v: {[key: string]: string}) => Object.keys(v);

  // Checking object values
  public checkObjectValues = (v: {[key: string]: string}) => Object.values(v);

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
