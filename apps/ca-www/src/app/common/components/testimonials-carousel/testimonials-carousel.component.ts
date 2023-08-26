import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  Renderer2,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit
} from '@angular/core';

import { slideAnimation } from '../../animations/slide.animation';
import { TESTIMONIALS } from './testimonials';

/**
 * Testimonial carousel component.
 */
@Component({
  selector: 'app-testimonials-carousel',
  templateUrl: './testimonials-carousel.component.html',
  styleUrls: ['./testimonials-carousel.component.scss'],
  animations: [slideAnimation]
})
export class TestimonialsCarouselComponent implements OnInit, OnDestroy {
  @ViewChildren('mobileSlides') set content(value) {
    this.mobileSlides = value;

    this.mobileSlides.forEach((slide, index) => {
      this.renderer.listen(
        slide.nativeElement,
        'touchstart',
        event => (this.startDraggingPosition = this.getPositionX(event))
      );

      this.renderer.listen(slide.nativeElement, 'touchend', event => {
        const movedBy = this.endDraggingPosition - this.startDraggingPosition;

        if (movedBy < -100) {
          this.nextTestimonial();
        }

        if (movedBy > 100) {
          this.prevTestimonial();
        }
      });

      this.renderer.listen(
        slide.nativeElement,
        'touchmove',
        event => (this.endDraggingPosition = this.getPositionX(event))
      );
    });
  }

  public testimonials = TESTIMONIALS;
  public index = 0;

  private timer: NodeJS.Timer;
  private time = 10000;
  private innerWidth: number;
  private mobileSlides: QueryList<ElementRef>;
  private startDraggingPosition: number;
  private endDraggingPosition: number;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }

  constructor(private renderer: Renderer2) {}

  /**
   * Initializes testimonial carousel.
   */
  ngOnInit(): void {
    this.innerWidth = window.innerWidth;

    this.startCarousel();
  }

  /**
   * Checks if it's the corresponding index.
   */
  public isTestimonialndex(index: number): boolean {
    return this.index === index;
  }

  /**
   * Sets index and resets timer;
   */
  public setTestimonialIndex(index: number): void {
    this.index = index;
    this.resetTimer();
  }

  /**
   * Resets timer and navigate to the next testimonial.
   */
  public nextTestimonial(): void {
    this.resetTimer();

    this.increment();
  }

  /**
   * Resets timer and navigate to the previous testimonial.
   */
  public prevTestimonial(): void {
    this.resetTimer();

    this.decrement();
  }

  /**
   * Starts carousel.
   */
  private startCarousel(): void {
    this.timer = setInterval(() => this.increment(), this.time);
  }

  /**
   * Resets timer and start carousel.
   */
  private resetTimer(): void {
    clearInterval(this.timer);
    this.startCarousel();
  }

  /**
   * Increments index.
   */
  private increment(): void {
    // toggling counter for +2 (if desktop) or +1 (if mobile) slide
    const addNumber = this.innerWidth >= 1000 ? 1 : 0;

    if (this.index % 2 === 1 && this.innerWidth > 1000) {
      this.index--;
    }

    if (this.index + addNumber < this.testimonials.length - 1) {
      this.index += 1 + addNumber;
    } else {
      this.index = 0;
    }
  }

  /**
   * Decrements index.
   */
  private decrement(): void {
    if (this.index === 0) {
      this.index = this.testimonials.length - 1;
    } else {
      this.index--;
    }
  }

  /**
   * get current touch or mouse position.
   */
  private getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
  }

  /**
   * Clears interval.
   */
  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
