import { DatePipe } from '@angular/common';
import { format, utcToZonedTime } from 'date-fns-tz';

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
  Notification,
  PopInNotificationConnectorService
} from '../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { IFileToUpload } from '../pages/feeds/models/feed.model';
import { TimePipe } from '../pipes/time.pipe';
import { SrcRequest } from '../models/SrcRequest';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { LocalTranslationService } from '../services/local-translation.service';

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
  require?: boolean;
  readonly?: boolean;
  title?: string;
  type?: string;
  items?: any;
  enum?: any;
  top?: number;
  key?: string;
  pageNumber?: number;
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

export class FormBuilder {
  formModel: FormModel | null = new FormModel();
  form?:any;
  answer_ct = 0;
  answers: any = {};
  submission: any = {};
  userId = '';
  loading = true;
  documentKey = '';
  attachedDoc: any = null;
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
  ifNewField = true;
  editingField: Field | null = new Field();
  supportedExtensions: any;
  uploadingGoes = false;
  blockFields = false;
  metaData: any = {};
  saveModel: any = {};
  addFieldFormTouched = false;
  activeSidebarTab = 1;
  formTouched = false;
  displayCount?: any;
  activeDocPage = 0;
  pagelength = true;
  stylesService: any;
  fieldsList?: any[];
  fieldParticipants?: string[] | null;
  docData: any = {};
  pageData: any = {};
  optionsSupport: any = {
    dropdown: true,
    multidropdown: true,
    checkboxes: true,
    options: true
  };
  caseId = '';
  docThumbnails: string[] = [];
  fieldPositionList: string[] = [];
  addFieldTitle: string = '';
  formIsValid?: boolean;
  components?: any;
  privateCDN = environment.PRIVATE_CDN_URL + '/';
  unsubscribe$: Subject<void> = new Subject();
  isSaving = false;
  required_userfield = [];
  required_field?: string[];
  optionsService;
  // any;
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
      name: 'Horizontal'
    },
    {
      id: 'vertical',
      name: 'Vertical'
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
  protected timeoutId = null;
  protected formsService: FormsService;
  protected signsService: SignsService;
  protected utilsService: UtilsService;
  protected subscribers: any[] = [];
  protected typesByField: any = {};
  protected mediaList: any[] = [];

  private acceptableFields: string[] = [];
  private newProperty: any = {};
  private allowedFileSizes?: IAllowedFileSizes;
  private destroy$ = new Subject<void>();

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

    this.casesService.getCaseId.subscribe((res: any) => {
      this.caseId = res['case_id'];

      if (this.caseId) {
        this.loadExtesions();
      }
    });

    if (this.people.length) {
      this.runBuilder();
    } else {
      this.subscribers.push(
        this.userService.getTeamData.subscribe((data: any) => {
          this.people = data.items.map((usr: any) => ({
            id: usr.user_id,
            text: `${usr.given_name} ${usr.family_name}`,
            role_id: usr.role_id
          }));

          this.runBuilder();
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
      this.formModel!.form_id = this.form.form_id;
      this.loadExistingFormInfo();
    } else {
      this.route.params.subscribe((params: any) => {
        this.formModel!.form_id = params['id'];
        this.userId = params['userId'] || '';

        if (this.formModel?.form_id && this.caseId) {
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
    this.contentMediaService.getExtesions().subscribe((data: any) => (this.supportedExtensions = data));
  }

  private async loadMediaInfo() {
    if (this.formModel?.form_id) {
      const res = await this.builderService.getFormInfo(this.caseId, this.formModel.form_id).toPromise();
      this.mediaList = res?.media || {};
    }
  }

  // Show builder information
  private loadExistingFormInfo() {
    if (this.formModel?.form_id) {
      this.blockFields = true;
      this.userService.getPossibleVariable(this.caseId).subscribe((res: any) => {
        this.required_userfield = res.data.host.require_userfields;
        this.optionsService
          ?.userFields()
          .pipe(takeUntil(this.destroy$))
          .subscribe(userFields => {
            this.required_field = this.required_userfield.map(userFieldKey => '${' + userFields[userFieldKey] + '}');
          });
      });
      this.subscribers.push(
        this.builderService.getFormInfo(this.caseId, this.formModel.form_id).subscribe((formModel: any) => {
          this.formModel!.name = formModel.name;
          this.mediaList = formModel.media;
          formModel.description !== undefined
            ? (this.formModel!.description = formModel.description)
            : delete this.formModel!.description;
          formModel.media_asset_id
            ? (this.formModel!.media_asset_id = formModel.media_asset_id)
            : delete this.formModel!.media_asset_id;
          formModel.notifications !== undefined
            ? (this.formModel!.notifications = formModel.notifications)
            : delete this.formModel!.notifications;
          formModel.permissions !== undefined
            ? (this.formModel!.permissions = formModel.permissions)
            : delete this.formModel?.permissions;
          formModel.participants_ids !== undefined
            ? (this.formModel!.participants_ids = formModel.participants_ids)
            : delete this.formModel!.participants_ids;
          formModel.field_participants !== undefined
            ? (this.formModel!.field_participants = formModel.field_participants)
            : delete this.formModel!.field_participants;
          this.formModel!.duration.due_date = formModel.due_date;
          formModel.rrule ? (this.formModel!.duration.rrule = formModel.rrule) : delete this.formModel?.duration.rrule;
          this.formModel!.type = formModel.type;
          this.formModel!.published = formModel.published;
          this.formModel!.pages_ct = formModel.pages_ct;

          if (
            this.afterUpdateNavigation === '/e-signs/' &&
            this.formModel?.permissions &&
            this.formModel?.permissions.length > 0
          ) {
            this.people = this.people.filter(p => this.formModel!.permissions!.indexOf(p.role_id!) >= 0);
          }
          const pages = () => {
            let returnPages = Array();
            const pages = formModel.pages;
            if (typeof pages == 'object' && formModel.pages_ct !== 0) {
              Object.values(pages).map((item: any, index: any) => {
                Object.keys(item.schema.properties).map(key => {
                  if (item.schema.properties[key].description) {
                    pages[index].schema.properties[key].description = JSON.parse(
                      item.schema.properties[key].description || ''
                    );
                  }
                });
              });
              returnPages = pages;
            } else if (formModel.pages_ct === 0) {
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
            pageContent.forEach(() => {
              const thumbnailSrc = '/images/fancybox/blank.gif';
              this.docThumbnails.push(thumbnailSrc);
            });

            this.switchDocumentPage(1);
          }
          this.loading = false;
          this.answer_ct = Object.keys(formModel.answers || {}).length;
          this.answers = formModel.answers || {};
          this.loadUserAnswer(this.answers);
          this.blockFields = !!formModel.answer_ct;
        })
      );
    } else {
      this.loading = false;
    }
  }

  togglePublished(form: any, flag: any) {
    const published = flag ? 1 : 0;
    const notification: Notification = this.notificationsService.addNotification({
      title: `Saving form`
    });

    this.formsService
      .updateForm(this.caseId, { ...form, published }, form.form_id)
      .pipe()
      .subscribe(
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

  public loadUserAnswer(answers: any) {
    const answer = answers[(Object.keys(answers) as any).find((user_id: any) => user_id === this.userId)];
    Object.assign(this.submission, answer && answer.page_answers[0]);
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
    this.defaultTextType = 'single';
    if (fl.fieldType === 'multi-text') {
      this.defaultTextType = 'multi';
    }
    this.defaultDropDownLayout = 'dropdown';
    if (fl.fieldType === 'options') {
      this.defaultDropDownLayout = 'options';
    }
    this.editingField!.index = index;

    if (this.afterUpdateNavigation === '/e-signs/') {
      this.fieldParticipants = this.formModel?.field_participants[this.editingField!.name!];
    }
  }

  public runFieldCopy(fl: any) {
    this.editingField = this.utilsService.copy(fl);
    this.editingField!.defaultValue = fl.description;
    this.editingField!.key = this.generateRandomName(10);
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
  public deletePropertyOption(ind: number) {
    if (this.editingField?.fieldType === 'multidropdown' || this.editingField?.fieldType === 'checkboxes') {
      this.editingField.items.enum.splice(ind, 1);
      this.editingField.items.enum = this.editingField.items.enum.slice();
    } else {
      this.editingField?.enum.splice(ind, 1);
      this.editingField!.enum = this.editingField?.enum.slice();
    }
  }

  // Add option for field
  public addOption(event: any) {
    event.preventDefault();
    let canAdd = true;
    const limit = this.typesByField[this.editingField?.fieldType!].itemsToAddLimit;

    if (limit) {
      if (this.editingField?.fieldType === 'multidropdown' || this.editingField?.fieldType === 'checkboxes') {
        if (this.editingField.items.enum.length >= limit) {
          canAdd = false;
        } else {
          if (this.editingField.enum.length >= limit) {
            canAdd = false;
          }
        }
      }
    }

    if (canAdd) {
      if (this.editingField?.fieldType === 'multidropdown' || this.editingField?.fieldType === 'checkboxes') {
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
    } else {
      this.optionsLimitError = true;
    }
  }

  // Saving builder changes
  public async save() {
    if (this.answer_ct) {
      return;
    }

    Object.values(this.pageData).map((item: any, index: any) => {
      if (!item?.ui_schema?.elements?.length) {
        delete this.pageData[index];
      }
    });
    this.displayCount = Object.values(this.pageData).length || 1;

    if (this.attachedDoc?.media) {
      try {
        const res = await this.builderService
          .postFormMedia(this.caseId, this.formModel?.form_id, this.attachedDoc?.media)
          .toPromise();
        const notification: Notification = this.notificationsService.addNotification({
          title: 'Saving'
        });
        this.notificationsService.ok(notification, 'Saved');
        const mediaId = res.data.items[0].media_id;
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
          this.pagelength = false;
        }

        const pageLen = Object.keys(this.pageData).length;
        if (this.pagelength) {
          this.addNewDocumentPage();
        }
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
          title: this.editingField?.title,
          description: mediaId,
          require: this.editingField?.require,
          readonly: this.editingField?.readonly
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
      this.formModel!.pages = Array();
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      Object.values(tempPageData).map((item: any, index: any) => {
        Object.keys(item.schema.properties).map(key => {
          tempPageData[index].schema.properties[key].description = JSON.stringify(
            tempPageData[index].schema.properties[key].description
          );
          delete tempPageData[index].schema.properties[key].top;
        });
        this.formModel?.pages?.push(item);
      });
    } else {
      this.formModel!.pages = Array();
    }
    if (this.formModel?.form_id) {
      this.isSaving = true;

      let notification: Notification;

      if (this.formsService.checkRoutes()) {
        notification = this.notificationsService.addNotification({
          title: `Saving field`
        });
      }

      this.builderService.updateForm(this.caseId, this.formModel, this.formModel.form_id).subscribe(
        () => {
          this.isSaving = false;
          this.blockFields = false;

          if (this.formsService.checkRoutes()) {
            this.notificationsService.ok(notification, 'Form Updated');
          }
        },
        (err: any) => {
          this.isSaving = false;

          if (this.formsService.checkRoutes()) {
            this.notificationsService.failed(notification, err.message);
          }
        }
      );
    }
    this.calcFieldPosition();
    await this.loadMediaInfo();
    await this.loadExistingFormInfo();
  }

  public refreshPreview(): void {
    this.components = [];
    const _previewData = this.getSchemaListFromUiList();
    _previewData.map(item => {
      const componentItem: any = {};
      componentItem['key'] = item.key;
      componentItem['label'] = item.title;
      componentItem['defaultValue'] = item.description || '';
      if (item.format) {
        componentItem['format'] = item.format || '';
      }
      switch (item.fieldType) {
        case 'text':
          componentItem['type'] = 'textfield';
          break;
        case 'multi-text':
          componentItem['type'] = 'textarea';
          break;
        case 'options':
          componentItem['type'] = 'radio';
          componentItem['inline'] = false;
          componentItem['values'] = item.enum.map((option: any) => ({
            value: option,
            label: option
          }));
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
          (this.loadMediaSrcInfo(this.mediaList, item) || []).map((imagePath: string) => {
            componentItem['html'] += "<div><img src='" + imagePath + "' alt='Form Docs Image'/></div>";
          });
          break;
        case 'images':
          componentItem['type'] = 'content';
          componentItem['html'] =
            "<img src='" + (this.loadMediaSrcInfo(this.mediaList, item) || []) + "' alt='Form Image'/>";
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
      .replace('${display_size}', (request.width as any))
      .replace('${display_format}', request.ext)}`;
    if (~mediaLink.indexOf('${display_count}')) {
      mediaLink = mediaLink.replace('${display_count}', `${request.page}`);
    }
    return mediaLink;
  }

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
      } else {
        this.newFieldType = 'checkboxes';
      }
      this.addField();
    } else {
      if (event.id === 'horizontal') {
        this.editingField!.fieldType = 'multidropdown';
      } else {
        this.editingField!.fieldType = 'checkboxes';
      }
    }
  }

  public dropDownLayoutChanged(event: any) {
    if (this.ifNewField) {
      if (event.id === 'dropdown') {
        this.newFieldType = 'dropdown';
      } else {
        this.newFieldType = 'options';
      }
      this.addField();
    } else {
      if (event.id === 'dropdown') {
        this.editingField!.fieldType = 'dropdown';
      } else {
        this.editingField!.fieldType = 'options';
      }
    }
  }

  // Add field for form\sign builder
  public addField() {
    if (this.newFieldType === 'blank') {
      this.addNewDocumentPage();
    } else {
      this.newProperty = this.generateNewPropertiesList();
      this.editingField = null;
      switch (this.newFieldType) {
        case 'multidropdown':
          this.addFieldTitle = 'Multi Choice ';
          break;
        case 'checkboxes':
          this.addFieldTitle = 'Multi Choice ';
          break;
        case 'multi-text':
          this.addFieldTitle = 'Multi Text ';
          break;
        case 'text':
          this.addFieldTitle = 'Text ';
          break;
        case 'dropdown':
          this.addFieldTitle = 'Single Choice ';
          break;
        case 'options':
          this.addFieldTitle = 'Single Choice ';
          break;
        case 'list':
          this.addFieldTitle = 'Single Choice ';
          break;
        case 'date':
          this.addFieldTitle = 'Date ';
          break;
        case 'time':
          this.addFieldTitle = 'Time ';
          break;
        case 'number':
          this.addFieldTitle = 'Number ';
          break;
        case 'text-only':
          this.addFieldTitle = 'Read-Only ';
          break;
        case 'images':
          this.addFieldTitle = 'Image ';
          break;
        case 'docs':
          this.addFieldTitle = 'Pdf ';
          break;
      }
      this.attachedDoc = {};
      // this.metaData[this.newProperty.name] = this.newProperty.meta_data;
      this.ifNewField = true;

      if (this.typesByField[this.newFieldType].pattern) {
        this.newProperty.pattern = this.typesByField[this.newFieldType].pattern;
      }

      if (this.typesByField[this.newFieldType].enum) {
        this.newProperty['enum'] = this.typesByField[this.newFieldType].enum;
        this.newProperty['items'] = { type: 'string', enum: this.typesByField[this.newFieldType].enum };
      }
      this.editingField = this.utilsService.copy(this.newProperty);
      this.shownDefaultsModal = true;
    }
  }

  // Set option info in input field for options and activate botton for update too
  public editPropertyOption(ident: number) {
    if (this.editingField?.fieldType === 'multidropdown' || this.editingField?.fieldType === 'checkboxes') {
      this.fieldValue = this.editingField.items.enum[ident];
    } else {
      this.fieldValue = this.editingField?.enum[ident];
    }
    this.editOptionIndex = ident;
    this.editOptionAction = true;
  }

  // Updating changed option
  public updateOption(event: Event) {
    event.preventDefault();
    if (this.editingField?.fieldType === 'multidropdown' || this.editingField?.fieldType === 'checkboxes') {
      this.editingField.items.enum[this.editOptionIndex] = this.fieldValue;
      this.editingField.items.enum = this.editingField.items.enum.slice();
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
  public handleFileUpload(target: HTMLInputElement): void {
    if (!target.files) return;
    const file: File = target.files[0];
    const fileSize = (Math.ceil(file.size / 100000) / 10).toFixed(1);
    const fileToUpload: IFileToUpload = {
      fileData: file,
      type: file.type.split('/')[0],
      extension: file.name.split('.').pop()!.toLowerCase(),
      fileGroup: file.name.split('.').pop()?.toLowerCase() === 'pdf' ? 'docs' : 'images'
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
    const notification: Notification = this.notificationsService.addNotification({
      title: 'Uploading'
    });
    const tag_id = fileToUpload.fileData.name.replace(/[^A-Za-z1-90-]/g, '-');
    this.uploadingGoes = true;
    this.feedsService
      .getUploadParams(
        this.caseId,
        fileToUpload.fileGroup,
        fileToUpload.extension,
        this.afterUpdateNavigation === '/e-signs/' ? 'signs' : 'forms',
        this.formModel?.form_id,
        tag_id
      )
      .subscribe(
        (res: any) => {
          this.attachedDoc = {
            fileName: file.name,
            progress: 0,
            media: res.fields.key,
            src: ''
          };
          const reader = new FileReader();

          reader.onloadend = () => {
            this.attachedDoc.src = reader.result;
          };

          if (file) {
            reader.readAsDataURL(file);
          } else {
            this.attachedDoc.src = '';
          }

          this.feedsService.filetoAWSUpload(res, file).subscribe((resB: any) => {
            if (resB.type === 1) {
              const percentDone = Math.round((100 * resB['loaded']) / resB['total']);
              this.notificationsService.ok(notification, 'Uploaded');
            } else if (resB.type === 2) {
              this.uploadingGoes = false;
              target.value = '';
              this.attachedDoc['key'] = res.fields.key;
              this.documentKey = res.fields.key;
              this.changeDetector.tick();
              this.notificationsService.ok(notification, 'Uploaded');
            }
          });
        },
        () => {
          this.uploadingGoes = false;
          this.changeDetector.tick();
          this.docData.execution_status = 'FAILED';
          this.notificationsService.failed(notification, 'Upload Failed');
        }
      );
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
    this.calcFieldPosition();
    this.save();
  }

  public readOnlyChanged(e: any, fl: any) {
    if (this.pageData[this.activeDocPage - 1]?.schema?.properties[fl.key]) {
      this.pageData[this.activeDocPage - 1].schema.properties[fl.key]['readonly'] = e;
      this.calcFieldPosition();
      this.save();
    }
  }

  public moveUpField(fl: any) {
    let elementList = this.pageData[this.activeDocPage - 1]?.ui_schema?.elements;
    let beforeKeyList = elementList.map((element: any) => element.scope.split('/')[2]);
    let pos = beforeKeyList.indexOf(fl.key);
    if (pos !== 0 && pos > -1) {
      beforeKeyList[pos] = beforeKeyList[pos - 1];
      beforeKeyList[pos - 1] = fl.key;
      const sortedElements = beforeKeyList.map((key: any) => elementList.filter((item: any) => item.scope.split('/')[2] === key)[0]);
      this.pageData[this.activeDocPage - 1].ui_schema.elements = new Array();
      Object.assign(this.pageData[this.activeDocPage - 1].ui_schema.elements, sortedElements);
      this.calcFieldPosition();
      this.save();
    }
  }

  public moveDownField(fl: any) {
    let elementList = this.pageData[this.activeDocPage - 1]?.ui_schema?.elements;
    let beforeKeyList = elementList.map((element: any) => element.scope.split('/')[2]);
    let pos = beforeKeyList.indexOf(fl.key);
    if (pos !== elementList.length - 1 && pos > -1) {
      beforeKeyList[pos] = beforeKeyList[pos + 1];
      beforeKeyList[pos + 1] = fl.key;
      const sortedElements = beforeKeyList.map((key: any) => elementList.filter((item: any) => item.scope.split('/')[2] === key)[0]);
      this.pageData[this.activeDocPage - 1].ui_schema.elements = new Array();
      Object.assign(this.pageData[this.activeDocPage - 1].ui_schema.elements, sortedElements);
      this.calcFieldPosition();
      this.save();
    }
  }

  // Change field position
  public changePosition(e: any, fl: any) {
    if (this.pageData[this.activeDocPage - 1]?.schema?.properties[fl.key]) {
      this.pageData[this.activeDocPage - 1].schema.properties[fl.key].top = e.top;
      this.pageData[this.activeDocPage - 1].schema.properties[fl.key].height = e.height;
    }
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
    this.switchDocumentPage((this.activeDocPage || 2) - 1);
  }

  // Check builder on count pages
  public fetchEditedPages(metaData: any) {
    const numbers: any[] = [];

    Object.keys(metaData).map(key => {
      const pageNumber = +metaData[key].pageNumber;

      if (!~numbers.indexOf(pageNumber)) {
        numbers.push(pageNumber);
      }
    });

    return numbers;
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
    const thumbnailSrc = '/images/fancybox/blank.gif';
    this.docThumbnails = [...this.docThumbnails, thumbnailSrc];
  };

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

  checkEditingFieldValidation() {
    let retValue = false;
    if (this.editingField?.fieldType !== 'text-only') {
      retValue = !this.fieldParticipants?.length || !this.editingField?.title;
    } else {
      retValue = !this.fieldParticipants?.length;
    }
    return retValue;
  }

  isEmptyData(): boolean {
    return Object.keys(this.pageData).length === 1 && Object.keys(this.pageData[0].schema.properties).length === 0;
  }

  formatInTimeZone(date: Date | string, fmt: string, tz: string) {
    return format(utcToZonedTime(date, tz), fmt, { timeZone: tz });
  }

  // Saving field
  public saveField() {
    if (this.editingField?.fieldType === 'time' && this.editingField?.defaultValue) {
      this.editingField.defaultValue = this.formatInTimeZone(this.editingField?.defaultValue, 'kk:mm:ssxxx', 'UTC');
    }

    if (!this.formModel?.field_participants) {
      this.formModel!.field_participants = {};
      this.formModel!.field_participants[this.editingField?.name!] = this.fieldParticipants;
    } else {
      this.formModel.field_participants[this.editingField?.name!] = this.fieldParticipants;
    }
    const sameFieldList = Object.values(this.pageData[this.activeDocPage - 1].schema?.properties || {}).filter(
      (item: any) => item.key === this.editingField?.key
    );
    if (!sameFieldList.length) {
      const firstItem: any = Object.values(this.pageData[this.activeDocPage - 1].schema.properties)[0] || {
        fieldType: 'text'
      };
      if (firstItem.fieldType === 'images' || firstItem.fieldType === 'docs') {
        const pageLen = Object.keys(this.pageData).length;
        this.addNewDocumentPage();
        this.switchDocumentPage(pageLen + 1);
      }

      this.pageData[this.activeDocPage - 1].ui_schema.elements.push({
        scope: '#/properties/' + this.editingField?.key,
        type: 'Control'
      });
      this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!] = {
        key: this.editingField?.key,
        title: this.editingField?.title,
        type: this.editingField?.type,
        fieldType: this.editingField?.fieldType,
        description: this.editingField?.defaultValue || '',
        format: this.editingField?.format || '',
        require: this.editingField?.require,
        readonly: this.editingField?.readonly
      };
      if (this.editingField?.fieldType === 'multidropdown' || this.editingField?.fieldType === 'checkboxes') {
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
      if (this.typesByField[this.editingField?.fieldType!].format) {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField?.key!].format =
          this.typesByField[this.editingField?.fieldType!].format;
      }
    } else {
      Object.values(this.pageData[this.activeDocPage - 1].schema.properties).map((item: any, index) => {
        if (item.key === this.editingField?.key) {
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].description =
            this.editingField?.defaultValue || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].format = this.editingField?.format || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].title = this.editingField?.title;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].type = this.editingField?.type;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].key = this.editingField?.key;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].require = this.editingField?.require;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].readonly = this.editingField?.readonly;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].fieldType = this.editingField?.fieldType;
          if (this.editingField?.fieldType === 'multidropdown' || this.editingField?.fieldType === 'checkboxes') {
            if (this.editingField?.items.enum) {
              this.pageData[this.activeDocPage - 1].schema.properties[item.key].items = {
                type: 'string',
                enum: this.editingField.items.enum
              };
            }
          } else {
            if (this.editingField?.enum) {
              this.pageData[this.activeDocPage - 1].schema.properties[item.key].enum = this.editingField?.enum;
            }
          }
          if (this.typesByField[this.editingField?.fieldType!].format) {
            this.pageData[this.activeDocPage - 1].schema.properties[item.key].format =
              this.typesByField[this.editingField?.fieldType!].format;
          }
        }
      });
    }
    this.requiredChanged(this.editingField?.require, this.editingField);
    setTimeout(() => {
      this.calcFieldPosition();
    });
    this.save();
    this.refreshPreview();
    this.refreshModal(false);
  }

  // Checking object keys
  public checkObjectKeys = (v: {[key: string]: any}) => Object.keys(v);

  // Checking object values
  public checkObjectValues = (v: {[key: string]: any}) => Object.values(v);

  // Set default values for form
  public refreshModal(modalState : boolean): void {
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
    modalState ? (this.shownDefaultsModal = true) : (this.shownDefaultsModal = false);

    this.fieldParticipants = null;
    this.editingField = null;
    this.addFieldFormTouched = false;
    this.blockFields = false;
    this.formIsValid = true;
  }

  // Generate fields list
  private generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text', hidden: false },
      { id: 'multi-text', text: 'Multi Text', element: 'Multi Text', hidden: true },
      { id: 'dropdown', text: 'Single Choice', element: 'Single Choice', hidden: false },
      { id: 'options', text: 'Single Choice', element: 'Single Choice', hidden: true },
      { id: 'list', text: 'List', element: 'Single Choice', hidden: true },
      { id: 'multidropdown', text: 'Multi Choice', element: 'Multi Choice', hidden: false },
      { id: 'checkboxes', text: 'Multi Choice', element: 'Multi Choice', hidden: true },
      { id: 'date', text: 'Date', element: 'Date', hidden: false },
      { id: 'time', text: 'Time', element: 'Time', hidden: false },
      { id: 'number', text: 'Number', element: 'Number', hidden: false },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text', hidden: false },
      { id: 'docs', text: 'Upload Pdf', element: 'Pdf', hidden: false },
      { id: 'images', text: 'Upload Image', element: 'Image', hidden: false },
      { id: 'blank', text: 'Blank new page', element: 'Blank new page', hidden: false }
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
      readonly: false,
      defaultValue: this.typesByField[this.newFieldType].defaultValue,
      format: ''
    };
  }
}
