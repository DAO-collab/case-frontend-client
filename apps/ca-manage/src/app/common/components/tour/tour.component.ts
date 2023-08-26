import { Component, HostBinding, HostListener, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { delay, take, tap } from 'rxjs/operators';
import { JoyrideService } from 'ngx-joyride';
import { AdminService, TourOptions } from '../../../services/admin.service';
import { HostService } from '../../../services/host.service';
import { TOUR_PAGES, TourPopupState, TourItem, TOUR_POPUP_STATE_KEY } from './tour.constants';

@Component({
  selector: 'app-tour',
  templateUrl: './tour.component.html',
  styleUrls: ['./tour.component.css']
})
export class TourComponent implements OnInit {
  public tourItems: TourItem[] = [];
  public expandedIndex: number = -1;
  public completedTours: string[] = [];
  public TourPopupState = TourPopupState;
  public currentTourPopupState: TourPopupState = TourPopupState.Completed;

  private currentTourStep: string | null = null;

  constructor(
    private readonly adminService: AdminService,
    private readonly hostService: HostService,
    private readonly joyrideService: JoyrideService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  public get stepsCompleted(): number {
    return this.completedTours?.length;
  }

  public get tourSteps(): number {
    return this.tourItems.length;
  }

  @HostBinding('class.minimized')
  private get isMinimized(): boolean {
    return this.currentTourPopupState === TourPopupState.Minimized;
  }

  @HostBinding('class.is-going')
  private get isGoing(): boolean {
    return this.currentTourPopupState === TourPopupState.Going;
  }

  @HostBinding('class.completed')
  private get isCompleted(): boolean {
    return this.currentTourPopupState === TourPopupState.Completed;
  }

  @HostBinding('style.--steps-progress-percent')
  private get completedStepsPercent(): string {
    return (this.stepsCompleted / this.tourSteps) * 100 + '%';
  }

  public ngOnInit(): void {
    this.getHostInfoAndTour();
  }

  public toggleTourStep(tourKey: string): void {
    if (this.completedTours.includes(tourKey)) {
      const indexToRemove = this.completedTours.indexOf(tourKey);
      this.completedTours.splice(indexToRemove, 1);
    } else {
      this.completedTours.push(tourKey);
    }

    this.hostService.setHostCompletedTours(this.completedTours).pipe(take(1)).subscribe();
  }

  public completeTour(): void {
    this.completedTours = this.tourItems.map(([key, _]) => key);
    this.setTourPopupState(TourPopupState.Completed);
    this.hostService.setHostCompletedTours(this.completedTours).pipe(take(1)).subscribe();
  }

  public uncompleteTour(): void {
    this.completedTours.length = 0;
    this.hostService.setHostCompletedTours(this.completedTours).pipe(take(1)).subscribe();
  }

  public setTourPopupState(popupState: TourPopupState): void {
    this.currentTourPopupState = popupState;
    localStorage.setItem(TOUR_POPUP_STATE_KEY, popupState.toString());
  }

  public startTour(step: string): void {
    this.currentTourStep = step;
    this.joyrideService.startTour({
      steps: [TOUR_PAGES[step as keyof typeof TOUR_PAGES]],
      customTexts: { done: 'Complete Step' },
      showCounter: false,
      stepDefaultPosition: 'center'
    });

    of(1)
      .pipe(
        take(1),
        delay(1500),
        tap(() => {
          this.joyrideService.closeTour();
          this.currentTourStep = null;
        })
      )
      .subscribe();
    this.setTourPopupState(TourPopupState.Going);
  }

  private getHostInfoAndTour(): void {
    forkJoin([this.hostService.getHostInfo(), this.adminService.fetchOptions('/messages/tour', '')])
      .pipe(take(1))
      .subscribe(([hostInfo, tourMessages]) => {
        this.tourItems = Object.entries(tourMessages);
        if (hostInfo.tour_completed) {
          this.completedTours = hostInfo.tour_completed;
          this.setInitialExpandedIndex(tourMessages as TourOptions);
        }
        this.getStorageTourState();
      });
  }

  private getStorageTourState(): void {
    const state: any = localStorage.getItem(TOUR_POPUP_STATE_KEY);
    if (!state) {
      this.setTourPopupState(TourPopupState.Initial);
      return;
    }
    this.setTourPopupState(TourPopupState[TourPopupState[state] as keyof typeof TourPopupState]);
  }

  private setInitialExpandedIndex(tourMessages: TourOptions): void {
    for (let i = 0; i < Object.keys(tourMessages).length; i++) {
      if (!this.completedTours.includes(Object.keys(tourMessages)[i])) {
        this.expandedIndex = i;
        return;
      }
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  private onEscapePress(): void {
    if (this.currentTourPopupState === TourPopupState.Initial) {
      this.setTourPopupState(TourPopupState.Minimized);
    }
  }

  @HostListener('window:scroll', ['$event'])
  private onFirstTourStepScroll(): void {
    if (this.currentTourStep === 'beatify_app') {
      this.document.documentElement.scroll(0, 0);
    }
  }
}
