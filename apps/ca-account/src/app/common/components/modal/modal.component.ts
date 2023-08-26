import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * Modal component.
 */
@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Input() isLocked = false;
  @Input() width?: number;
  @Input() height?: number | null;
  @Input() position: 'absolute' | 'fixed' = 'absolute';

  @Output() close = new EventEmitter<void>();

  /**
   * Emits to close modal.
   */
  public onClose(): void {
    this.close.emit();
  }
}
