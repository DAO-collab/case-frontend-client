import { Directive, Renderer2, HostListener, ElementRef } from '@angular/core';

/**
 * Scroll Slides directive.
 */
@Directive({
  selector: '[appScrollSlides]'
})
export class ScrollSlidesDirective {
  constructor(private renderer: Renderer2, private element: ElementRef<HTMLElement>) {}

  /**
   * Toggle show class on scroll.
   */
  @HostListener('window:scroll', ['$event'])
  onScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight * 0.75;
    const elDistanceToTop = window.pageYOffset + this.host.getBoundingClientRect().top;

    if (scrollY + windowHeight >= elDistanceToTop) {
      this.renderer.addClass(this.host, 'show');
    } else {
      this.renderer.removeClass(this.host, 'show');
    }
  }

  /**
   * Getter for easy access to the host element.
   */
  private get host(): HTMLElement {
    return this.element.nativeElement;
  }
}
