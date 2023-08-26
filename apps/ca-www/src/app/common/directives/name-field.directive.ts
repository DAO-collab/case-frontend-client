import { Directive, HostListener, ElementRef } from '@angular/core';

/**
 * Name Field directive.
 */
@Directive({
  selector: '[appNameField]'
})
export class NameFieldDirective {
  /**
   * Disables enter numbers chars for name inputs.
   */
  @HostListener('keydown', ['$event'])
  public onKeyDown(e: KeyboardEvent): void {
    const reg = /[0-9]/.test(e.key);

    if (reg) {
      e.preventDefault();
    }
  }
}
