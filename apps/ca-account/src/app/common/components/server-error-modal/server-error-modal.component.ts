import { Component, Renderer2, ViewChild, ElementRef } from '@angular/core';

/**
 * Server error modal component.
 */
@Component({
  selector: 'app-server-error-modal',
  templateUrl: './server-error-modal.component.html',
  styleUrls: ['./server-error-modal.component.css']
})
export class ServerErrorModalComponent {
  @ViewChild('popUp') popUp?: ElementRef<HTMLDivElement>;

  constructor(private renderer: Renderer2) {}

  /**
   * Closes modal.
   */
  public closeModal(): void {
    this.renderer.removeClass(this.popUp?.nativeElement, 'shown');
  }
}
