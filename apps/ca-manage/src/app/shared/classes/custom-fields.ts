import { Directive, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { format, utcToZonedTime } from 'date-fns-tz';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import * as _ from 'lodash';

import {
  Notification,
  PopInNotificationConnectorService
} from '../../common/components/pop-in-notifications/pop-in-notification-connector.service';
import { AdminService } from '../../services/admin.service';
import { UtilsService } from '../../services/utils.service';
import { StylesService } from '../../services/styles.service';
import { HostService } from '../../services/host.service';
import { DesignService } from '../../services/design.service';

@Directive()
export class CustomField implements OnInit {
  public formType?: string;
  public schemaType?: string;
  public loading = true;
  public message = '';
  public errorMessage = '';
  public properties: any[] = [];
  public propertiesOrder: any[] = [];
  public validationDefaultsErrors: any[] = [];
  public newFieldType = '';
  public noFields = false;
  public shownDefaultsModal = false;
  public editCustomFields = true;
  public editingField: any = {};
  public customValues = {};
  public caseTypeList = [];
  public addFieldFormTouched?: boolean;
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
      itemsToAddLimit: 5,
      defaultValue: []
    },
    date: {
      type: 'string',
      pattern: '^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$',
      defaultValue: ''
    },
    time: {
      type: 'string',
      defaultValue: '',
      format: 'time'
    },
    boolean: { type: 'boolean', defaultValue: false },
    number: { type: 'number', defaultValue: 0 }
  };

  get headersLength(): number {
    return this.properties.filter((p: any) => p.header).length;
  }

  constructor(
    public adminService: AdminService,
    public utils: UtilsService,
    public stylesService: StylesService,
    public notificationsService: PopInNotificationConnectorService,
    public titleService: Title,
    private designService: DesignService,
    public hostService: HostService
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${this.hostService.appName} | Settings`);
    this.loading = true;
    this.message = '';
    this.errorMessage = '';
    this.addFieldFormTouched = false;
    let schema = this.hostService.noteSchema;
    let uiSchema = this.hostService.noteUiSchema;
    switch (this.schemaType) {
      case 'cases':
        schema = this.hostService.caseSchema;
        uiSchema = this.hostService.caseUiSchema;
        break;
      case 'users':
        schema = this.hostService.userSchema;
        uiSchema = this.hostService.userUiSchema;
        break;
      case 'notes':
        schema = this.hostService.noteSchema;
        uiSchema = this.hostService.noteUiSchema;
        break;
    }
    if (!schema) {
      this.noFields = true;
    } else {
      this.properties = [];
      this.propertiesOrder = [];
      schema.required = schema.required ? schema.required : [];
      schema.header = schema.header ? schema.header : [];
      // convert schema to properties array
      _.forEach(schema.properties, (field, fieldName) => {
        const isRequired = schema?.required?.indexOf(fieldName) !== -1; // check if field is required or not
        const isHeader = schema?.header?.indexOf(fieldName) !== -1; // check if field is required or not

        const property: any = field;
        property.name = fieldName;
        property.readonly = !property.readonly;
        property.required = isRequired;
        property.header = isHeader;

        if (this.typesByField[field.fieldType].items) {
          if (field.items) {
            property['items'] = field.items;
          } else {
            property['items'] = this.typesByField[field.fieldType].items;
          }
        }

        this.properties.push(property);
        this.propertiesOrder.push(fieldName);
      });

      if (this.properties.length === 0) {
        this.noFields = true;
      } else {
        this.noFields = false;
      }

      if (uiSchema && uiSchema.elements) {
        this.propertiesOrder = [];
        uiSchema.elements.map(element => {
          this.propertiesOrder.push(element.scope.split('/')[2]);
        });
      }
    }
    this.designService.getCompanyInfo().subscribe(response => {
      this.caseTypeList = response?.case_types || ['general'];
    });
    this.loading = false;
  }

  public requiredChanged(field: any) {
    this.properties.map((item, index) => {
      if (item.name === field.name) {
        this.properties[index].required = !this.properties[index].required;
      }
    });
    this.save();
  }

  public readOnlyChanged(field: any) {
    this.properties.map((item, index) => {
      if (item.name === field.name) {
        this.properties[index].readonly = !this.properties[index].readonly;
        if (this.properties[index].readonly) {
          this.properties[index].required = false;
        } else {
          this.properties[index].required = true;
        }
      }
    });
    this.save();
  }

  public onTypeChange(type: string) {
    this.newFieldType = type;
  }

  public addField() {
    const keyValue = this.utils.get_random(10);
    const newProperty: any = {
      type: this.typesByField[this.newFieldType].type,
      fieldType: this.newFieldType,
      title: '',
      name: keyValue,
      field_name: '',
      description: '',
      required: true,
      header: !this.headersLength,
      readonly: true,
      defaultValue: this.typesByField[this.newFieldType].defaultValue
    };

    if (this.typesByField[this.newFieldType].pattern) {
      newProperty.pattern = this.typesByField[this.newFieldType].pattern;
    }

    if (this.typesByField[this.newFieldType].items) {
      newProperty['items'] = this.typesByField[this.newFieldType].items;
      newProperty.items.enum = [];
    }
    if (this.newFieldType === 'date') {
      newProperty.defaultValue = new Date().toLocaleDateString('en-US');
    } else if (this.newFieldType === 'time') {
      newProperty.defaultValue = new Date();
    }

    this.newFieldType = '';
    this.shownDefaultsModal = true;
    this.editCustomFields = true;
    this.editingField = newProperty;
    this.stylesService.popUpActivated();
  }

  convertTime(value: any, timePeriod = false) {
    if (timePeriod) {
      let period;

      value >= 12 ? (period = 'PM') : (period = 'AM');

      return period;
    } else {
      if (value > 12) {
        return '0' + (value - 12);
      }

      return value;
    }
  }

  formatInTimeZone(date: Date | string, fmt: string, tz: string) {
    let dateFormat = format(utcToZonedTime(date, tz), fmt, { timeZone: tz });

    // tslint:disable-next-line:triple-equals
    if (
      (dateFormat.slice(0, 2) as any) == 24 &&
      (((dateFormat.slice(3, 5) as any) >= 1 || dateFormat.slice(6, 8)) as any) >= 1
    ) {
      dateFormat =
        '00' + ':' + dateFormat.slice(3, 5) + ':' + dateFormat.slice(6, 8) + dateFormat.slice(8, dateFormat.length);
    }

    return dateFormat;
  }

  public saveDefaultValue() {
    if (this.editCustomFields) {
      if (this.editingField.fieldType === 'time' && this.editingField.defaultValue) {
        this.editingField.defaultValue = this.formatInTimeZone(this.editingField.defaultValue, 'kk:mm:ssxxx', 'UTC');
      }
      if (this.editingField.key !== undefined) {
        this.properties[this.editingField.key].defaultValue = this.editingField.defaultValue;

        if (this.editingField.items) {
          this.properties[this.editingField.key].items = this.editingField.items;
        }

        this.properties[this.editingField.key].title = this.editingField.title;
        this.properties[this.editingField.key].description = this.editingField.description;

        this.save();
      } else {
        this.propertiesOrder.push(this.editingField.name);
        this.properties.push(this.editingField);
        this.save();
      }
    } else {
      this.saveCaseType(this.editingField?.items?.enum || ['general']);
    }
  }

  public schemaList() {
    return this.propertiesOrder.map(key => this.properties.filter(item => item.name === key)[0]);
  }

  public saveCaseType(typeList: any) {
    const notification: Notification = this.notificationsService.addNotification({
      title: `${this.formType} updating `
    });
    this.designService
      .updateCompanyInfo({ case_types: typeList })
      .pipe(
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          this.notificationsService.failed(notification, ` Case Types updated `);
          return throwError(res.error);
        })
      )
      .subscribe(() => {
        this.caseTypeList = typeList;
        this.notificationsService.ok(notification, ` Case Types updated `);
        this.errorMessage = '';
        this.shownDefaultsModal = false;
        this.noFields = false;
        delete this.editingField?.items?.emnu;
        this.stylesService.popUpDisactivated();
      });
  }

  public save(noPostSave?: any) {
    const notification: Notification = this.notificationsService.addNotification({
      title: `${this.formType} updating `
    });

    const formSchema: any = { type: 'object' },
      required: any = [],
      header: any = [],
      properties: any = {};
    const uiSchema: any = { type: 'VerticalLayout', elements: [] };

    _.forEach(this.properties, field => {
      // check if required and populate
      if (field.required && !!field.readonly && required.indexOf(field.name) === -1) {
        required.push(field.name);
      }
      // check if header
      if (field.header && header.indexOf(field.name) === -1) {
        header.push(field.name);
      }

      properties[field.name] = {};
      properties[field.name].type = this.typesByField[field.fieldType].type;
      properties[field.name].fieldType = field.fieldType;
      properties[field.name].description = field.description;
      properties[field.name].title = field.title;
      properties[field.name].readonly = !field.readonly;
      properties[field.name].defaultValue = field.defaultValue;

      if (field.header !== undefined) {
        properties[field.name].asColumn = field.asColumn;
      }

      if (this.typesByField[field.fieldType].pattern) {
        properties[field.name].pattern = this.typesByField[properties[field.name].fieldType].pattern;
      }

      if (this.typesByField[field.fieldType].items) {
        if (field.items) {
          if (field.items.enum) {
            if (field.items.enum.length === 0) {
              delete field.items.enum;
            }
          }

          properties[field.name].items = field.items;
        }
      }
    });

    if (required.length) {
      formSchema['required'] = required;
    }

    if (header.length) {
      formSchema['header'] = header;
    }

    if (!_.isEqual(properties, {})) {
      formSchema['properties'] = properties;
    }

    if (this.properties.length !== 0) {
      this.noFields = false;
    }

    this.propertiesOrder.map(key => {
      uiSchema.elements.push({
        type: 'Control',
        scope: '#/properties/' + key
      });
    });

    const submitData = { pages: [{ schema: formSchema, ui_schema: uiSchema }] },
      postSave = () => {
        this.notificationsService.ok(notification, ' Field updated');
        this.errorMessage = '';
        this.shownDefaultsModal = false;
        this.noFields = false;
        this.stylesService.popUpDisactivated();
      };

    this.adminService
      .updateSchema(submitData, this.schemaType!)
      .pipe(
        catchError(res => {
          this.notificationsService.failed(notification, res.message);
          this.notificationsService.failed(notification, ` ${this.formType} updated `);
          return throwError(res.error);
        })
      )
      .subscribe(data => {
        if (!noPostSave) {
          postSave();
        }
        this.notificationsService.ok(notification, ` ${this.formType} updated `);
      });
  }

  public deleteField(i: number) {
    const deletedKey = this.propertiesOrder[i];
    this.propertiesOrder.splice(i, 1);
    let removePropertyIndex = -1;
    this.properties.map((item, index) => {
      if (item.name === deletedKey) {
        removePropertyIndex = index;
      }
    });
    if (removePropertyIndex !== -1) {
      this.properties.splice(removePropertyIndex, 1);
    }

    if (this.properties.length === 0) {
      this.noFields = true;
    }

    this.save();
  }

  public updateActiveOptions() {
    const lookIn = this.editingField['defaultValue'] ? this.editingField['defaultValue'] : [];

    if (this.editingField.fieldType === 'dropdown' && this.editingField.items.enum.indexOf(lookIn) === -1) {
      this.editingField['defaultValue'] = '';
    }
  }

  public getDefaultValue(field: any) {
    field.defaultValue = !field.defaultValue ? '' : field.defaultValue;

    return typeof field.defaultValue === 'object'
      ? field.defaultValue.length
        ? field.defaultValue
            .filter((v: any) => {
              if (!field.items.enum) {
                field.items.enum = [];
              }

              return field.items.enum.indexOf(typeof v === 'object' ? v.id : v) > -1;
            })
            .map((v: any) => (typeof v === 'object' ? v.id : v))
            .join(', ')
        : field.defaultValue.text
      : field.defaultValue;
  }

  public currentIsNotValid() {
    return this.validationDefaultsErrors.indexOf(this.editingField.name + '-f') > -1;
  }

  public activateNativeModal(field: any) {
    this.customValues = {};
    this.shownDefaultsModal = true;
    this.editCustomFields = false;
    this.stylesService.popUpActivated();
    this.editingField = JSON.parse(JSON.stringify(field));
    if (field.title === 'Case Types') {
      this.editingField.key = 0;
      this.editingField['items'] = this.typesByField['dropdown'].items;
      this.editingField.items.enum = this.caseTypeList;
      this.editingField['defaultValue'] = this.caseTypeList[0];
      this.updateActiveOptions();
    }
  }

  public activateDefaultsModal(field: any, key: any) {
    this.customValues = {};
    this.shownDefaultsModal = true;
    this.editCustomFields = true;
    this.stylesService.popUpActivated();
    this.editingField = JSON.parse(JSON.stringify(field));
    this.editingField.key = key;

    const fieldType = this.editingField['fieldType'];
    const defaultValue = this.editingField['defaultValue'];

    if (
      typeof defaultValue === 'object' ||
      fieldType === 'dropdown' ||
      fieldType === 'checkboxes' ||
      fieldType === 'multidropdown'
    ) {
      if (!this.editingField.items.enum) {
        this.editingField.items.enum = [];
      }

      this.updateActiveOptions();
    }
  }
}
