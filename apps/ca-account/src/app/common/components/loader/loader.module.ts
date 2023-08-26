import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './loader.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [LoaderComponent],
  imports: [CommonModule, TranslateModule],
  exports: [LoaderComponent]
})
export class LoaderModule {}
