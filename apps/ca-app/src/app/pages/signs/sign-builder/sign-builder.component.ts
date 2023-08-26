import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ApplicationRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { format, utcToZonedTime } from 'date-fns-tz';
import { DatePipe } from '@angular/common';
import { Role } from '@app/interfaces/role.interface';

import { CasesService } from '../../../services/cases.service';
import { SignsService } from '../../../services/signs.service';
import { UserService } from '../../../services/user.service';
import { LocalTranslationService } from '../../../services/local-translation.service';
import { StylesService } from '../../../services/styles.service';
import { FormModel } from '../../forms/models/FormModel';
import { UtilsService } from '../../../services/utils.service';
import { HostService } from '../../../services/host.service';
import { OptionsService } from '../../../services/options.service';
import { Person } from '../../../shared/document-forms-builder';
import {
  Notification,
  PopInNotificationConnectorService
} from '../../../directives/component-directives/pop-in-notifications/pop-in-notification-connector.service';
import { FeedMediaService, IAllowedFileSizes } from '../../../services/feed-media.service';
import { SrcRequest } from '../../../models/SrcRequest';
import { TimePipe } from '../../../pipes/time.pipe';
import { environment } from '../../../../environments/environment';
import { IFileToUpload } from '../../feeds/models/feed.model';
import { FeedsService } from '../../../services/feeds.service';
import { RolesService } from '../../../services/roles.service';
import { IUserFields } from '../../../interfaces/user.interface';

@Component({
  selector: 'app-sign-builder',
  templateUrl: './sign-builder.component.html',
  styleUrls: ['./sign-builder.component.css'],
  providers: [TimePipe, DatePipe]
})
export class SignBuilderComponent implements OnInit, OnDestroy {
  @Input() caseId?: string;
  @Input() sign?: any;
  @Input() people: Person[] = [];
  @Output() close = new EventEmitter();

