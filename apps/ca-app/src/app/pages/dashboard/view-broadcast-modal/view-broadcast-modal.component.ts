import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Broadcast } from '@app/interfaces';

@Component({
  selector: 'app-view-broadcast-modal',
  templateUrl: './view-broadcast-modal.component.html',
  styleUrls: ['./view-broadcast-modal.component.css']
})
export class ViewBroadcastModalComponent {
  @Input() broadcast?: Broadcast;

  @Output() close = new EventEmitter<void>();

  closeModal(): void {
    this.close.next();
  }
}
