import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NumberDirective } from './numbers-only.directive';

@NgModule({
  declarations: [NumberDirective],
  imports: [CommonModule],
  exports: [NumberDirective]
})
export class NumbersOnlyModule {}
