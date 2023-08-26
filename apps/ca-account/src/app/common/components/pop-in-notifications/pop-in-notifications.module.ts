import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopInBoxComponent } from './pop-in-box/pop-in-box.component';

@NgModule({
  declarations: [PopInBoxComponent],
  imports: [CommonModule],
  exports: [PopInBoxComponent]
})
export class PopInNotificationsModule {}
