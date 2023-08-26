import { Component, Input, OnChanges, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-checkbox-select',
  templateUrl: './checkbox-select.component.html',
  styleUrls: ['./checkbox-select.component.css']
})
export class CheckboxSelectComponent implements OnChanges, OnInit {
  @ViewChild('checkboxLabel', { static: true }) checkboxLabelElem?: ElementRef;
  @ViewChild('checkboxList', { static: true }) checkboxListElem?: ElementRef;

  @Input() outputValue!: any[];
  @Input() items: any;
  @Input() hideLable?: boolean;
  @Output() valueChange = new EventEmitter<any>();

  permissionsListStr?: string;
  toggleActive = false;

  constructor() {}

  ngOnInit() {
    document.addEventListener('click', this.docClickHandler.bind(this));
  }

  ngOnChanges(): void {
    this.choosedPrmissionsNames();
  }

  // Add or remove permissions without list
  private choosedPrmissionsNames(): void {
    this.permissionsListStr =
      this.outputValue && this.outputValue.length
        ? this.items
            .filter((v: any) => this.outputValue.indexOf(v.role_id) > -1)
            .map((v: any) => v.name)
            .join(', ')
        : '';
  }

  // Option toggle
  public togglePermission(roleId: string): void {
    const indx = this.outputValue.indexOf(roleId);

    if (indx === -1) {
      this.outputValue.push(roleId);
    } else {
      this.outputValue.splice(indx, 1);
    }

    this.valueChange.emit(this.outputValue);
    this.choosedPrmissionsNames();
  }

  // All option toggle
  public toggleAllPermissions(toAll: any): void {
    if (this.outputValue.length < this.items.length) {
      for (const item of this.items) {
        const indx = this.outputValue.indexOf(item.role_id);

        if (indx === -1) {
          this.outputValue.push(item.role_id);
        }
      }
      toAll.checked = true;
    } else if (this.outputValue.length === this.items.length) {
      this.outputValue.splice(0);
      toAll.checked = false;
    }

    this.valueChange.emit(this.outputValue);
    this.choosedPrmissionsNames();
  }

  private docClickHandler(event: any) {
    this.toggleActive =
      this.checkboxLabelElem?.nativeElement.contains(event.target) ||
      this.checkboxListElem?.nativeElement.contains(event.target);
  }
}
