import {
  IAddMediaRequest,
  IMediaAttachment,
  IMediaObject,
  MediaStatus
} from './../../pages/modules/media/models/media.model';
import { FeedMediaService } from '../../services/feed-media.service';
import { Observable, Subject, Subscription, of, throwError } from 'rxjs';
import { DatePipe } from '@angular/common';
import { catchError, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { FormsService, IForm } from '../../services/forms.service';
import { ModuleName } from '../../services/drive.service';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { format, utcToZonedTime } from 'date-fns-tz';
import { UtilsService } from '../../services/utils.service';
import { UserService } from '../../services/user.service';
import { TimePipe } from '../../common/pipes/time.pipe';
import {
  PopInNotificationConnectorService,
  Notification
} from '../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { environment } from '../../../environments/environment';
import { Field } from '../interfaces/field.interface';
import { AttachedDoc } from '../interfaces/attached-doc.interface';
import { FormInfo } from '../interfaces/form-info.interface';
import { SaveMedia } from '../interfaces/save-media.interface';
import { ElementRef } from '@angular/core';
import { AuthStatus } from '../../interfaces/auth-status.interface';
import { IUserFields } from '../../pages/users/models/user.model';

export class DocFormBuilder {
  public formModel?: IForm;
  public pageData: any = {};
  public loading = false;
  public is_loading = true;
  public message = '';
  public errorMessage = '';
  public currentFileUploading: string | null = null;
  public allDay = false;
  public tabNumber = 1;
  public docData: any = {};
  public recurring: any = { rrule: [''] };
  public todayDate;
  public notifications: any = {};
  public properties: any = [];
  public title?: any;
  public description?: any;
  public validationErrors = [];
  public validationErrorsPopUp = [];
  public validationDefaultsErrors: any[] = [];
  public validationOptionsErrors = [];
  public reuquiredCustomFields: any = [];
  public editingOptions = [];
  public optionsModel = [];
  public savingError = '';
  public people: any[] = [];
  public recipients: any[] = [];
  public optionsError = '';
  public editingPropertyIndex: any;
  public editOptionAction = false;
  public editOptionIndex: any;
  public subscribers: any[] = [];
  public newFieldType = '';
  public saving = false;
  public signError = '';
  public optionsLimitError = false;
  public optionExistsError = false;
  public fieldValue = '';
  public noFields = false;
  public shownOptionsModal = false;
  public shownDefaultsModal = false;
  public shownPageOptionModal = false;
  public ifNewField = true;
  public defaultOptionsToUpdate: any = [];
  public editingField: any = {};
  public customValues = {};
  public activeOptions = [];
  public activeRecepients: any[] = [];
  public loadingDocTimeouId: any;
  public formMedia: IMediaAttachment[] = [];
  public docThumbnails: string[] = [];
  public typesByField: any = {
    'text-only': { type: 'string', defaultValue: '' },
    docs: { type: 'string', defaultValue: '' },
    images: { type: 'string', defaultValue: '' },
    blank: { type: 'string', defaultValue: '' },
    text: { type: 'string', defaultValue: '' },
    textarea: { type: 'string', defaultValue: '' },
    dropdown: {
      type: 'string',
      items: {
        type: 'string',
        enum: []
      },
      enum: [],
      defaultValue: ''
    },
    multidropdown: {
      type: 'array',
      items: {
        type: 'string',
        enum: []
      },
      enum: [],
      defaultValue: []
    },
    checkboxes: {
      type: 'array',
      items: {
        type: 'string',
        enum: []
      },
      enum: [],
      itemsToAddLimit: 10,
      defaultValue: []
    },
    options: {
      type: 'string',
      items: {
        type: 'string',
        enum: []
      },
      enum: [],
      itemsToAddLimit: 10,
      defaultValue: ''
    },
    'checkbox-options': {
      type: 'array',
      items: {
        type: 'string',
        enum: []
      },
      enum: [],
      itemsToAddLimit: 10,
      defaultValue: []
    },
    list: {
      type: 'string',
      items: {
        type: 'string',
        enum: []
      },
      enum: [],
      itemsToAddLimit: 10,
      defaultValue: '',
      height: '150px'
    },
    date: {
      type: 'string',
      pattern: '^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$',
      defaultValue: '',
      format: 'date'
    },
    time: {
      type: 'string',
      pattern: '^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$',
      defaultValue: '',
      format: 'time'
    },
    boolean: { type: 'boolean', defaultValue: false },
    number: { type: 'number', defaultValue: 0 },
    'signature-box': { type: 'string', value: null },
    table: {
      type: 'array',
      defaultValue: [],
      cols: [],
      rows: [[]],
      height: '110px'
    },
    image: { type: 'string', value: null }
  };
  defaultTextType = 'single';
  textTypeList = [
    {
      id: 'single',
      name: 'Single Line'
    },
    {
      id: 'multi',
      name: 'Multi-Line'
    }
  ];
  public isPreprareField: boolean = false;
  public prepareFieldValue = {
    description: '',
    fieldType: 'text',
    height: '60px',
    key: 'prepareField',
    left: '200px',
    require: true,
    readonly: false,
    displayText: true,
    title: 'Default Prepare Field',
    subText: 'Default Sub Text',
    top: '200px',
    type: 'string'
  };
  public draggingField: any = null;
  public defaultLayout = 'horizontal';
  public layoutList = [
    {
      id: 'horizontal',
      name: 'Dropdown'
    },
    {
      id: 'vertical',
      name: 'List'
    },
    {
      id: 'checkbox-options',
      name: 'Separated Checkboxes'
    }
  ];
  public defaultDropDownLayout = 'dropdown';
  public dropDownLayoutList = [
    {
      id: 'dropdown',
      name: 'Dropdown'
    },
    {
      id: 'options',
      name: 'Separated Radio Buttons'
    },
    {
      id: 'list',
      name: 'List'
    }
  ];

  public supportedExtensions?: any;
  public uploadProgress: any;
  public uploadingGoes = false;
  public assetId?: string;
  public blockFields = false;
  public documentLink?: any;
  public metaData: any = {};
  public saveModel = {};
  public extension = '';
  public addFieldFormTouched?: boolean;
  public activeSidebarTab = 1;
  public formTouched?: boolean;
  public timeoutId = null;
  public formType?: any;
  public acceptAttribute?: string;
  public stylesService: any;
  public formsService: any;
  public contentMediaS: any;
  public feedMediaS: any;
  public amazonService: any;
  public errorDistionary: any;
  public optionsService: any;
  public driveService: any;
  public changeDetector: any;
  public sanitizer: any;
  public route: any;
  protected router: any;
  public date: DatePipe;
  public timePipe: TimePipe;
  public utilsService: UtilsService;
  public notificationsService: PopInNotificationConnectorService;
  public userService: UserService;
  public formBuilder: UntypedFormBuilder;
  public designService: any;
  public formIsValid?: boolean;
  public required_userfield = [];
  public required_field?: string[];
  public convertingCount = 0;
  private newProperty: any = {};
  public destroy$ = new Subject<void>();
  public isSaving = false;
  public components: any[] = [];
  protected mediaList: any = [];
  public privateCDN = environment.PRIVATE_CDN_URL + '/';
  public insertFieldType: null | string = null;
  public destroy: boolean = false;
  public convertingFiles: { editingField: Field; mediaId?: string; doc?: AttachedDoc }[] = [];
  public isResizing: boolean = false;
  public schemaList: any[] = [];
  public _backgroundImage?: ElementRef;
  public realVariable?: AuthStatus['data'];
  public userField?: IUserFields;

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

  changesSaved?: boolean;
  displayCount?: any;
  activeDocPage = 0;

  public saveTimeoutId?: any;
  private previousState = {};
  private saveSubscription?: Subscription;

  autoSaveSubject: Subject<any> = new Subject<any>();
  autoSaveObserver = this.autoSaveSubject.asObservable();

  public fieldsList?: any[];

  public formError = '';

  public fieldForm: UntypedFormGroup;

  get fieldValueField() {
    return this.fieldForm.controls['fieldValue'];
  }

  get currentTime(): string[] {
    const currentTime = new Date().toLocaleTimeString();
    return currentTime.split(' ')[0].split(':');
  }


  constructor(
    notificationsService: PopInNotificationConnectorService,
    utilsService: UtilsService,
    timePipe: TimePipe,
    stylesS?: any,
    formsS?: any,
    contentMediaS?: any,
    feedMediaS?: any,
    amazonS?: any,
    errorD?: any,
    optionsS?: any,
    driveS?: any,
    change?: any,
    sanitizer?: any,
    route?: any,
    router?: any,
    date?: DatePipe,
    formBuilder?: any,
    designService?: any,
    userService?: any
  ) {
    this.notificationsService = notificationsService;
    this.utilsService = utilsService;
    this.timePipe = timePipe;
    this.stylesService = stylesS;
    this.formsService = formsS;
    this.contentMediaS = contentMediaS;
    this.feedMediaS = feedMediaS;
    this.amazonService = amazonS;
    this.errorDistionary = errorD;
    this.optionsService = optionsS;
    this.userService = userService;
    this.driveService = driveS;
    this.changeDetector = change;
    this.sanitizer = sanitizer;
    this.route = route;
    this.router = router;
    this.date = date!;
    this.formBuilder = formBuilder;
    (this.designService = designService), (this.todayDate = this.date.transform(new Date(), 'MM/dd/yyyy'));

    this.fieldForm = this.formBuilder.group({
      newFieldType: '',
      title: [{ value: '', disabled: this.blockFields }, Validators.required],
      fieldValue: { value: '', disabled: this.blockFields }
    });

  }

  initializationComponents() {
    this.fieldsList = this.generateFieldsList().filter(item => !item.hidden);
    this.loadExtesions();
    this.checkMediaConvertingInProcess();
  }

  currentIsNotValid() {
    return this.validationDefaultsErrors.indexOf(this.editingField.name + '-f') > -1;
  }

  // Prepeating for edit field
  public runFieldEditing(fl: any, index: number) {
    this.refreshModal(true);
    this.ifNewField = false;
    this.editingField = this.utilsService.copy(fl);
    this.editingField.defaultValue = fl.description;
    if (fl.fieldType == 'time') {
      this.editingField.defaultValue = this.timePipe.transform(String(fl.description), true);
    }
    this.defaultLayout = 'horizontal';
    if (fl.fieldType === 'checkboxes') {
      this.defaultLayout = 'vertical';
    }
    if (fl.fieldType === 'checkbox-options') {
      this.defaultLayout = 'checkbox-options';
    }
    this.defaultDropDownLayout = 'dropdown';
    if (fl.fieldType === 'options') {
      this.defaultDropDownLayout = 'options';
    }
    this.editingField.index = index;
  }

  public runFieldCopy(fl: any) {
    this.editingField = this.utilsService.copy(fl);
    this.editingField.defaultValue = fl.description;
    this.editingField.key = this.generateRandomName(10);
    this.saveField();
  }

  // Prepearing for delete field
  public runFieldDelete(pageNumber: any, propertyKey: any) {
    const propertyIndex = Object.keys(this.pageData[pageNumber].schema?.properties).indexOf(propertyKey);
    if (propertyIndex >= 0) {
      delete this.pageData[pageNumber].schema?.properties[propertyKey];
    }
    const elementIndex = Object.values(this.pageData[pageNumber].ui_schema?.elements)
      .map((item: any) => item.scope.split('/')[2])
      .indexOf(propertyKey);
    if (elementIndex >= 0) {
      if (Object.keys(this.pageData[pageNumber].ui_schema?.elements).length === 1) {
        this.pageData[pageNumber].ui_schema.elements = [];
      } else {
        this.pageData[pageNumber].ui_schema?.elements.splice(elementIndex, 1);
      }
    }

    let requiredList = this.pageData[pageNumber]?.schema?.required || [];
    if (requiredList.indexOf(propertyKey) > -1) {
      requiredList.splice(
        requiredList.findIndex((key: string) => key === propertyKey),
        1
      );
      if (requiredList.length) {
        this.pageData[pageNumber].schema.required = requiredList;
      } else {
        delete this.pageData[pageNumber].schema.required;
      }
    }
    this.save();
  }

  public handleChange(event: any): void {
    if (event?.changed?.value) {
      this.editingField.defaultValue = event.changed.value;
      this.editingField.description = event.changed.value;
      this.editingField.title = this.htmltoText(event.changed.value);
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
    if (this.editingField.fieldType === 'text-only') {
      this.editorForm.components[0].key = this.editingField.key;
      this.editorForm.components[0].defaultValue = this.editingField.description;
    }
  }

  // Delete option from field
  public deletePropertyOption(ind: number): void {
    if (this.editingField?.fieldType === 'table') {
      this.editingField.cols?.splice(ind, 1);
      this.editingField.rows?.[0].splice(ind, 1);
      return;
    }
    if (
      this.editingField?.fieldType === 'multidropdown' ||
      this.editingField?.fieldType === 'checkboxes' ||
      this.editingField?.fieldType === 'checkbox-options'
    ) {
      this.editingField.items.enum.splice(ind, 1);
      this.editingField.items.enum = this.editingField.items.enum.slice();
    } else {
      this.editingField?.enum.splice(ind, 1);
      this.editingField!.enum = this.editingField?.enum.slice();
    }
    if (this.editingField?.fieldType === 'checkbox-options' || this.editingField?.fieldType === 'options') {
      this.editingField.positions?.splice(ind, 1);
    }
  }

  addOption(event: Event) {
    event.preventDefault();
    let canAdd = true;
    const limit = this.typesByField[this.editingField.fieldType].itemsToAddLimit;

    if (limit) {
      if (this.editingField.fieldType === 'multidropdown' ||
      this.editingField?.fieldType === 'checkboxes' || this.editingField.fieldType === 'checkbox-options') {
        if (this.editingField.items.enum.length >= limit) {
          canAdd = false;
        } else {
          if (this.editingField.enum?.length >= limit) {
            canAdd = false;
          }
        }
      }
    }

    if (canAdd) {
      if (this.editingField.fieldType === 'multidropdown' ||
      this.editingField?.fieldType === 'checkboxes' || this.editingField.fieldType === 'checkbox-options') {
        if (this.editingField.items.enum.indexOf(this.fieldValue) === -1) {
          this.editingField.items.enum.push(this.fieldValue);
          this.editingField.items.enum = this.editingField.items.enum.slice();
          this.fieldValue = '';
          this.optionExistsError = false;
        } else {
          this.optionExistsError = true;
        }
        this.optionsLimitError = false;
      } else {
        if (this.editingField.fieldType === 'table') {
          this.editingField.cols.push(this.fieldValue);
          this.fieldValue = '';
          this.optionExistsError = false;
          return;
        }
        if (this.editingField.enum.indexOf(this.fieldValue) === -1) {
          this.editingField.enum.push(this.fieldValue);
          this.editingField.enum = this.editingField.enum.slice();
          this.fieldValue = '';
          this.optionExistsError = false;
        } else {
          this.optionExistsError = true;
        }
        this.optionsLimitError = false;
      }

      if (
        this.editingField.fieldType === 'checkbox-options' ||
        (this.editingField.fieldType === 'options' && this.editingField?.positions?.length)
      ) {
        const heightCoef = this._backgroundImage?.nativeElement.clientHeight * 0.0375;
        const prevPosition = { ...this.editingField.positions[this.editingField.positions.length - 1] };
        const newPosition = { ...prevPosition, top: +prevPosition.top.split('px')[0] + heightCoef + 'px' };
        this.editingField.positions = [...this.editingField.positions, { ...newPosition }];
      }
    } else {
      this.optionsLimitError = true;
    }
  }

  public updateOption(event: Event) {
    event.preventDefault();
    if (
      this.editingField?.fieldType === 'multidropdown' ||
      this.editingField?.fieldType === 'checkboxes' ||
      this.editingField?.fieldType === 'checkbox-options'
    ) {
      this.editingField.items.enum[this.editOptionIndex] = this.fieldValue;
      this.editingField.items.enum = this.editingField.items.enum.slice();
    } else if (this.editingField?.fieldType === 'table') {
      this.editingField.cols![this.editOptionIndex] = this.fieldValue;
    } else {
      this.editingField!.enum[this.editOptionIndex] = this.fieldValue;
      this.editingField!.enum = this.editingField?.enum.slice();
    }
    this.editOptionAction = false;
    this.fieldValue = '';
  }

  // Set option info in input field for options and activate botton for update too
  public editPropertyOption(ident: number) {
    this.editOptionIndex = ident;
    this.editOptionAction = true;
    if (this.editingField?.fieldType === 'table') {
      this.fieldValue = this.editingField.cols![ident];
      return;
    }
    if (this.editingField?.fieldType === 'list' || this.editingField?.fieldType === 'options' || this.editingField?.fieldType === 'dropdown') {
      this.fieldValue = this.editingField.enum[ident];
      return;
    }
    this.fieldValue = this.editingField?.items.enum[ident];
  }

  updateActiveOptions() {
    const lookIn = this.editingField['defaultValue'] ? this.editingField['defaultValue'] : [];
    if (
      this.editingField.fieldType !== 'dropdown' &&
      this.editingField.fieldType !== 'list' &&
      this.editingField.fieldType !== 'checkbox-options' &&
      this.editingField.fieldType !== 'options'
    ) {
      this.activeOptions = lookIn
        .map((v: any) => {
          return {
            id: v,
            text: v
          };
        })
        .filter((v: any) => {
          return this.editingField.items.enum ? this.editingField.items.enum.indexOf(v.id) > -1 : false;
        });
    } else {
      if (this.editingField.fieldType === 'list' || this.editingField.fieldType === 'options') {
        if (this.editingField.enum.indexOf(lookIn) === -1) {
          this.activeOptions = [];
          this.editingField['defaultValue'] = '';
        }
        return;
      }
      if (this.editingField.items.enum.indexOf(lookIn) === -1) {
        this.activeOptions = [];
        this.editingField['defaultValue'] = '';
      }
    }
  }

  stringify = (v: any) => JSON.stringify(v, null, 2);

  changeStep(prop: any, st: any) {
    (this as any)[prop] += st;
  }

  autoSave() {
    this.autoSaveSubject.next();
  }

  // Checking object keys
  checkObjectKeys = (v: {[key: string]: any}) => Object.keys(v);
  checkObjectValues = (v: {[key: string]: any}) => Object.values(v);

  public getElementListFromUiList(pageNumber: number = this.activeDocPage): any[] {
    const elements = this.pageData[pageNumber - 1]?.ui_schema?.elements || [];
    const properties = this.pageData[pageNumber - 1]?.schema?.properties || [];
    const requiredList = this.pageData[pageNumber - 1]?.schema?.required || [];
    return elements.map((item: any) => {
      let result = properties[item.scope.split('/')[2]];
      result.require = requiredList.indexOf(result.key) >= 0;
      return result;
    });
  }

  public getSchemaListFromUiList(pageNumber: number = this.activeDocPage): any[] {
    const elements = this.pageData[pageNumber - 1]?.ui_schema?.elements || [];
    const properties = this.pageData[pageNumber - 1]?.schema?.properties || [];
    const requiredList = this.pageData[pageNumber - 1]?.schema?.required || [];
    const res = new Array();
    let id = 0;
    elements.forEach((item: any) => {
      let result = properties[item.scope.split('/')[2]];
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

  public saveMedia(mediaId = '', attachedDoc?: AttachedDoc, isAfterReload: boolean = false): Observable<SaveMedia | undefined> {
    if (attachedDoc?.media) {
      if (isAfterReload) {
        return this.saveMediaProcess(mediaId);
      }
      this.isSaving = true;
      const mediaRequest: IAddMediaRequest = {
        media: [
          {
            media_key: attachedDoc?.media
          }
        ]
      };
      return this.contentMediaS.addPostMedia(mediaRequest, this.assetId).pipe(
        take(1),
        tap((res: SaveMedia) => {
          mediaId = res.data.items[0].media_id;
          this.convertingFiles[0].mediaId = mediaId;
          if (!this.convertingCount) this.addNewDocumentPage('', true);
          this.currentFileUploading = null;
        }),
        switchMap(() => this.saveMediaProcess(mediaId)),
        catchError(error => {
          this.currentFileUploading = null;
          return of(error);
        })
      );
    }
    return this.saveMediaProcess(mediaId).pipe(take(1));
  }

  save(quietUpdate = false, isConverting: boolean = false) {
    if (Object.keys(this.pageData).length) {
      this.formModel!.pages = Array();
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      Object.values(tempPageData).map((item: any, index: any) => {
        if (!Object.keys(item?.schema?.properties).length) {
          delete tempPageData[index].schema?.properties;
        } else {
          Object.keys(item.schema.properties).map(key => {
            tempPageData[index].schema.properties[key].description = JSON.stringify(
              tempPageData[index].schema.properties[key].description
            );
          });
        }
        this.formModel?.pages?.push(item);
      });
    } else {
      this.formModel!.pages = Array();
    }

    this.blockFields = true;

    const request: any = {
      tag_id: this.title,
      description: this.description,
      pages: this.formModel?.pages
    };

    if (this.notifications) {
      request.notifications = this.notifications;
    }

    if (this.recipients.length) {
      request.recipients_ids = this.recipients;
    }

    if (this.recurring.rrule && this.recurring.rrule[0]) {
      request.rrule = this.recurring.rrule[0];
    }

    if (isConverting) {
      let notification: Notification;
      if (this.formsService.checkRoutes()) {
        notification = this.notificationsService.addNotification({
          title: `Saving field`
        });
      }

      if (this.formModel?.mediaId) {
        delete this.formModel.mediaId;
      }
      return this.formsService.updateForm(request, this.assetId).pipe(
        tap(() => {
          this.blockFields = false;
          this.isSaving = false;
          if (this.formsService.checkRoutes()) {
            this.notificationsService.ok(notification, 'Form Updated');
          }
          this.formsService.isFieldsDisabled = false;
          this.savingError = '';
          this.changesSaved = true;
          if (this.formsService.checkRoutes()) {
            this.notificationsService.ok(notification, 'Form Updated');
          }
        }),
        switchMap(() => {
          this.loadExistingFormInfo();
          return this.loadMediaInfo();
        }),
        catchError(err => {
          this.blockFields = false;
          this.isSaving = false;
          this.changesSaved = false;
          this.showError('savingError', err.message);
          if (this.formsService.checkRoutes()) {
            this.notificationsService.failed(notification, err.message);
          }
          return of(err);
        })
      );
    }

    const updateFn = () => {
      // this.is_loading = false;
      this.isSaving = true;
      if (this.previousState !== JSON.stringify(request)) {
        this.previousState = JSON.stringify(request);

        if (this.saveSubscription) {
          this.saveSubscription.unsubscribe();
        }
        let notification: any;
        if (this.formsService.checkRoutes()) {
          notification = this.notificationsService.addNotification({
            title: `Saving field`
          });
        }

        if (this.formModel?.mediaId) {
          delete this.formModel.mediaId;
        }

        this.saveSubscription = this.formsService.updateForm(request, this.assetId).subscribe(
          () => {
            this.blockFields = false;
            this.isSaving = false;
            if (!quietUpdate) {
              this.loadExistingFormInfo();
            }
            this.savingError = '';
            this.changesSaved = true;
            if (this.formsService.checkRoutes()) {
              this.notificationsService.ok(notification, 'Form Updated');
            }
            this.loadExistingFormInfo();
            // this.loadMediaInfo();
            setTimeout(() => {
              this.formsService.isFieldsDisabled = false;
            }, 1000);
          },
          (err: any) => {
            this.blockFields = false;
            this.isSaving = false;
            this.changesSaved = false;
            this.showError('savingError', err.message);
            if (this.formsService.checkRoutes()) {
              this.notificationsService.failed(notification, err.message);
            }
          }
        );
      }
    };

    updateFn();
  }

  private saveWithoutRerender(): Observable<unknown> {
    if (Object.keys(this.pageData).length) {
      this.formModel!.pages = Array();
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      Object.values(tempPageData).map((item: any, index: any) => {
        if (!Object.keys(item?.schema?.properties).length) {
          delete tempPageData[index].schema?.properties;
        } else {
          Object.keys(item.schema.properties).map(key => {
            tempPageData[index].schema.properties[key].description = JSON.stringify(
              tempPageData[index].schema.properties[key].description
            );
          });
        }
        this.formModel?.pages?.push(item);
      });
    } else {
      this.formModel!.pages = Array();
    }

    this.blockFields = true;

    const request: any = {
      tag_id: this.title,
      description: this.description,
      pages: this.formModel?.pages
    };

    if (this.notifications) {
      request.notifications = this.notifications;
    }

    if (this.recipients.length) {
      request.recipients_ids = this.recipients;
    }

    if (this.recurring.rrule && this.recurring.rrule[0]) {
      request.rrule = this.recurring.rrule[0];
    }

    let notification: Notification;
    if (this.formsService.checkRoutes()) {
      notification = this.notificationsService.addNotification({
        title: `Saving field`
      });
    }
    if (this.formModel?.mediaId) {
      delete this.formModel.mediaId;
    }
    this.isSaving = true;

    return this.formsService.updateForm(request, this.assetId).pipe(
      tap(() => {
        this.blockFields = false;
        this.isSaving = false;
        if (this.formsService.checkRoutes()) {
          this.notificationsService.ok(notification, 'Form Updated');
        }
        this.formsService.isFieldsDisabled = false;
        this.savingError = '';
        this.changesSaved = true;
        if (this.formsService.checkRoutes()) {
          this.notificationsService.ok(notification, 'Form Updated');
        }
      }),
      catchError(err => {
        this.blockFields = false;
        this.isSaving = false;
        this.changesSaved = false;
        this.showError('savingError', err.message);
        if (this.formsService.checkRoutes()) {
          this.notificationsService.failed(notification, err.message);
        }
        return of(err);
      })
    );
  }

  toggleRecipient(event: any) {
    if (~this.recipients.indexOf(event.id)) {
      this.recipients.splice(this.recipients.indexOf(event.id), 1);
    } else {
      this.recipients.push(event.id);
    }
  }

  generateHours(min: number, max: number, mark: number) {
    const arr = [];

    for (let i = min; i <= max; i++) {
      arr.push(i + ':00' + mark);

      arr.push(i + ':30' + mark);
    }

    return arr;
  }

  selected(e: any, vr: any, parent: any) {
    if (!parent) {
      (this as any)[vr] = e.id;
    } else {
      (this as any)[parent][vr] = e.id;
    }
  }

  selectedMultiple(e: any, vr: any) {
    if (!this.editingField[vr]) {
      this.editingField[vr] = [];
    }

    this.editingField[vr].push(e.id);
  }

  removedFromMultiple(e: any, vr: any, parent: any) {
    if (!parent) {
      (this as any)[vr].splice((this as any)[vr].indexOf(e.id), 1);
    } else {
      (this as any)[parent][vr].splice((this as any)[parent][vr].indexOf(e.id), 1);
    }
  }

  createDropdownList(fl: any) {
    const enums = fl.items.enum;

    return enums
      ? enums.map((v: string) => {
          return {
            id: v,
            text: v
          };
        })
      : [];
  }

  /*
   * setTextAreaValue
   */
  setTextAreaValue(e: any, parent: any, t: any) {
    const vl = e.target.value;

    (this as any)[parent][t] = vl;
  }

  public textFieldTypeChanged(event: any) {
    if (this.ifNewField) {
      if (event.id === 'multi') {
        this.newFieldType = 'text-only';
      } else if (event.id === 'single') {
        this.newFieldType = 'text';
      }
      this.addField();
    } else {
      if (event.id === 'multi') {
        this.editingField.fieldType = 'text-only';
      } else if (event.id === 'single') {
        this.editingField.fieldType = 'text';
      }
    }
  }

  public removeConvertingPage = () => {
    if (this.convertingCount > 0) {
      this.convertingCount--;
      this.displayCount--;
      delete this.pageData[this.displayCount];
      this.docThumbnails.pop();
    }
  };

  // Add a new page for form file builder
  public addNewDocumentPage = (bgId = '', isConverting = false) => {
    if (isConverting) this.convertingCount++;
    this.shownPageOptionModal = false;
    this.displayCount++;
    this.pageData[this.displayCount - 1] = {
      schema: {
        type: 'object',
        properties: {}
      },
      ui_schema: {
        type: 'VerticalLayout',
        elements: []
      },
      background_id: bgId || '/images/fancybox/a4.png&&images/form-image-converting.svg'
    };
    const thumbnailSrc = bgId ? bgId.split('&&')[1] : 'images/form-image-converting.svg';
    this.docThumbnails = [...this.docThumbnails, thumbnailSrc];
    this.switchDocumentPage(this.activeDocPage || 0);
  };

  // Add field for form\sign builder
  public addField() {
    this.shownPageOptionModal = false;
    if (this.newFieldType === 'new-page') {
      this.shownPageOptionModal = true;
      this.activeDocPage = Object.keys(this.pageData).length + 1;
    } else {
      this.newProperty = this.generateNewPropertiesList();

      this.metaData[this.newProperty.name] = this.newProperty.meta_data;
      this.ifNewField = true;

      if (this.typesByField[this.newFieldType].pattern) {
        this.newProperty.pattern = this.typesByField[this.newFieldType].pattern;
      }

      if (this.typesByField[this.newFieldType].enum) {
        this.newProperty['enum'] = this.typesByField[this.newFieldType].enum;
        this.newProperty['items'] = { type: 'string', enum: this.typesByField[this.newFieldType].enum };
      }

      if (
        this.pageData[this.activeDocPage - 1]?.background_id &&
        this.pageData[this.activeDocPage - 1].background_id.split('&&')[0] === '/images/fancybox/a4.png'
      ) {
        this.newProperty.displayText = true;
      }

      this.editingField = this.utilsService.copy(this.newProperty);
      if (this.newFieldType === 'docs' || this.newFieldType === 'images') {
        this.newFieldType = 'new-page';
        this.shownPageOptionModal = true;
        this.activeDocPage = Object.keys(this.pageData).length + 1;
        return;
      }
      this.shownDefaultsModal = true;
    }
  }

  st = (jsn: any) => JSON.stringify(jsn, null, 2);

  showError(errorVariable: any, error: any) {
    if (this.errorDistionary.errorsDictionary) {
      (this as any)[errorVariable] = this.errorDistionary.errorsDictionary[error]
        ? this.errorDistionary.errorsDictionary[error]
        : error;
    } else {
      this.errorDistionary.loadErrors().subscribe(() => {
        (this as any)[errorVariable] = this.errorDistionary.errorsDictionary[error]
          ? this.errorDistionary.errorsDictionary[error]
          : error;
      });
    }
  }

  /**
   * loadExtesions - load supported files extensions for feeds
   * - needed to understand types of files that can be attached to feed
   */
  loadExtesions() {
    this.optionsService.getExtesions().subscribe((data: any) => {
      this.supportedExtensions = data;
      this.acceptAttribute = Object.keys(data.docs)
        .map(ext => '.' + ext)
        .join(',');
    });
  }

  /*
   * handleFileUpload - upload attached to new feed file
   * - runs automatically when file choosen
   */
  handleFileUpload(target: HTMLInputElement, staySameModal: boolean = false, isConverting: boolean = true) {
    if (staySameModal) {
      this.shownPageOptionModal = false;
    }

    if (this.convertingFiles.length) {
      this.shownDefaultsModal = false;
    }

    if (isConverting) {
      this.convertingFiles.push({ editingField: JSON.parse(JSON.stringify(this.editingField)) });
    }

    if (!target.files) return;

    const fileDataI = target.files[0];
    const mimeFType = fileDataI.type;
    const fileTypeN = mimeFType.split('/')[0] + 's';
    const extension = fileDataI.name.split('.').pop();
    let fileGroup = '';
    const docKeys = Object.keys(this.supportedExtensions['docs']);
    const imageKeys = Object.keys(this.supportedExtensions['images']);
    const tag_id = fileDataI.name.replace(/[^A-Za-z1-90-]/g, '-');
    let supported = false;
    docKeys.forEach(ext => {
      if (ext === extension) {
        fileGroup = 'docs';
        supported = true;
      }
    });
    imageKeys.forEach(ext => {
      if (ext === extension) {
        fileGroup = 'images';
        supported = true;
      }
    });

    if (!supported) {
      return alert('unsupported mediatype or extension list not loaded');
    }

    this.docData.execution_status = 'RUNNING';
    this.uploadingGoes = true;
    this.driveService
      .getUploadingRequestDataPrivate(fileGroup, extension, ModuleName.Assets, tag_id, this.assetId)
      .pipe(
        catchError(res => {
          this.uploadingGoes = false;
          this.changeDetector.detectChanges();
          return throwError(res.error);
        })
      )
      .subscribe(
        (res: any) => {
          const doc: AttachedDoc = {
            fileName: fileDataI.name,
            progress: 0,
            media: res.fields.key,
            src: ''
          };
          this.currentFileUploading = doc.fileName;
          const reader = new FileReader();

          reader.onloadend = () => {
            doc.src = reader.result as string;
          };

          if (fileDataI) {
            reader.readAsDataURL(fileDataI);
          } else {
            doc.src = '';
          }

          this.uploadProgress = '0%';

          this.amazonService.filetoAWSUpload(res, fileDataI).subscribe((resB: any) => {
            if (resB.type === 1) {
              const percentDone = Math.round((100 * resB['loaded']) / resB['total']);

              this.uploadProgress = percentDone + '%';
            } else if (resB.type === 2) {
              this.uploadProgress = '0%';
              this.uploadingGoes = false;
              target.value = '';
              doc.key = res.fields.key;
              this.convertingFiles[this.convertingFiles.length - 1].doc = { ...doc };
              this.changeDetector.detectChanges();
              if (this.convertingFiles.length === 1) {
                this.saveMedia('', doc).pipe(take(1)).subscribe();
              }
            }
          });
        },
        () => {
          this.uploadingGoes = false;
          this.changeDetector.tick();
          this.docData.execution_status = 'FAILED';
        }
      );
  }

  changePosition(e: any, fl: any) {
    fl.width = e.width;
    fl.height = e.height;
    fl.left = e.left;
    fl.top = e.top;
    if (this.draggingField !== null && this.draggingField?.key === fl.key) {
      if (this.draggingField?.childIndex !== undefined) {
        if (fl.childIndex !== undefined && this.draggingField.childIndex === fl.childIndex) {
          this.draggingField = { ...fl };
        }
      } else {
        this.draggingField = { ...fl };
      }
    }
    Object.values(this.pageData).map((item: any, index: any) => {
      Object.keys(item.schema.properties).map(key => {
        if (key === fl.key) {
          this.pageData[index].schema.properties[key].width = e.width;
          this.pageData[index].schema.properties[key].height = e.height;
          this.pageData[index].schema.properties[key].top = e.top;
          this.pageData[index].schema.properties[key].left = e.left;
          if (fl.childIndex !== undefined) {
            this.pageData[index].schema.properties[key].positions[fl.childIndex].width = e.width;
            this.pageData[index].schema.properties[key].positions[fl.childIndex].height = e.height;
            this.pageData[index].schema.properties[key].positions[fl.childIndex].top = e.top;
            this.pageData[index].schema.properties[key].positions[fl.childIndex].left = e.left;
          }
        }
      });
    });
  }

  sanitizedStyle(value: any, diff: any, min?: any) {
    const vl = value ? this.sanitizer.bypassSecurityTrustStyle(value + 'px') : min || 'auto';
    return vl;
  }

  // Switch next document page
  public nextDoc() {
    this.switchDocumentPage((this.activeDocPage || 0) + 1);
  }

  // Switch previous document page
  public previousDoc() {
    this.switchDocumentPage((this.activeDocPage === 1 ? this.activeDocPage + 1 : this.activeDocPage) - 1);
  }

  loadOpenedInformation() {
    this.route.params.subscribe((params: any) => {
      this.assetId = params['id'];

      if (this.assetId) {
        this.loading = true;
        this.loadExistingFormInfo();
      } else {
        this.loading = false;
      }
    });
  }

  loadExistingFormInfo() {
    const run = () => {
      this.blockFields = true;
      return this.formsService.getFormInfo(this.assetId).subscribe((form: IForm) => {
        this.formModel = form;

        this.designService.getCompanyInfo().subscribe((response: any) => {
          this.required_userfield = response.require_userfields || [];
          this.optionsService
            .userFields()
            .pipe(takeUntil(this.destroy$))
            .subscribe((userFields: any) => {
              this.required_field = this.required_userfield.map(userFieldKey => '${' + userFields[userFieldKey] + '}');
            });
        });

        this.userService
          .getAuthStatus()
          .pipe(takeUntil(this.destroy$))
          .subscribe((res: AuthStatus) => {
            this.realVariable = res.data;
          });
        this.optionsService
          .userFields()
          .pipe(takeUntil(this.destroy$))
          .subscribe((userFields: any) => {
            this.userField = userFields;
          });
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
          } else {
            this.shownPageOptionModal = true;
          }
          return returnPages;
        };

        const pageContent = pages();

        if (pageContent) {
          this.docThumbnails = [];
          Object.assign(this.pageData, pageContent);
          this.displayCount = pageContent.length || 0;
          pageContent.forEach(page => {
            const backgroundId = page.background_id || '';
            this.docThumbnails.push(backgroundId ? backgroundId.split('&&')[1] : 'images/form-image-converting.svg');
          });
        }
        if (Object.keys(pageContent).length) this.switchDocumentPage(this.activeDocPage || 1);

        this.properties = {};

        const schema = form.schema ? form.schema.schema : {};
        const properties = schema.properties || {};
        const metaData = form.schema ? form.schema.meta_data : {};

        this.formType = schema.type;

        Object.keys(properties).map(v => {
          if (v !== '$schema') {
            if (metaData && metaData[v]) {
              properties[v].meta_data = metaData[v];
              this.metaData[v] = metaData[v];
            } else {
              properties[v].meta_data = {};
            }

            const pageNumber = (this.metaData[v] && this.metaData[v].pageNumber) || 0;

            if (!this.properties[pageNumber]) {
              this.properties[pageNumber] = [];
            }

            properties[v].name = v;
            this.properties[pageNumber].push(properties[v]);
          }
        });

        this.title = form.tag_id;
        this.description = form.description;

        if (form.rrule) {
          this.recurring.rrule[0] = form.rrule;
          this.recurring.recurring = true;
        }

        this.activeRecepients = form.recipients_ids
          ? form.recipients_ids.map(rs => {
              return this.people.find(p => {
                return p.id === rs;
              });
            })
          : [];

        if (form.notifications) {
          this.notifications = form.notifications;
        }

        if (form.pages) {
          this.saveModel = this.loadDefaultAnswer(form.pages);
        }

        this.is_loading = true;
        this.loading = false;
        this.blockFields = false;
      });
    };

    this.subscribers.push(run());
  }

  private loadDefaultAnswer(pages: any): any {
    const result: any = {};
    pages.map((page: any) => {
      Object.keys(page.schema.properties).map(key => {
        let description = page.schema.properties[key].description;
        result[key] = description;
        if (page.schema.properties[key].fieldType === 'date' && description !== '') {
          result[key] = this.date.transform(String(description), 'YYYY-MM-dd');
        } else if (page.schema.properties[key].fieldType === 'time' && description !== '') {
          result[key] = this.timePipe.transform(String(description), true);
        }
      });
    });
    return result;
  }

  updateDocumentViewSizeDueToWindowWidth = () => {
    // const parentNode: any = document.querySelector('.document-image-wrapper');
    // if (parentNode) {
    //   const documentsListElWidthDiff = document.querySelector('.documents-list')['offsetWidth'] / 880;
    //   parentNode.style.zoom = documentsListElWidthDiff;
    // }
  };

  fetchEditedPages(metaData: any) {
    const numbers: any[] = [];

    Object.keys(metaData).map(key => {
      const pageNumber = +metaData[key].pageNumber;

      if (!~numbers.indexOf(pageNumber)) {
        numbers.push(pageNumber);
      }
    });

    return numbers;
  }

  // Switching page for document builder
  public switchDocumentPage(pageNumber: number) {
    if (pageNumber > this.displayCount) {
      this.activeDocPage = this.displayCount;
    } else if (pageNumber == 0) {
      this.activeDocPage = 1;
    } else {
      this.activeDocPage = pageNumber;
    }
    const bgId = this.pageData[this.activeDocPage - 1].background_id || '';
    this.documentLink = bgId ? bgId.split('&&')[0] : '/images/fancybox/a4.png';
    this.loading = false;
    setTimeout(() => this.formsService.refreshPinch());
    this.schemaList = this.getSchemaListFromUiList(this.activeDocPage);
  }

  formatInTimeZone(date: Date | string, fmt: string, tz: string) {
    return format(utcToZonedTime(date, tz), fmt, { timeZone: tz });
  }

  saveField() {
    this.isPreprareField = false;
    if (this.editingField.fieldType === 'time' && this.editingField.defaultValue) {
      this.editingField.defaultValue = this.formatInTimeZone(this.editingField.defaultValue, 'kk:mm:ssxxx', 'UTC');
    }

    if (!this.properties[this.activeDocPage]) {
      this.properties[this.activeDocPage] = [];
    }
    const field = JSON.parse(JSON.stringify(this.editingField));
    const activeProperties = this.properties[this.activeDocPage];

    const indexOf = activeProperties.indexOf(activeProperties.find((p: any) => p.name === this.editingField.name));
    const sameFieldList = Object.values(this.pageData[this.activeDocPage - 1].schema?.properties || {}).filter(
      (item: any) => item.key === this.editingField.key
    );
    if (!sameFieldList.length) {
      this.pageData[this.activeDocPage - 1].ui_schema.elements.push({
        scope: '#/properties/' + this.editingField.key,
        type: 'Control'
      });
      this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key] = {
        key: this.editingField.key,
        title: this.editingField.title,
        subText: this.editingField?.subText,
        type: this.editingField.type,
        fieldType: this.editingField.fieldType,
        format: this.editingField?.format || '',
        description: this.editingField.defaultValue ?? '',
        require: this.editingField?.require,
        readonly: this.editingField?.readonly,
        displayText: this.editingField.displayText
      };
      if (this.editingField?.top && this.editingField?.left) {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].top = this.editingField.top;
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].left = this.editingField.left;
      }
      if (this.editingField.fieldType === 'multidropdown' ||
      this.editingField?.fieldType === 'checkboxes' || this.editingField.fieldType === 'checkbox-options') {
        if (this.editingField.items.enum) {
          this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].items = {
            type: 'string',
            enum: this.editingField.items.enum
          };
        }
      } else {
        if (this.editingField.enum) {
          this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].enum = this.editingField.enum;
        }
      }
      const widthCoef = this.editingField?.displayText ? 0.2 : 0.05;
      const heightCoef = this._backgroundImage?.nativeElement.clientHeight * 0.075;
      if (this.editingField.fieldType === 'options') {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]['positions'] = new Array(
          this.editingField.enum.length
        )
          .fill(0)
          .map((item, index) => {
            return {
              top: parseInt(this.editingField?.top! || '100px') + index * heightCoef + 'px',
              left: this.editingField.left || '300px',
              width: this._backgroundImage?.nativeElement.clientWidth * widthCoef + 'px'
            };
          });
      }
      if (this.editingField.fieldType === 'checkbox-options') {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]['positions'] = new Array(
          this.editingField.items.enum.length
        )
          .fill(0)
          .map((item, index) => {
            return {
              top: parseInt(this.editingField?.top! || '100px') + index * heightCoef + 'px',
              left: this.editingField.left || '300px',
              width: this._backgroundImage?.nativeElement.clientWidth * widthCoef + 'px'
            };
          });
      }

      if (this.editingField.fieldType === 'table') {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].cols = [
          ...this.editingField.cols
        ];
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].rows = [
          ...this.editingField.rows
        ];
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].height =
          this.editingField.height;
      }
      if (this.typesByField[this.editingField.fieldType].format) {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].format =
          this.typesByField[this.editingField.fieldType].format;
      }
    } else {
      Object.values(this.pageData[this.activeDocPage - 1].schema.properties).map((item: any, index) => {
        if (item.key === this.editingField.key) {
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].description =
            this.editingField.defaultValue ?? '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].title = this.editingField.title;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].format = this.editingField?.format || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].subText = this.editingField?.subText || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].type = this.editingField.type;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].key = this.editingField.key;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].require = this.editingField.require;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].readonly = this.editingField?.readonly;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].fieldType = this.editingField.fieldType;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].displayText = this.editingField.displayText;
          const widthCoef = this.editingField?.displayText ? 0.2 : 0.05;
          const heightCoef = this._backgroundImage?.nativeElement.clientHeight * 0.075;
          const top = this.editingField.top.split('px')[0];
          if (
            this.editingField.fieldType === 'multidropdown' ||
            this.editingField.fieldType === 'checkboxes' ||
            this.editingField.fieldType === 'checkbox-options'
          ) {
            if (this.editingField.items.enum) {
              this.pageData[this.activeDocPage - 1].schema.properties[item.key].items = {
                type: 'string',
                enum: this.editingField.items.enum
              };
              if (
                this.editingField.fieldType === 'checkbox-options' &&
                !this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]?.['positions']
              ) {
                this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]['positions'] = new Array(
                  this.editingField.items.enum.length
                )
                  .fill(0)
                  .map((item, index) => {
                    return {
                      top: parseInt(this.editingField?.top!) + index * heightCoef + 'px',
                      left: this.editingField.left || '300px',
                      width: this._backgroundImage?.nativeElement.clientWidth * widthCoef + 'px'
                    };
                  });
              }
              if (
                this.editingField.fieldType === 'checkbox-options' &&
                this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]?.['positions']
              ) {
                if (
                  this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]?.['positions']
                    .length !== this.editingField.items.enum.length
                ) {
                  this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]['positions'] = [
                    ...this.editingField.positions
                  ];
                }
              }
            }
          } else {
            if (this.editingField.enum) {
              this.pageData[this.activeDocPage - 1].schema.properties[item.key].enum = this.editingField.enum;
              if (
                this.editingField.fieldType === 'options' &&
                !this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]?.['positions']
              ) {
                this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]['positions'] = new Array(
                  this.editingField.enum.length
                )
                  .fill(0)
                  .map((item, index) => {
                    return {
                      top: parseInt(this.editingField?.top!) + index * heightCoef + 'px',
                      left: this.editingField.left || '300px',
                      width: this._backgroundImage?.nativeElement.clientWidth * widthCoef + 'px'
                    };
                  });
              }
              if (
                this.editingField.fieldType === 'options' &&
                this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]?.['positions']
              ) {
                if (
                  this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]?.['positions']
                    .length !== this.editingField.enum.length
                ) {
                  this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key]['positions'] = [
                    ...this.editingField.positions
                  ];
                }
              }
            }
          }
          if (this.typesByField[this.editingField.fieldType].format) {
            this.pageData[this.activeDocPage - 1].schema.properties[item.key].format =
              this.typesByField[this.editingField.fieldType].format;
          }
          if (this.editingField.fieldType === 'table') {
            this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].cols = [
              ...this.editingField.cols
            ];
            this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].rows = [
              ...this.editingField.rows
            ];
            this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].height =
              this.editingField.height;
          }
        }
      });
    }
    // if (!this.formModel.field_participants) {
    //   this.formModel.field_participants = {};
    //   this.formModel.field_participants[this.editingField.name] = this.fieldParticipants;
    // } else {
    //   this.formModel.field_participants[this.editingField.name] = this.fieldParticipants;
    // }

    indexOf > -1 ? (activeProperties[indexOf] = this.editingField) : activeProperties.push(field);

    this.requiredChanged(this.editingField.require, this.editingField);
    this.save();
    this.refreshModal(false);
  }

  keys = (v: {[key: string]: string}) => Object.keys(v);

  public activateAddFieldPopUp() {
    this.editingField.fieldType = '';
    this.newFieldType = '';
    this.ifNewField = true;
    this.shownDefaultsModal = true;
  }

  disactivateAddFieldPopUp() {
    this.fieldForm.controls['title'].reset(null, { emitEvent: false });
    this.fieldForm.controls['fieldValue'].reset(null, { emitEvent: false });
    this.editingField = {};
    this.shownDefaultsModal = false;
    this.stylesService.popUpDisactivated();
    this.addFieldFormTouched = false;
    this.blockFields = false;
  }

  closeUpload() {
    this.router.navigate(['/library/forms']);
  }

  public handleResizing(isResizing: boolean): void {
    this.isResizing = isResizing;
  }

  onFieldTypeSelectChange({ id }: { id: string; text?: string }) {
    this.newFieldType = id;
    id === 'text-only' ? (this.insertFieldType = null) : (this.insertFieldType = id);
  }

  generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text' },
      { id: 'dropdown', text: 'Single Choice', element: 'Single Choice', hidden: false },
      { id: 'options', text: 'Single Choice', element: 'Single Choice', hidden: true },
      { id: 'list', text: 'List', element: 'Single Choice', hidden: true },
      { id: 'multidropdown', text: 'Multi Choice', element: 'Multi Choice' },
      { id: 'checkbox-options', text: 'Separated Checkboxes', element: 'Multi Choice', hidden: true },
      { id: 'date', text: 'Date', element: 'Date' },
      { id: 'time', text: 'Time', element: 'Time' },
      { id: 'number', text: 'Number', element: 'Number' },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text', hidden: true },
      { id: 'table', text: 'Table', element: 'Table', hidden: false },
      { id: 'new-page', text: 'New Page', element: 'New Page' },
      { id: 'signature-box', text: 'Signature Box', element: 'Signature Box' }
    ];
  }

  // Set default values for form
  public refreshModal(modalState: any): void {
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
    modalState ? (this.shownDefaultsModal = true) : (this.shownDefaultsModal = false);
    this.isSaving = false;
    this.currentFileUploading = null;
    this.docData['execution_status'] = '';
    this.editingField = null;
    this.addFieldFormTouched = false;
    this.blockFields = false;
    this.formIsValid = true;
  }

  public closeOptionModal(): void {
    this.shownPageOptionModal = false;
  }

  public previewFormChange(event: { key: string; value: string }): void {
    (Object.entries(this.pageData[this.activeDocPage - 1]?.schema?.properties) as any).forEach(
      ([propKey, propValue]: [string, { description: string | number; fieldType: string }]) => {
        Object.entries(event).forEach(([evKey, evValue]: [string, any]) => {
          if (propKey === evKey) {
            if (propValue.fieldType === 'date') {
              propValue.description = this.date.transform(String(evValue), 'YYYY-MM-dd')!;
            } else if (propValue.fieldType === 'time') {
              propValue.description = this.timePipe.transform(String(evValue), true);
            } else {
              propValue.description = evValue;
            }
          }
        });
      }
    );
    this.save();
  }

  public requiredChanged(e: any, fl: any) {
    let requiredList = this.pageData[this.activeDocPage - 1]?.schema?.required || [];
    if (e) {
      if (requiredList.indexOf(fl.key) == -1) requiredList = [...requiredList, fl.key];
    } else {
      if (requiredList.findIndex((key: string) => key === fl.key) != -1) {
        requiredList.splice(
          requiredList.findIndex((key: string) => key === fl.key),
          1
        );
      }
    }
    if (requiredList.length) {
      this.pageData[this.activeDocPage - 1].schema.required = requiredList;
    } else {
      delete this.pageData[this.activeDocPage - 1].schema.required;
    }
    this.save();
  }

  // Generate new properties list
  private generateNewPropertiesList() {
    const keyValue = this.generateRandomName(10);
    const fields = {
      type: this.typesByField[this.newFieldType].type,
      fieldType: this.newFieldType,
      title: '',
      subText: '',
      name: keyValue,
      key: keyValue,
      field_name: '',
      description: '',
      meta_data: { pageNumber: this.activeDocPage },
      pageNumber: this.activeDocPage,
      require: true,
      readonly: false,
      displayText: false,
      defaultValue: this.typesByField[this.newFieldType].defaultValue,
      rows: this.typesByField[this.newFieldType].rows,
      cols: this.typesByField[this.newFieldType].cols,
      format: '',
      height: this.typesByField[this.newFieldType].height
    };

    if (this.newFieldType !== 'table') {
      delete fields.rows;
      delete fields.cols;
    }

    if (this.newFieldType !== 'table' && this.newFieldType !== 'list') {
      delete fields.height;
    }

    return fields;
  }

  // Generate random name for fields
  private generateRandomName(digit: number) {
    return Math.random()
      .toString(36)
      .substring(2, digit + 2);
  }

  public preSave($event: any) {
    this.deselectDraggableItemField();
    if ($event?.target?.className !== 'icon-edit') {
      this.saveWithoutRerender().pipe(take(1)).subscribe();
    }
  }

  public deselectDraggableItemField(): void {
    this.draggingField = null;
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

  private getImageSrc(request: any): any {
    let mediaLink = `${this.privateCDN}${request.url_key
      .replace('${display_size}', request.width)
      .replace('${display_format}', request.ext)}`;
    if (~mediaLink.indexOf('${display_count}')) {
      mediaLink = mediaLink.replace('${display_count}', `${request.page}`);
    }
    return mediaLink;
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
      switch (item.fieldType) {
        case 'text':
          componentItem['type'] = 'textfield';
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
        case 'multidropdown':
          componentItem['type'] = 'select';
          componentItem['valueProperty'] = 'value';
          componentItem['multiple'] = true;
          componentItem['dataType'] = 'string';
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
          componentItem['defaultValue'] = this.date.transform(String(item.description), 'YYYY-MM-dd');
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

  public handleFieldMouseDown(fl: any): void {
    this.draggingField = fl;
  }

  public handlePinchMouseMoveEvent(event: any): void {
    const backgroundCoefTop = 800 / this._backgroundImage?.nativeElement.clientHeight;
    const backgroundCoefLeft = 565 / this._backgroundImage?.nativeElement.clientWidth;
    const myPinch = document.getElementById('myPinch');
    if (!myPinch) return;

    const top = (event.pageY - myPinch.getBoundingClientRect().y) / backgroundCoefTop;
    const left = (event.pageX - myPinch.getBoundingClientRect().x) / backgroundCoefLeft;
    this.prepareFieldValue.top = `${top}px`;
    this.prepareFieldValue.left = `${left}px`;
    this.prepareFieldValue.title = this.editingField?.title!;
    this.prepareFieldValue.subText = this.editingField?.subText!;
    if (this.editingField?.fieldType === 'text-only') {
      this.prepareFieldValue.fieldType = 'text-only';
    }

    const xLine = document.getElementById('xLine');
    const yLine = document.getElementById('yLine');
    if (xLine && yLine) {
      xLine.style.top = `${top}px`;
      yLine.style.left = `${left}px`;
    }
    if (this.draggingField !== null) {
      const curXLine = document.getElementById('curXLine');
      const curYLine = document.getElementById('curYLine');
      if (curXLine && curYLine) {
        const textSpans = event.target.closest('ca-draggable-field')?.querySelectorAll('.field-text');
        let spansHeight = 0;
        if (textSpans?.length) {
          spansHeight = [...textSpans].reduce((accum, span: HTMLSpanElement) => accum + span.clientHeight, 0);
        }
        
        curXLine.style.top = `${parseFloat(this.draggingField.top) + spansHeight}px`;
        curYLine.style.left = `${parseFloat(this.draggingField.left)}px`;
      }
    }
  }

  handlePinchMouseDownEvent(event: any): void {
    if (this.prepareFieldValue.fieldType === 'text-only') {
      this.addField();
      this.editingField!.left = this.prepareFieldValue.left;
      this.editingField!.top = this.prepareFieldValue.top;
      return;
    }
    const backgroundCoefTop = 800 / this._backgroundImage?.nativeElement.clientHeight;
    if (this.isPreprareField) {
      const textSpans = event.target.nextElementSibling?.querySelectorAll('.field-text');
      let spansHeight = 0;
      if (textSpans?.length) {
        spansHeight = [...textSpans].reduce((accum, span: HTMLSpanElement) => {
          if (span.innerText.length && this.editingField?.displayText) {
            return accum + span.clientHeight;
          }
          return accum;
        }, 0);
      }
      this.editingField!['top'] = +this.prepareFieldValue.top.split('px')[0] - spansHeight / backgroundCoefTop + 'px';
      this.editingField!['left'] = this.prepareFieldValue.left;
      this.saveField();
    }
  }

  public handleTextOnlyAdd() {
    this.newFieldType = 'text-only';
    this.newProperty = this.generateNewPropertiesList();
    this.ifNewField = true;
    this.isPreprareField = true;
    this.prepareFieldValue.fieldType = 'text-only';
  }

  public prepareField() {
    if (this.newFieldType === 'text-only') {
      this.saveField();
      this.prepareFieldValue.fieldType = 'text';
      return;
    }
    if (this.ifNewField) {
      this.isPreprareField = true;
      this.shownDefaultsModal = false;
    } else {
      this.saveField();
    }
  }

  private loadMediaInfo() {
    if (this.formModel?.asset_id) {
      return this.formsService.getFormInfo(this.formModel.asset_id).pipe(
        tap((res: FormInfo) => {
          this.mediaList = res?.media || {};
        })
      );
    }
  }

  public dropDownLayoutChanged(event: any) {
    if (this.ifNewField) {
      if (event.id === 'dropdown') {
        this.newFieldType = 'dropdown';
      } else if (event.id === 'list') {
        this.newFieldType = 'list';
      } else {
        this.newFieldType = 'options';
      }
      // this.addField();
      this.newProperty = this.generateNewPropertiesList();
      this.ifNewField = true;
      this.newProperty.enum = [...this.editingField.enum];
      this.newProperty.title = this.editingField.title;
      this.newProperty.subText = this.editingField.subText;
      this.newProperty.require = this.editingField.require;
      this.newProperty.readonly = this.editingField.readonly;
      this.newProperty.displayText = this.editingField.displayText;
      this.editingField = this.utilsService.copy(this.newProperty);
      this.shownDefaultsModal = true;
    } else {
      if (event.id === 'dropdown') {
        this.editingField.fieldType = 'dropdown';
      } else if (event.id === 'list') {
        this.editingField.fieldType = 'list';
      } else {
        this.editingField.fieldType = 'options';
      }
    }
  }

  public checkboxLayoutChanged(event: any) {
    if (this.ifNewField) {
      if (event.id === 'horizontal') {
        this.newFieldType = 'multidropdown';
        this.editingField.fieldType = 'multidropdown';
      } else if (event.id === 'checkbox-options') {
        this.newFieldType = 'checkbox-options';
        this.editingField.fieldType = 'checkbox-options';
      } else {
        this.newFieldType = 'checkboxes';
        this.editingField.fieldType = 'checkboxes';
      }
      // this.addField();
    } else {
      if (event.id === 'horizontal') {
        this.editingField.fieldType = 'multidropdown';
      } else if (event.id === 'checkbox-options') {
        this.editingField.fieldType = 'checkbox-options';
      } else {
        this.editingField.fieldType = 'checkboxes';
      }
    }
  }

  private checkMediaConvertingInProcess(): void {
    const storageFormModel = localStorage.getItem('form_model-' + this.assetId);
    if (!storageFormModel) return;
    const formModel = JSON.parse(storageFormModel).form_model;
    if (formModel.asset_id !== this.assetId) return;
    this.convertingFiles = JSON.parse(storageFormModel).converting_files;
    this.editingField = { ...this.convertingFiles[0].editingField };
    this.is_loading = false;
    this.shownPageOptionModal = false;
    this.shownDefaultsModal = false;
    this.saveMedia(this.convertingFiles[0].mediaId, this.convertingFiles[0].doc, true).pipe(take(1)).subscribe();
  }

  private saveMediaProcess(mediaId: string): Observable<SaveMedia | undefined> {
    if (this.assetId) {
      return this.formsService.getFormInfo(this.assetId).pipe(
        take(1),
        tap(() =>
          localStorage.setItem(
            'form_model-' + this.assetId,
            JSON.stringify({ form_model: { ...this.formModel }, converting_files: [...this.convertingFiles] })
          )
        ),
        switchMap((formModel: IForm) => {
          const document: any = this.generateDoc(formModel);
          if (document[mediaId]?.execution_status === 'SUCCEEDED') {
            const tempArr = new Array(document[mediaId].display_count).fill(0);
            tempArr.forEach((_, index) => {
              let thumbnailSrc = '/images/fancybox/a4.png';
              let backgroundSrc = '/images/fancybox/blank.gif';
              if (document[mediaId].display_start) {
                backgroundSrc = this.feedMediaS.getMediaSrc({
                  ext: document[mediaId].display_formats[0],
                  urlKey: document[mediaId].display_start,
                  width: Math.max.apply(Math, document[mediaId].display_sizes),
                  displayCount: index + 1
                });
                thumbnailSrc = this.feedMediaS.getMediaSrc({
                  ext: document[mediaId].display_formats[0],
                  urlKey: document[mediaId].display_start,
                  width: '90',
                  displayCount: index + 1
                });
              }
              if (this.convertingCount) this.removeConvertingPage();
              this.addNewDocumentPage(`${backgroundSrc}&&${thumbnailSrc}`);
            });
            this.isSaving = false;
            this.docData = {};
            this.refreshModal(false);
            localStorage.removeItem('form_model-' + this.assetId);
            this.convertingFiles.shift();
            if (this.convertingFiles.length) {
              return this.save(false, true).pipe(
                take(1),
                tap(() => {
                  this.editingField = { ...this.convertingFiles[0].editingField };
                }),
                switchMap(() => this.saveMedia('', this.convertingFiles[0].doc))
              );
            }
            return this.save(false, true);
          } else if (document[mediaId]?.execution_status !== 'FAILED') {
            if (!this.convertingCount) this.addNewDocumentPage('', true);
            if (!this.destroy) {
              return this.saveMedia(mediaId).pipe(take(1));
            }
          } else {
            this.isSaving = false;
            this.refreshModal(false);
            localStorage.removeItem('form_model-' + this.assetId);
            return this.save(false, true);
          }
        })
      );
    }
    return of(void 0);
  }

  private generateDoc(formModel: IForm): Object {
    let returnDoc: any = {};
    const media: any = formModel.media;
    if (typeof media === 'object') {
      for (const groupName in media) {
        if (media.hasOwnProperty(groupName)) {
          const group: any = media[groupName];
          if (typeof group === 'object') {
            for (const groupItemName in group) {
              if (group.hasOwnProperty(groupItemName)) {
                const item = group[groupItemName];
                if (item && typeof item === 'object' && Object.values(item).length) {
                  Object.values(item).forEach((_, index) => {
                    returnDoc[Object.keys(item)[index]] = Object.values(item)[index];
                  });
                }
              }
            }
          }
        }
      }
    }
    return returnDoc;
  }
}
