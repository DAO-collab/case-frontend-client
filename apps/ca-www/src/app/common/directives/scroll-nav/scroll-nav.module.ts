import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScrollNavDirective } from './scroll-nav.directive';

@NgModule({
  declarations: [ScrollNavDirective],
  imports: [CommonModule],
  exports: [ScrollNavDirective]
})
export class ScrollNavModule {}
