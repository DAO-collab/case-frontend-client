import { Component, Output, EventEmitter } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'app-add-field',
  templateUrl: './add-field.component.html',
  styleUrls: ['./add-field.component.css']
})
export class AddFieldComponent {
  @Output() add: EventEmitter<any> = new EventEmitter<any>();
  @Output() typeChange: EventEmitter<any> = new EventEmitter<any>();

  public fieldType = new UntypedFormControl();
  public ngSelectValues = [
    { value: 'text', text: 'Text' },
    { value: 'dropdown', text: 'Single Choice' },
    { value: 'multidropdown', text: 'Multi Choice' },
    { value: 'date', text: 'Date' },
    { value: 'time', text: 'Time' },
    { value: 'number', text: 'Number' }
  ];

  /**
   * Emit form type change
   */
  public onFormTypeChange() {
    this.typeChange.emit(this.fieldType.value);
  }

  /**
   * Emit add button click and reset selected option
   */
  public addField() {
    if (this.fieldType?.value) {
      this.add.emit(this.fieldType.value);
      this.fieldType.reset();
    }
  }
}
