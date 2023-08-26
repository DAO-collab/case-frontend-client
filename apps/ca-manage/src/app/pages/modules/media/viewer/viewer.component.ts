import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FeedMediaService } from '../../../../services/feed-media.service';
import { MediaStatus } from '../models/media.model';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css']
})
export class ViewerComponent implements OnInit {
  @Input() activePopUp = false;
  @Input() viewingItems: any[] = [];
  @Input() activeItem: any = 0;
  @Input() caseId?: string;
  @Output() viewerClose: EventEmitter<any> = new EventEmitter();
  @ViewChild('galleryViewBlock', { static: true }) galleryViewBlock?: any;
  @ViewChild('imgTrg') imgTrg?: any;

  public activeItemInSlider: any = this.activeItem;
  public htmlDefStyles: any = {};
  public sliderItemsWidth: any = 100;
  public sliderHolder: any;
  public fullView = false;
  public zoomOn = false;
  public zoomedImageLeft: any = 0;
  public zoomedImageTop: any = 0;
  public currentImage?: any;
  public documentPagePositionById: any = {};
  public dcoumentScrollTop = 0;
  public activeDocPage = 1;
  public MediaStatus = MediaStatus;

  // Image Zoom vars
  startZoomLeft?: any;
  pageXStart?: any;
  startZoomTop?: any;
  pageYStart?: any;
  widrthDifference?: any;
  heightDifference?: any;
  zoomDragActive?: any;

  zoomStep = 0;
  zoomClassByStep: any = {
    // '-3': '1/4x',
    // '-2': '1/3x',
    // '-1': '1/2x',
    0: '1x',
    1: '2x',
    2: '3x',
    3: '4x'
  };

  dragDataToDefault() {
    this.startZoomLeft = 0;
    this.pageXStart = 0;
    this.startZoomTop = 0;
    this.pageYStart = 0;
    this.widrthDifference = 0;
    this.heightDifference = 0;
    this.zoomDragActive = 0;
    this.zoomOn = false;
    this.zoomOff();
  }

  coordinatesCount = (e: any) => {
    const img = e.target;

    e.preventDefault();

    this.zoomedImageLeft = this.startZoomLeft + (e.pageX - this.pageXStart);
    this.zoomedImageLeft = this.zoomedImageLeft > 0 ? 0 : this.zoomedImageLeft;
    this.zoomedImageLeft = this.zoomedImageLeft < this.widrthDifference ? this.widrthDifference : this.zoomedImageLeft;

    this.zoomedImageTop = this.startZoomTop + (e.pageY - this.pageYStart);
    this.zoomedImageTop = this.zoomedImageTop > 0 ? 0 : this.zoomedImageTop;
    this.zoomedImageTop = this.zoomedImageTop < this.heightDifference ? this.heightDifference : this.zoomedImageTop;

    img.style.left = this.zoomedImageLeft + 'px';
    img.style.top = this.zoomedImageTop + 'px';
  };

  imageZoomLeft(event: any, img: any, holderWidth: any, holderHeight: any) {
    this.pageXStart = event.pageX;
    this.pageYStart = event.pageY;
    this.startZoomLeft = this.zoomedImageLeft;
    this.startZoomTop = this.zoomedImageTop;
    this.widrthDifference = holderWidth - img.offsetWidth;
    this.heightDifference = holderHeight - img.offsetHeight;
    this.zoomDragActive = true;
    const stopZoomCounting = (e: any) => {
      e.preventDefault();
      this.zoomDragActive = false;
      document.removeEventListener('mouseup', stopZoomCounting, false);
    };

    img.addEventListener('mouseout', stopZoomCounting, false);
    document.addEventListener('mouseup', stopZoomCounting, false);
    this.currentImage = img;
  }

  constructor(public feedMediaService: FeedMediaService) {}

  ngOnInit() {
    this.activatePopup();
    this.documentPagePositionById[this.activeItem || 0] = [];
    this.documentPagePositionById[this.activeItem || 0][this.activeDocPage] = [];
    this.sliderHolder = document.querySelector('.slider-holder');
    this.activeItemInSlider = this.activeItem;

    const maxItems = this.viewingItems.length - this.toInteger(this.sliderHolder.offsetWidth / this.sliderItemsWidth);

    if (this.activeItemInSlider >= maxItems) {
      this.activeItemInSlider = maxItems;
    }
  }

  activatePopup() {
    const html = document.querySelector('html');

    this.htmlDefStyles.overflow = html?.style.overflow;
    this.htmlDefStyles.maxHeight = html?.style.maxHeight;
    this.activePopUp = true;

    html!.style.overflow = 'hidden';
    html!.style.maxHeight = '100%';
  }

  disActivatePopup() {
    const html = document.querySelector('html');

    this.activePopUp = false;
    html!.style.overflow = this.htmlDefStyles.overflow;
    html!.style.maxHeight = this.htmlDefStyles.maxHeight;
  }

