import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChunkLoadingErrorModalComponent } from './chunk-loading-error-modal.component';

@NgModule({
  imports: [CommonModule],
  declarations: [ChunkLoadingErrorModalComponent],
  exports: [ChunkLoadingErrorModalComponent]
})
export class ChunkLoadingErrorModalModule {}
