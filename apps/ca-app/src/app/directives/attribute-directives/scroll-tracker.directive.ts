import { Directive, ElementRef, EventEmitter, Input, Output, inject } from '@angular/core';

@Directive({
  selector: '[caScrollObserver]',
  standalone: true,
})
export class ScrollTrackerDirective {
  @Output() itemVisible: EventEmitter<void> = new EventEmitter<void>();
  @Input() attributeName: string = 'trigger-data-loading';
  @Input() threshold: number = 0;
  @Input() rootMargin: string = '0px';

  private observer!: IntersectionObserver;
  private el: ElementRef = inject(ElementRef);

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting === true) {
        if (!this.el.nativeElement.getAttribute(this.attributeName)) {
          this.el.nativeElement.setAttribute(this.attributeName, true);
          this.itemVisible.emit();
        }
        this.observer.disconnect();
      }
    }, {
      threshold: this.threshold,
      rootMargin: this.rootMargin,
    });

    this.observer.observe(this.el.nativeElement as HTMLElement);
  }

  ngOnDestroy() {
    this.observer.disconnect();
  }

}
