import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScrollSlidesDirective } from './scroll-slides.directive';

@NgModule({
  declarations: [ScrollSlidesDirective],
  imports: [CommonModule],
  exports: [ScrollSlidesDirective]
})
export class ScrollSlidesModule {}
