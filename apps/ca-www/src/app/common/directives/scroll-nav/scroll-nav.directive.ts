import { Directive, ElementRef, Renderer2, HostListener, Input } from '@angular/core';
import { Location } from '@angular/common';

/**
 * Scroll Navigation directive.
 */
@Directive({
  selector: '[appScrollNav]'
})
export class ScrollNavDirective {
  @Input() nav: HTMLElement;

  constructor(private element: ElementRef<HTMLHeadElement>, private renderer: Renderer2, private location: Location) {}

  /**
   * Scrolls top navigation.
   */
  @HostListener('window:scroll', ['$event'])
  public headerScrolled(): void {
    window.scrollY > 100
      ? this.renderer.addClass(this.host, 'scrolled')
      : this.renderer.removeClass(this.host, 'scrolled');

    this.location.path() === '/home' && window.scrollY <= 100
      ? this.renderer.addClass(this.nav, 'home')
      : this.renderer.removeClass(this.nav, 'home');
  }

  /**
   * Getter for easy access to the host element.
   */
  private get host() {
    return this.element.nativeElement;
  }
}
