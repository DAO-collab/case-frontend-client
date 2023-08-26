import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerErrorModalComponent } from './server-error-modal.component';

@NgModule({
  declarations: [ServerErrorModalComponent],
  imports: [CommonModule],
  exports: [ServerErrorModalComponent]
})
export class ServerErrorModalModule {}
