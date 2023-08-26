import { Directive, OnInit, OnDestroy, Input, ElementRef, OnChanges } from '@angular/core';
import { PrivateFilesHelperService } from '../../../services/helpers/private-files-helper.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

declare var jQuery: any;

@Directive({
  selector: '[appPrivateFile]'
})
export class PrivateFileDirective implements OnInit, OnDestroy, OnChanges {
  @Input() url?: any;
  @Input() mimeType?: any;
  @Input() includeLoader?: any;
  @Input() parentToHideOnLoad?: any;
  @Input() private?: boolean;

  private loaded = false;
  private loader: any = null;
  private parentNode: any;
  private cachedImages: any[] = [];

  constructor(private privateFilesHelper: PrivateFilesHelperService, private elementRef: ElementRef) {}

  ngOnInit() {
    if (!this.loaded) {
      this.defineParentNode();
      if (this.includeLoader) {
        this.loader = this.createLoader();
        jQuery(this.parentNode).after(this.loader);
      }
    }
  }

  ngOnChanges(change: any) {
    const url = change.url;

    if (url && url.currentValue !== url.previousValue) {
      this.url = url.currentValue;
      this.loadImage();
    }
  }

  loadImage() {
    const existingIndex = this.findCached(this.cachedImages, this.url);

    if (existingIndex === -1) {
      this.privateFilesHelper
        .getImageSrc(this.url, this.private)
        .pipe(
          catchError(res => {
            this.removeLoader();
            return throwError(res);
          })
        )
        .subscribe(rawImg => {
          const imageBody = URL.createObjectURL(rawImg.toString as any);
          const cachedKeys = Object.keys(this.cachedImages);

          if (cachedKeys.length === 4) {
            this.cachedImages.shift();
          }

          this.cachedImages.push({ url: this.url, body: imageBody });
          this.elementRef.nativeElement.src = imageBody;
          this.loaded = true;
          this.removeLoader();
        });
    } else {
      this.elementRef.nativeElement.src = this.cachedImages[existingIndex].body;
    }
  }

  findCached(cachedArray: any[], url: string) {
    return cachedArray.findIndex(obj => obj.url === url);
  }

  defineParentNode(): void {
    this.parentNode = this.parentToHideOnLoad
      ? this.elementRef.nativeElement.closest(this.parentToHideOnLoad)
      : this.elementRef.nativeElement.parentNode;
  }

  removeLoader() {
    if (this.loader) {
      this.loader.remove();
      this.loader = null;
      this.parentNode.style.display = '';
    }
  }

  createLoader() {
    const loader = document.createElement(this.parentNode.localName);

    loader.innerHTML = '<p class="text-center" translate><span class="loader loader-bubbles"><span></span></span></p>';
    loader.className = 'active-loading';
    this.parentNode.style.display = 'none';

    return loader;
  }

  ngOnDestroy() {
    this.loaded = false;
  }
}
