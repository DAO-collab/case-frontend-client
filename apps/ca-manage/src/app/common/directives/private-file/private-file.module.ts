import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivateFileDirective } from './private-file.directive';

@NgModule({
  declarations: [PrivateFileDirective],
  imports: [CommonModule],
  exports: [PrivateFileDirective]
})
export class PrivateFileModule {}
