import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterPipe } from './filter.pipe';
import { ReplaceUnsupportedSymbolsPipe } from './replace-unsupported-symbols.pipe';
import { TimeAgoPipe } from './time-ago.pipe';
import { TodayPipe } from './today.pipe';

@NgModule({
  declarations: [FilterPipe, ReplaceUnsupportedSymbolsPipe, TimeAgoPipe, TodayPipe],
  imports: [CommonModule],
  exports: [FilterPipe, ReplaceUnsupportedSymbolsPipe, TimeAgoPipe, TodayPipe]
})
export class PipesModule {}
