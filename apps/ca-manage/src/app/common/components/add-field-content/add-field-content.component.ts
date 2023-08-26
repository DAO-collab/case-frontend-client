import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormControl, UntypedFormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-field-content',
  templateUrl: './add-field-content.component.html',
  styleUrls: ['./add-field-content.component.css']
})
export class AddFieldContentComponent implements OnInit {
  @Input() editingField?: any;
  @Input() customValues?: any;
  @Input() editCustomFields? = true;
  @Output() saveField: EventEmitter<any> = new EventEmitter<any>();

  optionField = new UntypedFormControl('');
  optionExistsError = false;
  optionsLimitError = false;
  editOptionAction = false;
  editOptionIndex: any;
  optionsSupport: any = {
    dropdown: true,
    multidropdown: true,
    checkboxes: true,
    options: true,
    list: true
  };
  validationErrors = [];
  validationDefaultsErrors = [];
  typesByField: any = {
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
    number: { type: 'number', defaultValue: null }
  };
  fieldForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    description: [''],
    defaultValue: ''
  });

  get defaultValue() {
    return this.fieldForm.controls['defaultValue'];
  }

  constructor(private formBuilder: UntypedFormBuilder) {}

  ngOnInit() {
    if (this.editingField) {
      this.fieldForm.patchValue(this.editingField);
    }
  }

  triggerSelectedCheckbox(checkboxId: string) {
    const defaultValue = this.defaultValue.value;

    if (defaultValue.includes(checkboxId)) {
      this.defaultValue.setValue(defaultValue.filter((value: string) => value !== checkboxId));
    } else {
      this.defaultValue.setValue([...defaultValue, checkboxId]);
    }
  }

  /**
   * addOption()
   */
  addOption(event: any) {
    event.preventDefault();
    let canAdd = true;
    const limit = this.typesByField[this.editingField.fieldType].itemsToAddLimit;

    if (limit) {
      if (this.editingField.items.enum.length >= limit) {
        canAdd = false;
      }
    }

    if (canAdd) {
      if (this.editingField.items.enum.indexOf(this.optionField.value) === -1) {
        this.editingField.items.enum = this.editingField.items.enum.concat([this.optionField.value]);
        this.optionField.reset();
        this.optionExistsError = false;
      } else {
        this.optionExistsError = true;
      }
      this.optionsLimitError = false;
    } else {
      this.optionsLimitError = true;
    }

    this.updateActiveOptions();
  }

  deletePropertyOption(ind: number) {
    this.editingField.items.enum.splice(ind, 1);
    this.updateActiveOptions();
  }

  /**
   * editPropertyOption(ind)
   */
  editPropertyOption(ind: number) {
    this.optionField.setValue(this.editingField.items.enum[ind]);
    this.editOptionIndex = ind;
    this.editOptionAction = true;
  }

  /**
   * updateOption($event)
   */
  updateOption(event: any) {
    event.preventDefault();

    this.editingField.items.enum[this.editOptionIndex] = this.optionField.value;
    this.editOptionAction = false;
    this.optionField.reset();
    this.updateActiveOptions();
  }

  updateActiveOptions() {
    const lookIn = this.editingField['defaultValue'] ? this.editingField['defaultValue'] : [];

    if (this.editingField.fieldType === 'dropdown' && this.editingField.items.enum.indexOf(lookIn) === -1) {
      this.editingField['defaultValue'] = '';
    }
  }

  submitField() {
    this.editingField.title = this.fieldForm.value.title;
    this.editingField.name = this.fieldForm.value.title.toLowerCase().split(' ').join('_');
    this.editingField.description = this.fieldForm.value.description;
    this.editingField.defaultValue = this.fieldForm.value.defaultValue;

    this.saveField.emit();
  }
}
