import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-form-field-selector',
  templateUrl: './form-field-selector.component.html',
  styleUrls: ['./form-field-selector.component.css']
})
export class FormFieldSelectorComponent {
  @Output() selected: EventEmitter<string> = new EventEmitter<string>();

  public fieldType: string = '';

  constructor() {}

  addField() {
    this.selected.emit(this.fieldType);
  }
}
