import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { Role } from '@app/interfaces/role.interface';

@Component({
  selector: 'app-checkbox-select',
  templateUrl: './checkbox-select.component.html',
  styleUrls: ['./checkbox-select.component.css']
})
export class CheckboxSelectComponent implements OnChanges {
  @Input() outputValue?: string[];
  @Input() items!: Role[];
  @Input() hideLable?: boolean;
  @Input() enabled?: boolean;
  @Input() permissionsInitialListStr: string = 'Everybody can see';
  @Input() isCustomActiveApplied: boolean = false;
  @Input() withImage: boolean = false;
  @Output() valueChange: EventEmitter<string[]> = new EventEmitter<string[]>();

  public permissionsListStr?: string;
  public usersListWithImage: Role[] = [];
  public showClass = false;

  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    this.showClass = !!this.element.nativeElement.contains(event.target);
  }

  constructor(public element: ElementRef) {}

  ngOnChanges() {
    this.choosedPrmissionsNames();
  }

  // Choosed permission name
  public choosedPrmissionsNames(): void {
    this.usersListWithImage = [];
    this.permissionsListStr =
      this.outputValue && this.items && this.outputValue.length === this.items.length
        ? (this.usersListWithImage = [...this.items]) && this.permissionsInitialListStr
        : this.items
            ?.filter((v) => this.outputValue?.includes(v.role_id!))
            .map(v => {
              this.usersListWithImage.push(v);
              return v.name;
            })
            .join(', ');
  }

  // Toggle one permission item
  public togglePermission(roleId: string): void {
    if (this.enabled) {
      if (!Array.isArray(this.outputValue)) {
        this.outputValue = []
      }

      const indx = this.outputValue?.indexOf(roleId);

      if (indx === -1) {
        this.outputValue?.push(roleId);
      } else {
        this.outputValue?.splice(indx!, 1);
      }

      this.valueChange.emit(this.outputValue);
      this.choosedPrmissionsNames();
    }
  }

  // Toggle all permissions items
  public toggleAllPermissions(): void {
    if (this.enabled) {
      if (this.outputValue && this.outputValue.length) {
        this.outputValue.splice(0, this.outputValue.length);
      } else {
        this.outputValue = this.items.map(item => item.role_id);
      }

      this.valueChange.emit(this.outputValue);
      this.choosedPrmissionsNames();
    }
  }
}
