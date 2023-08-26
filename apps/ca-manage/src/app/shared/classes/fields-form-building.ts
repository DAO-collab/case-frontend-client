import { Subject, throwError } from 'rxjs';
import { catchError, finalize, map, takeUntil } from 'rxjs/operators';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { UtilsService } from '../../services/utils.service';
import { IForm } from '../../services/forms.service';
import { environment } from '../../../environments/environment';
import { FeedMediaService } from '../../services/feed-media.service';
import { IFileToUpload, IMediaAttachment } from '../../pages/modules/media/models/media.model';
import { PopInNotificationConnectorService } from '../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { format, utcToZonedTime } from 'date-fns-tz';
import { DriveService, ModuleName } from '../../services/drive.service';
import { AmazonService } from '../../services/amazon.service';

/**
 * This class goal is to avoid duplicated code in Field Signs and Field Forms creation
 */
export class FieldsFormBuilder {
  public form?: any;
  public builderModel: IForm = { asset_id: '', description: '', pages: [] };
  public datePipe;
  public timePipe;
  public formsService;
  public hostService;
  public utilsService: UtilsService;
  public disableEditing?: boolean;
  public blockFields = false;
  public addFieldFormTouched = false;
  public formTouched = false;
  public formType?: any;
  public properties?: any[];
  public notifications = {
    names: [],
    values: []
  };
  public recipients: any[] = [];
  public recurring: any = { rrule: [''] };
  public editOptionAction = false;
  public editOptionIndex: any;
  public editingField: any = {};
  public savingError?: string;
  public description?: any;
  public title?: any;
  public fieldValue = '';
  public subscribers: any[] = [];
  public loading = true;
  public validationErrors = [];
  public validationErrorsPopUp = [];
  public message = '';
  public saving = false;
  public optionsLimitError = false;
  public optionExistsError = false;
  public shownDefaultsModal = false;
  public ifNewField = true;
  public activeOptions = [];
  public stylesService: any;
  public optionsSupport: any = {
    dropdown: true,
    multidropdown: true,
    checkboxes: true,
    options: true,
    table: true
  };
  public formBuilder: UntypedFormBuilder;
  public fieldsForm?: UntypedFormGroup;
  public fieldForm?: UntypedFormGroup;
  public typesByField: any = {};
  public acceptableFields: string[] = [];
  public fieldsList: any[] = [];
  public pageData: any = {};
  public mediaList: any;
  public displayCount?: any;
  public activeDocPage = 0;
  public fieldPositionList: string[] = [];
  public components?: any;
  public privateCDN = environment.PRIVATE_CDN_URL + '/';
  public newFieldType = '';
  public supportedExtensions: any;
  public formIsValid?: boolean;
  public docData: any = {};
  public uploadingGoes = false;
  public addFieldTitle = '';
  public newProperty: any = {};
  public attachedDoc: any = null;
  public requiredUserfield = [];
  public requiredField?: string[];
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

  private errorDictionary;
  private activatedRoute;
  private onSaveFn;
  private destroy$ = new Subject<void>();
  public unsubscribe$: Subject<void> = new Subject();

  protected sanitizer: any;
  protected optionService: any;
  protected contentMediaService: any;
  protected driveService: any;
  protected amazonService: any;
  protected notificationsService: PopInNotificationConnectorService;

  get fieldType() {
    return this.fieldsForm?.controls['newFieldType'];
  }

  get fields() {
    return this.fieldsForm?.controls['fieldsGroup'] as UntypedFormGroup;
  }

  get defaultValue() {
    return this.fieldForm?.controls['defaultValue'];
  }

  constructor(
    timePipe?: any,
    datePipe?: any,
    formService?: any,
    utilsService?: any,
    stylesS?: any,
    errorD?: any,
    route?: any,
    formBuilder?: any,
    onSave?: any,
    sanitizer?: any,
    optionService?: any,
    contentMediaS?: any,
    notificationsService?: any,
    driveService?: any,
    amazonService?: any,
    hostService?: any
  ) {
    this.timePipe = timePipe;
    this.datePipe = datePipe;
    this.formsService = formService;
    this.errorDictionary = errorD;
    this.activatedRoute = route;
    this.stylesService = stylesS;
    this.onSaveFn = onSave;
    this.utilsService = utilsService;
    this.formBuilder = formBuilder;
    this.sanitizer = sanitizer;
    this.optionService = optionService;
    this.contentMediaService = contentMediaS;
    this.notificationsService = notificationsService;
    this.driveService = driveService;
    this.amazonService = amazonService;
    this.hostService = hostService;
  }

