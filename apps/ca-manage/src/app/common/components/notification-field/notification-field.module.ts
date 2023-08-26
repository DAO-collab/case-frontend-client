import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { NotificationFieldComponent } from './notification-field.component';

import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  declarations: [NotificationFieldComponent],
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  exports: [NotificationFieldComponent]
})
export class NotificationFieldModule {}
