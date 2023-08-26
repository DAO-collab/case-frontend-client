import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RruleComponent } from './rrule.component';

import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [RruleComponent],
  imports: [CommonModule, FormsModule, NgSelectModule, SharedModule],
  exports: [RruleComponent]
})
export class RruleModule {}
