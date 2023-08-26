import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorComponent } from './error.component';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [ErrorComponent],
  imports: [CommonModule, PipesModule],
  exports: [ErrorComponent, PipesModule]
})
export class ErrorModule {}
