import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * Pop up form wrraper.
 */
@Component({
  selector: 'app-pop-up-form-wrapper',
  templateUrl: './pop-up-form-wrapper.component.html',
  styleUrls: ['./pop-up-form-wrapper.component.css']
})
export class PopUpFormWrapperComponent {
  @Input() showModal: boolean;
  @Output() signedUpPopUp = new EventEmitter<void>();

  /**
   * Controls sign up pop-up.
   */
  public managedSignUpPopUp(): void {
    this.signedUpPopUp.emit();
  }
}
