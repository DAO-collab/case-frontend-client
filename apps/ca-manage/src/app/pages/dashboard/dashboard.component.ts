import { Component, DoCheck, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';

import { CookieService } from 'ngx-cookie';
import { Chart } from 'chart.js';
import { finalize, takeUntil } from 'rxjs/operators';

import { HostService } from '../../services/host.service';
import { UnsubscriptionHandler } from '../../shared/classes/unsubscription-handler';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent extends UnsubscriptionHandler implements OnInit, DoCheck {
  public dataLoaded = false;
  public metricsLoading?: boolean;
  public allItems: any = {};
  public endDate?: string;
  public startDate?: string;
  public chart?: Chart;
  graphColor?: string;

  private viewType: any = { id: 'sessions', text: 'Page Views' };
  private dashboardData?: any;
  public metricsData?: any;
  private xAxis: any[] = [];
  private yAxis: any[] = [];
  private filterByDashboardViewProcessors: any = {
    sessions: () => {
      this.xAxis.forEach((data, i) => {
        const xAxisDay = new Date(data);
        this.dashboardData.forEach((dashItem: any, j: number) => {
          const dashboardDateStr = dashItem.day.value.ScalarValue;
          const dashboardDay = new Date(
            dashboardDateStr.split('-')[1] + '/' + dashboardDateStr.split('-')[2] + '/' + dashboardDateStr.split('-')[0]
          );
          if (xAxisDay.getDate() === dashboardDay.getDate()) {
            this.yAxis[i] = dashItem.sessions.value.ScalarValue;
          }
        });
      });
    },
    unique_visitors: () => {
      this.xAxis.forEach((data, i) => {
        const xAxisDay = new Date(data);
        this.dashboardData.forEach((dashItem: any, j: number) => {
          const dashboardDateStr = dashItem.day.value.ScalarValue;
          const dashboardDay = new Date(
            dashboardDateStr.split('-')[1] + '/' + dashboardDateStr.split('-')[2] + '/' + dashboardDateStr.split('-')[0]
          );
          if (xAxisDay.getDate() === dashboardDay.getDate()) {
            this.yAxis[i] = dashItem.users.value.ScalarValue;
          }
        });
      });
    }
  };

  constructor(
    private hostService: HostService,
    private datePipe: DatePipe,
    public cookiesService: CookieService,
    private titleService: Title,
    private adminService: AdminService
  ) {
    super();
  }

  ngOnInit(): void {
    this.adminService.getProfile().subscribe(data => {
      if (data.company_system) {
        data.company_system.design
          ? (this.graphColor = data.company_system.design.colors.text)
          : (this.graphColor = '22, 176, 197');
      }
    });
    this.titleService.setTitle(`${this.hostService.appName} | Dashboard`);
    this.endDate = this.hostService.endDate;
    this.startDate = this.hostService.startDate;
    this.loadStats();

    this.hostService.metricsFormSubscription.subscribe(r => {
      Object.assign(this, r);
      this.loadStats();
    });
  }

  ngDoCheck() {
    // to chang chart color as primary
    // if (this.chart) {
    // this.graphColor = window
    //   .getComputedStyle(document.querySelector('#root.logged-in #nav > ul > li.active > a'))
    //   .color.slice(4, -1);
    // this.chart.data.datasets[0].borderColor = 'rgb(' + this.graphColor + ')';
    // this.chart.update();
    // }
  }

  private chartUpdate(): void {
    this.filterByDashboardViewProcessors[this.viewType.id]();
  }

  private loadStats(): void {
    this.metricsLoading = true;
    this.hostService
      .getHostData(this.startDate!, this.endDate!)
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => {
          this.metricsLoading = false;
          this.dataLoaded = true;
        })
      )
      .subscribe(resp => {
        this.dashboardData = resp.dashboard || {};
        this.metricsData = resp.metrics || {};
        this.xAxis = this.getArrayFromDatesRange(this.startDate!, this.endDate!);
        this.yAxis = this.fillArray(this.xAxis.length);
        this.chartUpdate();
        this.runDashBoardChart();
      });
  }

  private getArrayFromDatesRange(startDate: string, endDate: string): any[] {
    const startDateO = new Date(startDate),
      endUTCDate = new Date(endDate).toUTCString(),
      arrayOfDates = [];

    for (let i = 0; i < 10; i++) {
      const dt = startDateO.toUTCString();

      arrayOfDates.push(this.datePipe.transform(dt, 'M/d/yyy'));

      if (dt === endUTCDate) {
        break;
      }

      startDateO.setDate(startDateO.getDate() + 1);
    }

    return arrayOfDates;
  }

  private fillArray(length: number, value: number = 0): any {
    const result = [];

    for (let i = 0; i < length; i++) {
      result.push(value);
    }

    return result;
  }

  public getAbstractSize = (size: any) => {
    let sizeMbResult: number = +(size / 1048576).toFixed(2);

    if (sizeMbResult !== sizeMbResult) {
      sizeMbResult = 0;
    }

    return sizeMbResult < 1024 ? sizeMbResult + 'MB' : this.getGb(size) + 'GB';
  };

  private getGb = (size: any) => (size / 1073741824).toFixed(2);

  private runDashBoardChart(): void {
    const yAxisMax = Math.max.apply(null, this.yAxis);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('dashboard-chart', {
      type: 'line',
      data: {
        labels: this.xAxis,
        datasets: [
          {
            data: this.yAxis.slice(),
            borderColor: 'rgb(' + this.graphColor + ')',
            fill: false,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
            ],
            // @ts-ignore
            gridLines: {
              display: false,
              color: '#f1f1f1'
            }
          }
        ]
      },
      options: {
        legend: {
          display: false,
          labels: {
            fontColor: 'f5871f',
            fontSize: 18,
            // @ts-ignore
            fillStyle: '#f5871f'
          }
        },
        tooltips: {
          backgroundColor: 'rgba(255, 255, 255, 1)',
          titleFontColor: '#333',
          titleFontStyle: 'bold',
          bodyFontColor: '#333',
          displayColors: false,
          callbacks: {
            label: (tooltip: any) => this.viewType.text + ':  ' + tooltip.yLabel
          }
        },
        scales: {
          xAxes: [
            {
              display: true,
              gridLines: {
                display: false,
                color: '#545a5c'
              },
              ticks: {
                beginAtZero: true
              }
            }
          ],
          yAxes: [
            {
              display: true,
              gridLines: {
                color: '#545a5c'
              },
              ticks: {
                beginAtZero: true,
                stepSize: yAxisMax > 1 ? Math.round(yAxisMax / 10) : 0.1
              }
            }
          ]
        },
        maintainAspectRatio: false
      }
    });
  }
}
