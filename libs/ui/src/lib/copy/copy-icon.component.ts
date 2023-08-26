import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';


@Component({
  selector: 'ca-copy',
  templateUrl: './copy-icon.component.html',
  styleUrls: ['./copy-icon.component.scss'],
  standalone: true,
  imports: [NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CopyComponent {
    @Output() click: EventEmitter<void> = new EventEmitter<void>();
    
    constructor(private cdr: ChangeDetectorRef) {}

    isActive: Boolean = false;
    public onClick(): void {
        this.click.emit();
        this.isActive = true;
        setTimeout(this.toggleActive.bind(this), 3000);
    }

    public toggleActive() {
        this.isActive = false;
        this.cdr?.detectChanges();
    }
    getImageSource(): string {
        return this.isActive ? 'images/copy-icon-active.svg' : 'images/copy-icon-inactive.svg';
    }

}
