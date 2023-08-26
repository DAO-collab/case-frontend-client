import { NameFieldDirective } from './directives/name-field.directive';
import { NgModule } from '@angular/core';
import { PipesModule } from './pipes/pipes.module';

@NgModule({
  imports: [PipesModule],
  declarations: [NameFieldDirective],
  exports: [NameFieldDirective, PipesModule],
  providers: []
})
export class SharedModule {}
