import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output, Directive } from '@angular/core';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'ca-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss'],
  standalone: true,
  imports: [NgIf, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleComponent {
  @Output() toggle: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input() text?: string = "";
  @Input() name: string = "slideToggle";
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Input() title: string = "";
  @Input() ariaLabel: string = "Toggle On/Off";
  @Input() ariaLabelBy: string = "Some Other Text";
  @Input() customDirective?: Directive;
  @Input() condition: boolean = true;
  @HostBinding('style.font-weight')
  @Input() fontWeight: number = 500;

  @HostBinding('style.--margin')
  @Input() margin: string = '0';

  public onToggle(event: MatSlideToggleChange): void {
    this.toggle.emit(event.checked);
  }

}
