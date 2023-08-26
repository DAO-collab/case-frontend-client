import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MobileMenuDirective } from './mobile-menu.directive';

@NgModule({
  declarations: [MobileMenuDirective],
  imports: [CommonModule],
  exports: [MobileMenuDirective]
})
export class MobileMenuModule {}
