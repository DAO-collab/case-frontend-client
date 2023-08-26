import { Injectable, OnInit, ApplicationRef } from '@angular/core';

declare var jQuery: any;

@Injectable({
  providedIn: 'root'
})
export class StylesService implements OnInit {
  private pageBody = document.querySelector('body');
  private popUpActive = false;
  private reservedHeight = '';
  private reservedOverflow = '';

  constructor(private applicationRef: ApplicationRef) {}

  ngOnInit() {}

  setPopUpStyle() {
    const bl: any = document.querySelector('.box-inner');

    if (!bl) {
      return;
    }

    const position = jQuery(bl).position(),
      top = position.top;

    if (top < 0) {
      bl.style.setProperty('margin-top', Math.abs(top) + 'px', 'important');
    } else {
      bl.style.marginTop = '';
    }
  }

  unsetPopUpStyle() {
    const bl: any = document.querySelector('.box-inner');

    if (bl) {
      bl.style.marginTop = '';
    }
  }

  setFixedHeight() {
    this.pageBody!.style.height = window.innerHeight + 'px';
    this.pageBody!.style.overflow = 'hidden';
    this.setPopUpStyle();
  }

  unsetFixedHeight() {
    if (this.reservedHeight) {
      this.pageBody!.style.height = this.reservedHeight;
    } else {
      this.pageBody!.style.height = '';
    }

    if (this.reservedOverflow) {
      this.pageBody!.style.overflow = this.reservedOverflow;
    } else {
      this.pageBody!.style.overflow = '';
    }

    this.reservedHeight = '';
    this.reservedOverflow = '';
    this.unsetPopUpStyle();
  }

  popUpActivated() {
    setTimeout(() => {
      this.reservedHeight = this.pageBody!.style.height;
      this.reservedOverflow = this.pageBody!.style.overflow;
      this.popUpActive = true;
      this.setFixedHeight();
    });
  }

  popUpDisactivated() {
    this.popUpActive = false;
    this.unsetFixedHeight();
    this.unsetPopUpStyle();
    this.applicationRef.tick();
  }

  resize() {
    if (this.popUpActive) {
      this.setFixedHeight();
      this.setPopUpStyle();
    } else {
      this.unsetPopUpStyle();
    }
  }
}
