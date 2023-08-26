import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-no-permission-to-case-modal',
  templateUrl: './no-permission-to-case-modal.component.html',
  styleUrls: ['./no-permission-to-case-modal.component.css']
})
export class NoPermissionToCaseModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }
}
