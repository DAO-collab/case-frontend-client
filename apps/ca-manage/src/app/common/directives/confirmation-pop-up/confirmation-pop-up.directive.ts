import { Directive, ElementRef, Input, Output, EventEmitter, OnChanges, ApplicationRef } from '@angular/core';
import { ConfirmationPopUpService } from '../../../services/confirmation-pop-up.service';

@Directive({
  selector: '[appConfirmationPopUp]'
})
export class ConfirmationPopUpDirective implements OnChanges {
  @Output() yes: EventEmitter<any> = new EventEmitter();
  @Input() showLoader?: boolean;
  @Input() includeLoader?: boolean;
  @Input() message?: any;
  @Input() title?: any;

  public status = {
    loading: false
  };

  constructor(
    private elementRef: ElementRef,
    private confirmationPopUpService: ConfirmationPopUpService,
    private applicationRef: ApplicationRef
  ) {
    this.elementRef.nativeElement.addEventListener('click', (event: Event) => {
      event.preventDefault();
      event.stopPropagation();

      this.confirmationPopUpService.popUpActivated({
        message: this.message,
        status: this.status,
        title: this.title,
        includeLoader: this.includeLoader
      });

      this.confirmationPopUpService.onYes = this.yes;
      this.status.loading = this.showLoader!;
      this.applicationRef.tick();
    });
  }

  ngOnChanges(change: any) {
    if (change.showLoader && change.showLoader.currentValue !== undefined) {
      this.status.loading = change.showLoader.currentValue;
    }
  }
}
