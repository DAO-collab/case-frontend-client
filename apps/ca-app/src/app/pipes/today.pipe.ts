import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'today'
})
export class TodayPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    const inputDate = new Date(value);
    const todayDate = new Date();
    return inputDate.setHours(0, 0, 0, 0) === todayDate.setHours(0, 0, 0, 0);
  }
}
