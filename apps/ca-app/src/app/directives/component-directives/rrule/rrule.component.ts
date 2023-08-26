import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { RruleSelectItemModel } from './models/RruleSelectItemModel';
import { FormsService } from '../../../services/forms.service';
import { SignsService } from '../../../services/signs.service';
import { EventsService } from '../../../services/events.service';

@Component({
  selector: 'app-rrule',
  templateUrl: './rrule.component.html',
  styleUrls: ['./rrule.component.css'],
  providers: [DatePipe]
})
export class RruleComponent implements OnInit, OnDestroy {
  @Input() startDate: any;
  @Input() endDate: any;
  @Input() endTime: any;
  @Input() enabled?: boolean;
  @Output() rruleChange = new EventEmitter();
  @Input() get rrule(): string {
    return this.rruleInner;
  }

  private rruleInner = '';
  private destroy$ = new Subject<void>();
  set rrule(val: string) {
    this.rruleInner = val;
    this.updateLocalRrule(val);
    this.rruleChange.emit(this.rruleInner);
  }
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
  public activeEndOption?: string = this.endOptions[0].id;
  public end = (() => {
    const returnObj: any = {};

    Object.keys(this.models).map((k) => {
      returnObj[k] = 'false';
    });

    return returnObj;
  })();

  constructor(
    private date: DatePipe,
    private formsService: FormsService,
    private signsService: SignsService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.updateEndDate(this.endDate);

    this.formsService.dueDate$.pipe(takeUntil(this.destroy$)).subscribe(next => {
      this.updateEndDate(next);
    });

    this.signsService.dueDate$.pipe(takeUntil(this.destroy$)).subscribe(next => {
      this.updateEndDate(next);
    });

    this.eventsService.endDate$.pipe(takeUntil(this.destroy$)).subscribe(next => {
      this.updateEndDate(next);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public updateEndDate(dateStr: string): void {
    let tm = new Date(dateStr).toISOString();
    tm = `${tm.substr(0, tm.length - 5)}Z`;
    this.models.YEARLY.UNTIL = tm;
    this.models.MONTHLY.UNTIL = tm;
    this.models.WEEKLY.UNTIL = tm;
    this.models.DAILY.UNTIL = tm;
  }

  public selected(event: any, sl: any) {
    typeof sl === 'string' ? (this[sl as keyof RruleComponent] = event.id) : (sl = event.id);
  }

  /**
   * Toggle week days of week in string
   */
  public toggleWeekDay(dayId: string) {
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

  /**
   * Generate RRULE string by active repeat type
   */
  private generateSimpleString(target: any, id: number, end: any): string {
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
    const idFreq: any = this.activeFREQ.toString();

    this.rrule = this.generateSimpleString(this.models[idFreq], idFreq, this.end[idFreq]);

    return this.rrule;
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

  private parseRruleStr(str: string) {
    str = typeof str === 'string' ? str : str[0];

    const props: any = {};

    str.split(';').map(v => {
      const spl = v.split('='),
        tv = spl[1];
      props[spl[0]] = tv;
    });

    return props;
  }

  public previosOnChanges() {
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);

    let tm;
    endDate <= startDate ? (tm = new Date().toISOString()) : (tm = endDate.toISOString());

    tm = `${tm.substr(0, tm.length - 5)}Z`;
    this.models.YEARLY.UNTIL = tm;
  }
}
