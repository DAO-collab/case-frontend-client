import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';

interface RruleSelectItemModel {
  id: string;
  text: string;
}

@Component({
  selector: 'app-rrule',
  templateUrl: './rrule.component.html',
  styleUrls: ['./rrule.component.css'],
  providers: [DatePipe]
})
export class RruleComponent implements OnInit {
  dailyDate?: string;
  weekDate?: string;
  yearDate?: string;
  @Input() startDate: any;
  @Input() endDate: any;
  @Input() endTime: any;

  @Input() get rrule(): string {
    return this.rruleInner;
  }

  set rrule(val: string) {
    this.rruleInner = val;
    this.updateLocalRrule(val);
    this.rruleChange.emit(this.rruleInner);
  }

  @Output() rruleChange = new EventEmitter();

  public repeatItems = {
    FREQ: [
      {
        text: 'daily',
        id: 'DAILY'
      },
      {
        text: 'week',
        id: 'WEEKLY'
      },
      {
        text: 'month',
        id: 'MONTHLY'
      },
      {
        text: 'year',
        id: 'YEARLY'
      }
    ]
  };
  public weekDaysShort: RruleSelectItemModel[] = [
    {
      id: 'SU',
      text: 'Sun'
    },
    {
      id: 'MO',
      text: 'Mon'
    },
    {
      id: 'TU',
      text: 'Tue'
    },
    {
      id: 'WE',
      text: 'Wed'
    },
    {
      id: 'TH',
      text: 'Thu'
    },
    {
      id: 'FR',
      text: 'Fri'
    },
    {
      id: 'SA',
      text: 'Sat'
    }
  ];
  public endOptions: RruleSelectItemModel[] = [
    {
      id: 'false',
      text: 'Never'
    },
    {
      id: 'COUNT',
      text: 'After'
    },
    {
      id: 'UNTIL',
      text: 'On date'
    }
  ];
  public models: any = {
    YEARLY: {
      UNTIL: this.date.transform(new Date(), 'MM/dd/yyyy'),
      COUNT: 1,
      INTERVAL: 1
    },
    MONTHLY: {
      UNTIL: this.date.transform(new Date(), 'MM/dd/yyyy'),
      COUNT: 1,
      INTERVAL: 1
    },
    WEEKLY: {
      BYDAY: 'SU',
      COUNT: 1,
      INTERVAL: 1,
      UNTIL: this.date.transform(new Date(), 'MM/dd/yyyy')
    },
    DAILY: {
      UNTIL: this.date.transform(new Date(), 'MM/dd/yyyy'),
      COUNT: 1,
      INTERVAL: 1
    },
    HOURLY: {
      UNTIL: this.date.transform(new Date(), 'MM/dd/yyyy'),
      COUNT: 1,
      INTERVAL: 1
    }
  };
  public activeFREQ: string = this.repeatItems.FREQ[0].id;
  public activeEndOption: string = this.endOptions[0].id;
  public end = (() => {
    const returnObj: any = {};

    Object.keys(this.models).map(k => {
      returnObj[k] = 'false';
    });
    return returnObj;
  })();

  private rruleInner = '';

  constructor(private date: DatePipe) {}

  ngOnInit() {
    this.setDate();
  }

  public selected(event: any, sl: any) {
    typeof sl === 'string' ? (this[sl as keyof RruleComponent] = event.id) : (sl = event.id);
  }

  /*
    Toggle week days of week in string
  */

  public toggleWeekDay(dayId: any) {
    const curVal = this.models.WEEKLY.BYDAY,
      byDayVal = curVal === '' ? [] : this.models.WEEKLY.BYDAY.split(',');

    if (byDayVal.indexOf(dayId) > -1) {
      if (byDayVal.length !== 1) {
        byDayVal.splice(byDayVal.indexOf(dayId), 1);
      }
    } else {
      byDayVal.push(dayId);
    }

    this.models.WEEKLY.BYDAY = byDayVal.join(',');
    this.generateRRule();
  }

  public previosOnChanges() {
    const startDate = new Date(this.startDate);
    const endDate = this.endDate ? new Date(this.endDate) : new Date();

    let tm;
    endDate <= startDate ? (tm = new Date().toISOString()) : (tm = endDate.toISOString());
    tm = `${tm.substr(0, tm.length - 5)}Z`;

    this.models.YEARLY.UNTIL = tm;
  }

