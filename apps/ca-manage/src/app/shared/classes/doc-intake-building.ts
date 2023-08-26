import {
  IAddMediaRequest,
  IMedia,
  IMediaAttachment,
  IMediaObject,
  MediaStatus
} from './../../pages/modules/media/models/media.model';
import { FeedMediaService } from '../../services/feed-media.service';
import { Subject, Subscription, throwError } from 'rxjs';
import { DatePipe } from '@angular/common';
import { catchError, takeUntil } from 'rxjs/operators';
import { IForm } from '../../services/forms.service';
import { ModuleName } from '../../services/drive.service';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { format, utcToZonedTime } from 'date-fns-tz';
import { UtilsService } from '../../services/utils.service';
import { TimePipe } from '../../common/pipes/time.pipe';
import { PopInNotificationConnectorService } from '../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { environment } from '../../../environments/environment';

export class DocIntakeBuilder {
  public formModel?: IForm;
  public pageData: any = {};
  public loading = false;
  public is_loading = true;
  public message = '';
  public errorMessage = '';
  public documentKey = '';
  public attachedDoc: any = null;
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
    text: { type: 'string', defaultValue: '' },
    textarea: { type: 'string', defaultValue: '' },
    dropdown: {
      type: 'string',
      items: {
        type: 'string',
        enum: []
      },
      defaultValue: ''
    },
    multidropdown: {
      type: 'array',
      items: {
        type: 'string',
        enum: []
      },
      defaultValue: []
    },
    checkboxes: {
      type: 'array',
      items: {
        type: 'string',
        enum: []
      },
      itemsToAddLimit: 10,
      defaultValue: []
    },
    options: {
      type: 'array',
      items: {
        type: 'string',
        enum: []
      },
      itemsToAddLimit: 10,
      defaultValue: []
    },
    date: {
      type: 'string',
      pattern: '^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$',
      defaultValue: ''
    },
    time: { type: 'string', pattern: '^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$', defaultValue: '' },
    boolean: { type: 'boolean', defaultValue: false },
    number: { type: 'number', defaultValue: null }
  };
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
  public timeoutId: any = null;
  public formType?: any;
  public acceptAttribute?: string;
  public stylesService: any;
  public intakeFormsService;
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
  public formBuilder: UntypedFormBuilder;
  public designService: any;
  public formIsValid?: boolean;
  public required_userfield = [];
  public required_field?: string[];
  private newProperty: any = {};
  private destroy$ = new Subject<void>();
  public isSaving = false;
  public components: any[] = [];
  protected mediaList: any[] = [];
  public privateCDN = environment.PRIVATE_CDN_URL + '/';

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

  constructor(
    notificationsService: PopInNotificationConnectorService,
    utilsService: UtilsService,
    timePipe: TimePipe,
    stylesS?: any,
    intakeFormsService?: any,
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
    designService?: any
  ) {
    this.notificationsService = notificationsService;
    this.utilsService = utilsService;
    this.timePipe = timePipe;
    this.stylesService = stylesS;
    this.intakeFormsService = intakeFormsService;
    this.contentMediaS = contentMediaS;
    this.feedMediaS = feedMediaS;
    this.amazonService = amazonS;
    this.errorDistionary = errorD;
    this.optionsService = optionsS;
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

    this.fieldForm.valueChanges.subscribe(value => {
      this.editingField.title = value.title;
      this.newFieldType = value.newFieldType;
      this.fieldValue = value.fieldValue;
    });
  }

  initializationComponents() {
    this.fieldsList = this.generateFieldsList();
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

  deletePropertyOption(ind: number) {
    this.editingField.items.enum.splice(ind, 1);
    this.updateActiveOptions();
  }

  addOption(event: any) {
    event.preventDefault();
    let canAdd = true;
    const limit = this.typesByField[this.editingField.fieldType].itemsToAddLimit;

    if (limit) {
      if (this.editingField.fieldType === 'multidropdown') {
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
      if (this.editingField.fieldType === 'multidropdown') {
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
    } else {
      this.optionsLimitError = true;
    }

    this.updateActiveOptions();
  }

  updateOption() {
    this.editingField.items.enum[this.editOptionIndex] = this.fieldValueField.value;
    this.editOptionAction = false;
    this.fieldValueField.reset();
    this.updateActiveOptions();
  }

  editPropertyOption(ind: number) {
    this.fieldValueField.setValue(this.editingField.items.enum[ind]);
    this.editOptionIndex = ind;
    this.editOptionAction = true;
  }

  updateActiveOptions() {
    const lookIn = this.editingField['defaultValue'] ? this.editingField['defaultValue'] : [];

    if (this.editingField.fieldType !== 'dropdown') {
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
      if (this.editingField.items.enum.indexOf(lookIn) === -1) {
        this.activeOptions = [];
        this.editingField['defaultValue'] = '';
      }
    }
  }

  stringify = (v: {[key: string]: string}) => JSON.stringify(v, null, 2);

  changeStep(prop: any, st: any) {
    (this as any)[prop] += st;
  }

  autoSave() {
    this.autoSaveSubject.next();
  }

  // Checking object keys
  checkObjectKeys = (v: {[key: string]: any}) => Object.keys(v);
  checkObjectValues = (v: {[key: string]: any}) => Object.values(v);

  getSchemaListFromUiList(pageNumber: number = this.activeDocPage): any[] {
    const elements = this.pageData[pageNumber - 1]?.ui_schema?.elements || [];
    const properties = this.pageData[pageNumber - 1]?.schema?.properties || [];
    const requiredList = this.pageData[pageNumber - 1]?.schema?.required || [];
    return elements.map((item: any) => {
      let result = properties[item.scope.split('/')[2]];
      result.require = requiredList.indexOf(result.key) >= 0;
      return result;
    });
  }

  save(quietUpdate = false) {
    Object.values(this.pageData).map((item: any, index: any) => {
      if (!item?.ui_schema?.elements?.length) {
        delete this.pageData[index];
      }
    });
    if (Object.keys(this.pageData).length) {
      this.formModel!.pages = Array();
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      Object.values(tempPageData).map((item: any, index: any) => {
        Object.keys(item.schema.properties).map(key => {
          tempPageData[index].schema.properties[key].description = JSON.stringify(
            tempPageData[index].schema.properties[key].description
          );
        });

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
      request.recipients_ids = this.recipients.length > 0 ? this.recipients : null;
    }

    if (this.recurring.rrule && this.recurring.rrule[0]) {
      request.rrule = this.recurring.rrule[0];
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
        if (this.intakeFormsService.checkRoutes()) {
          notification = this.notificationsService.addNotification({
            title: `Saving field`
          });
        }

        this.saveSubscription = this.intakeFormsService.putIntakeForm(request, this.assetId).subscribe(
          () => {
            this.blockFields = false;
            this.isSaving = false;
            if (!quietUpdate) {
              this.loadExistingFormInfo();
            }
            this.savingError = '';
            this.changesSaved = true;
            if (this.intakeFormsService.checkRoutes()) {
              this.notificationsService.ok(notification, 'Form Updated');
            }
            // this.loadMediaInfo();
            this.loadExistingFormInfo();
            setTimeout(() => {
              this.intakeFormsService.isFieldsDisabled = false;
            }, 1000);
          },
          (err: any) => {
            this.blockFields = false;
            this.isSaving = false;
            this.changesSaved = false;
            this.showError('savingError', err.message);
            if (this.intakeFormsService.checkRoutes()) {
              this.notificationsService.failed(notification, err.message);
            }
          }
        );
      }
    };

    if (!this.documentLink) {
      const mediaRequest: IAddMediaRequest = {
        media: [
          {
            media_key: this.documentKey
          }
        ]
      };

      this.contentMediaS
        .addPostMedia(mediaRequest, this.assetId)
        .pipe(
          catchError(res => {
            this.blockFields = false;
            this.showError('savingError', res.message);
            return throwError(res.error);
          })
        )
        .subscribe(() => updateFn());
    } else {
      updateFn();
    }
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

  // Add field for form\sign builder
  public addField() {
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
    this.editingField = this.utilsService.copy(this.newProperty);
    this.shownDefaultsModal = true;
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
  handleFileUpload(target: HTMLInputElement) {
    if (!target.files) return;
    const fileDataI = target.files[0];
    const mimeFType = fileDataI.type;
    const fileTypeN = mimeFType.split('/')[0] + 's';
    const extension = fileDataI.name.split('.').pop();
    const keys = Object.keys(this.supportedExtensions['docs']);
    const tag_id = fileDataI.name.replace(/[^A-Za-z1-90-]/g, '-');

    let supported = false;

    keys.forEach(ext => {
      if (ext === extension) {
        supported = true;
      }
    });

    if (!supported) {
      return alert('unsupported mediatype or extension list not loaded');
    }

    this.docData.execution_status = 'RUNNING';
    this.uploadingGoes = true;
    this.driveService
      .getUploadingRequestDataPrivate('docs', extension, ModuleName.Assets, tag_id, this.assetId)
      .pipe(
        catchError(res => {
          this.uploadingGoes = false;
          this.changeDetector.detectChanges();
          return throwError(res.error);
        })
      )
      .subscribe(
        (res: any) => {
          this.attachedDoc = {
            fileName: fileDataI.name,
            progress: 0,
            media: res.fields.key,
            src: ''
          };
          const reader = new FileReader();

          if (fileTypeN === 'docs') {
            reader.onloadend = () => {
              this.attachedDoc.src = reader.result;
            };

            if (fileDataI) {
              reader.readAsDataURL(fileDataI);
            } else {
              this.attachedDoc.src = '';
            }
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
              this.attachedDoc['key'] = res.fields.key;
              this.documentKey = res.fields.key;
              this.changeDetector.detectChanges();
              this.save();
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
    Object.values(this.pageData).map((item: any, index: any) => {
      Object.keys(item.schema.properties).map(key => {
        if (key === fl.key) {
          this.pageData[index].schema.properties[key].width = e.width;
          this.pageData[index].schema.properties[key].height = e.height;
          this.pageData[index].schema.properties[key].top = e.top;
          this.pageData[index].schema.properties[key].left = e.left;
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
    this.switchDocumentPage((this.activeDocPage || 2) - 1);
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
      return this.intakeFormsService.getIntakeForm(this.assetId).subscribe((form: IForm) => {
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

        const pages = () => {
          let returnPages = Array();
          const pages = form.pages;
          if (typeof pages == 'object' && form.pages_ct !== 0) {
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
          } else if (form.pages_ct === 0) {
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

        if (pageContent) {
          Object.assign(this.pageData, pageContent);
        }

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
        for (const mediaKey in form.media) {
          if (form.media[mediaKey as keyof IMedia]) {
            const mediaObject: IMediaObject = form.media[mediaKey as keyof IMedia];

            if (mediaObject.ct) {
              for (const mediaItemKey of Object.keys(mediaObject?.items!)) {
                const mediaItem = mediaObject.items![mediaItemKey];
                this.formMedia.push({
                  tag_id: mediaItem.tag_id,
                  media_group: mediaKey,
                  media_id: mediaItemKey,
                  status: mediaItem.execution_status,
                  src:
                    mediaItem.execution_status === MediaStatus.Succeeded && mediaItem.display_start
                      ? this.feedMediaS.getMediaSrc({
                          urlKey: mediaItem.display_start,
                          width: `${mediaItem.display_sizes[mediaItem.display_sizes.length - 2]}`,
                          displayCount: mediaItem.display_count,
                          ext: mediaItem.display_formats[0]
                        })
                      : ''
                });
              }
            }
          }
        }
        const doc: any = (() => {
          let returnDoc;
          const media: any = form.media;

          if (typeof media === 'object') {
            for (const groupName in media) {
              if (media.hasOwnProperty(groupName)) {
                const group: any = media[groupName];

                if (typeof group === 'object') {
                  for (const groupItemName in group) {
                    if (group.hasOwnProperty(groupItemName)) {
                      const item = group[groupItemName];

                      if (item && typeof item === 'object' && Object.values(item).length) {
                        returnDoc = Object.values(item)[0];
                      }
                    }
                  }
                }
              }
            }
          }

          return returnDoc;
        })();

        this.displayCount = doc && doc.display_count;

        if (form.rrule) {
          this.recurring.rrule[0] = form.rrule;
          this.recurring.recurring = true;
        }

        if (form.pages) {
          this.saveModel = this.loadDefaultAnswer(form.pages);
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

        if (doc) {
          Object.assign(this.docData, doc);
          this.documentKey = doc.original;
          this.documentLink = this.docData.display_start
            ? this.feedMediaS.getMediaSrc({
                urlKey: this.docData.display_start,
                ext: this.docData.display_formats[0],
                width: Math.max.apply(Math, this.docData.display_sizes),
                displayCount: 1
              })
            : null;
          this.attachedDoc = {
            fileName: doc.tag_id,
            progress: 0,
            media: doc.original,
            src: ''
          };

          this.extension = doc.display_start ? doc.display_start.split('.').pop() : '';
          this.switchDocumentPage(1);

          if (doc.display_start) {
            this.blockFields = false;
            this.tabNumber = 2;
            const docPagesArray = Array.from(Array(doc.display_count).keys());
            docPagesArray.forEach(pageNumber => {
              const thumbnailSrc = this.feedMediaS.getMediaSrc({
                ext: this.docData.display_formats[0],
                urlKey: this.docData.display_start,
                width: '90',
                displayCount: pageNumber + 1
              });

              this.docThumbnails.push(thumbnailSrc);
            });
          } else if (doc.tag_id) {
            clearTimeout(this.timeoutId);

            this.timeoutId = setTimeout(() => {
              run();
            }, 10000);
          }

          return;
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
  public switchDocumentPage = (pageNumber: any) => {
    const maxLen = this.displayCount;

    if (pageNumber !== '' && this.docData.display_start) {
      if (pageNumber > maxLen) {
        pageNumber = 1;
      } else if (pageNumber < 1) {
        pageNumber = maxLen;
      }

      this.activeDocPage = pageNumber;
      this.documentLink = this.docData.display_start
        ? this.feedMediaS.getMediaSrc({
            urlKey: this.docData.display_start,
            ext: this.docData.display_formats[0],
            width: Math.max.apply(Math, this.docData.display_sizes),
            displayCount: pageNumber
          })
        : null;
      this.loading = false;
    } else if (pageNumber !== '') {
      this.activeDocPage = 1;
    }
  };

  formatInTimeZone(date: Date | string, fmt: string, tz: string) {
    return format(utcToZonedTime(date, tz), fmt, { timeZone: tz });
  }

  saveField() {
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
      const firstItem: any = Object.values(this.pageData[this.activeDocPage - 1].schema.properties)[0] || {
        fieldType: 'text'
      };
      if (firstItem.fieldType === 'images' || firstItem.fieldType === 'docs') {
        const pageLen = Object.keys(this.pageData).length;
        this.switchDocumentPage(pageLen + 1);
      }

      this.pageData[this.activeDocPage - 1].ui_schema.elements.push({
        scope: '#/properties/' + this.editingField.key,
        type: 'Control'
      });
      this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key] = {
        key: this.editingField.key,
        title: this.editingField.title,
        type: this.editingField.type,
        fieldType: this.editingField.fieldType,
        description: this.editingField.defaultValue ?? '',
        require: this.editingField.require
      };
      if (this.editingField.fieldType === 'multidropdown') {
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
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].type = this.editingField.type;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].key = this.editingField.key;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].require = this.editingField.require;
          if (this.editingField.fieldType === 'multidropdown') {
            if (this.editingField.items.enum) {
              this.pageData[this.activeDocPage - 1].schema.properties[item.key].items = {
                type: 'string',
                enum: this.editingField.items.enum
              };
            }
          } else {
            if (this.editingField.enum) {
              this.pageData[this.activeDocPage - 1].schema.properties[item.key].enum = this.editingField.enum;
            }
          }
          if (this.typesByField[this.editingField.fieldType].format) {
            this.pageData[this.activeDocPage - 1].schema.properties[item.key].format =
              this.typesByField[this.editingField.fieldType].format;
          }
        }
      });
    }

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

  onFieldTypeSelectChange({ id }: { id: string; text: string }) {
    this.newFieldType = id;
  }

  generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text' },
      { id: 'dropdown', text: 'Multiple choice', element: 'Multiple choice' },
      { id: 'multidropdown', text: 'Checkboxes', element: 'Checkboxes' },
      { id: 'date', text: 'Date', element: 'Date' },
      { id: 'time', text: 'Time', element: 'Time' },
      { id: 'number', text: 'Number', element: 'Number' },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text' }
    ];
  }

  // Set default values for form
  public refreshModal(modalState: any): void {
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
    modalState ? (this.shownDefaultsModal = true) : (this.shownDefaultsModal = false);

    this.editingField = null;
    this.addFieldFormTouched = false;
    this.blockFields = false;
    this.formIsValid = true;
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

  // Generate random name for fields
  private generateRandomName(digit: number) {
    return Math.random()
      .toString(36)
      .substring(2, digit + 2);
  }

  public preSave($event: any) {
    if ($event.target.className !== 'icon-edit') {
      setTimeout(() => this.save(), 100);
    }
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
            values: item.enum.map((option: string) => ({
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

  private async loadMediaInfo() {
    if (this.formModel?.asset_id) {
      const res = await this.intakeFormsService.getIntakeForm(this.formModel.asset_id).toPromise();
      this.mediaList = res?.media || {};
    }
  }
}
