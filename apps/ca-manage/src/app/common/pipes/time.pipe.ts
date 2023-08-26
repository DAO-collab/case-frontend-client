import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { format, utcToZonedTime } from 'date-fns-tz';

@Pipe({
  name: 'time',
  pure: false
})
export class TimePipe implements PipeTransform, OnDestroy {
  private timer?: number | null;

  constructor() {}

  formatInTimeZone(date: Date | string, fmt: string, tz: string) {
    let dateFormat = format(utcToZonedTime(date, tz), fmt, { timeZone: tz });
    dateFormat = this.checkIfFormatCorrect(dateFormat);

    return dateFormat;
  }

  checkIfFormatCorrect(value: string) {
    // tslint:disable-next-line:triple-equals
    if ((value.slice(0, 2) as any) == 24 && (((value.slice(3, 5) as any) >= 1 || value.slice(6, 8)) as any) >= 1) {
      return '00' + ':' + value.slice(3, 5) + ':' + value.slice(6, 8) + value.slice(8, value.length);
    } else {
      return value;
    }
  }

  transform(value: string, isUtc: boolean) {
    this.removeTimer();
    const currentDate = new Date().toISOString().slice(0, 10);
    if (!value) {
      return value;
    }
    value = this.checkIfFormatCorrect(value);
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
