import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimeSelectorService {

  // Generate time array for times
  public generateTimeArray(): string[] {
    const minutesInterval = 30;
    const tempTimeArray = [];
    let startTime = 0;
    const ap = ['AM', 'PM'];

    for (let i = 0; startTime < 24 * 60; i++) {
      const hh = Math.floor(startTime / 60);
      const mm = startTime % 60;
      let time = ('0' + (hh % 12)).slice(-2) + ':' + ('0' + mm).slice(-2) + ' ' + ap[Math.floor(hh / 12)];

      switch (time) {
        case '00:00 AM':
          time = '12:00 AM';
          break;
        case '00:30 AM':
          time = '12:30 AM';
          break;
        case '00:00 PM':
          time = '12:00 PM';
          break;
        case '00:30 PM':
          time = '12:30 PM';
          break;
      }

      tempTimeArray[i] = time;
      startTime = startTime + minutesInterval;
    }

    return tempTimeArray;
  }
  
  public convertTime12to24(time12h: string): string {
    const [time, modifier] = time12h.split(' ');
    const timeFrames = time.split(':');

    let hours: string | number = timeFrames[0];
    const minutes = timeFrames[1];

    if (hours === '12') {
      hours = '00';
    }

    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }

    hours = ('0' + hours).substr(-2);
    return hours + ':' + minutes;
  }

  public convertTime24to12(date: string | Date): string {
    if (typeof date === 'string') {
      const split = date.split(':');
      const tempHours = split[0];
      const tempMinutes = split[1].split(' ')[0];
      date = new Date();
      (date as Date).setHours(+tempHours, +tempMinutes, 0);
    }

    let hours: number = date.getHours();
    let minutes: string | number = date.getMinutes();
    const ampm = hours === 0 || hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const strTime = ('0' + hours).substr(-2) + ':' + ('0' + minutes).substr(-2) + ' ' + ampm;
    return strTime;
  }
}