  protected initialize() {
    this.typesByField = this.utilsService.generateTypesByFields();
    this.acceptableFields = this.utilsService.generateAcceptableFields();
    this.fieldsList = this.generateFieldsList().filter(item => !item.hidden);
    this.loadExtesions();

    this.activatedRoute.params.subscribe((params: any) => {
      this.builderModel.asset_id = params['id'] || '';

      if (this.builderModel.asset_id) {
        this.loading = true;
        this.loadOpenedInformation();
      } else {
        this.loading = false;
      }
    });
  }

  // Saving builder changes
  public async save() {
    Object.values(this.pageData).map((item: any, index: any) => {
      if (!item?.ui_schema?.elements?.length) {
        delete this.pageData[index];
      }
    });
    this.displayCount = Object.values(this.pageData).length || 1;

    if (this.attachedDoc?.media) {
      try {
        const request: any = {
          media: []
        };
        request.media.push({ media_key: this.attachedDoc.media });

        const res = await this.contentMediaService.addPostMedia(request, this.builderModel.asset_id).toPromise();
        const notification = this.notificationsService.addNotification({
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
        const notification = this.notificationsService.addNotification({
          title: `Saving access `
        });
        this.notificationsService.failed(notification, err.message);
      }
      this.refreshModal(false);
    }

    if (Object.keys(this.pageData).length) {
      this.builderModel.pages = Array();
      const _tempPageData = JSON.parse(JSON.stringify(this.pageData));
      Object.values(_tempPageData).map((item: any, index: any) => {
        Object.keys(item.schema.properties).map(key => {
          _tempPageData[index].schema.properties[key].description = JSON.stringify(
            _tempPageData[index].schema.properties[key].description
          );
          delete _tempPageData[index].schema.properties[key].top;
        });
        this.builderModel?.pages?.push(item);
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
      delete this.builderModel.pages;
    }

    if (this.builderModel.asset_id) {
      this.formsService.updateForm(this.builderModel, this.builderModel.asset_id).subscribe(
        () => {
          this.blockFields = false;
          this.savingError = '';
        },
        (err: any) => {
          this.blockFields = false;
          this.showError('savingError', err.message);
        }
      );
    }
  }

  showError(errorVariable: any, error: any) {
    if (this.errorDictionary.errorsDictionary) {
      (this as any)[errorVariable] = this.errorDictionary.errorsDictionary[error]
        ? this.errorDictionary.errorsDictionary[error]
        : error;
    } else {
      this.errorDictionary.loadErrors().subscribe(() => {
        (this as any)[errorVariable] = this.errorDictionary.errorsDictionary[error]
          ? this.errorDictionary.errorsDictionary[error]
          : error;
      });
    }
  }

  // Set option info in input field for options and activate botton for update too
  public editPropertyOption(ident: number) {
    this.editOptionIndex = ident;
    this.editOptionAction = true;
    if (this.editingField.fieldType === 'table') {
      this.fieldValue = this.editingField.cols[ident];
      return;
    }
    this.fieldValue = this.editingField.enum[ident];
  }

  // Get extensions for documents
  private loadExtesions() {
    this.optionService.getExtesions().subscribe((data: any) => (this.supportedExtensions = data));
  }

  public isEmptyData(): boolean {
    return Object.keys(this.pageData).length === 1 && Object.keys(this.pageData[0].schema.properties).length === 0;
  }

  public loadOpenedInformation() {
    if (this.builderModel.asset_id) {
      this.blockFields = true;
      this.hostService
        .getHostInfo()
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((data: any) => {
          this.requiredUserfield = data.require_userfields;
          this.optionService
            .userFields()
            .pipe(takeUntil(this.destroy$))
            .subscribe((userFields: any) => {
              this.requiredField = this.requiredUserfield.map(userFieldKey => '${' + userFields[userFieldKey] + '}');
            });
        });
      this.subscribers.push(
        this.formsService.getFormInfo(this.builderModel.asset_id).subscribe((builderModel: IForm) => {
          this.builderModel.tag_id = builderModel.tag_id;
          this.mediaList = builderModel.media;
          builderModel.description !== undefined
            ? (this.builderModel.description = builderModel.description)
            : delete this.builderModel.description;
          builderModel.media_asset_id
            ? (this.builderModel.media_asset_id = builderModel.media_asset_id)
            : delete this.builderModel.media_asset_id;
          builderModel.notifications !== undefined
            ? (this.builderModel.notifications = builderModel.notifications)
            : delete this.builderModel.notifications;
          builderModel.permissions !== undefined
            ? (this.builderModel.permissions = builderModel.permissions)
            : delete this.builderModel.permissions;
          this.builderModel.due_date = builderModel.due_date;
          builderModel.rrule ? (this.builderModel.rrule = builderModel.rrule) : delete this.builderModel.rrule;
          this.builderModel.type = builderModel.type;

          const pages = () => {
            let returnPages = Array();
            // tslint:disable-next-line:no-shadowed-variable
            const pages = builderModel.pages;
            if (typeof pages === 'object') {
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
          this.blockFields = false;
        })
      );
    } else {
      this.loading = false;
    }
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
    this.loading = false;
    setTimeout(() => {
      this.calcFieldPosition();
      this.refreshPreview();
    });
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
          componentItem['data'] = {
            values: item.enum.map((option: any) => ({
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
          componentItem['type'] = 'textarea';
          componentItem['wysiwyg'] = {
            toolbar: false
          };
          componentItem['disabled'] = true;
          componentItem['editor'] = 'ckeditor';
          componentItem['defaultValue'] = item.description;
          componentItem['label'] = '';
          break;
        case 'table':
          componentItem['type'] = 'table';
          componentItem['label'] = '';
          componentItem['header'] = [...item.cols];
          componentItem['numCols'] = item.cols.length;
          componentItem['numRows'] = 1;
          componentItem['hover'] = true;
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
      const urlKey = mediaInfo.alias_display_start
        ? mediaInfo.alias_display_start
        : mediaInfo.display_start
        ? mediaInfo.display_start
        : '';

      if (item.fieldType === 'docs') {
        const result = [];
        for (let i = 0; i < mediaInfo.display_count; i++) {
          result.push(
            this.getImageSrc({
              ext,
              url_key: urlKey,
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
          url_key: urlKey,
          height: '0',
          width: Math.max.apply(null, displaySizes),
          page: i + 1
        });
      }
    } else {
      return '';
    }
  }

  public getImageSrc(request: any): any {
    let mediaLink = `${this.privateCDN}${request.url_key
      .replace('${display_size}', request.width)
      .replace('${display_format}', request.ext)}`;
    if (~mediaLink.indexOf('${display_count}')) {
      mediaLink = mediaLink.replace('${display_count}', `${request.page}`);
    }
    return mediaLink;
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

  // Get Schema from Ui_schema list
  public getSchemaListFromUiList(pageNumber: number = this.activeDocPage): any[] {
    const elements = this.pageData[pageNumber - 1]?.ui_schema?.elements || [];
    const properties = this.pageData[pageNumber - 1]?.schema?.properties || [];
    const requiredList = this.pageData[pageNumber - 1]?.schema?.required || [];
    return elements.map((item: any) => {
      const result = properties[item.scope.split('/')[2]];
      result.require = requiredList.indexOf(result.key) >= 0;
      return result;
    });
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
    return value ? this.sanitizer.bypassSecurityTrustStyle(value + 'px') : min || 'auto';
  }

  // Switch next document page
  public nextDoc() {
    this.switchDocumentPage((this.activeDocPage || 0) + 1);
  }

  // Switch previous document page
  public previousDoc() {
    this.switchDocumentPage((this.activeDocPage === 1 ? this.activeDocPage + 1 : this.activeDocPage) - 1);
  }

  public moveUpField(fl: any) {
    const elementList = this.pageData[this.activeDocPage - 1]?.ui_schema?.elements;
    const beforeKeyList = elementList.map((element: any) => element.scope.split('/')[2]);
    const pos = beforeKeyList.indexOf(fl.key);
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
    const elementList = this.pageData[this.activeDocPage - 1]?.ui_schema?.elements;
    const beforeKeyList = elementList.map((element: any) => element.scope.split('/')[2]);
    const pos = beforeKeyList.indexOf(fl.key);
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

  public requiredChanged(e: any, fl: any) {
    let requiredList = this.pageData[this.activeDocPage - 1]?.schema?.required || [];
    if (e) {
      if (requiredList.indexOf(fl.key) === -1) requiredList = [...requiredList, fl.key];
    } else {
      requiredList.splice(
        requiredList.findIndex((key: string) => key === fl.key),
        1
      );
    }
    if (requiredList.length) {
      this.pageData[this.activeDocPage - 1].schema.required = requiredList;
    } else {
      delete this.pageData[this.activeDocPage - 1].schema.required;
    }
    this.save();
  }

  // Checking object keys
  public checkObjectKeys = (v: {[key: string]: any}) => Object.keys(v);

  // Checking object values
  public checkObjectValues = (v: {[key: string]: any}) => Object.values(v);

  private checkFileExtension(file: any): boolean {
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

  // Prepeating for edit field
  public runFieldEditing(fl: any, index: number) {
    this.refreshModal(true);

    this.ifNewField = false;
    this.editingField = this.utilsService.copy(fl);
    this.editingField.defaultValue = fl.description;
    this.editingField.index = index;
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

    const requiredList = this.pageData[pageNumber]?.schema?.required || [];
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
    if (this.editingField.fieldType === 'table') {
      this.editingField.cols.splice(ind, 1);
      this.editingField.rows[0].splice(ind, 1);
      return;
    }
    this.editingField.enum.splice(ind, 1);
  }

  // Add option for field
  public addOption(event: any) {
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
    } else {
      this.optionsLimitError = true;
    }
  }

  // Updating changed option
  public updateOption(event: any) {
    event.preventDefault();
    this.editOptionAction = false;
    this.fieldValue = '';
    if (this.editingField.fieldType === 'table') {
      this.editingField.cols[this.editOptionIndex] = this.fieldValue;
      return;
    }
    this.editingField.enum[this.editOptionIndex] = this.fieldValue;
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
    const fileToUpload: IFileToUpload = {
      fileData: target.files[0],
      type: target.files[0].type.split('/')[0],
      extension: target.files[0].name.split('.').pop()!.toLowerCase(),
      fileGroup: target.files[0].name.split('.').pop()!.toLowerCase() === 'pdf' ? 'docs' : 'images'
    };
    if (fileToUpload.type !== 'image' && fileToUpload.extension !== 'pdf') {
      return alert('Unsupported file extension.');
    }
    this.uploadingGoes = true;
    const notification = this.notificationsService.addNotification({
      title: 'Uploading'
    });

    this.driveService
      .getUploadingRequestDataPrivate(
        fileToUpload.fileGroup,
        fileToUpload.extension,
        ModuleName.Assets,
        this.builderModel.tag_id,
        this.builderModel.asset_id
      )
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError(errMsg => {
          this.formTouched = true;
          this.notificationsService.failed(notification, errMsg.errors[0].location);
          return throwError(errMsg.error);
        })
      )
      .subscribe((fileRes: any) => {
        this.attachedDoc = {
          fileName: target?.files?.[0].name,
          progress: 0,
          media: fileRes.fields.key,
          src: ''
        };
        const reader = new FileReader();
        reader.onloadend = () => {
          this.attachedDoc.src = reader.result;
        };
        if (fileToUpload.fileData) {
          reader.readAsDataURL(fileToUpload.fileData);
        } else {
          this.attachedDoc.src = '';
        }

        this.amazonService
          .filetoAWSUpload(fileRes, fileToUpload.fileData)
          .pipe(
            takeUntil(this.unsubscribe$),
            catchError(errMsg => {
              this.notificationsService.failed(notification, errMsg.errors[0].location);
              return throwError(errMsg.error);
            }),
            map((res: any) => {
              if (res.type === 1) {
                const percentDone = Math.round((100 * res['loaded']) / res['total']);
                this.notificationsService.ok(notification, 'Uploaded');
              } else if (res.type === 2) {
                this.uploadingGoes = false;
                target.value = '';
                this.notificationsService.ok(notification, 'Uploaded');
              }
            }),
            finalize(() => {
              this.uploadingGoes = false;
            })
          )
          .subscribe(() => {
            this.uploadingGoes = false;
          });
      });
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

  // Add field for form\sign builder
  public addField() {
    if (this.newFieldType === 'blank') {
      this.addNewDocumentPage();
    } else {
      this.newProperty = this.generateNewPropertiesList();
      this.editingField = null;
      switch (this.newFieldType) {
        case 'multidropdown':
          this.addFieldTitle = 'Checkboxes ';
          break;
        case 'text':
          this.addFieldTitle = 'Text ';
          break;
        case 'dropdown':
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
        case 'table':
          this.addFieldTitle = 'Table ';
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
      }
      this.editingField = this.utilsService.copy(this.newProperty);
      this.shownDefaultsModal = true;
    }
  }

  currentIsNotValid() {
    return this.editingField.fieldType === 'text-only' ? !this.editingField.defaultValue : !this.editingField.title;
  }

  // Saving field
  public saveField() {
    if (this.editingField.fieldType === 'time' && this.editingField.defaultValue) {
      this.editingField.defaultValue = this.formatInTimeZone(this.editingField.defaultValue, 'kk:mm:ssxxx', 'UTC');
    }

    const sameFieldList = Object.values(this.pageData[this.activeDocPage - 1].schema?.properties || {}).filter(
      (item: any) => item.key === this.editingField.key
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
        scope: '#/properties/' + this.editingField.key,
        type: 'Control'
      });
      this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key] = {
        key: this.editingField.key,
        title: this.editingField.title,
        subText: this.editingField?.subText,
        format: this.editingField?.format || '',
        type: this.editingField.type,
        fieldType: this.editingField.fieldType,
        description: this.editingField.defaultValue || '',
        require: this.editingField.required
      };
      if (this.editingField.enum) {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].enum = this.editingField.enum;
      }
      if (this.typesByField[this.editingField.fieldType].format) {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].format =
          this.typesByField[this.editingField.fieldType].format;
      }
      if (this.editingField.fieldType === 'table') {
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].cols = [
          ...this.editingField.cols
        ];
        this.pageData[this.activeDocPage - 1].schema.properties[this.editingField.key].rows = [
          ...this.editingField.rows
        ];
      }
    } else {
      Object.values(this.pageData[this.activeDocPage - 1].schema.properties).map((item: any, index) => {
        if (item.key === this.editingField.key) {
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].description =
            this.editingField.defaultValue || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].title = this.editingField.title;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].type = this.editingField.type;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].subText = this.editingField?.subText || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].format = this.editingField?.format || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].key = this.editingField.key;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].require = this.editingField.required;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].fieldType = this.editingField.fieldType;
          if (this.editingField.enum) {
            this.pageData[this.activeDocPage - 1].schema.properties[item.key].enum = this.editingField.enum;
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
          }
        }
      });
    }
    this.requiredChanged(this.editingField.required, this.editingField);
    setTimeout(() => {
      this.calcFieldPosition();
    });
    this.save();
    this.refreshPreview();
    this.refreshModal(false);
  }

  public formatInTimeZone(date: Date | string, fmt: string, tz: string) {
    return format(utcToZonedTime(date, tz), fmt, { timeZone: tz });
  }

  disactivateAddFieldPopUp() {
    this.fieldForm?.reset({}, { emitEvent: false });
    this.shownDefaultsModal = false;
    this.stylesService.popUpDisactivated();
    this.addFieldFormTouched = false;
  }

  // Generate fields list
  private generateFieldsList() {
    return [
      { id: 'text', text: 'Text', element: 'Text' },
      { id: 'dropdown', text: 'Single Choice', element: 'Single Choice' },
      { id: 'multidropdown', text: 'Multi Choice', element: 'Multi Choice' },
      { id: 'date', text: 'Date', element: 'Date' },
      { id: 'time', text: 'Time', element: 'Time' },
      { id: 'number', text: 'Number', element: 'Number' },
      { id: 'text-only', text: 'Read-only text', element: 'Read-only text', hidden: true },
      { id: 'table', text: 'Table', element: 'Table' },
      { id: 'docs', text: 'Upload Pdf', element: 'Pdf' },
      { id: 'images', text: 'Upload Image', element: 'Image' },
      { id: 'blank', text: 'Blank new page', element: 'Blank new page' }
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
      format: '',
      name: keyValue,
      key: keyValue,
      field_name: '',
      description: '',
      meta_data: { pageNumber: this.activeDocPage },
      pageNumber: this.activeDocPage,
      required: false,
      readonly: false,
      defaultValue: this.typesByField[this.newFieldType].defaultValue,
      rows: this.typesByField[this.newFieldType].rows,
      cols: this.typesByField[this.newFieldType].cols
    };

    if (this.newFieldType !== 'table') {
      delete fields.rows;
      delete fields.cols;
    }

    return fields;
  }
}
