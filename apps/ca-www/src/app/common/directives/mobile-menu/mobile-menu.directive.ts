import { Directive, Renderer2, HostListener, Input } from '@angular/core';

/**
 * Mobile menu directive.
 */
@Directive({
  selector: '[appMobileMenu]'
})
export class MobileMenuDirective {
  @Input() target: HTMLHeadElement;

  constructor(private renderer: Renderer2) {}

  /**
   * Handle mobile menu click.
   */
  @HostListener('click', ['$event'])
  onClickMenu(): void {
    this.toggleMobileMenu();
  }

  /**
   * Toggles mobile menu.
   */
  toggleMobileMenu(): void {
    const isActive = this.target.classList.contains('active');

    isActive ? this.renderer.removeClass(this.target, 'active') : this.renderer.addClass(this.target, 'active');
  }
}
