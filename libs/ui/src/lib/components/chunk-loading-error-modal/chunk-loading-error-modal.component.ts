import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ca-chunk-loading-error-modal',
  templateUrl: './chunk-loading-error-modal.component.html',
  styleUrls: ['./chunk-loading-error-modal.component.scss'],
})
export class ChunkLoadingErrorModalComponent {
  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }

  reloadPage(): void {
    window.location.reload();
  }
}
