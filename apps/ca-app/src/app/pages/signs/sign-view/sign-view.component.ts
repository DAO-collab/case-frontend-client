import { Component, OnDestroy, OnInit, Input, Output, EventEmitter, ApplicationRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { CasesService } from '../../../services/cases.service';
import { SignsService } from '../../../services/signs.service';
import { UserService } from '../../../services/user.service';
import { FeedMediaService, IAllowedFileSizes } from '../../../services/feed-media.service';
import { SrcRequest } from '../../../models/SrcRequest';
import { HostService } from '../../../services/host.service';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TimePipe } from '../../../pipes/time.pipe';
import { DatePipe } from '@angular/common';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { FormModel } from '../../forms/models/FormModel';
import { environment } from '../../../../environments/environment';
import { UtilsService } from '../../../services/utils.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { StylesService } from '../../../services/styles.service';
import { FeedsService } from '../../../services/feeds.service';
import { format, utcToZonedTime } from 'date-fns-tz';
import { IFileToUpload } from '../../feeds/models/feed.model';
import { Person } from '../../../shared/document-forms-builder';
import { OptionsService } from '../../../services/options.service';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
@Component({
  selector: 'app-sign-view',
  templateUrl: './sign-view.component.html',
  styleUrls: ['./sign-view.component.css'],
  providers: [TimePipe, DatePipe]
})
export class SignViewComponent implements OnInit, OnDestroy {
  @Input() caseId?: string;
  @Input() sign?: any;
  @Input() people: Person[] = [];
  @Output() close = new EventEmitter();
  @Output() submit = new EventEmitter();

  signModel: FormModel = new FormModel();
  loading = true;
  properties: any = [];
  validationErrorsPopUp = [];
  requiredCustomFields: any = [];
  savingError = '';
  editOptionAction = false;
  editOptionIndex?: number;
  newFieldType = '';
  saving = false;
  optionsLimitError = false;
  optionExistsError = false;
  fieldValue = '';
  shownDefaultsModal = false;
  ifNewField = true;
  editingField: any = {};
  answer_ct = 0;
  formTouched = false;
  blockFields = false;
  formIsValid?: boolean;
  optionsSupport = {
    dropdown: true,
    multidropdown: true,
    checkboxes: true,
    options: true
  };
  participants = {};
  fieldParticipants: string[] = [];
  pageData: any = {};
  addFieldFormTouched = false;
  activeDocPage = 0;
  displayCount = 0;
  newProperty: any = {};
  addFieldTitle: string = '';
  attachedDoc: any = null;
  fieldPositionList: string[] = [];
  allowedFileSizes?: IAllowedFileSizes;
  userId = '';
  mediaList: any[] = [];
  afterUpdateNavigation = '/e-signs/';
  answers: any = {};
  submission: any = {};
  components?: any;
  privateCDN = environment.PRIVATE_CDN_URL + '/';
  isPreview = false;
  selectedPopupMenu = -1;
  fieldsList?: any[];
  supportedExtensions: any;
  uploadingGoes = false;
  docData: any = {};
  documentKey = '';
  is_preview = false;
  userField: any = [];
  realVariable: any = [];

  private signId?: string;
  private typesByField: any = {};
  private acceptableFields: string[] = [];
  private unsubscribe$: Subject<void> = new Subject();

