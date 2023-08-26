import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateComponent } from './translate.component';

@NgModule({
  declarations: [TranslateComponent],
  imports: [CommonModule],
  exports: [TranslateComponent]
})
export class CaTranslateModule {}
