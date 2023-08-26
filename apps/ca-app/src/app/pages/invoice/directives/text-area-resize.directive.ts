import { Directive, HostListener, Output, Renderer2, EventEmitter } from '@angular/core';

@Directive({
  selector: 'textarea[resize]'
})
export class ResizableTextAreaDirective {
  @Output() resize = new EventEmitter();

  width?: number;
  height?: number;

  mouseMoveListener?: Function;

  @HostListener('mousedown', ['$event.target'])
  onMouseDown(el: HTMLElement) {
    this.width = el.offsetWidth;
    this.height = el.offsetHeight;
    this.mouseMoveListener = this.renderer2.listen('document', 'mousemove', () => {
      if (this.width !== el.offsetWidth || this.height !== el.offsetHeight) {
        this.resize.emit({ width: el.offsetWidth, height: el.offsetHeight });
      }
    });
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.ngOnDestroy();
  }

  constructor(private renderer2: Renderer2) {}

  ngOnDestroy() {
    if (this.mouseMoveListener) {
      this.mouseMoveListener();
    }
  }
}
