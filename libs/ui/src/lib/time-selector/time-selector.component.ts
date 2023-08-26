import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeSelectorService } from './services/time-selector.service';

@Component({
  selector: 'ca-time-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-selector.component.html',
  styleUrls: ['./time-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeSelectorComponent {
  @Output() selected: EventEmitter<string> = new EventEmitter<string>();
  @Output() open: EventEmitter<string> = new EventEmitter<string>();
  @Output() resetTime: EventEmitter<string> = new EventEmitter<string>();
  @Input() selectedTime!: string;
  @Input() enabled?: boolean;

  public activeTime!: string;
  public times?: string[];
  public showTimesList?: boolean;

  constructor(public element: ElementRef, private timeSelectorService: TimeSelectorService) { }

  public ngOnInit(): void {
    this.times = this.timeSelectorService.generateTimeArray();
  }

  public ngOnChanges(change: SimpleChanges): void {
    if (change['selectedTime']) {
      this.selectedTime = this.timeSelectorService.convertTime12to24(change['selectedTime'].currentValue);
      this.activeTime = this.timeSelectorService.convertTime24to12(this.selectedTime);
    }
  }

  public resetTimeAction() {
    this.resetTime.emit();
  }

  public openDropdown(): void {
    this.showTimesList = true;
    this.open.emit();
  }

  public updateTime(time?: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.selectedTime = this.timeSelectorService.convertTime12to24(time ? time : this.selectedTime);
    this.activeTime = this.timeSelectorService.convertTime24to12(this.selectedTime);
    this.selected.emit(this.activeTime);
    this.showTimesList = false;
  }

  @HostListener('window:click', ['$event.target'])
  private onClick(): void {
    this.showTimesList = false;
  }
}
