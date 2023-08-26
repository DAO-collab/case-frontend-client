import { AfterViewInit, Directive, ElementRef, EventEmitter, Host, OnDestroy, Output } from "@angular/core";

@Directive({
  selector: "[appEnterTheViewportNotifier]",
  standalone: true
})
export class EnterTheViewportNotifierDirective implements AfterViewInit, OnDestroy {
  @Output() visibilityChange = new EventEmitter<boolean>();

  private _observer: IntersectionObserver | undefined;

  constructor(@Host() private _elementRef: ElementRef) { }

  ngAfterViewInit(): void {
    const options = { root: null, rootMargin: "0px", threshold: 0.1 };

    this._observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => this.visibilityChange.emit(entry.isIntersecting));
    }, options);
    this._observer.observe(this._elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
    this._observer = undefined;
  }
}