import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScrollingModule } from '@angular/cdk/scrolling';

import { SelectLanguageComponent } from './select-language.component';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [SelectLanguageComponent],
  imports: [CommonModule, PipesModule, ScrollingModule],
  exports: [SelectLanguageComponent]
})
export class SelectLanguageModule {}
