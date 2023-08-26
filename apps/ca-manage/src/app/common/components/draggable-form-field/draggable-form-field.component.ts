import {
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';

import { SrcRequest } from '../../../model/SrcRequest';
import { environment } from '../../../../environments/environment';
import { TimePipe } from '../../pipes/time.pipe';
import { UtilsService } from '../../../services/utils.service';
import { editorConfig } from './constants/editor.config';

@Component({
  selector: 'app-draggable-form-field',
  templateUrl: './draggable-form-field.component.html',
  styleUrls: ['./draggable-form-field.component.css'],
  providers: [TimePipe]
})
export class DraggableFormFieldComponent implements OnInit, DoCheck {
  @ViewChild('wrapper') wrapperDiv?: ElementRef;

  @Input() fieldData: any = {};
  @Input() fieldKey: any = '';
  @Input() fieldParticipants: any = [];
  @Input() saveModel: any;
  @Output() changePosition: EventEmitter<any> = new EventEmitter();
  @Output() runFieldEditing: EventEmitter<any> = new EventEmitter();
  @Output() runFieldCopy: EventEmitter<any> = new EventEmitter();
  @Output() runFieldDelete: EventEmitter<any> = new EventEmitter();
  @Output() dragStop: EventEmitter<any> = new EventEmitter();
  @Output() toggleRequired: EventEmitter<any> = new EventEmitter();
  @Output() onMoveMouseDown: EventEmitter<any> = new EventEmitter();
  @Output() onMoveUp: EventEmitter<any> = new EventEmitter();
  @Output() onMoveDown: EventEmitter<any> = new EventEmitter();

  @Input() disableDragging?: any;
  @Input() disableEditing?: any;

  @Input() width?: any;
  @Input() height?: any;

  @Input() media?: any;
  @Input() caseId?: any;

  private pageX?: any;
  private pageY?: any;
  private diffX?: any;
  private diffY?: any;
  private el?: any;
  private res?: any;
  private cdnUrl: string = environment.PUBLIC_CDN_URL;
  private privateCDN = environment.PRIVATE_CDN_URL + '/';
  public showViwer = false;
  public viewerIndx = 0;
  public viewiengItems: any[] = [];
  public activeDocPage = 1;
  public showPopup = false;
  public formConfig = editorConfig;

  @Input() @HostBinding('style.left') left?: any;
  @Input() @HostBinding('style.top') top?: any;

  constructor(public elementRef: ElementRef, public timePipe: TimePipe, public utilsService: UtilsService) {
    if (!this.saveModel) {
      this.saveModel = {};
    }
  }

  ngOnInit() {
    this.setEditorValue();
    this.el = this.elementRef.nativeElement;
    this.el.setAttribute('tabindex', '0');

    this.res = () => {
      this.el = this.elementRef.nativeElement;

      const parentNode = this.el.closest('.document-image-wrapper');

      if (parentNode) {
        this.diffX = (this.el.offsetWidth - this.el.offsetWidth) / 2;
        this.diffY = (this.el.offsetHeight - this.el.offsetHeight) / 2;
        this.emit();
        this.el.classList.add('clear-after');
      }
    };

    window.addEventListener('resize', this.res);
    this.res();
  }

  ngDoCheck() {
    this.res();
    this.showInViewer(this.media, 0);
  }

  tooglePopup(): void {
    this.showPopup = !this.showPopup;
  }

  moveUp($event: any, wrapper: any): void {
    this.showPopup = !this.showPopup;
    this.onMoveUp.emit();
  }

  moveDown($event: any, wrapper: any): void {
    this.showPopup = !this.showPopup;
    this.onMoveDown.emit();
  }

  checkLineBreak(str: any): number {
    return (str.match(/\n/g) || []).length;
  }

  viewerClosed(): void {
    this.showViwer = false;
  }

  changeToogle($event: any): void {
    this.toggleRequired.emit($event);
  }

  prevDoc() {
    this.switchDocumentPage((this.activeDocPage || 2) - 1);
  }

  nextDoc() {
    this.switchDocumentPage((this.activeDocPage || 0) + 1);
  }

  switchDocumentPage(pageNumber: any) {
    const maxLen = this.viewiengItems[this.viewerIndx].src ? this.viewiengItems[this.viewerIndx].src.length : 1;

    if (pageNumber !== '') {
      if (pageNumber > maxLen) {
        pageNumber = 1;
      } else if (pageNumber === 0) {
        pageNumber = maxLen;
      }
      this.activeDocPage = pageNumber;
    }
  }

  showInViewer(media: any, index: number): void {
    let result = [];
    const mediaInfo = media[this.fieldData.fieldType]?.items[this.fieldData.description] || null;
    if (mediaInfo) {
      let obj = {
        downloadLink: this.getDownloadLink(mediaInfo),
        extension: mediaInfo.tag_id.split('.')[1] || 'jpg',
        name: mediaInfo.tag_id,
        src: this.loadMediaSrcInfo(media),
        status: 'SUCCEEDED',
        thumbnail: this.loadMediaThumbInfo(media),
        type: this.fieldData.fieldType
      };
      result.push(obj);
    }
    this.viewerIndx = index;
    this.viewiengItems = result;
  }

  getOriginalMediaSrc(caseId: string, request: any) {
    return this.cdnUrl + '/' + caseId + '/private/case/posts/media?media=' + request.url_key;
  }

  getDownloadLink(mediaInfo: any) {
    return `${this.privateCDN}${mediaInfo.original}`;
  }

  getImageSrc(request: SrcRequest) {
    let mediaLink = `${this.privateCDN}${(request.url_key as any)
      .replace('${display_size}', (request?.width as any))
      .replace('${display_format}', (request.ext as any))}`;

    if (~mediaLink.indexOf('${display_count}')) {
      mediaLink = mediaLink.replace('${display_count}', `${request.page}`);
    }

    return mediaLink;
  }

  loadMediaSrcInfo(media: any): string[] | string | void {
    const mediaInfo = media[this.fieldData.fieldType]?.items[this.fieldData.description] || null;
    if (mediaInfo) {
      const displaySizes = mediaInfo.display_sizes || [];
      const thumbnailWidthSize = '90';
      const ext = mediaInfo.display_formats && mediaInfo.display_formats[0];
      const url_key = mediaInfo.alias_display_start
        ? mediaInfo.alias_display_start
        : mediaInfo.display_start
        ? mediaInfo.display_start
        : '';

      if (this.fieldData.fieldType === 'docs') {
        let result = [];
        for (let i = 0; i < mediaInfo.display_count; i++) {
          result.push(
            this.getImageSrc({
              ext,
              url_key,
              height: '0',
              width: (Math.max.apply(null, displaySizes) as any),
              page: i + 1
            })
          );
        }
        return result;
      } else {
        const i = 0;
        const result = this.getImageSrc({
          ext,
          url_key,
          height: '0',
          width: (Math.max.apply(null, displaySizes) as any),
          page: i + 1
        });
        return result;
      }
    }
  }

  loadMediaStatusInfo(media: any): string | void {
    const mediaInfo = media[this.fieldData.fieldType]?.items[this.fieldData.description] || null;
    if (mediaInfo.execution_status === 'RUNNING') {
      return "Media is converting. We will notify you when it's ready";
    } else if (mediaInfo.execution_status === 'FAILED') {
      return 'Media failed in converting. Please delete and try again or another file';
    }
  }

  loadMediaThumbInfo(media: any) {
    const mediaInfo = media[this.fieldData.fieldType]?.items[this.fieldData.description] || null;
    if (mediaInfo && mediaInfo.execution_status === 'SUCCEEDED') {
      const displaySizes = mediaInfo.display_sizes || [];
      const thumbnailWidthSize = '90';
      const ext = mediaInfo.display_formats && mediaInfo.display_formats[0];
      const url_key = mediaInfo.alias_display_start
        ? mediaInfo.alias_display_start
        : mediaInfo.display_start
        ? mediaInfo.display_start
        : '';
      const i = 0;
      const thumbnail = this.getImageSrc({
        ext,
        url_key,
        height: '51',
        width: (Math.max.apply(null, displaySizes) as any),
        page: i + 1
      });
      return thumbnail;
    } else {
      return '';
    }
  }

  generateActiveItems(vl: any) {
    return (typeof vl === 'object' && vl) || [vl];
  }

  checkIfValueExists(name: string, v: string) {
    if (!this.saveModel[name]) {
      this.saveModel[name] = v;
    }
  }

  runFieldEditingF() {
    this.runFieldEditing.emit(this.fieldData);
  }

  runFieldCopyF() {
    this.runFieldCopy.emit(this.fieldData);
  }

  runFieldDeleteF() {
    this.runFieldDelete.emit(this.fieldKey);
  }

  moveMouseDown() {
    this.onMoveMouseDown.emit(this.fieldKey);
  }

  startDraging($event: any, wrapper: any, direction1: any, direction2: any) {
    $event.preventDefault();
    $event.stopPropagation();

    const self = this,
      parentNode = wrapper.parentNode,
      documentImageWrapper = parentNode.parentNode,
      documentImage = documentImageWrapper.querySelector('img'),
      leftMargin = documentImage.offsetLeft,
      topMargin = documentImage.offsetTop;

    this.width = parentNode.offsetWidth;
    this.height = parentNode.offsetHeight;
    this.left = parentNode.offsetLeft + 'px';
    this.top = parentNode.offsetTop - 5 + 'px';
    this.pageX = $event.pageX;
    this.pageY = $event.pageY;

    const initialWidth = parentNode.offsetWidth,
      initialHeight = parentNode.offsetHeight,
      initialLeft = parentNode.offsetLeft,
      initialTop = parentNode.offsetTop;

    const minFieldWidth = 100,
      minFieldHeight = 90;

    const maxRight = documentImage.offsetWidth + leftMargin,
      maxBottom = documentImage.offsetHeight + topMargin;

    const draggWatch = (e: any) => {
      e.preventDefault();

      const diffX = e.pageX - self.pageX,
        diffY = e.pageY - self.pageY;

      let newWidth,
        newHeight,
        newTop = parseInt(self.top, 10),
        newLeft = parseInt(self.left, 10);

      if (direction2 === 'left') {
        newLeft = initialLeft + diffX;
        newWidth = initialWidth - diffX;
      } else {
        newWidth = initialWidth + diffX;
        newWidth = newWidth > minFieldWidth ? newWidth : minFieldWidth;
      }

      if (direction1 === 'top') {
        newTop = initialTop + diffY;
        newHeight = initialHeight - diffY;
      } else {
        newHeight = initialHeight + diffY;
        newHeight = newHeight > minFieldHeight ? newHeight : minFieldHeight;
      }

      // Coord match
      const correctLeft = newLeft > leftMargin;
      const correctRight = newWidth + parseInt(self.left, 10) < maxRight;
      const correctTop = newTop > topMargin;
      const correctBottom = newHeight + parseInt(self.top, 10) < maxBottom;

      self.width = correctLeft && correctRight ? newWidth : self.width;
      self.left = (correctLeft ? newLeft : leftMargin) + 'px';

      self.height = correctTop && correctBottom ? newHeight : self.height;
      self.top = (correctTop ? newTop : topMargin) + 'px';

      if (this.wrapperDiv) {
        self.height = this.wrapperDiv.nativeElement.clientHeight + 30 + 'px';
      }
      self.changePosition.emit({
        width: self.width,
        left: self.left,
        top: self.top,
        diffX: self.diffX,
        diffY: self.diffY,
        height: self.height,
        docHolderWidth: parentNode.parentNode.offsetWidth,
        fieldName: self.fieldData.name
      });
    }

    const draggStop = (e: any) => {
      // Stop dragging spots
      this.dragStop.emit();
      document.removeEventListener('mousemove', draggWatch, false);
      document.removeEventListener('mouseup', draggStop, false);
    };

    document.addEventListener('mousemove', draggWatch, false);
    document.addEventListener('mouseup', draggStop, false);
  }

  startChangePosition($event: any, wrapper: any) {
    $event.preventDefault();
    this.el.focus();

    this.moveMouseDown();
    const parentNode = wrapper.parentNode,
      documentImageWrapper = parentNode.parentNode,
      documentImage = documentImageWrapper.querySelector('img'),
      leftMargin = documentImage.offsetLeft,
      fieldWidth = parentNode.offsetWidth,
      topMargin = documentImage.offsetTop,
      fieldHeight = parentNode.offsetHeight;

    this.pageX = $event.pageX;
    this.pageY = $event.pageY;
    this.left = parentNode.offsetLeft + 'px';
    this.top = parentNode.offsetTop - 5 + 'px';

    // Document Wrapper
    const maxRight = documentImage.offsetWidth + leftMargin,
      maxBottom = documentImage.offsetHeight + topMargin;

    // Document
    const initialLeft = parentNode.offsetLeft,
      initialTop = parentNode.offsetTop;

    this.res();

    const draggWatch = (e: any) => {
      e.preventDefault();

      const diffX = e.pageX - this.pageX,
        diffY = e.pageY - this.pageY;

      const newLeft = initialLeft + diffX,
        newTop = initialTop + diffY;

      // Coord match
      const correctLeft = newLeft >= leftMargin,
        correctRight = newLeft + fieldWidth <= maxRight,
        correctTop = newTop >= topMargin,
        correctBottom = newTop + fieldHeight <= maxBottom;

      // Set new Top and Left based on new coords
      this.left = (correctLeft && correctRight ? newLeft : !correctRight ? maxRight - fieldWidth : leftMargin) + 'px';
      this.top =
        (correctTop && correctBottom ? newTop : !correctBottom ? maxBottom - fieldHeight : topMargin) - 5 + 'px';

      let newHeight = fieldHeight;
      if (this.wrapperDiv) {
        newHeight = this.wrapperDiv.nativeElement.clientHeight + 30 + 'px';
      }
      this.changePosition.emit({
        width: this.width,
        left: this.left,
        top: this.top,
        diffX: this.diffX,
        diffY: this.diffY,
        height: newHeight,
        docHolderWidth: documentImageWrapper.offsetWidth,
        fieldName: this.fieldData.name
      });
    };

    const draggStop = (e: any) => {
      // Stop dragging spots
      this.dragStop.emit();
      document.removeEventListener('mousemove', draggWatch, false);
      document.removeEventListener('mouseup', draggStop, false);
    };

    document.addEventListener('mousemove', draggWatch, false);
    document.addEventListener('mouseup', draggStop, false);
  }

  emit() {
    if (this.wrapperDiv) {
      this.height = this.wrapperDiv.nativeElement.clientHeight + 30 + 'px';
    }
    this.changePosition.emit({
      width: this.width,
      left: this.left,
      top: this.top,
      height: this.height,
      diffX: this.diffX,
      diffY: this.diffY,
      fieldName: this.fieldData.name
    });
  }

  private setEditorValue(): void {
    this.formConfig.components[0] = {
      ...this.formConfig.components[0],
      key: this.fieldData.key,
      defaultValue: this.fieldData.description
    };
  }
}