  /**
   * Convert empty value to specified
   */
  public convertNullValue(v: any, to: any) {
    return v ? v : to;
  }

  /**
   * return the final RRULE value to 'rrule' variable
   */
  public generateRRule() {
    const idFreq = this.activeFREQ.toString();

    this.rrule = this.generateSimpleString(this.models[idFreq], idFreq, this.end[idFreq]);

    return this.rrule;
  }

  /**
   * Generate RRULE string by active repeat type
   */
  private generateSimpleString(target: any, id: any, end: any): string {
    const returnStr = ['FREQ=' + id],
      targeKeys = Object.keys(target);

    targeKeys.map(v => {
      if (v !== 'UNTIL' && v !== 'COUNT') {
        returnStr.push(v + '=' + target[v]);
      }
    });

    if (end !== 'false' && end) {
      if (end === 'UNTIL') {
        const repeatDate = new Date(target[end]);

        const time = this.endTime.slice(0, -3).split(':');
        const hours = time[0];
        const minutes = time[1];

        repeatDate.setHours(+hours, +minutes);
        const tm = repeatDate.toISOString().replace(/[^a-zA-Z 0-9]+/g, '');
        returnStr.push(`${end}=${tm.substr(0, tm.length - 4)}Z`);
      } else {
        returnStr.push(end + '=' + target[end]);
      }
    }

    return returnStr.join(';');
  }

  private updateLocalRrule(rule: string) {
    const props: any = this.parseRruleStr(rule || ''),
      keys = props ? Object.keys(props) : [];

    if (props && Object.keys(props).length > 1) {
      if (props.UNTIL) {
        const t = props.UNTIL;

        this.activeEndOption = this.endOptions[2].id;
        this.end[props.FREQ] = 'UNTIL';
        props.UNTIL =
          t.substr(0, 4) +
          '-' +
          t.substr(4, 2) +
          '-' +
          t.substr(6, 5) +
          ':' +
          t.substr(11, 2) +
          ':' +
          t.substr(13, 2) +
          'Z';
      } else if (props.COUNT) {
        this.activeEndOption = this.endOptions[1].id;
        this.end[props.FREQ] = 'COUNT';
      } else {
        this.activeEndOption = this.endOptions[0].id;
        this.end[props.FREQ] = false;
      }

      keys.map(v => {
        if (v !== 'FREQ') {
          this.models[props.FREQ][v] = props[v];
        }
      });

      this.repeatItems.FREQ.map((v, i) => {
        if (v.id === props.FREQ) {
          this.activeFREQ = this.repeatItems.FREQ[i].id;
        }
      });
    }
  }

  private parseRruleStr(str: any) {
    str = typeof str === 'string' ? str : str[0];

    const props: any = {};

    str.split(';').map((v: any) => {
      const spl = v.split('='),
        tv = spl[1];
      props[spl[0]] = tv;
    });

    return props;
  }

  onDateChange(event: any, type: string): void {
    const splitValue = type.split('.');
    this.models[splitValue[0]][splitValue[1]] = this.date.transform(new Date(event['selectedDates'][0]), 'MM/dd/yyyy');
    this.rrule = this.generateRRule();
  }

  setDate() {
    if (this.rrule) {
      const temp = this.rrule.split(';');
      const index = temp.findIndex(el => el.includes('UNTIL'));
      const isoDate = temp[index].split('=')[1];
      const type = temp[0].split('=')[1];
      const year = isoDate.substring(0, 4);
      const month = isoDate.substring(4, 6);
      const date = isoDate.substring(6, 8);
      const t1 = isoDate.substring(9, 11);
      const t2 = isoDate.substring(11, 13);
      const t3 = isoDate.substring(13);
      const final = year + '-' + month + '-' + date + 'T' + t1 + ':' + t2 + ':' + t3;

      if (type === 'DAILY') {
        this.dailyDate = this.date.transform(new Date(final), 'MM/dd/yyyy')!;
      }
      if (type === 'WEEKLY') {
        this.weekDate = this.date.transform(new Date(final), 'MM/dd/yyyy')!;
      }
      if (type === 'YEARLY') {
        this.yearDate = this.date.transform(new Date(final), 'MM/dd/yyyy')!;
      }
    }
  }
}
