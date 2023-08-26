import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, FormBuilder, UntypedFormArray } from '@angular/forms';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-schema',
  templateUrl: './schema.component.html',
  styleUrls: ['./schema.component.css']
})
export class SchemaComponent implements OnInit {
  @Input() schema: any;
  @Input() uiSchema: any;
  @Input() name?: string;
  @Input() disabled?: boolean;
  @Input() value?: any;
  @Input()
  set valid(value: boolean) {
    this.formValid = value;
    this.validChange.emit(value);
  }
  get valid(): boolean {
    return this.formValid!;
  }

  @Output() valueChange: EventEmitter<boolean> = new EventEmitter();
  @Output() validChange: EventEmitter<boolean> = new EventEmitter();

  formValid?: boolean;
  schemaFormGroup: UntypedFormGroup = new UntypedFormGroup({});
  properties: any[] = [];

  constructor(private utils: UtilsService) {}

  ngOnInit() {
    const properties: any = {};
    this.uiSchema.elements.map((item: any) => {
      const key = item.scope.split('/')[2];
      properties[key] = this.schema.properties[key];
    });
    const required: string[] = this.schema.required || [];

    this.properties = [];

    Object.keys(properties).forEach(pKey => {
      const property = properties[pKey];

      if (property.readonly) return;

      const requiredValidator = required.indexOf(pKey) > -1 ? Validators.required : null;
      const patternValidator = property.pattern ? Validators.pattern(property.pattern) : null;
      const validators: any = [requiredValidator, patternValidator].filter(f => f !== null);
      let fieldValue: any;

      if (property.fieldType === 'time') {
        fieldValue = this.value
          ? this.convertUTCDateToLocalTime(this.value[pKey])
          : this.convertUTCTimeToLocalTime(property.defaultValue);
      } else {
        fieldValue = this.value ? this.value[pKey] : property.defaultValue;
      }

      const formControl =
        property.fieldType === 'checkboxes'
          ? new UntypedFormArray(
              property.items.enum.map((n: string) => new UntypedFormControl(fieldValue.indexOf(n) > -1 ? n : '')),
              validators
            )
          : new UntypedFormControl(fieldValue, validators);
      const controlData = {
        name: pKey,
        control: formControl,
        fieldType: property.fieldType,
        items: property.items,
        title: property.title,
        required: requiredValidator,
        stringValue: SchemaComponent.anyTypeToString(fieldValue)
      };

      this.schemaFormGroup.addControl(pKey, controlData.control);
      this.properties.push(controlData);
    });

    this.schemaFormGroup.valueChanges.subscribe(form => this.updateValueModel(form)); // Update `value` model's value each time form change detected
    this.updateValueModel(this.schemaFormGroup.value); // Update `value` model's value on component initialization
  }

  private updateValueModel(form: any) {
    form = this.utils.copy(form);

    this.valid = this.schemaFormGroup.valid;

    Object.keys(form).forEach(fieldKey => {
      const prop: any = this.properties.find((p: any) => p.name === fieldKey) || {};

      if (prop.fieldType === 'checkboxes') {
        form[fieldKey] = this.checkboxBoolToNormalValue(form[fieldKey], prop.items.enum);
      }

      if (prop.fieldType === 'boolean') {
        form[fieldKey] = this.boolToNormalValue(form[fieldKey]);
      }
    });

    this.valueChange.emit(form);
  }

  public static anyTypeToString(value: any): string {
    let returnValue = '';

    value = value === null ? '' : value;

    switch (typeof value) {
      case 'object':
        if (value.length) {
          returnValue = value.join(', ');
        } else {
          returnValue = Object.keys(value)
            .map(k => {
              return value[k];
            })
            .join(', ');
        }

        break;

      case 'undefined':
        returnValue = '';

        break;

      case 'boolean':
        returnValue = UserFriendlyValue[value.toString() as keyof typeof UserFriendlyValue];

        break;

      default:
        returnValue = value.toString();
    }

    return returnValue;
  }

  private checkboxBoolToNormalValue(list: boolean[], getFrom: string[]): string[] {
    return list.map((v, i) => getFrom[v ? i : 0]).filter(v => v);
  }

  private boolToNormalValue(value: any): boolean {
    return value ? value : false;
  }

  private convertUTCTimeToLocalTime(time: any) {
    const todayDate = new Date().toLocaleDateString();
    const [days, month, year] = [todayDate.slice(0, 2), todayDate.slice(3, 5), todayDate.slice(6, 10)];

    return new Date(`${month}-${days}-${year} ${time}`);
  }

  private convertUTCDateToLocalTime(note: string) {
    if ((new Date(note) as any) !== 'Invalid Date' && !isNaN(new Date(note) as any) && note.length > 11) {
      return new Date(note).toLocaleTimeString();
    }

    return note;
  }
}

enum UserFriendlyValue {
  'true' = 'Yes',
  'false' = 'No'
}

export interface SchemaProperty {
  type: string;
  fieldType: string;
  description: string;
  title: string;
  readonly: false;
  defaultValue: string;
  asColumn: boolean;
}