  signModel: FormModel = new FormModel();
  loading = true;
  properties: any = [];
  validationErrors = [];
  validationErrorsPopUp: any[] = [];
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
  pagelength = true;
  editingField: any = {};
  answer_ct = 0;
  formTouched = false;
  blockFields = false;
  formIsValid?: boolean;
  optionsSupport: any = {
    dropdown: true,
    multidropdown: true,
    checkboxes: true,
    options: true
  };
  activeParticipants: any[] = [];
  initialParicipants: Role[] = [];
  participants: any = {};
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
  submission = {};
  components?: any;
  privateCDN = environment.PRIVATE_CDN_URL + '/';
  isPreview = false;
  selectedPopupMenu = -1;
  fieldsList?: any[];
  supportedExtensions: any;
  uploadingGoes = false;
  docData: any = {};
  documentKey = '';
  team: any = [];
  roleNamesById: any = {};
  isSaving = false;
  public rolesList: { name: string; role_id: string }[] = [];
  required_userfield = [];
  required_field?: string[];
  selectedElementPopupMenu = -1;
  public selectedItem = '';
  public keyword: string = '';
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
    }
  ];

  private signId?: string;
  private typesByField: any = {};
  private acceptableFields: string[] = [];
  private unsubscribe$: Subject<void> = new Subject();
  private destroy$ = new Subject<void>();

  get currentTime() {
    const currentTime = new Date().toLocaleTimeString();
    return currentTime.split(' ')[0].split(':');
  }

  constructor(
    public timePipe: TimePipe,
    public datePipe: DatePipe,
    private rolesService: RolesService,
    public utilsService: UtilsService,
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
    private contentMediaService: FeedMediaService,
    private optionsService: OptionsService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(`${this.hostService.appName} | E-signs`);
    this.typesByField = this.utilsService.generateTypesByFields();
    this.acceptableFields = this.utilsService.generateAcceptableFields();
    this.fieldsList = this.generateFieldsList().filter(item => !item.hidden);
    this.loadExtensions();
    this.rolesList = this.rolesService.rolesList;
    this.rolesList.map(v => (this.roleNamesById[v.role_id] = v.name));
    // Get user roles
    this.rolesService.rolesGetSub.subscribe(item => {
      item.map((v: any) => {
        this.roleNamesById[v.role_id] = v.name;
      });
    });

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

    // Get case team information
    this.userService.getTeamData.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.people = data!.items
        .filter((v: any) => v.case_role_id !== 'role::bots')
        .map((usr: any) => ({
          id: usr.user_id,
          text: usr.sync_info
            ? usr.sync_info.given_name + ' ' + usr.sync_info.family_name
            : usr.given_name + ' ' + usr.family_name,
          role_id: usr.role_id
        }));
      this.initialParticipant();
      data ? (this.team = data.items) : (this.team = [this.userService.userData]);
    });

    this.userService.getCasePermissionsData.subscribe(data => {
      if (data.role.file_size) {
        this.allowedFileSizes = data.role.file_size;
      }
    });

    if (this.caseId) {
      this.loadOpenedSignInformation();
    } else {
      this.casesService.getCaseId.pipe(takeUntil(this.unsubscribe$)).subscribe(res => {
        this.caseId = res['case_id'];
        this.loadOpenedSignInformation();
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
        () => {
          this.notificationsService.ok(notification, 'Sign Updated');
          this.router.navigate(['/e-signs']);
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
            this.errorD
              .showError(err.error.error.message)
              .pipe(takeUntil(this.unsubscribe$))
              .subscribe(errorMessage => this.notificationsService.failed(notification, errorMessage));
          }
          this.signsService.toggleSignBuilder(published === 1 ? 0 : 1);
        }
      );
  }

  // Check on valid state builder
  currentIsNotValid() {
    return ~this.validationErrorsPopUp.indexOf(this.editingField.name);
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
    // let tempPageData = JSON.parse(JSON.stringify(this.pageData));
    // this.pageData = {};
    // Object.values(tempPageData).map((item: any, index:any) => {
    //   this.pageData[index] = item;
    // });
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
          title: this.editingField.title,
          description: mediaId,
          require: this.editingField.require,
          readonly: this.editingField.readonly
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
      this.isSaving = true;

      let notification: Notification;

      if (this.signsService.checkRoutes()) {
        notification = this.notificationsService.addNotification({
          title: `Saving field`
        });
      }

      this.signsService.updateForm(this.caseId as any, this.signModel, this.signModel.sign_id).subscribe(
        () => {
          this.blockFields = false;
          this.isSaving = false;

          if (this.signsService.checkRoutes()) {
            this.notificationsService.ok(notification, 'E-sign Updated');
          }
        },
        err => {
          this.isSaving = false;

          if (this.signsService.checkRoutes()) {
            this.notificationsService.failed(notification, err.message);
          }
        }
      );
    }
    this.calcFieldPosition();
    await this.loadMediaInfo();
    await this.loadExistingSignInfo();
  }

  private async loadMediaInfo() {
    if (this.signModel.sign_id) {
      const res = await this.signsService.getFormInfo(this.caseId as any, this.signModel.sign_id).toPromise();
      this.mediaList = res?.media || {};
    }
  }

  changeReadOnlyToogle($event: any) {
    this.editingField.readonly = $event;
  }

  checkEditingFieldValidation() {
    let retValue = false;
    if (this.editingField.fieldType !== 'text-only') {
      retValue = !this.fieldParticipants?.length || !this.editingField?.title;
    } else {
      retValue = !this.fieldParticipants?.length;
    }
    return retValue;
  }

  backToSigns(): void {
    if (this.sign) {
      this.close.emit();
    } else {
      //this.router.navigate(['/signs']);
      this.router.navigate(['/e-signs'], { queryParams: { tab: 'published' } });
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

  // Show error with requests failed
  // private showError(errorVariable: any, error: any) {
  //   if (this.errorD.errorsDictionary) {
  //     this[errorVariable] = this.errorD.errorsDictionary[error] ? this.errorD.errorsDictionary[error] : error;
  //   } else {
  //     this.errorD
  //       .loadErrors()
  //       .pipe(takeUntil(this.unsubscribe$))
  //       .subscribe(
  //         () =>
  //           (this[errorVariable] = this.errorD.errorsDictionary[error] ? this.errorD.errorsDictionary[error] : error)
  //       );
  //   }
  // }

  // Checking object keys
  public checkObjectKeys = (v: {[key: string]: any}) => Object.keys(v);

  // Checking object values
  public checkObjectValues = (v: {[key: string]: any}) => Object.values(v);

  // Set default values for sign
  public refreshModal(modalState: any): void {
    modalState ? this.stylesService.popUpActivated() : this.stylesService.popUpDisactivated();
    modalState ? (this.shownDefaultsModal = true) : (this.shownDefaultsModal = false);

    this.fieldParticipants = [];
    this.activeParticipants = [];
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
      { id: 'dropdown', text: 'Multiple choice', element: 'Multiple choice', hidden: false },
      { id: 'options', text: 'Multiple choice', element: 'Multiple choice', hidden: true },
      { id: 'multidropdown', text: 'Checkboxes', element: 'Checkboxes', hidden: false },
      { id: 'checkboxes', text: 'Checkboxes', element: 'Checkboxes', hidden: true },
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
        this.editingField.fieldType = 'multi-text';
      } else if (event.id === 'single') {
        this.editingField.fieldType = 'text';
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
        this.editingField.fieldType = 'multidropdown';
      } else {
        this.editingField.fieldType = 'checkboxes';
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
        this.editingField.fieldType = 'dropdown';
      } else {
        this.editingField.fieldType = 'options';
      }
    }
  }

  public addField(): void {
    if (this.newFieldType === 'blank') {
      this.addNewDocumentPage();
    } else {
      this.newProperty = this.generateNewPropertiesList();
      this.editingField = null;
      switch (this.newFieldType) {
        case 'multidropdown':
          this.addFieldTitle = 'Checkboxes ';
          break;
        case 'checkboxes':
          this.addFieldTitle = 'Checkboxes ';
          break;
        case 'text':
          this.addFieldTitle = 'Text ';
          break;
        case 'multi-text':
          this.addFieldTitle = 'Multi Text ';
          break;
        case 'dropdown':
          this.addFieldTitle = 'Multiple Choice ';
          break;
        case 'options':
          this.addFieldTitle = 'Multiple Choice ';
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

  // Updating changed option
  public updateOption(event: any): void {
    event.preventDefault();
    if (this.editingField.fieldType === 'multidropdown' || this.editingField.fieldType === 'checkboxes') {
      this.editingField.items.enum[this.editOptionIndex as number] = this.fieldValue;
      this.editingField.items.enum = this.editingField.items.enum.slice();
    } else {
      this.editingField.enum[this.editOptionIndex as number] = this.fieldValue;
      this.editingField.enum = this.editingField.enum.slice();
    }
    this.editOptionAction = false;
    this.fieldValue = '';
  }

  // Set option info in input field for options and activate botton for update too
  public editPropertyOption(ident: number): void {
    if (this.editingField.fieldType === 'multidropdown' || this.editingField.fieldType === 'checkboxes') {
      this.fieldValue = this.editingField.items.enum[ident];
    } else {
      this.fieldValue = this.editingField.enum[ident];
    }
    this.editOptionIndex = ident;
    this.editOptionAction = true;
  }

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
    let tempPosition: any = [];
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
      const sortedElements = beforeKeyList.map((key: string) => elementList.filter((item: any) => item.scope.split('/')[2] === key)[0]);
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
      const sortedElements = beforeKeyList.map((key: string) => elementList.filter((item: any) => item.scope.split('/')[2] === key)[0]);
      this.pageData[this.activeDocPage - 1].ui_schema.elements = new Array();
      Object.assign(this.pageData[this.activeDocPage - 1].ui_schema.elements, sortedElements);
      this.calcFieldPosition();
      this.save();
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

  public formatInTimeZone(date: string | Date, fmt: string, tz: string) {
    return format(utcToZonedTime(date, tz), fmt, { timeZone: tz });
  }

  public saveField() {
    if (this.editingField.fieldType === 'time' && this.editingField.defaultValue) {
      this.editingField.defaultValue = this.formatInTimeZone(this.editingField.defaultValue, 'kk:mm:ssxxx', 'UTC');
    }
    this.participants[this.editingField.key] = { users: this.fieldParticipants };
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
        type: this.editingField.type,
        fieldType: this.editingField.fieldType,
        description: this.editingField.defaultValue || '',
        format: this.editingField.format || '',
        require: this.editingField.require,
        readonly: this.editingField.readonly
      };
      if (this.editingField.fieldType === 'multidropdown' || this.editingField.fieldType === 'checkboxes') {
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
            this.editingField.defaultValue || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].format = this.editingField.format || '';
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].title = this.editingField.title;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].type = this.editingField.type;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].key = this.editingField.key;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].require = this.editingField.require;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].readonly = this.editingField.readonly;
          this.pageData[this.activeDocPage - 1].schema.properties[item.key].fieldType = this.editingField.fieldType;
          if (this.editingField.fieldType === 'multidropdown' || this.editingField.fieldType === 'checkboxes') {
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
    this.requiredChanged(this.editingField.require, this.editingField);
    setTimeout(() => {
      this.calcFieldPosition();
    });
    this.save();
    this.refreshPreview();
    this.refreshModal(false);
  }

  // Add option for field
  public addOption(event: any) {
    event.preventDefault();

    let canAdd = true;
    const limit = this.typesByField[this.editingField.fieldType].itemsToAddLimit;

    if (limit) {
      if (this.editingField.fieldType === 'multidropdown' || this.editingField.fieldType === 'checkboxes') {
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
      if (this.editingField.fieldType === 'multidropdown' || this.editingField.fieldType === 'checkboxes') {
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
  }

  // Delete property option from field
  public deletePropertyOption(ind: number) {
    if (this.editingField.fieldType === 'multidropdown' || this.editingField.fieldType === 'checkboxes') {
      this.editingField.items.enum.splice(ind, 1);
      this.editingField.items.enum = this.editingField.items.enum.slice();
    } else {
      this.editingField.enum.splice(ind, 1);
      this.editingField.enum = this.editingField.enum.slice();
    }
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
    delete this.participants[propertyKey];
    this.save();
  }

  public runFieldCopy(fl: any) {
    this.editingField = this.utilsService.copy(fl);
    this.editingField.defaultValue = fl.description;
    this.editingField.key = this.generateRandomName(10);
    this.participants[this.editingField.key] = this.participants[fl.key];
    this.fieldParticipants = this.participants[this.editingField.key].users;
    this.fieldParticipants.map((item: any) => {
      this.activeParticipants.push(this.team.filter((t: any) => t.user_id === item)[0]);
    });
    this.saveField();
  }

  // Prepearing for field edit
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
    this.defaultTextType = 'single';
    if (fl.fieldType === 'multi-text') {
      this.defaultTextType = 'multi';
    }
    this.defaultDropDownLayout = 'dropdown';
    if (fl.fieldType === 'options') {
      this.defaultDropDownLayout = 'options';
    }
    this.editingField.index = index;
    this.fieldParticipants = this.participants[this.editingField.key].users;
    this.fieldParticipants.map((item: any) => {
      this.activeParticipants.push(this.team.filter((t: any) => t.user_id === item)[0]);
    });
  }

  public loadUserAnswer(answers: any) {
    const answer = answers[(Object.keys(answers) as any).find((user_id: any) => user_id === this.userId)];
    Object.assign(this.submission, answer && answer.page_answers[0]);
  }

  private loadExistingSignInfo() {
    if (this.signModel.sign_id) {
      this.blockFields = true;
      this.userService.getPossibleVariable(this.caseId as any).subscribe(res => {
        this.required_userfield = res.data.host.require_userfields;
        this.optionsService
          .userFields()
          .pipe(takeUntil(this.destroy$))
          .subscribe((userFields: IUserFields) => {
            this.required_field = this.required_userfield.map(userFieldKey => '${' + userFields[userFieldKey] + '}');
          });
      });
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
        this.signModel.published = signModel.published;
        this.signModel.pages_ct = signModel.pages_ct;
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
          componentItem['values'] = item.enum.map((option: string) => ({
            value: option,
            label: option
          }));
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
            values: item.items.enum.map((option: any) => ({
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

  previewSign(): void {
    this.refreshPreview();
    this.isPreview = !this.isPreview;
    setTimeout(() => {
      this.calcFieldPosition();
    });
  }

  showPopupMenu(index: any): void {
    if (this.selectedPopupMenu === index) {
      this.selectedPopupMenu = -1;
    } else {
      this.selectedPopupMenu = index;
    }
  }

  duplicatePage(index: any): void {
    const lastIndex = Object.keys(this.pageData).length;
    let tempPageData = JSON.parse(JSON.stringify(this.pageData));
    tempPageData[lastIndex] = tempPageData[index];
    this.pageData = tempPageData;
    this.selectedPopupMenu = -1;
    this.save();
  }

  deletePage(index: any): void {
    delete this.pageData[index];
    let tempPageData = JSON.parse(JSON.stringify(this.pageData));
    this.pageData = {};
    Object.values(tempPageData).map((item: any, index: any) => {
      this.pageData[index] = item;
    });
    this.selectedPopupMenu = -1;
    this.save();
  }

  moveUpPage(index: any): void {
    if (index > 0) {
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      const upItem = tempPageData[index - 1];
      const downItem = tempPageData[index];
      tempPageData[index] = upItem;
      tempPageData[index - 1] = downItem;
      this.pageData = tempPageData;
    }
    this.selectedPopupMenu = -1;
    this.save();
  }

  moveDownPage(index: any): void {
    const lastIndex = Object.keys(this.pageData).length - 1;
    if (index < lastIndex) {
      let tempPageData = JSON.parse(JSON.stringify(this.pageData));
      const upItem = tempPageData[index];
      const downItem = tempPageData[index + 1];
      tempPageData[index] = downItem;
      tempPageData[index + 1] = upItem;
      this.pageData = tempPageData;
    }
    this.selectedPopupMenu = -1;
    this.save();
  }

  onFieldTypeSelectChange({ id }: { id: string; text: string }) {
    this.newFieldType = id;
  }

  getElement(fieldType: any): string {
    return this.fieldsList?.filter(item => item.id === fieldType)[0].element;
  }

  // Change field position
  public changePosition(e: any, fl: any) {
    if (this.pageData[this.activeDocPage - 1]?.schema?.properties[fl.key]) {
      this.pageData[this.activeDocPage - 1].schema.properties[fl.key].top = e.top;
      this.pageData[this.activeDocPage - 1].schema.properties[fl.key].height = e.height;
    }
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

  // Handling file upload
  public handleFileUpload(target: HTMLInputElement): void {
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
    const notification: Notification = this.notificationsService.addNotification({
      title: 'Uploading'
    });
    const tag_id = fileToUpload.fileData.name.replace(/[^A-Za-z1-90-]/g, '-');
    this.uploadingGoes = true;
    this.feedsService
      .getUploadParams(
        this.caseId as any,
        fileToUpload.fileGroup,
        fileToUpload.extension,
        this.afterUpdateNavigation === '/e-signs/' ? 'signs' : 'forms',
        this.signModel.sign_id as any,
        tag_id
      )
      .subscribe(
        res => {
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

  public initialParticipant(): void {
    this.initialParicipants = [];
    this.people.map(pl => {
      this.initialParicipants.push({
        role_id: pl.id!,
        name: pl.text!
      });
    });
  }

  public setParticipant(participant: string[]) {
    this.fieldParticipants = [];
    this.activeParticipants = [];

    participant.map(item => {
      this.fieldParticipants.push(item);
      this.activeParticipants.push(this.team.filter((t: any) => t.user_id === item)[0]);
    });
  }

  public removeParticipant(index: any) {
    this.fieldParticipants.splice(index, 1);
    this.activeParticipants = [];
    this.fieldParticipants.map((item: any) => {
      this.activeParticipants.push(this.team.filter((t: any) => t.user_id === item)[0]);
    });
  }

  public shorTitleName(val: string, am: number) {
    return val ? (val.length > am ? val.substring(0, am) + '...' : val) : '';
  }

  selectEvent($event: any) {
    this.editingField.defaultValue = $event;
  }

  onChangeSearch($event: any) {
    this.editingField.defaultValue = $event;
  }

  showElementPopupMenu(index: any): void {
    if (this.selectedElementPopupMenu === index) {
      this.selectedElementPopupMenu = -1;
    } else {
      this.selectedElementPopupMenu = index;
    }
  }

  changeStyle($event: any, data: any) {
    this.selectedItem = $event.type == 'mouseover' ? data.key : '';
  }
}
