import { Directive, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { ConfirmationPopUpService } from '../../services/confirmation-pop-up.service';

@Directive({
  selector: '[appConfirmationPopUp]'
})
export class ConfirmationPopUpDirective {
  @Output() yes: EventEmitter<void> = new EventEmitter<void>();
  @Input() message?: string;
  @Input() title?: string;

  constructor(private elementRef: ElementRef, private confirmationPopUpService: ConfirmationPopUpService) {
    this.elementRef.nativeElement.addEventListener('click', () => {
      this.confirmationPopUpService.popUpActivated({
        message: this.message,
        title: this.title
      });

      this.confirmationPopUpService.onYes = this.yes;
    });
  }
}
