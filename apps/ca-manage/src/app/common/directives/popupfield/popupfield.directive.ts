import {
  Directive,
  HostListener,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  OnDestroy,
  AfterContentInit
} from '@angular/core';

@Directive({
  selector: '[appPopupfield]'
})
export class PopupfieldDirective implements OnInit, OnDestroy, AfterContentInit {
  @Output() saved: EventEmitter<any> = new EventEmitter<any>();
  @Input() appendTo?: string;
  @Input() inputValue?: string;

  private active?: boolean;
  private fieldBody = document.createElement('input');
  private saveButton = document.createElement('button');
  private form = document.createElement('form');
  private appendToElement?: any;
  private backgroundStorage = document.createElement('div');

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.active = false;
    this.form.appendChild(this.fieldBody);
    this.form.appendChild(this.saveButton);
    this.saveButton.innerText = 'OK';
    this.fieldBody.setAttribute('placeholder', 'File Name');
    this.appendToElement = this.elementRef.nativeElement.closest(this.appendTo || 'body');
    this.form.className = 'pop-up-field';
    document.addEventListener('click', this.closeField);
    this.saveButton.addEventListener('click', this.saveValue);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.closeField);
    this.saveButton.removeEventListener('click', this.saveValue);
  }

  ngAfterContentInit() {
    this.fieldBody.value = this.inputValue as any;
  }

  @HostListener('click', ['$event']) onclick(e: any) {
    e.preventDefault();

    if (!this.active) {
      this.appendToElement.appendChild(this.form);

      const fileBox = this.elementRef.nativeElement.closest('.notice-a'),
        offset = this.closestOffset(fileBox, fileBox.closest(this.appendTo));

      this.form.style.top = offset.top + 'px';
      this.form.style.left = offset.left + 'px';
      this.fieldBody.focus();

      setTimeout(() => (this.active = true));
    } else {
      this.active = false;
      this.backgroundStorage.appendChild(this.form);
    }
  }

  saveValue = (event: any) => {
    event.preventDefault();
    this.saved.emit(this.fieldBody.value);
    this.backgroundStorage.appendChild(this.form);
  };

  closeField = (event: any) => {
    if (this.active && !event.target.closest('.pop-up-field')) {
      this.backgroundStorage.appendChild(this.form);
      this.active = false;
    }
  };

  closestOffset(el: any, destination: any, offset?: any): any {
    offset = offset || { top: el.offsetHeight + el.offsetTop, left: el.offsetLeft };

    const parentNode = el.parentNode;

    if (parentNode && parentNode !== destination) {
      offset.top += parentNode.offsetTop;
      offset.left += parentNode.offsetLeft;

      return this.closestOffset(el, parentNode, offset);
    } else {
      return offset;
    }
  }
}
