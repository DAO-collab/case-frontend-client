import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
  ViewEncapsulation,
  ElementRef
} from '@angular/core';
import SwiperCore, { Keyboard, Pagination, Navigation, Virtual } from 'swiper';

SwiperCore.use([Keyboard, Pagination, Navigation, Virtual]);

import { FeedMediaService } from '../../../services/feed-media.service';
import { DesignService } from '../../../services/design.service';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ViewerComponent implements OnInit, AfterViewInit {
  @Input() activePopUp: boolean = false;
  @Input() viewiengItems: ViewerItem[] = [];
  @Input() activeItem: number = 0;
  @Output() onviewerclose: EventEmitter<void> = new EventEmitter<void>();
  @Input() caseId?: string;
  @ViewChild('galleryViewBlock', { static: true }) galleryViewBlock?: ElementRef<HTMLDivElement>;
  @ViewChild('imgTrg') imgTrg?: HTMLImageElement;

  public sliderItemsWidth: number = 100;
  public sliderHolder!: HTMLElement;
  public fullView: boolean = true;
  public zoomOn: boolean = false;
  public documentPagePositionById: any = {};
  public activeDocPage = 1;
  public zoomDragActive?: any;
  public zoomStep = 0;
  public rotateDegree = 0;
  public favIconUrl: string = '';
  public zoomClassByStep: any = {
    '-1': '1/5x',
    '-0.75': '1/4x',
    '-0.5': '1/3x',
    '-0.25': '1/2x',
    '0': '1x',
    '0.25': '5/4x',
    '0.5': '6/4x',
    '0.75': '7/4x',
    '1': '2x',
    '1.25': '9/4x',
    '1.5': '10/4x',
    '1.75': '11/4x',
    '2': '3x',
    '2.25': '13/4x',
    '2.5': '14/4x',
    '2.75': '15/4x',
    '3': '4x'
  };

  public activeItemInSlider: number = this.activeItem;
  private htmlDefStyles: any = {};
  private zoomedImageLeft: number = 0;
  private zoomedImageTop: number = 0;
  private currentImage?: any;
  public prev = true;
  public next = true;

  // Image Zoom vars
  private startZoomLeft?: any;
  private pageXStart?: any;
  private startZoomTop?: any;
  private pageYStart?: any;
  private widrthDifference?: any;
  private heightDifference?: any;

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

  coordinatesCount = (e: MouseEvent) => {
    const img = e.target as HTMLElement;

    e.preventDefault();

    this.zoomedImageLeft = this.startZoomLeft + (e.pageX - this.pageXStart);
    // this.zoomedImageLeft = this.zoomedImageLeft > 0 ? 0 : this.zoomedImageLeft;
    // this.zoomedImageLeft = this.zoomedImageLeft < this.widrthDifference ? this.widrthDifference : this.zoomedImageLeft;

    this.zoomedImageTop = this.startZoomTop + (e.pageY - this.pageYStart);
    // this.zoomedImageTop = this.zoomedImageTop > 0 ? 0 : this.zoomedImageTop;
    // this.zoomedImageTop = this.zoomedImageTop < this.heightDifference ? this.heightDifference : this.zoomedImageTop;

    img.setAttribute('style', 'transform: translate(0, 0) !important');
    img.style.left = this.zoomedImageLeft + 'px';
    img.style.top = this.zoomedImageTop + 'px';
  };

  imageZoomLeft(event: MouseEvent, img: any, holderWidth: number, holderHeight: number) {
    this.pageXStart = event.pageX;
    this.pageYStart = event.pageY;
    this.startZoomLeft = this.zoomedImageLeft;
    this.startZoomTop = this.zoomedImageTop;
    this.widrthDifference = holderWidth - img.offsetWidth;
    this.heightDifference = holderHeight - img.offsetHeight;
    this.zoomDragActive = true;
    const stopZoomCounting = (e: Event) => {
      e.preventDefault();
      this.zoomDragActive = false;
      document.removeEventListener('mouseup', stopZoomCounting, false);
    };

    img.addEventListener('mouseout', stopZoomCounting, false);
    document.addEventListener('mouseup', stopZoomCounting, false);
    this.currentImage = img;
  }

  constructor(public feedMediaService: FeedMediaService, public designService: DesignService) {}

  ngOnInit() {
    this.activatePopup();
    this.documentPagePositionById[this.activeItem || 0] = [];
    this.documentPagePositionById[this.activeItem || 0][this.activeDocPage] = [];
    this.sliderHolder = document.querySelector('.slider-holder')!;
    this.activeItemInSlider = this.activeItem;

    const maxItems = this.viewiengItems.length - this.toInteger(this.sliderHolder.offsetWidth / this.sliderItemsWidth);

    if (this.activeItemInSlider >= maxItems) {
      this.activeItemInSlider = maxItems;
    }

    const startIndex = location.href.indexOf('ca-');
    const endIndex = location.href.indexOf('.');
    const hostId = location.href.slice(startIndex, endIndex);
    this.favIconUrl = (this.designService.getFaviconSecureUrl('favicon', 'ico', hostId, '24') as any)[
      'changingThisBreaksApplicationSecurity'
    ];
  }

  ngAfterViewInit(): void {
    let img = this.galleryViewBlock?.nativeElement.querySelectorAll('.item')[this.activeItem].querySelector('img');
    if (img) {
      img.setAttribute('style', 'transform: translate(-50%, -50%) !important');
      img.style.left = '50%';
      img.style.top = '50%';
    }

    if (document.getElementsByClassName('swiper-button-next').length) {
      document
        .getElementsByClassName('swiper-button-prev')[0]
        .classList.add('cdn-item', 'unset-border', 'unset-background', 'unset-boxshadow');
      document
        .getElementsByClassName('swiper-button-next')[0]
        .classList.add('cdn-item', 'unset-border', 'unset-background', 'unset-boxshadow');
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

  prevItem(sliderHolder: HTMLElement) {
    this.activeItemInSlider = this.activeItemInSlider - 1;
    if (this.activeItemInSlider === 0) {
      this.prev = false;
    }

    if (this.activeItemInSlider < this.viewiengItems.length - this.toInteger(sliderHolder.offsetWidth / 95)) {
      this.next = true;
    }
    this.zoomedImageLeft = 0;
    this.zoomedImageTop = 0;

    return this.activeItemInSlider < 0
      ? (this.activeItemInSlider =
          this.viewiengItems.length - this.toInteger(sliderHolder.offsetWidth / this.sliderItemsWidth))
      : false;
  }
  nextItem(sliderHolder: HTMLElement) {
    this.activeItemInSlider = this.activeItemInSlider + 1;
    this.zoomedImageLeft = 0;
    this.zoomedImageTop = 0;

    if (this.activeItemInSlider > 0) {
      this.prev = true;
    }

    if (this.activeItemInSlider === this.viewiengItems.length - this.toInteger(sliderHolder.offsetWidth / 95)) {
      this.next = false;
    }
    return this.activeItemInSlider >
      this.viewiengItems.length + 1 - this.toInteger(sliderHolder.offsetWidth / this.sliderItemsWidth) - 1
      ? (this.activeItemInSlider = 0)
      : false;
  }

  zoomPlus() {
    this.zoomStep = this.zoomStep < 3 ? this.zoomStep + 0.25 : 3;
    this.zoomCentering(1);
    this.zoomSwiperCentering(1);
  }

  zoomMinus() {
    this.zoomStep = this.zoomStep > -1 ? this.zoomStep - 0.25 : -1;
    this.zoomCentering(-1);
    this.zoomSwiperCentering(-1);
  }

  zoomCentering(direction: number) {
    setTimeout(() => {
      const containerWidth = this.galleryViewBlock!.nativeElement.offsetWidth / 2,
        containerHeight = this.galleryViewBlock!.nativeElement.offsetHeight / 2,
        img = this.galleryViewBlock?.nativeElement.querySelectorAll('.item')[this.activeItem].querySelector('img');

      if (img) {
        this.zoomedImageLeft = containerWidth - img.clientWidth / 2;
        this.zoomedImageTop = containerHeight - img.clientHeight / 2;

        /*
          img.setAttribute('style', 'transform: translate(0, 0) !important');
          img.style.left = this.zoomedImageLeft + 'px';
          img.style.top = this.zoomedImageTop + 'px';
        */

        img.setAttribute('style', 'transform: translate(-50%, -50%) !important');
        img.style.left = '50%';
        img.style.top = '50%';
      }
    });
  }

  zoomSwiperCentering(direction: any) {
    // setTimeout(() => {
    if (this.galleryViewBlock?.nativeElement.querySelectorAll('.itemSwiper').length) {
      const containerWidth = this.galleryViewBlock.nativeElement.offsetWidth / 2,
        containerHeight = this.galleryViewBlock.nativeElement.offsetHeight / 2,
        img = this.galleryViewBlock.nativeElement
          .querySelectorAll('.itemSwiper')
          [this.activeItem > 0 ? 1 : 0].querySelector('img');
      if (img) {
        this.zoomedImageLeft = containerWidth - img.clientWidth / 2;
        this.zoomedImageTop = containerHeight - img.clientHeight / 2;

        img.setAttribute('style', 'transform: translate(0, 0) !important');
        img.style.left = this.zoomedImageLeft + 'px';
        img.style.top = this.zoomedImageTop + 'px';
      }
    }
    // });
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

  checkIfShowControlls(sliderHolder: HTMLDivElement) {
    return this.viewiengItems.length * this.sliderItemsWidth > sliderHolder.offsetWidth ? true : false;
  }

  countInnerItemsWidth(viewportBlock: HTMLElement) {
    return (this.activeItem * viewportBlock.offsetWidth - this.activeItem * 10) * -1;
  }

  countInnerSliderLeft(sliderHolder: HTMLElement) {
    const left =
      sliderHolder.offsetWidth <= this.viewiengItems.length * this.sliderItemsWidth
        ? this.activeItemInSlider * this.sliderItemsWidth * -1
        : 0;

    return left;
  }

  viewerClosed() {
    this.onviewerclose.emit();
    this.disActivatePopup();
    this.viewiengItems = [];
  }

  downloadDoc(doc: any) {
    this.feedMediaService.downloadDocument(doc.downloadLink);
  }

  rotate(initial = -1) {
    this.rotateDegree = initial == -1 ? this.rotateDegree + 1 : initial;
    document.getElementById(`imgViewer${this.activeItem}`)!.style.transform = `rotate(${this.rotateDegree * 90}deg)`;
    if (document.getElementById(`imgViewerSilder${this.activeItem}`)) {
      document.getElementById(`imgViewerSilder${this.activeItem}`)!.style.transform = `rotate(${
        this.rotateDegree * 90
      }deg)`;
    }
  }

  runFullSize() {
    this.fullView = true;
  }

  autoMargin(holder: HTMLElement) {
    const mt = (window.innerHeight - holder.offsetHeight) / 2;

    return (mt > 0 ? mt : 0) + 'px';
  }

  print(v: any) {
    return v;
  }

  switchDocumentPage(pageNumber: any) {
    const maxLen: any = this.viewiengItems[this.activeItem].src ? this.viewiengItems[this.activeItem].src?.length : 1;

    if (pageNumber !== '') {
      if (pageNumber > maxLen) {
        pageNumber = 1;
      } else if (pageNumber === 0) {
        pageNumber = maxLen;
      }

      this.activeDocPage = pageNumber;
      // this.documentPagePositionById[this.activeItem] =
      //   this.documentPagePositionById[this.activeItem] || [];
      this.documentPagePositionById[this.activeItem] = [];
      this.documentPagePositionById[this.activeItem][pageNumber] = true;
      if (!this.documentPagePositionById[this.activeItem]) {
        this.documentPagePositionById[this.activeItem][0] = true;
      }
      this.dragDataToDefault();
      setTimeout(() => {
        this.zoomCentering(1);
      });
    }
  }

  onSwiper($event: any) {
    setTimeout(() => {
      this.activeItem = $event.activeIndex;
      this.zoomSwiperCentering(1);
    });
  }

  onSlideChange($event: any) {
    setTimeout(() => {
      this.activeItem = $event[0].activeIndex;
      this.zoomSwiperCentering(1);
    });
  }

  prevDoc() {
    this.rotate(0);
    this.switchDocumentPage((this.activeDocPage || 2) - 1);
  }

  nextDoc() {
    this.rotate(0);
    this.switchDocumentPage((this.activeDocPage || 0) + 1);
  }

  switchDocument(index: number) {
    this.dragDataToDefault();
    this.documentPagePositionById[this.activeItem] = this.documentPagePositionById[this.activeItem] || [];
    if (!this.documentPagePositionById[this.activeItem]) {
      this.documentPagePositionById[this.activeItem][0] = true;
    }

    const activePageIndex = this.documentPagePositionById[index]
      ? this.documentPagePositionById[index].findIndex((x: any) => x == true) || 1
      : 1;

    this.activeItem = index;
    this.rotate(0);

    this.switchDocumentPage(activePageIndex);
  }
}

export class ViewerItem {
  extension?: string;
  name?: string;
  src?: string[];
  url?: string;
  status?: string;
  thumbnail?: string;
  type?: string;
  stream?: string;
  duration?: number;
}
