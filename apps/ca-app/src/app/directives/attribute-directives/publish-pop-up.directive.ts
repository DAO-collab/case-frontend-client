import { Directive, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { PublishPopUpService } from '../../services/publish-pop-up.service';

@Directive({
  selector: '[appPublishPopUp]'
})
export class PublishPopUpDirective {
  @Output() publish: EventEmitter<void> = new EventEmitter<void>();
  @Output() later: EventEmitter<void> = new EventEmitter<void>();
  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  @Input() message?: string;
  @Input() title?: string;
  @Input() canClick: boolean = true;

  constructor(private elementRef: ElementRef, private publishPopUpService: PublishPopUpService) {
    this.elementRef.nativeElement.addEventListener('click', () => {
      if (!this.canClick) {
        return;
      }
      this.publishPopUpService.popUpActivated({
        message: this.message,
        title: this.title
      });

      this.publishPopUpService.onPublish = this.publish;
      this.publishPopUpService.onLater = this.later;
      this.publishPopUpService.onClose = this.close;
    });
  }
}
