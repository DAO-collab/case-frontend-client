import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SharedModule } from './../../../shared/shared.module';

import { AddFieldContentComponent } from './add-field-content.component';

import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';

import { ErrorModule } from '../error/error.module';

@NgModule({
  declarations: [AddFieldContentComponent],
  imports: [CommonModule, FormsModule, SharedModule, TranslateModule, NgSelectModule, ErrorModule],
  exports: [AddFieldContentComponent]
})
export class AddFieldContentModule {}