  constructor(
    public timePipe: TimePipe,
    public datePipe: DatePipe,
    public utilsService: UtilsService,
    public optionsService: OptionsService,
    private casesService: CasesService,
    private signsService: SignsService,
    private userService: UserService,
    private errorD: LocalTranslationService,
    private route: ActivatedRoute,
    private router: Router,
    private stylesService: StylesService,
    private hostService: HostService,
    private titleService: Title,
    private notificationsService: PopInNotificationConnectorService,
    private sanitizer: DomSanitizer,
    private feedsService: FeedsService,
    private changeDetector: ApplicationRef,
    private contentMediaService: FeedMediaService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | E-signs`);
    this.typesByField = this.utilsService.generateTypesByFields();
    this.acceptableFields = this.utilsService.generateAcceptableFields();
    this.fieldsList = this.generateFieldsList();
    this.loadExtensions();

    if (!this.sign) {
      this.signsService.publishSign$.pipe(takeUntil(this.unsubscribe$)).subscribe(flag => {
        if (
          this.signModel.schema?.schema?.properties &&
          Object.keys(this.signModel.schema?.schema?.properties).length
        ) {
          this.togglePublished(this.signModel, flag);
        } else {
          const notification: Notification = this.notificationsService.addNotification({
            title: `Saving e-sign`
          });
          this.notificationsService.failed(notification, 'Choose At Least One Field');
          this.signsService.toggleSignBuilder(flag ? 0 : 1);
        }
      });
    }

    this.route.params.subscribe(params => {
      this.is_preview = params['preview'] === '1' ? false : true;
    });

    this.optionsService.userFields().subscribe(userFields => {
      this.userField = userFields;
    });

    this.userService.getAuthStatus().subscribe(res => {
      this.realVariable = res.data;
    });

    // Get case team information
    this.userService.getTeamData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.people = data!.items.map((usr: any) => ({
        id: usr.user_id,
        text: usr.sync_info
          ? usr.sync_info.given_name + ' ' + usr.sync_info.family_name
          : usr.given_name + ' ' + usr.family_name,
        role_id: usr.role_id
      }));
    });

    this.userService.getCasePermissionsData.subscribe(data => {
      if (data.role.file_size) {
        this.allowedFileSizes = data.role.file_size;
      }
    });

    if (this.caseId) {
      this.loadOpenedSignInformation();
      this.refreshPreview();
    } else {
      this.casesService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
        this.caseId = res['case_id'];
        this.loadOpenedSignInformation();
        this.refreshPreview();
      });
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.signsService.toggleSignBuilder(-1);
  }

  togglePublished(sign: any, flag: any) {
    const published = flag ? 1 : 0;
    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving form`
    });

    this.signsService
      .updateForm(this.caseId as any, { ...sign, published }, sign.sign_id)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => {
          this.signsService.toggleSignBuilder(published);
        })
      )
      .subscribe(
        () => this.notificationsService.ok(notification, 'Form Updated'),
        err => {
          if (err.error.error.message === 'SchemaMissingException') {
            notification.width = '450px';

            this.notificationsService.failed(
              notification,
              'You cannot publish a form if there is no field added to it'
            );
          } else if (err.error.error.message === 'SchemaModifyException') {
            this.notificationsService.failed(notification, `An answered form can't be modified`);
          } else {
            this.errorD
              .showError(err.error.error.message)
              .pipe(takeUntil(this.unsubscribe$))
              .subscribe(errorMessage => this.notificationsService.failed(notification, errorMessage));
          }
          this.signsService.toggleSignBuilder(published === 1 ? 0 : 1);
        }
      );
  }

  // Group form builder fields and send request on server for form saving
  public async save() {
    if (this.answer_ct) {
      return;
    }
    Object.values(this.pageData).map((item: any, index: any) => {
      if (!item?.ui_schema?.elements?.length) {
        delete this.pageData[index];
      }
    });
    let tempPageData = JSON.parse(JSON.stringify(this.pageData));
    this.pageData = {};
    Object.values(tempPageData).map((item: any, index: any) => {
      this.pageData[index] = item;
    });
    this.displayCount = Object.values(this.pageData).length || 1;

    if (this.attachedDoc?.media) {
      try {
        const res = await this.signsService
          .postFormMedia(this.caseId as any, this.signModel.sign_id as any, this.attachedDoc?.media)
          .toPromise();
        const notification: Notification = this.notificationsService.addNotification({
          title: 'Saving'
        });
        this.notificationsService.ok(notification, 'Saved');
        const mediaId = (res as any).data.items[0].media_id;
        if (!Object.keys(this.pageData).length) {
          this.pageData = new Array();
          this.pageData.push({
            schema: {
              type: 'object',
              properties: {}
            },
            ui_schema: {
              type: 'VerticalLayout',
              elements: []
            }
          });
        }

        const pageLen = Object.keys(this.pageData).length;
        this.addNewDocumentPage();
        this.switchDocumentPage(pageLen + 1);

        const keyValue = this.generateRandomName(10);
        this.pageData[this.activeDocPage - 1].ui_schema.elements.push({
          scope: '#/properties/' + keyValue,
          type: 'Control'
        });
        this.pageData[this.activeDocPage - 1].schema.properties[keyValue] = {
          type: this.typesByField[this.newFieldType].type,
          fieldType: this.newFieldType,
          contentMediaType: this.newFieldType === 'images' ? 'image/png' : 'doc/pdf',
          key: keyValue,
          title: this.editingField.title,
          description: mediaId,
          require: this.editingField.required
        };
        this.attachedDoc = {};
      } catch (err: any) {
        this.attachedDoc = {};
        const notification: Notification = this.notificationsService.addNotification({
          title: `Saving access `
        });
        this.notificationsService.failed(notification, err.message);
      }
      this.refreshModal(false);
    }

    if (Object.keys(this.pageData).length) {
      this.signModel.pages = Array();
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      Object.values(tempPageData).map((item: any, index: any) => {
        Object.keys(item.schema.properties).map(key => {
          tempPageData[index].schema.properties[key].description = JSON.stringify(
            tempPageData[index].schema.properties[key].description
          );
          delete tempPageData[index].schema.properties[key].top;
        });
        item.participants = this.participants;
        this.signModel?.pages?.push(item);
      });
    } else {
      this.pageData = [
        {
          schema: {
            type: 'object',
            properties: {}
          },
          ui_schema: {
            type: 'VerticalLayout',
            elements: []
          }
        }
      ];
      delete this.signModel.pages;
    }
    if (this.fieldParticipants.length) {
      const _formParticipants = this.signModel.participants_ids || [];
      this.fieldParticipants.map(participant => {
        if (_formParticipants.indexOf(participant) === -1) {
          _formParticipants.push(participant);
        }
      });
      if (_formParticipants.length) {
        this.signModel.participants_ids = _formParticipants;
      }
    }
    if (this.signModel.sign_id) {
      const notification: Notification = this.notificationsService.addNotification({
        title: `Saving field`
      });
      this.signsService.updateForm(this.caseId as any, this.signModel, this.signModel.sign_id).subscribe(
        () => {
          this.blockFields = false;
          this.notificationsService.ok(notification, 'E-sign Updated');
        },
        err => this.notificationsService.failed(notification, err.message)
      );
    }
    this.calcFieldPosition();
    await this.loadMediaInfo();
  }

  private async loadMediaInfo() {
    if (this.signModel.sign_id) {
      const res = await this.signsService.getFormInfo(this.caseId as any, this.signModel.sign_id).toPromise();
      this.mediaList = res?.media || {};
    }
  }

  public backToSigns(): void {
    if (this.sign) {
      this.close.emit();
    } else {
      const tab: string = this.signsService.currentTab$.value;
      this.router.navigate(['/e-signs'], { queryParams: { tab } });
    }
  }

  // Clone form response object for sending and get schema.properties
  private loadOpenedSignInformation() {
    if (this.sign) {
      this.signId = this.sign.sign_id;
      this.signModel.sign_id = this.signId;
      this.loadExistingSignInfo();
    } else {
      this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
        this.signId = params['id'];
        this.signModel.sign_id = this.signId;
        this.userId = params['userId'] || '';

        if (this.signId && this.caseId) {
          this.loading = true;
          this.loadExistingSignInfo();
        } else {
          this.loading = false;
        }
      });
    }
  }

  // Checking object keys
  public checkObjectKeys = (v: {[key: string]: string}) => Object.keys(v);

  // Checking object values
  public checkObjectValues = (v: {[key: string]: string}) => Object.values(v);

  // Set default values for sign
  public refreshModal(modalState: any): void {
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
    modalState ? (this.shownDefaultsModal = true) : (this.shownDefaultsModal = false);

    this.fieldParticipants = [];
    this.editingField = null;
    this.addFieldFormTouched = false;
    this.blockFields = false;
    this.formIsValid = true;
  }

  // Generate fields list
  private generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text' },
      { id: 'dropdown', text: 'Multiple choice', element: 'Multiple choice' },
      { id: 'multidropdown', text: 'Checkboxes', element: 'Checkboxes' },
      { id: 'date', text: 'Date', element: 'Date' },
      { id: 'time', text: 'Time', element: 'Time' },
      { id: 'number', text: 'Number', element: 'Number' },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text' },
      { id: 'docs', text: 'Upload Pdf', element: 'Pdf' },
      { id: 'images', text: 'Upload Image', element: 'Image' },
      { id: 'blank', text: 'Blank new page', element: 'Blank new page' }
    ];
  }

  // Generate new properties list
  private generateNewPropertiesList() {
    const keyValue = this.generateRandomName(10);
    return {
      type: this.typesByField[this.newFieldType].type,
      fieldType: this.newFieldType,
      title: '',
      name: keyValue,
      key: keyValue,
      field_name: '',
      description: '',
      meta_data: { pageNumber: this.activeDocPage },
      pageNumber: this.activeDocPage,
      required: false,
      readonly: true,
      defaultValue: this.typesByField[this.newFieldType].defaultValue
    };
  }

  // Add a new page for form file builder
  public addNewDocumentPage = () => {
    this.displayCount++;
    this.pageData[this.displayCount - 1] = {
      schema: {
        type: 'object',
        properties: {}
      },
      ui_schema: {
        type: 'VerticalLayout',
        elements: []
      }
    };
  };

  // Generate random name for fields
  private generateRandomName(digit: number) {
    return Math.random()
      .toString(36)
      .substring(2, digit + 2);
  }

  // Get Schema from Ui_schema list
  public getSchemaListFromUiList(pageNumber: number = this.activeDocPage): any[] {
    const elements = this.pageData[pageNumber - 1]?.ui_schema?.elements || [];
    const properties = this.pageData[pageNumber - 1]?.schema?.properties || [];
    const requiredList = this.pageData[pageNumber - 1]?.schema?.required || [];
    return elements.map((item: any) => {
      let result = properties[item.scope.split('/')[2]];
      result.require = requiredList.indexOf(result.key) >= 0;
      return result;
    });
  }

  public calcFieldPosition(): any {
    const fieldList = this.getSchemaListFromUiList();
    let top = 20;
    let tempPosition: any[] = [];
    for (let i = 0; i < fieldList.length; i++) {
      tempPosition = [...tempPosition, top + 'px'];
      top += parseInt(fieldList[i].height);
    }
    this.fieldPositionList = tempPosition;
  }

  // Switch next document page
  public nextDoc() {
    this.switchDocumentPage((this.activeDocPage || 0) + 1);
  }

  // Switch previous document page
  public previousDoc() {
    this.switchDocumentPage((this.activeDocPage || 2) - 1);
  }

  // Switching page for document builder
  public switchDocumentPage = (pageNumber: any) => {
    const maxLen = this.displayCount;
    if (pageNumber !== '' && Object.keys(this.pageData).length) {
      if (pageNumber > maxLen) {
        pageNumber = 1;
      } else if (pageNumber < 1) {
        pageNumber = maxLen;
      }

      this.activeDocPage = pageNumber;
      this.loading = false;
    } else if (pageNumber !== '') {
      this.activeDocPage = 1;
    }
    setTimeout(() => {
      this.calcFieldPosition();
      this.refreshPreview();
    });
  };

  public isEmptyData(): boolean {
    return Object.keys(this.pageData).length === 1 && Object.keys(this.pageData[0].schema.properties).length === 0;
  }

  public loadUserAnswer(answers: any) {
    const answer = answers[(Object.keys(answers) as any).find((user_id: any) => user_id === this.userId)];
    Object.assign(this.submission, answer && answer.page_answers[0]);
  }

  private loadExistingSignInfo() {
    if (this.signModel.sign_id) {
      this.blockFields = true;
      this.signsService.getFormInfo(this.caseId as any, this.signId as any).subscribe(signModel => {
        this.signModel.name = signModel.name;
        this.mediaList = signModel.media;
        signModel.description !== undefined
          ? (this.signModel.description = signModel.description)
          : delete this.signModel.description;
        signModel.media_asset_id
          ? (this.signModel.media_asset_id = signModel.media_asset_id)
          : delete this.signModel.media_asset_id;
        signModel.notifications !== undefined
          ? (this.signModel.notifications = signModel.notifications)
          : delete this.signModel.notifications;
        signModel.permissions !== undefined
          ? (this.signModel.permissions = signModel.permissions)
          : delete this.signModel.permissions;
        signModel.participants_ids !== undefined
          ? (this.signModel.participants_ids = signModel.participants_ids)
          : delete this.signModel.participants_ids;
        signModel.field_participants !== undefined
          ? (this.signModel.field_participants = signModel.field_participants)
          : delete this.signModel.field_participants;
        this.signModel.duration.due_date = signModel.due_date;
        signModel.rrule ? (this.signModel.duration.rrule = signModel.rrule) : delete this.signModel.duration.rrule;
        this.signModel.type = signModel.type;

        if (
          this.afterUpdateNavigation === '/e-signs/' &&
          this.signModel.permissions &&
          this.signModel.permissions.length > 0
        ) {
          this.people = this.people.filter((p: any) => this.signModel.permissions!.indexOf(p.role_id) >= 0);
        }

        const pages = () => {
          let returnPages = Array();
          const pages = signModel.pages;
          if (typeof pages == 'object') {
            Object.values(pages).map((item: any, index: any) => {
              if (item.participants) {
                this.participants = item.participants;
              } else {
                this.participants = {};
              }
              Object.keys(item.schema.properties).map(key => {
                if (item.schema.properties[key].description) {
                  pages[index].schema.properties[key].description = JSON.parse(
                    item.schema.properties[key].description || ''
                  );
                }
              });
            });
            returnPages = pages;
          } else {
            returnPages.push({
              schema: {
                type: 'object',
                properties: {}
              },
              ui_schema: {
                type: 'VerticalLayout',
                elements: []
              }
            });
          }
          return returnPages;
        };

        const pageContent = pages();
        this.displayCount = (pageContent && pageContent.length) || 1;

        if (pageContent) {
          Object.assign(this.pageData, pageContent);
          this.switchDocumentPage(1);
        }
        this.loading = false;
        this.answer_ct = Object.keys(signModel.answers || {}).length;
        this.answers = signModel.answers || {};
        this.loadUserAnswer(this.answers);
        this.blockFields = !!signModel.answer_ct;
      });
    } else {
      this.loading = false;
    }
  }

  public refreshPreview(): void {
    this.components = [];
    const _previewData = this.getSchemaListFromUiList();
    _previewData.map(item => {
      const componentItem: any = {};
      componentItem['key'] = item.key;
      componentItem['label'] = item.title;
      componentItem['defaultValue'] = item.description || '';
      switch (item.fieldType) {
        case 'text':
          componentItem['type'] = 'textfield';
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
        case 'multidropdown':
          componentItem['type'] = 'select';
          componentItem['valueProperty'] = 'value';
          componentItem['dataType'] = 'string';
          componentItem['multiple'] = true;
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
          componentItem['defaultValue'] = componentItem['defaultValue'].substring(
            0,
            componentItem['defaultValue'].length - 3
          );
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
          componentItem['html'] = "<img src='" + this.loadMediaSrcInfo(this.mediaList, item) + "' alt='Form Image'/>";
          break;
        default:
          componentItem['type'] = 'textfield';
          break;
      }
      this.components.push(componentItem);
    });
  }

  public loadMediaSrcInfo(media: any, item: any) {
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

  public getImageSrc(request: SrcRequest): any {
    let mediaLink = `${this.privateCDN}${request.url_key
      .replace('${display_size}', request.width as any)
      .replace('${display_format}', request.ext)}`;
    if (~mediaLink.indexOf('${display_count}')) {
      mediaLink = mediaLink.replace('${display_count}', `${request.page}`);
    }
    return mediaLink;
  }

  getElement(fieldType: any): string {
    return this.fieldsList?.filter(item => item.id === fieldType)[0].element;
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  // Get extensions for documents
  private loadExtensions() {
    this.contentMediaService.getExtesions().subscribe(data => (this.supportedExtensions = data));
  }

  private checkFileExtension(file: IFileToUpload): boolean {
    const docsExtensions = Object.keys(this.supportedExtensions.docs);
    const imagesExtensions = Object.keys(this.supportedExtensions.images);
    const isDoc = docsExtensions.some(ext => ext === file.extension);
    const isImage = imagesExtensions.some(ext => ext === file.extension);

    if (isDoc) {
      file.fileGroup = 'docs';
    } else if (isImage) {
      file.fileGroup = 'images';
    }

    return isDoc || isImage;
  }

  public downloadPDF(): void {
    const documentDefinition: any = this.getDocumentDefinition();
    pdfMake.createPdf(documentDefinition).download();
  }

  public getDocumentDefinition() {
    //TODO: help - http://pdfmake.org/playground.html
    const content = this.components.reduce((acc: any, cur: any) => {
      let component = [];
      if (cur.type === 'select') {
        component = [
          {
            text: `${cur.label}`,
            style: 'name'
          },
          {
            ul: cur.data.values.map((value: any) => {
              if (value.value === this.submission[cur.key]) {
                return { text: value.value, color: 'red' };
              } else {
                return value.value;
              }
            })
          },
          '\n'
        ];
      } else {
        component = [
          {
            text: `${cur.label}`,
            style: 'name'
          },
          {
            text: `${this.submission[cur.key]}`
          },
          '\n'
        ];
      }
      return [...acc, ...component];
    }, []);
    return {
      content: [
        {
          columns: [
            {
              text: this.signModel.name,
              alignment: 'left',
              style: 'header'
            },
            {
              image:
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAZCAYAAABzVH1EAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAP4SURBVHgB7VjNbttGEJ5ZimpuYgEbyM3sC7Ryb4ELREKB9tCD5SeQFMkGfIqEPoCsByiknAxYciU/geRTfSmkHNweI6MPUPrWog7AoyGR3H7DcFE1DQI3VIQkyAcQ3N+Z+WZml7tkWgM2xr90iKIKE/umTRPNbko7e7QiKFoDmLSjmRp/lXY+k8fSqggqDq0QTG8Bzmji2Jx9ZurwvpMoW46Ii7pn6gpE/9zdOac3RIZWBKcxcmy6V5Ky/i1w9Oe2d1P6qniXuRvnl60gZYRWllpCQhM/1qS2KKQtWjNSReR+4yd3QdyScpIqTkTa5XC1+X8XpCISEhXkzayG8tb0YtHpXMbBu0FrROo1gi3Vu+l883S57f7oVzcQmmvEWrbfdeCDIbKy7fe/4MLm+PL3V/VErI6e7z442xxdVjTrMmt25YNJKfBWiPyx98CjpY/tZuNiEDFPn3e+PcPH0s1QdgQSVwuaj8nOTWSM/92X15QCK1jsurLRuCgwhU2LlB8ST14eg+8LtmM1lrK/V/RAoqqZB+gopiXwjx0p4Xz/c/zxuxfOWUhoVpVAWd7L4/wfvv6XwRIZIUXvGiR9NpsXj+kjPuLdxWAwcI6Pj93/Mycjk6IgaDDzLuo+dpOZUqpdrVZ9SgmRrcNwEmrd3N/fn75mnBuG4cN6vX4m9SiKSrZti36P7ogMJnVIKe9RrbYtDaenp5Xb21s5vfqnvd4R+nJa6xmeazHm5OQkb1lWWcZC+dnBwcGs1+sVFHMZp0d/Pp8/OTw89IxBOEgOLY5PyFNDThyHsVvom0LWOca1cMTIQ7cQkroHfb4QjMKwNV8s2iKz3++XpE90xn1RFG8uolOR1oVardY2zFAeyqQf+/2ukBBjEa08ovQwZq7UAPWxtBtvwtAOjDpC+yxr2x0jC3t7a7FYnBsC8kaERrHcKHqC8ZxE/inmi/FDRMITXXi+EGeKc7LZbNnIFCeKTsgZoDoUOz6x7dHrzloirC3sUb4yjUi9KVzdFYEQ4sMr5YjiQ9sQ7Q1zrZUowbBpHB2lusZ76M/DWU2RK05LIueh3UdqXS+ndFK+WiIxg+PdIAjc+P6jdReOFSfmldyb4xRKIAYk3vMxIR8r1zq3FLEmW5ZcYX14ryUpAMdOH9XrRTzbUBb/GYETykIK6TCQFIOQipFhFrKJ0jJe1SbGJ4QLojfWCbsTnUVlWZ9ykmstsHthNH7ToKOJogOPS8hkA/AkBSOtq2Igi2BmF/UmvDhGbg/YKJM1gbzH3An6to0tGNOS/Md8FzLNrdKDrmpcjqJn0OFhY2hjfg71LtJvT1IN60TSOQ99HlK1KlEWedAp/wj8aOmnxnuPvwHE6BjpCpbezQAAAABJRU5ErkJggg==',
              width: 50
            }
          ]
        },
        [...content]
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 30]
        },
        name: {
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 10]
        }
      }
    };
  }
}
