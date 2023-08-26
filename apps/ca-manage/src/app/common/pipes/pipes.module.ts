import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterPipe } from './filter.pipe';
import { TodayPipe } from './today.pipe';
import { TimeAgoPipe } from './time-ago.pipe';
import { TimePipe } from './time.pipe';
import { SplitPipe } from './split.pipe';
import { ToSnakeCasePipe } from './to-snake-case.pipe';

@NgModule({
  declarations: [FilterPipe, TodayPipe, TimeAgoPipe, TimePipe, SplitPipe, ToSnakeCasePipe],
  imports: [CommonModule],
  exports: [FilterPipe, TodayPipe, TimeAgoPipe, TimePipe, SplitPipe, ToSnakeCasePipe]
})
export class PipesModule {}
