import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotifyMeModalComponent } from './notify-me-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [NotifyMeModalComponent],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  exports: [NotifyMeModalComponent]
})
export class NotifyMeModalModule {}
