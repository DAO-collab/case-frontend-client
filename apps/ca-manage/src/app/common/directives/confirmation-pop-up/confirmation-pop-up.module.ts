import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConfirmationPopUpDirective } from './confirmation-pop-up.directive';

@NgModule({
  declarations: [ConfirmationPopUpDirective],
  imports: [CommonModule],
  exports: [ConfirmationPopUpDirective]
})
export class ConfirmationPopUpModule {}