  toInteger(v: any) {
    return parseInt(v, 10);
  }

  prevItem(sliderHolder: any) {
    this.activeItemInSlider = this.activeItemInSlider - 1;
    this.zoomedImageLeft = 0;
    this.zoomedImageTop = 0;

    return this.activeItemInSlider < 0
      ? (this.activeItemInSlider =
          this.viewingItems.length - this.toInteger(sliderHolder.offsetWidth / this.sliderItemsWidth))
      : false;
  }

  nextItem(sliderHolder: any) {
    this.activeItemInSlider = this.activeItemInSlider + 1;
    this.zoomedImageLeft = 0;
    this.zoomedImageTop = 0;

    return this.activeItemInSlider >
      this.viewingItems.length + 1 - this.toInteger(sliderHolder.offsetWidth / this.sliderItemsWidth) - 1
      ? (this.activeItemInSlider = 0)
      : false;
  }

  zoomPlus() {
    if (this.zoomStep !== 3) {
      this.zoomCentering(1);
    }

    this.zoomStep = this.zoomStep < 3 ? this.zoomStep + 1 : 3;
  }

  zoomMinus() {
    this.zoomStep = this.zoomStep > 0 ? this.zoomStep - 1 : 0;

    if (this.zoomStep !== 0) {
      this.zoomCentering(-1);
    } else {
      const img = this.galleryViewBlock.nativeElement.querySelector('.active-image-item img');

      img.style.left = '';
      img.style.top = '';

      this.zoomedImageLeft = 0;
      this.zoomedImageTop = 0;
    }
  }

  zoomCentering(direction: any) {
    setTimeout(() => {
      const containerWidth = this.galleryViewBlock.nativeElement.offsetWidth / 2,
        containerHeight = this.galleryViewBlock.nativeElement.offsetHeight / 2,
        img = this.galleryViewBlock.nativeElement.querySelectorAll('.item')[this.activeItem].querySelector('img');

      if (direction > 0) {
        this.zoomedImageLeft = this.zoomedImageLeft - containerWidth;
        this.zoomedImageTop = this.zoomedImageTop - containerHeight;
      } else {
        this.zoomedImageLeft = this.zoomedImageLeft + containerWidth;
        this.zoomedImageTop = this.zoomedImageTop + containerHeight;
      }

      img.style.left = this.zoomedImageLeft + 'px';
      img.style.top = this.zoomedImageTop + 'px';
    });
  }

  zoomOff() {
    this.zoomOn = false;
    this.zoomedImageLeft = 0;
    this.zoomedImageTop = 0;
    this.zoomStep = 0;

    if (this.currentImage) {
      this.currentImage.style.left = '';
      this.currentImage.style.top = '';
    }

    this.currentImage = null;
  }

  checkIfShowControlls(sliderHolder: any) {
    return this.viewingItems.length * this.sliderItemsWidth > sliderHolder.offsetWidth ? true : false;
  }

  countInnerItemsWidth(viewportBlock: any) {
    return (this.activeItem * viewportBlock.offsetWidth - this.activeItem * 10) * -1;
  }

  countInnerSliderLeft(sliderHolder: any) {
    const left =
      sliderHolder.offsetWidth <= this.viewingItems.length * this.sliderItemsWidth
        ? this.activeItemInSlider * this.sliderItemsWidth * -1
        : 0;

    return left;
  }

  viewerClosed() {
    this.viewerClose.emit();
    this.disActivatePopup();
    this.viewingItems = [];
  }

  downloadDoc(doc: any) {
    window.open(doc.downloadLink, '_blank');
    // this.feedMediaService.downloadDocument(doc.downloadLink, doc.name);
  }

  runFullSize() {
    this.fullView = true;
  }

  autoMargin(holder: any) {
    const mt = (window.innerHeight - holder.offsetHeight) / 2;

    return (mt > 0 ? mt : 0) + 'px';
  }

  switchDocumentPage(pageNumber: any) {
    const maxLen = this.viewingItems[this.activeItem].url.path.length;

    if (pageNumber !== '') {
      const viewItems = this.galleryViewBlock.nativeElement.querySelectorAll('.item'),
        activeItem = viewItems[this.activeItem];

      if (pageNumber > maxLen) {
        pageNumber = 1;
      } else if (pageNumber === 0) {
        pageNumber = maxLen;
      }

      this.activeDocPage = pageNumber;
      this.documentPagePositionById[this.activeItem] = this.documentPagePositionById[this.activeItem] || [];
      this.documentPagePositionById[this.activeItem][pageNumber] = true;
      this.dragDataToDefault();
    }
  }

  prevDoc() {
    this.switchDocumentPage((this.activeDocPage || 2) - 1);
  }

  nextDoc() {
    this.switchDocumentPage((this.activeDocPage || 0) + 1);
  }
}
