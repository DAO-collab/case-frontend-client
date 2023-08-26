import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PopupfieldDirective } from './popupfield.directive';

@NgModule({
  declarations: [PopupfieldDirective],
  imports: [CommonModule],
  exports: [PopupfieldDirective]
})
export class PopupfieldModule {}
