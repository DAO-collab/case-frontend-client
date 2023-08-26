import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderByPipe } from './order-by.pipe';
import { ReplaceUnsupportedSymbolsPipe } from './replace-unsupported-symbols.pipe';

@NgModule({
  declarations: [OrderByPipe, ReplaceUnsupportedSymbolsPipe],
  imports: [CommonModule],
  exports: [OrderByPipe, ReplaceUnsupportedSymbolsPipe]
})
export class PipesModule {}
