import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
export interface OnMetricsRequested {
  onMetricsRequested(event: any): void;
}

export interface IDashboardViewType {
  text: string;
  id: string;
}

export enum ViewDateType {
  ViewStartDate = 'viewStartDate',
  ViewEndDate = 'viewEndDate'
}

export abstract class DashboardViews implements OnMetricsRequested {
  public dashboardViews: IDashboardViewType[] = [
    {
      text: 'Sessions',
      id: 'sessions'
    },
    {
      text: 'Unique Visitors',
      id: 'unique_visitors'
    }
  ];
  public viewDatesForm: UntypedFormGroup = this.formBuilder.group({
    viewStartDate: '',
    viewEndDate: ''
  });
  public dashboardView?: IDashboardViewType;
  public onMetricsRequested: any;
  public ViewDateType = ViewDateType;

  get viewStartDate() {
    return this.viewDatesForm.get('viewStartDate');
  }

  get viewEndDate() {
    return this.viewDatesForm.get('viewEndDate');
  }

  constructor(public formBuilder: UntypedFormBuilder) {}

  public pageViewSwitch(event: IDashboardViewType): void {
    this.dashboardView = event;
  }

  public requestMetrics(): void {
    if (this.viewStartDate?.value && this.viewEndDate?.value) {
      this.onMetricsRequested({
        viewType: this.dashboardView || this.dashboardViews[0],
        startDate: this.viewStartDate.value,
        endDate: this.viewEndDate.value
      });
    }
  }

  public checkDateRange(dateType: ViewDateType, event: any): void {
    this[dateType]?.setValue(event.dateString || this[dateType]?.value);
    const start: any = new Date(this.viewStartDate?.value);
    const end: any = new Date(this.viewEndDate?.value);
    const dateDiff = this.absDaysDiff(end, start);

    if (start > end) {
      this.addDays(start, end, 1, true);
      this.viewEndDate?.setValue(this.fullDate(end));
    }

    if (dateDiff > 6) {
      this.addDays(start, end, 6, true);
      this.viewEndDate?.setValue(this.fullDate(end));
    }
  }

  private absDaysDiff = (end: number, start: number) => Math.floor((end - start) / (1000 * 60 * 60 * 24));

  private fullDate = (date: Date) => date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();

  public addDays(checkDate: Date, dateToModify: Date, days: number, expr: boolean): void {
    if (expr) {
      const tempDate = checkDate.getTime();
      dateToModify.setTime(tempDate + days * 24 * 60 * 60 * 1000);
    } else {
      const tempDate = checkDate.getTime();
      dateToModify.setTime(tempDate - days * 24 * 60 * 60 * 1000);
    }
  }
}
