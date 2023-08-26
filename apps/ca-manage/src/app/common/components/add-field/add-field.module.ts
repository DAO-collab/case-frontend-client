import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';

import { AddFieldComponent } from './add-field.component';

@NgModule({
  declarations: [AddFieldComponent],
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  exports: [AddFieldComponent]
})
export class AddFieldModule {}
