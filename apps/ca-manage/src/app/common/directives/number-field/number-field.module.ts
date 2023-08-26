import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NumberFieldDirective } from './number-field.directive';

@NgModule({
  declarations: [NumberFieldDirective],
  imports: [CommonModule],
  exports: [NumberFieldDirective]
})
export class NumberFieldModule {}
