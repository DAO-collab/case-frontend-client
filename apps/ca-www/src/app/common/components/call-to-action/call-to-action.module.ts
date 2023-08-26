import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { CallToActionComponent } from './call-to-action.component';
import { ScrollSlidesModule } from '../../directives/scroll-slides/scroll-slides.module';

@NgModule({
  declarations: [CallToActionComponent],
  imports: [CommonModule, TranslateModule, ScrollSlidesModule],
  exports: [CallToActionComponent]
})
export class CallToActionModule {}
