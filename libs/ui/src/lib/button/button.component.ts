import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

type Button = 'submit' | 'button' | 'reset';

@Component({
  selector: 'ca-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  standalone: true,
  imports: [NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Output() btnClick: EventEmitter<void> = new EventEmitter<void>();

  @Input() text: string = 'text';
  @Input() isIcon: boolean = false;
  @Input() iconName: string = 'icon-plus';
  @Input() isUpperCase: boolean = true;
  @Input() isFilled: boolean = false;
  @Input() isDisabled: boolean = false;
  @Input() isHovered: boolean = false;
  @Input() buttonType: Button = 'button';

  @HostBinding('style.font-weight')
  @Input() fontWeight: number = 500;

  @HostBinding('style.--margin')
  @Input() margin: string = '0';

  public onBtnClick(): void {
    this.btnClick.emit();
  }

}
