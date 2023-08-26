import { SrcRequest } from '../models/SrcRequest';
import { StylesService } from '../services/styles.service';
import { FormsService } from '../services/forms.service';
import { FeedMediaService, IAllowedFileSizes } from '../services/feed-media.service';
import { CasesService } from '../services/cases.service';
import { FeedsService } from '../services/feeds.service';
import { UserService } from '../services/user.service';
import { SignsService } from '../services/signs.service';
import { FormModel } from '../pages/forms/models/FormModel';
import { UtilsService } from '../services/utils.service';
import { OptionsService } from '../services/options.service';
import {
  PopInNotificationConnectorService,
  Notification
} from '../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { IFileToUpload } from '../pages/feeds/models/feed.model';
import { catchError, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { LocalTranslationService } from '../services/local-translation.service';
import { Subject, of, Observable } from 'rxjs';
import { TimePipe } from '../pipes/time.pipe';
import { DatePipe } from '@angular/common';
import { ElementRef } from '@angular/core';
import { format, utcToZonedTime } from 'date-fns-tz';
import { environment } from '../../environments/environment';
import { IUserFields } from '../interfaces/user.interface';
import { AttachedDoc } from './interfaces/attached-doc.interface';
import { SaveMedia } from './interfaces/save-media.interface';
import { FormInfo, Medias } from './interfaces/form-info.interface';

export class Person {
  id?: string;
  text?: string;
  role_id?: string;
}

class Field {
  format?: string;
  defaultValue?: string;
  fieldType?: string;
  index?: number;
  meta_data?: FieldMetaData;
  name?: string;
  displayText?: boolean;
  require?: boolean;
  readonly?: boolean;
  title?: string;
  subText?: string;
  type?: string;
  items?: any;
  enum?: any;
  top?: string;
  left?: string;
  key?: string;
  pageNumber?: number;
  rows?: string[][];
  cols?: string[];
  description?: string;
  height?: string;
  positions?: { top: string; left: string; width: string; height: string }[];
}

class FieldMetaData {
  diffX?: number;
  diffY?: number;
  fieldName?: string;
  height?: number;
  left?: string;
  top?: string;
  width?: number;
}

export class UploadFormBuilder {
  formModel: FormModel = new FormModel();
  form?: any;
  answer_ct = 0;
  loading = true;
  is_loading = true;
  currentFileUploading: string | null = null;
  properties: any = {};
  propertiesArray: any[] = [];
  people: Person[] = [];
  editOptionAction = false;
  editOptionIndex: any;
  newFieldType = '';
  saving = false;
  optionsLimitError = false;
  optionExistsError = false;
  fieldValue = '';
  shownDefaultsModal = false;
  shownPageOptionModal = false;
  ifNewField = true;
  editingField: Field | null = new Field();
  supportedExtensions: any;
  uploadingGoes = false;
  isSaving = false;
  blockFields = false;
  documentLink = '';
  metaData: any = {};
  saveModel: any = {};
  addFieldFormTouched = false;
  components = [];
  formTouched = false;
  displayCount?: any;
  activeDocPage = 0;
  stylesService: any;
  fieldsList?: any[];
  privateCDN = environment.PRIVATE_CDN_URL + '/';
  fieldParticipants?: string[];
  docData: any = {};
  optionsSupport: any = {
    dropdown: true,
    multidropdown: true,
    checkboxes: true,
    options: true,
    table: true,
    list: true,
    'checkbox-options': true
  };
  formIsValid?: boolean;
  participants: any = {};
  caseId = '';
  pageData: any = {};
  docThumbnails: string[] = [];
  unsubscribe$: Subject<void> = new Subject();
  required_userfield = [];
  required_field?: string[];
  realVariable?: any;
  userField?: IUserFields;
  isPreprareField = false;
  convertingCount = 0;
  prepareFieldValue = {
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
  defaultLayout = 'horizontal';
  layoutList = [
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
  defaultDropDownLayout = 'dropdown';
  dropDownLayoutList = [
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
  draggingField: any = null;

  protected contentMediaService: any;
  protected feedsMediaService: any;
  protected feedsService: any;
  protected changeDetector: any;
  protected sanitizer: any;
  protected route: any;
  protected router: any;
  protected builderService: any;
  protected casesService: any;
  protected userService: any;
  protected afterUpdateNavigation?: string;
  protected optionsService: any;
  protected timeoutId = null;
  protected formsService: FormsService;
  protected signsService: SignsService;
  protected utilsService: UtilsService;
  protected subscribers: any[] = [];
  protected typesByField: any = {};
  protected mediaList: Medias | {} = {};

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

  public _backgroundImage?: ElementRef;

  private acceptableFields: string[] = [];
  private newProperty: any = {};
  private allowedFileSizes?: IAllowedFileSizes;
  public destroy$ = new Subject<void>();
  public destroy: boolean = false;
  public convertingFiles: { editingField: Field; mediaId?: string; doc?: AttachedDoc }[] = [];
  public isResizing: boolean = false;

  get currentTime() {
    const currentTime = new Date().toLocaleTimeString();
    return currentTime.split(' ')[0].split(':');
  }

  constructor(
    public timePipe: TimePipe,
    public datePipe: DatePipe,
    private notificationsService: PopInNotificationConnectorService,
    private translationService: LocalTranslationService,
    stylesS: StylesService,
    formsS: FormsService,
    signsS: SignsService,
    contentMediaS: FeedMediaService,
    change?: any,
    sanitizer?: any,
    route?: any,
    router?: any,
    casesService?: CasesService,
    feedsService?: FeedsService,
    feedsMediaService?: FeedMediaService,
    userService?: UserService,
    utilsService?: UtilsService,
    optionsService?: OptionsService
  ) {
    this.stylesService = stylesS;
    this.formsService = formsS;
    this.signsService = signsS;
    this.contentMediaService = contentMediaS;
    this.feedsMediaService = feedsMediaService;
    this.feedsService = feedsService;
    this.changeDetector = change;
    this.sanitizer = sanitizer;
    this.route = route;
    this.router = router;
    this.casesService = casesService;
    this.userService = userService;
    this.utilsService = utilsService!;
    this.optionsService = optionsService;
  }

  // Initialization component for work with builder
  protected initializationComponents() {
    this.typesByField = this.utilsService.generateTypesByFields();
    this.acceptableFields = this.utilsService.generateAcceptableFields();
    this.fieldsList = this.generateFieldsList().filter(item => !item.hidden);

    this.casesService.getCaseId
      .pipe(
        take(1),
        tap((res: any) => (this.caseId = res['case_id'])),
        switchMap(() => {
          return this.loadExtesions();
        })
      )
      .subscribe();

    if (this.people.length) {
      this.runBuilder();
    } else {
      this.subscribers.push(
        this.userService.getTeamData
          .pipe(
            take(1),
            tap(() => this.runBuilder())
          )
          .subscribe((data: any) => {
            this.people = data.items.map((usr: any) => ({
              id: usr.user_id,
              text: `${usr.given_name} ${usr.family_name}`,
              role_id: usr.role_id
            }));
          })
      );
    }

    this.subscribers.push(
      this.userService.getCasePermissionsData.subscribe((data: any) => {
        if (data.role.file_size) {
          this.allowedFileSizes = data.role.file_size;
        }
      })
    );
  }

  // Check relevance builder
  protected runBuilder() {
    if (this.form) {
      this.formModel.form_id = this.form.form_id;
      this.loadExistingFormInfo();
    } else {
      this.route.params.subscribe((params: any) => {
        this.formModel.form_id = params['id'];

        if (this.formModel.form_id && this.caseId) {
          this.loading = true;
          this.loadExistingFormInfo();
        } else {
          this.loading = false;
        }
      });
    }
  }

  // Get extensions for documents
  private loadExtesions() {
    return this.contentMediaService.getExtesions().pipe(tap(data => (this.supportedExtensions = data)));
  }

  private loadMediaInfo() {
    if (!this.formModel.form_id) return;

    return this.builderService.getFormInfo(this.caseId, this.formModel.form_id).pipe(
      tap((res: FormInfo) => {
        this.mediaList = res?.media || {};
      })
    );
  }

  // Show builder information
  private loadExistingFormInfo() {
    if (this.formModel.form_id) {
      this.blockFields = true;
      this.userService.getPossibleVariable(this.caseId).subscribe((res: any) => {
        this.required_userfield = res.data.host.require_userfields;
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
        .subscribe((res: any) => {
          this.realVariable = res.data;
        });
      this.optionsService
        .userFields()
        .pipe(takeUntil(this.destroy$))
        .subscribe((userFields: any) => {
          this.userField = userFields;
        });
      this.subscribers.push(
        this.builderService.getFormInfo(this.caseId, this.formModel.form_id).subscribe((formModel: any) => {
          this.formModel.name = formModel.name;
          formModel.description !== undefined
            ? (this.formModel.description = formModel.description)
            : delete this.formModel.description;
          formModel.media_asset_id
            ? (this.formModel.media_asset_id = formModel.media_asset_id)
            : delete this.formModel.media_asset_id;
          formModel.notifications !== undefined
            ? (this.formModel.notifications = formModel.notifications)
            : delete this.formModel.notifications;
          formModel.permissions !== undefined
            ? (this.formModel.permissions = formModel.permissions)
            : delete this.formModel.permissions;
          formModel.participants_ids !== undefined
            ? (this.formModel.participants_ids = formModel.participants_ids)
            : delete this.formModel.participants_ids;
          formModel.field_participants !== undefined
            ? (this.formModel.field_participants = formModel.field_participants)
            : delete this.formModel.field_participants;
          this.formModel.duration.due_date = formModel.due_date;
          formModel.rrule ? (this.formModel.duration.rrule = formModel.rrule) : delete this.formModel.duration.rrule;
          this.formModel.type = formModel.type;
          this.formModel.published = formModel.published;
          this.formModel.pages_ct = formModel.pages_ct;
          if (
            this.afterUpdateNavigation === '/e-signs/' &&
            this.formModel.permissions &&
            this.formModel.permissions.length > 0
          ) {
            this.people = this.people.filter(p => this.formModel?.permissions!.indexOf(p.role_id!) >= 0);
          }
          const pages = () => {
            let returnPages = Array();
            const pages = formModel.pages;
            if (typeof pages == 'object' && formModel.pages_ct !== 0) {
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
          this.loading = false;
          this.is_loading = true;
          if (formModel.pages) {
            this.saveModel = this.loadDefaultAnswer(formModel.pages);
          }
          this.answer_ct = Object.keys(formModel.answers || {}).length;
          this.blockFields = !!formModel.answer_ct;
          this.checkMediaConvertingInProcess();
        })
      );
    } else {
      this.loading = false;
    }
  }

  private loadDefaultAnswer(pages: any): any {
    const result: any = {};
    pages.map((page: any) => {
      Object.keys(page.schema.properties).map(key => {
        let description = page.schema.properties[key].description;
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

  public handleChange(event: any): void {
    if (event?.changed?.value) {
      this.editingField!.defaultValue = event.changed.value;
      this.editingField!.description = event.changed.value;
      this.editingField!.title = this.htmltoText(event.changed.value);
    }
  }

  htmltoText(html: string): string {
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

  public togglePublished(form: any, flag: any) {
    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving form`
    });

    this.formsService.publishFormApi(this.caseId, form.form_id).pipe(
      take(1)
    ).subscribe(
        () => {
          this.notificationsService.ok(notification, 'Form Updated');
          this.router.navigate(['/forms']);
        },
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
            this.translationService
              .showError(err.error.error.message)
              .pipe(takeUntil(this.unsubscribe$))
              .subscribe(errorMessage => this.notificationsService.failed(notification, errorMessage));
          }
        }
      );
  }

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

  elementTrackBy(index: number, item: any) {
    return item.id;
  }

  // Prepeating for edit field
  public runFieldEditing(fl: any, index: number) {
    this.refreshModal(true);
    this.ifNewField = false;
    this.editingField = this.utilsService.copy(fl);
    this.editingField!.defaultValue = fl.description;
    if (fl.fieldType == 'time') {
      this.editingField!.defaultValue = this.timePipe.transform(String(fl.description), true);
    }
    this.defaultLayout = 'horizontal';
    if (fl.fieldType === 'checkboxes') {
      this.defaultLayout = 'vertical';
    }
    if (fl.fieldType === 'checkbox-options') {
      this.defaultLayout = 'checkbox-options';
    }
    this.defaultTextType = 'single';
    if (fl.fieldType === 'multi-text') {
      this.defaultTextType = 'multi';
    }
    this.defaultDropDownLayout = 'dropdown';
    if (fl.fieldType === 'options') {
      this.defaultDropDownLayout = 'options';
    }
    if (fl.fieldType === 'list') {
      this.defaultDropDownLayout = 'list';
    }
    this.editingField!.index = index;

    if (this.afterUpdateNavigation === '/e-signs/') {
      this.fieldParticipants = this.formModel.field_participants[this.editingField?.name!];
    }
  }

  public runFieldCopy(fl: any) {
    this.editingField = this.utilsService.copy(fl);
    this.editingField!.defaultValue = fl.description;
    this.editingField!.key = this.generateRandomName(10);
    let currentTop = +fl.top.split('px')[0];
    currentTop += +fl.height.split('px')[0];
    this.editingField!.top = currentTop + 2 + 'px';
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

  // Add option for field
  public addOption(event: any) {
    event.preventDefault();
    let canAdd = true;
    const limit = this.typesByField[this.editingField?.fieldType!].itemsToAddLimit;

    if (limit) {
      if (
        this.editingField?.fieldType === 'multidropdown' ||
        this.editingField?.fieldType === 'checkboxes' ||
        this.editingField?.fieldType === 'checkbox-options'
      ) {
        if (this.editingField.items.enum.length >= limit) {
          canAdd = false;
        } else {
          if (this.editingField?.enum?.length >= limit) {
            canAdd = false;
          }
        }
      }
    }
    if (canAdd) {
      if (
        this.editingField?.fieldType === 'multidropdown' ||
        this.editingField?.fieldType === 'checkboxes' ||
        this.editingField?.fieldType === 'checkbox-options'
      ) {
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
        if (this.editingField?.fieldType === 'table') {
          this.editingField.cols?.push(this.fieldValue);
          this.fieldValue = '';
          this.optionExistsError = false;
          return;
        }
        if (this.editingField?.enum.indexOf(this.fieldValue) === -1) {
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
        (this.editingField?.fieldType === 'checkbox-options' ||
        this.editingField?.fieldType === 'options') && this.editingField?.positions?.length
      ) {
        const heightCoef = this._backgroundImage?.nativeElement.clientHeight * 0.0375;
        const prevPosition = { ...this.editingField.positions?.[this.editingField.positions.length - 1] };
        const newPosition = { ...prevPosition, top: +prevPosition?.top!.split('px')[0] + heightCoef + 'px' };
        this.editingField.positions = [...(this.editingField.positions as any), { ...newPosition }];
      }
    } else {
      this.optionsLimitError = true;
    }
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

  public handleFieldMouseDown(fl: any) {
    this.draggingField = fl;
  }

  public saveMedia(mediaId = '', attachedDoc?: AttachedDoc, isAfterReload: boolean = false): Observable<SaveMedia> {
    if (attachedDoc?.media) {
      if (isAfterReload) {
        return this.saveMediaProcess(mediaId);
      }
      return this.builderService.postFormMedia(this.caseId, this.formModel.form_id, attachedDoc.media).pipe(
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

  // Saving builder changes
  public save(isConverting: boolean = false): Observable<unknown> {
    if (Object.keys(this.pageData).length) {
      this.formModel.pages = Array();
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      Object.values(tempPageData).map((item: any, index: any) => {
        if (!Object.keys(item?.schema?.properties).length) {
          delete tempPageData[index]?.schema.properties;
          delete item?.schema?.properties;
        } else {
          Object.keys(item.schema.properties).map(key => {
            tempPageData[index].schema.properties[key].description = JSON.stringify(
              tempPageData[index].schema.properties[key].description
            );
          });
        }
        if (this.afterUpdateNavigation === '/e-signs/') {
          item.participants = this.participants;
        }
        this.formModel?.pages?.push(item);
      });
    } else {
      this.formModel.pages = Array();
    }

    if (this.formModel.form_id) {
      this.is_loading = false;
      this.isSaving = true;

      let notification: Notification;

      if (this.formsService.checkRoutes()) {
        notification = this.notificationsService.addNotification({
          title: `Saving field`
        });
      }

      if (this.formModel.mediaId) {
        delete this.formModel.mediaId;
      }
      if (isConverting) {
        return this.builderService.updateForm(this.caseId, this.formModel, this.formModel.form_id).pipe(
          tap(() => {
            this.blockFields = false;
            this.isSaving = false;
            if (this.formsService.checkRoutes()) {
              this.notificationsService.ok(notification, 'Form Updated');
            }
            this.formsService.isFieldsDisabled = false;
          }),
          switchMap(() => {
            this.loadExistingFormInfo();
            return this.loadMediaInfo();
          }),
          catchError(err => {
            this.isSaving = false;

            if (this.formsService.checkRoutes()) {
              this.notificationsService.failed(notification, err.message);
            }
            return of(err);
          })
        );
      }

      this.builderService.updateForm(this.caseId, this.formModel, this.formModel.form_id).subscribe(
        () => {
          this.blockFields = false;
          this.isSaving = false;

          if (this.formsService.checkRoutes()) {
            this.notificationsService.ok(notification, 'Form Updated');
          }

          this.formsService.isFieldsDisabled = false;
          this.loadMediaInfo().pipe(take(1)).subscribe();
          this.loadExistingFormInfo();
        },
        (err: any) => {
          this.isSaving = false;

          if (this.formsService.checkRoutes()) {
            this.notificationsService.failed(notification, err.message);
          }
        }
      );
    }
    return of(void 0);
  }

  private saveWithoutRerender(): Observable<unknown> {
    if (Object.keys(this.pageData).length) {
      this.formModel.pages = Array();
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      Object.values(tempPageData).map((item: any, index: any) => {
        if (!Object.keys(item?.schema?.properties).length) {
          delete tempPageData[index]?.schema.properties;
          delete item?.schema?.properties;
        } else {
          Object.keys(item.schema.properties).map(key => {
            tempPageData[index].schema.properties[key].description = JSON.stringify(
              tempPageData[index].schema.properties[key].description
            );
          });
        }
        if (this.afterUpdateNavigation === '/e-signs/') {
          item.participants = this.participants;
        }
        this.formModel?.pages?.push(item);
      });
    } else {
      this.formModel.pages = Array();
    }

    if (this.formModel.form_id) {
      this.is_loading = false;
      this.isSaving = true;

      let notification: Notification;

      if (this.formsService.checkRoutes()) {
        notification = this.notificationsService.addNotification({
          title: `Saving field`
        });
      }

      if (this.formModel.mediaId) {
        delete this.formModel.mediaId;
      }
        return this.builderService.updateForm(this.caseId, this.formModel, this.formModel.form_id).pipe(
          tap(() => {
            this.blockFields = false;
            this.isSaving = false;
            if (this.formsService.checkRoutes()) {
              this.notificationsService.ok(notification, 'Form Updated');
            }
            this.formsService.isFieldsDisabled = false;
          }),
          catchError(err => {
            this.isSaving = false;
            this.blockFields = false;
            if (this.formsService.checkRoutes()) {
              this.notificationsService.failed(notification, err.message);
            }
            return of(err);
          })
        );
    }
    return of(void 0);
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

  public textFieldTypeChanged(event: any) {
    if (this.ifNewField) {
      if (event.id === 'multi') {
        this.newFieldType = 'multi-text';
      } else if (event.id === 'single') {
        this.newFieldType = 'text';
      }
      this.addField();
    } else {
      if (event.id === 'multi') {
        this.editingField!.fieldType = 'multi-text';
      } else if (event.id === 'single') {
        this.editingField!.fieldType = 'text';
      }
    }
  }

  public checkboxLayoutChanged(event: any) {
    if (this.ifNewField) {
      if (event.id === 'horizontal') {
        this.newFieldType = 'multidropdown';
        this.editingField!.fieldType = 'multidropdown';
      } else if (event.id === 'checkbox-options') {
        this.newFieldType = 'checkbox-options';
        this.editingField!.fieldType = 'checkbox-options';
      } else {
        this.newFieldType = 'checkboxes';
        this.editingField!.fieldType = 'checkboxes';
      }
      // this.addField();
    } else {
      if (event.id === 'horizontal') {
        this.editingField!.fieldType = 'multidropdown';
      } else if (event.id === 'checkbox-options') {
        this.editingField!.fieldType = 'checkbox-options';
      } else {
        this.editingField!.fieldType = 'checkboxes';
      }
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
      this.newProperty.enum = [...this.editingField?.enum];
      this.newProperty.title = this.editingField?.title;
      this.newProperty.subText = this.editingField?.subText;
      this.newProperty.require = this.editingField?.require;
      this.newProperty.readonly = this.editingField?.readonly;
      this.newProperty.displayText = this.editingField?.displayText;
      this.editingField = this.utilsService.copy(this.newProperty);
      this.shownDefaultsModal = true;
    } else {
      if (event.id === 'dropdown') {
        this.editingField!.fieldType = 'dropdown';
      } else if (event.id === 'list') {
        this.editingField!.fieldType = 'list';
      } else {
        this.editingField!.fieldType = 'options';
      }
    }
  }

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

  // Set option info in input field for options and activate botton for update too
  public editPropertyOption(ident: number): void {
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

  // Updating changed option
  public updateOption(event: Event): void {
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

  // Generate random name for fields
  private generateRandomName(digit: number) {
    return Math.random()
      .toString(36)
      .substring(2, digit + 2);
  }

  // Handling file upload
  public handleFileUpload(
    target: HTMLInputElement,
    staySameModal: boolean = false,
    isConverting: boolean = true
  ): void {
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
    const file: File = target.files[0];
    const fileSize = (Math.ceil(file.size / 100000) / 10).toFixed(1);
    const fileToUpload: IFileToUpload = {
      fileData: file,
      type: file.type.split('/')[0],
      extension: file.name.split('.').pop()!.toLowerCase(),
      fileGroup: ''
    };

    if (!this.checkFileExtension(fileToUpload)) {
      return alert('Unsupported file extension.');
    }

    if (+fileSize > this.allowedFileSizes![fileToUpload.fileGroup as keyof IAllowedFileSizes]) {
      this.notificationsService.addNotification({
        title: 'Entity Too Large',
        text: `Your proposed upload exceeds the maximum allowed size`,
        status: 'error',
        width: '430px'
      });
      target.value = '';
      return;
    }

    this.docData.execution_status = 'RUNNING';
    const tag_id = fileToUpload.fileData.name.replace(/[^A-Za-z1-90-]/g, '-');
    this.uploadingGoes = true;
    this.feedsService
      .getUploadParams(
        this.caseId,
        fileToUpload.fileGroup,
        fileToUpload.extension,
        this.afterUpdateNavigation === '/e-signs/' ? 'signs' : 'forms',
        this.formModel.form_id,
        tag_id
      )
      .subscribe(
        (res: any) => {
          const reader = new FileReader();
          const doc: AttachedDoc = {
            fileName: file.name,
            progress: 0,
            media: res.fields.key,
            src: ''
          };
          this.currentFileUploading = doc.fileName;
          reader.onloadend = () => {
            doc.src = reader.result as string;
          };

          if (file) {
            reader.readAsDataURL(file);
          } else {
            doc.src = '';
          }

          this.feedsService.filetoAWSUpload(res, file).subscribe((resB: any) => {
            if (resB.type === 1) {
              const percentDone = Math.round((100 * resB['loaded']) / resB['total']);
            } else if (resB.type === 2) {
              this.uploadingGoes = false;
              target.value = '';

              doc.key = res.fields.key;
              this.convertingFiles[this.convertingFiles.length - 1].doc = { ...doc };
              this.changeDetector.tick();
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

  public closeUpload() {
    this.router.navigate(['/forms'], { queryParams: { tab: 'published' } });
  }

  public handleResizing(isResizing: boolean): void {
    this.isResizing = isResizing;
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

  // Change field position
  public changePosition(e: any, fl: any) {
    if (this.draggingField !== null && this.draggingField.key === fl.key) {
      if (this.draggingField?.childIndex !== undefined) {
        if (fl.childIndex !== undefined && this.draggingField.childIndex === fl.childIndex) {
          this.draggingField = fl;
        }
      } else {
        this.draggingField = fl;
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

  // Saving styles for angular
  public sanitizedStyle(value: any, min?: any) {
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

  // Check builder on count pages
  public fetchEditedPages(metaData: any) {
    const numbers: number[] = [];

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
    const bgId = this.pageData[this.activeDocPage - 1]?.background_id || '';
    this.documentLink = bgId ? bgId.split('&&')[0] : '/images/fancybox/a4.png';
    this.loading = false;
    setTimeout(() => this.formsService.refreshPinch());
  }

  checkEditingFieldValidation() {
    let retValue = false;
    if (this.editingField?.fieldType !== 'text-only') {
      retValue = !this.fieldParticipants?.length || !this.editingField?.title;
    } else {
      retValue = !this.fieldParticipants?.length;
    }
    return retValue;
  }

  formatInTimeZone(date: Date | string, fmt: string, tz: string) {
    return format(utcToZonedTime(date, tz), fmt, { timeZone: tz });
  }

  handlePinchMouseMoveEvent(event: any): void {
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

  // Saving field
  public saveField() {
    this.isPreprareField = false;
    if (this.editingField?.fieldType === 'time' && this.editingField?.defaultValue) {
      this.editingField.defaultValue = this.formatInTimeZone(this.editingField.defaultValue, 'kk:mm:ssxxx', 'UTC');
    }

    if (!this.properties[this.activeDocPage]) {
      this.properties[this.activeDocPage] = [];
    }
    this.participants[this.editingField?.key!] = { users: this.fieldParticipants };
    const field = JSON.parse(JSON.stringify(this.editingField));
    const activeProperties = this.properties[this.activeDocPage];

    const indexOf = activeProperties.indexOf(activeProperties.find((p: any) => p.name === this.editingField?.name));
    const sameFieldList = Object.values(this.pageData[this.activeDocPage - 1]?.schema?.properties || {}).filter(
      (item: any) => item.key === this.editingField?.key
    );
    if (!sameFieldList.length) {
      this.pageData[this.activeDocPage - 1].ui_schema.elements.push({
        scope: '#/properties/' + this.editingField?.key,
        type: 'Control'
      });
      this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!] = {
        key: this.editingField?.key,
        title: this.editingField?.title,
        subText: this.editingField?.subText,
        type: this.editingField?.type,
        fieldType: this.editingField?.fieldType,
        description: this.editingField?.defaultValue ?? '',
        format: this.editingField?.format || '',
        require: this.editingField?.require,
        readonly: this.editingField?.readonly,
        displayText: this.editingField?.displayText
      };
      if (this.editingField?.top && this.editingField?.left) {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].top = this.editingField.top;
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].left = this.editingField.left;
      }
      if (
        this.editingField?.fieldType === 'multidropdown' ||
        this.editingField?.fieldType === 'checkboxes' ||
        this.editingField?.fieldType === 'checkbox-options'
      ) {
        if (this.editingField.items.enum) {
          this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].items = {
            type: 'string',
            enum: this.editingField.items.enum
          };
        }
      } else {
        if (this.editingField?.enum) {
          this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].enum = this.editingField.enum;
        }
      }
      const widthCoef = this.editingField?.displayText ? 0.2 : 0.05;
      const heightCoef = this._backgroundImage?.nativeElement.clientHeight * 0.075;
      if (this.editingField?.fieldType === 'options') {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]['positions'] = new Array(
          this.editingField.enum.length
        )
          .fill(0)
          .map((item, index) => {
            return {
              top: parseInt(this.editingField?.top!) + index * heightCoef + 'px',
              left: this.editingField?.left || '300px',
              width: this._backgroundImage?.nativeElement.clientWidth * widthCoef + 'px'
            };
          });
      }
      if (this.editingField?.fieldType === 'checkbox-options') {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]['positions'] = new Array(
          this.editingField.items.enum.length
        )
          .fill(0)
          .map((item, index) => {
            return {
              top: parseInt(this.editingField?.top!) + index * heightCoef + 'px',
              left: this.editingField?.left || '300px',
              width: this._backgroundImage?.nativeElement.clientWidth * widthCoef + 'px'
            };
          });
      }

      if (this.editingField?.fieldType === 'table') {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].cols = [
          ...this.editingField.cols!
        ];
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].rows = [
          ...this.editingField.rows!
        ];
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].height =
          this.editingField.height;
      }

      if (this.editingField?.fieldType === 'list') {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].height =
          this.editingField.height;
      }
      if (this.typesByField[this.editingField?.fieldType!].format) {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].format =
          this.typesByField[this.editingField?.fieldType!].format;
      }
    } else {
      Object.values(this.pageData[this.activeDocPage - 1].schema.properties).map((item: any, index) => {
        if (item.key === this.editingField?.key) {
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].description =
            this.editingField?.defaultValue ?? '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].format = this.editingField?.format || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].title = this.editingField?.title;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].subText = this.editingField?.subText || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].type = this.editingField?.type;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].key = this.editingField?.key;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].require = this.editingField?.require;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].readonly = this.editingField?.readonly;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].displayText = this.editingField?.displayText;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].fieldType = this.editingField?.fieldType;
          const widthCoef = this.editingField?.displayText ? 0.2 : 0.05;
          const heightCoef = this._backgroundImage?.nativeElement.clientHeight * 0.075;
          if (
            this.editingField?.fieldType === 'multidropdown' ||
            this.editingField?.fieldType === 'checkboxes' ||
            this.editingField?.fieldType === 'checkbox-options'
          ) {
            if (this.editingField.items.enum) {
              this.pageData[this.activeDocPage - 1].schema.properties[item.key].items = {
                type: 'string',
                enum: this.editingField.items.enum
              };
              if (
                this.editingField.fieldType === 'checkbox-options' &&
                !this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]?.['positions']
              ) {
                this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]['positions'] = new Array(
                  this.editingField.items.enum.length
                )
                  .fill(0)
                  .map((item, index) => {
                    return {
                      top: parseInt(this.editingField?.top!) + index * heightCoef + 'px',
                      left: this.editingField?.left || '300px',
                      width: this._backgroundImage?.nativeElement.clientWidth * widthCoef + 'px'
                    };
                  });
              }
              if (
                this.editingField.fieldType === 'checkbox-options' &&
                this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]?.['positions']
              ) {
                if (
                  this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]?.['positions']
                    .length !== this.editingField.items.enum.length
                ) {
                  this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]['positions'] = [
                    ...this.editingField?.positions!
                  ];
                }
              }
            }
          } else {
            if (this.editingField?.enum) {
              this.pageData[this.activeDocPage - 1].schema.properties[item.key].enum = this.editingField.enum;
              if (
                this.editingField.fieldType === 'options' &&
                !this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]?.['positions']
              ) {
                this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]['positions'] = new Array(
                  this.editingField.enum.length
                )
                  .fill(0)
                  .map((item, index) => {
                    return {
                      top: parseInt(this.editingField?.top!) + index * heightCoef + 'px',
                      left: this.editingField?.left || '300px',
                      width: this._backgroundImage?.nativeElement.clientWidth * widthCoef + 'px'
                    };
                  });
              }
              if (
                this.editingField.fieldType === 'options' &&
                this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]?.['positions']
              ) {
                if (
                  this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]?.['positions']
                    .length !== this.editingField.enum.length
                ) {
                  this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!]['positions'] = [
                    ...this.editingField?.positions!
                  ];
                }
              }
            }
          }
          if (this.typesByField[this.editingField?.fieldType!].format) {
            this.pageData[this.activeDocPage - 1].schema.properties[item.key].format =
              this.typesByField[this.editingField?.fieldType!].format;
          }
          if (this.editingField?.fieldType === 'table') {
            this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].cols = [
              ...this.editingField.cols!
            ];
            this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].rows = [
              ...this.editingField.rows!
            ];
            this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].height =
              this.editingField.height;
          }
          if (this.editingField?.fieldType === 'list') {
            this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].height =
              this.editingField.height;
          }
        }
      });
    }
    if (!this.formModel.field_participants) {
      this.formModel.field_participants = {};
      this.formModel.field_participants[this.editingField?.name!] = this.fieldParticipants;
    } else {
      this.formModel.field_participants[this.editingField?.name!] = this.fieldParticipants;
    }

    indexOf > -1 ? (activeProperties[indexOf] = this.editingField) : activeProperties.push(field);

    if (this.metaData[field.name]) {
      Object.assign(this.metaData[field.name], field.meta_data);
    }
    this.requiredChanged(this.editingField?.require, this.editingField);
    this.save();
    this.refreshModal(false);
  }

  // Checking object keys
  public checkObjectKeys = (v: {[key: string]: any}) => Object.keys(v);
  public checkObjectValues = (v: {[key: string]: any}) => Object.values(v);

  // Set default values for form
  public refreshModal(modalState: any): void {
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
    modalState ? (this.shownDefaultsModal = true) : (this.shownDefaultsModal = false);
    this.currentFileUploading = null;
    this.isSaving = false;
    this.docData['execution_status'] = '';
    this.fieldParticipants = undefined;
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
              propValue.description = this.datePipe.transform(String(evValue), 'YYYY-MM-dd')!;
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

  private generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text', hidden: false },
      { id: 'multi-text', text: 'Multi Text', element: 'Multi Text', hidden: true },
      { id: 'dropdown', text: 'Single Choice', element: 'Single Choice', hidden: false },
      { id: 'options', text: 'Single Choice', element: 'Single Choice', hidden: true },
      { id: 'list', text: 'List', element: 'Single Choice', hidden: true },
      { id: 'multidropdown', text: 'Multi Choice', element: 'Multi Choice', hidden: false },
      { id: 'checkboxes', text: 'Multi Choice', element: 'Multi Choice', hidden: true },
      { id: 'checkbox-options', text: 'Separated Checkboxes', element: 'Multi Choice', hidden: true },
      { id: 'date', text: 'Date', element: 'Date', hidden: false },
      { id: 'time', text: 'Time', element: 'Time', hidden: false },
      { id: 'number', text: 'Number', element: 'Number', hidden: false },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text', hidden: true },
      { id: 'table', text: 'Table', element: 'Table', hidden: false },
      { id: 'new-page', text: 'New Page', element: 'New Page', hidden: false },
      { id: 'signature-box', text: 'Signature Box', element: 'Signature Box', hidden: false }
    ];
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

    if (this.newFieldType == 'image') {
      fields.require = false;
    }

    return fields;
  }

  private checkMediaConvertingInProcess(): void {
    if (!localStorage.getItem('form_model-' + this.formModel.form_id)) return;

    const formModel = JSON.parse(localStorage.getItem('form_model-' + this.formModel.form_id)!).form_model;
    if (formModel.form_id !== this.formModel.form_id) return;

    this.convertingFiles = JSON.parse(localStorage.getItem('form_model-' + this.formModel.form_id)!).converting_files;
    this.is_loading = false;
    this.shownPageOptionModal = false;
    this.shownDefaultsModal = false;
    this.saveMedia(this.convertingFiles[0].mediaId, this.convertingFiles[0].doc, true).pipe(take(1)).subscribe();
  }

  private saveMediaProcess(mediaId: string): Observable<SaveMedia> {
    if (!this.formModel.form_id) return of();

    return this.builderService.getFormInfo(this.caseId, this.formModel.form_id).pipe(
      take(1),
      tap(() =>
        localStorage.setItem(
          'form_model-' + this.formModel.form_id,
          JSON.stringify({ form_model: { ...this.formModel }, converting_files: [...this.convertingFiles] })
        )
      ),
      switchMap((formModel: FormModel) => {
        const document: any = this.generateDoc(formModel);
        if (document[mediaId]?.execution_status === 'SUCCEEDED') {
          const tempArr = new Array(document[mediaId].display_count).fill(0);
          tempArr.forEach((_, index) => {
            let thumbnailSrc = '/images/fancybox/a4.png';
            let backgroundSrc = '/images/fancybox/blank.gif';
            if (document[mediaId].display_start) {
              backgroundSrc = this.feedsMediaService.getFormMediaSrc(
                {
                  ext: document[mediaId].display_formats[0],
                  url_key: document[mediaId].display_start,
                  height: '0',
                  width: Math.max.apply(null, document[mediaId].display_sizes)
                },
                index + 1
              );
              thumbnailSrc = this.feedsMediaService.getMediaSrc({
                ext: document[mediaId].display_formats[0],
                url_key: document[mediaId].display_start,
                height: '0',
                width: '90',
                page: index + 1
              });
            }
            if (this.convertingCount) this.removeConvertingPage();
            this.addNewDocumentPage(`${backgroundSrc}&&${thumbnailSrc}`);
          });
          this.isSaving = false;
          this.docData = {};
          this.refreshModal(false);
          localStorage.removeItem('form_model-' + this.formModel.form_id);
          this.convertingFiles.shift();
          if (this.convertingFiles.length) {
            return this.save(true).pipe(
              take(1),
              tap(() => {
                this.editingField = { ...this.convertingFiles[0].editingField };
              }),
              switchMap(() => this.saveMedia('', this.convertingFiles[0].doc))
            );
          }
          return this.save(true);
        } else if (document[mediaId]?.execution_status !== 'FAILED') {
          if (!this.convertingCount) this.addNewDocumentPage('', true);
          if (!this.destroy) {
            return this.saveMedia(mediaId).pipe(take(1));
          }
          return of(void 0);
        } else {
          this.isSaving = false;
          this.refreshModal(false);
          localStorage.removeItem('form_model-' + this.formModel.form_id);
          return this.save(true);
        }
      })
    );
  }

  private generateDoc(formModel: FormModel): Object {
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
