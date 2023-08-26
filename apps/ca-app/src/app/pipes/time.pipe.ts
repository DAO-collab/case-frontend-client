import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { format, utcToZonedTime } from 'date-fns-tz';

@Pipe({
  name: 'time',
  pure: false
})
export class TimePipe implements PipeTransform, OnDestroy {
  private timer?: number | null;

  constructor() {}

  formatInTimeZone(date: any, fmt: string, tz: string) {
    return format(utcToZonedTime(date, tz), fmt, { timeZone: tz });
  }

  transform(value: string, isUtc: boolean) {
    this.removeTimer();
    const currentDate = new Date().toISOString().slice(0, 10);
    if (!value) {
      return value;
    }
    if (isUtc) {
      const timeZoneDate = new Date(currentDate + ' ' + value);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return this.formatInTimeZone(timeZoneDate, 'hh:mm:ss a', timeZone);
    } else {
      const utcStr = currentDate + ' ' + value;
      return this.formatInTimeZone(utcStr, 'hh:mm:ssxxx', 'UTC');
    }
  }

  ngOnDestroy(): void {
    this.removeTimer();
  }

  private removeTimer() {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
