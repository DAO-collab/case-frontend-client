import {
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, timer } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ResizableModule } from 'angular-resizable-element';
import { FlatpickrModule } from 'angularx-flatpickr';
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';
import { MatFormioModule } from '@formio/angular-material/dist';
import { ToggleComponent } from '../toggle';

const PAGE_ALL_SIDES_MARGIN: number = 96;

@Component({
  selector: 'ca-draggable-field',
  templateUrl: './draggable-field.component.html',
  styleUrls: ['./draggable-field.component.scss'],
  imports: [ 
    CommonModule,
    FormsModule,
    NgSelectModule,
    ResizableModule,
    FlatpickrModule,
    GooglePlaceModule,
    MatFormioModule,
    ToggleComponent
  ],
  standalone: true,
  host: {
    '(mousedown)': 'startDragging()',
    '(mouseup)': 'stopDragging()'
  }
})
export class DraggableFieldComponent implements OnChanges, OnInit, DoCheck {
  @ViewChild('resizeHandlerTop', { read: ElementRef }) resizeHandlerTop?: ElementRef<HTMLDivElement>;
  @ViewChild('resizeHandlerBot', { read: ElementRef }) resizeHandlerBot?: ElementRef<HTMLDivElement>;
  @ViewChild('resizeHandlerLeft', { read: ElementRef }) resizeHandlerLeft?: ElementRef<HTMLDivElement>;
  @ViewChild('resizeHandlerRight', { read: ElementRef }) resizeHandlerRight?: ElementRef<HTMLDivElement>;
  @ViewChild('resizeHandlerLeftTop', { read: ElementRef }) resizeHandlerLeftTop?: ElementRef<HTMLDivElement>;
  @ViewChild('resizeHandlerRightTop', { read: ElementRef }) resizeHandlerRightTop?: ElementRef<HTMLDivElement>;
  @ViewChild('resizeHandlerLeftBot', { read: ElementRef }) resizeHandlerLeftBot?: ElementRef<HTMLDivElement>;
  @ViewChild('resizeHandlerRightBot', { read: ElementRef }) resizeHandlerRightBot?: ElementRef<HTMLDivElement>;
  @ViewChild('resizeHandlerBorder', { read: ElementRef }) resizeHandlerBorder?: ElementRef<HTMLDivElement>;
  @Input() fieldData: any = {};
  @Input() fieldKey: string = '';
  @Input() saveModel: any;
  @Input() scaleNumber: number = 1;
  @Input() backgroundWidth!: number;

  @Output() changePosition: EventEmitter<any> = new EventEmitter();
  @Output() runFieldEditing: EventEmitter<any> = new EventEmitter();
  @Output() runFieldCopy: EventEmitter<any> = new EventEmitter();
  @Output() runFieldDelete: EventEmitter<any> = new EventEmitter();
  @Output() dragStop: EventEmitter<any> = new EventEmitter();
  @Output() resizeEnd: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() resizeStart: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input() showResizeHandlers: boolean = false;

  @Input() disableDragging?: any;
  @Input() disableEditing?: any;
  @Input() isPreparing: boolean = false;
  
  @Input() @HostBinding('style.width') width?: string;
  @Input() @HostBinding('style.height') height?: string;

  @HostBinding('style.--radio-size')
  @Input()
  radioButtonSize: string = '20px';

  public editorConfig?: any;
  public isResizing: boolean = false;

  private pageX?: any;
  private pageY?: any;
  private diffX?: any;
  private diffY?: any;
  private el?: any;
  private res?: any;
  private disableMobileEditing = false;
  private destroy$: Subject<void> = new Subject<void>();

  @HostBinding('style.--radio-padding')
  get radioLeftPadding(): string {
    return +this.radioButtonSize.split('px')[0] / 4 + +this.radioButtonSize.split('px')[0] / 2 + 'px';
  }

  @Input() @HostBinding('style.left') left?: any;
  @Input() @HostBinding('style.top') top?: any;
  title: string = 'title-hide';

  @HostBinding('class.dragging')
  public isDragging: boolean = false;

  @HostBinding('style.--table-cell-height')
  @Input()
  tableCellHeight: string = '26px';

  @HostBinding('style.--font-size')
  @Input()
  fontSize: string = '13px';

  @HostBinding('style.--checkbox-size')
  get checkBoxSize(): string {
    return this.backgroundWidth * 0.053 + 'px';
  }

  @Input() pageMargin: number = PAGE_ALL_SIDES_MARGIN;

  @HostBinding('style.--ng-select-padding')
  get selectPadding(): string {
    const top = this.backgroundWidth * 0.0018;
    const right = this.backgroundWidth * 0.0177;
    const left = this.backgroundWidth * 0.0142;
    return `${top}px ${right}px 0 ${left}px`;
  }

  @HostBinding('style.--ng-select-margin')
  get selectMargin(): string {
    const top = this.backgroundWidth * 0.0122;
    const right = this.backgroundWidth * 0.0159;
    const bot = this.backgroundWidth * 0.0177;
    return `${top}px ${right}px ${bot}px 0`;
  }

  @HostBinding('style.--ng-value-label-line-height')
  get ngValueLabelLineHeight(): string {
    const labelLineHeight = this.backgroundWidth * 0.0354;
    return `${labelLineHeight}px`;
  }

  @HostBinding('style.--ng-select-border-radius')
  get selectBorderRadius(): string {
    const radius = this.backgroundWidth * 0.0071;
    return `${radius}px`;
  }

  @HostBinding('style.--ng-value-icon-border-width')
  get ngValueIconBorderWidth(): string {
    const iconBorderWidth = this.backgroundWidth * 0.0018;
    return `${iconBorderWidth}px`;
  }

  @HostBinding('style.--resize-handler-size')
  get resizeHandlerSize(): number {
    return this.backgroundWidth! * 0.023;
  }

  constructor(
    public elementRef: ElementRef,
  ) {
    if (!this.saveModel) {
      this.saveModel = {};
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.['fieldData']?.previousValue?.description !== changes?.['fieldData']?.currentValue?.description &&
      this.fieldData.fieldType === 'text-only'
    ) {
      this.setEditorConfig();
    }
  }

  ngOnInit() {
    this.setEditorConfig();
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

    // need to rewrite that logic or check if it needed
    // timer(10000)
    //   .pipe(
    //     tap(() => this.res()),
    //     takeUntil(this.destroy$)
    //   )
    //   .subscribe();
  }

  ngDoCheck() {
    // need to rewrite that logic or check if it needed
    // this.res();
  }

  changeStyle($event: any) {
    this.title = $event.type == 'mouseover' ? 'title-show' : 'title-hide';
  }

  generateActiveItems(vl: any) {
    return (typeof vl === 'object' && vl) || [vl];
  }

  checkIfValueExists(name: string, v: string) {
    if (!this.saveModel[name]) {
      this.saveModel[name] = v;
    }
  }

  runFieldEditingF($event: Event) {
    $event.stopPropagation();
    this.runFieldEditing.emit(this.fieldData);
  }

  runFieldCopyF($event: Event) {
    $event.stopPropagation();
    this.runFieldCopy.emit(this.fieldData);
  }

  runFieldDeleteF($event: Event) {
    $event.stopPropagation();
    this.runFieldDelete.emit(this.fieldKey);
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

    this.width = parentNode.offsetWidth + 'px';
    this.height = parentNode.offsetHeight + 'px';
    this.left = parentNode.offsetLeft + 'px';
    this.top = parentNode.offsetTop + 'px';
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

      const diffX = (e.pageX - self.pageX) / this.scaleNumber,
        diffY = (e.pageY - self.pageY) / this.scaleNumber;

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

    const draggStop = (e: Event) => {
      // Stop dragging spots
      this.dragStop.emit();
      document.removeEventListener('mousemove', draggWatch, false);
      document.removeEventListener('mouseup', draggStop, false);
    };

    document.addEventListener('mousemove', draggWatch, false);
    document.addEventListener('mouseup', draggStop, false);
  }

  public onResizeEnd($event: any, wrapper: HTMLDivElement): void {
    this.isResizing = false;
    this.disableMobileEditing = false;
    const parentNode = wrapper.parentNode,
      documentImageWrapper = parentNode?.parentNode,
      documentImage = documentImageWrapper?.querySelector('img');
    const maxWidthOfPageEditor = documentImage?.offsetWidth! - this.pageMargin * 2;
    const maxHeightOfPageEditor = documentImage?.offsetHeight! - this.pageMargin * 2;

    const self = this;
    const left = $event.edges?.left || 0;
    const top = $event.edges?.top || 0;
    const leftToSet = parseInt(this.left, 10) + left;
    const topToSet = parseInt(this.top, 10) + top;

    const rectangleWidth = $event.rectangle.width;
    const rectangleHeight = $event.rectangle.height;

    const leftValueAfterConditionCheck = this.onResizeEdgeDistanceToSet(
      leftToSet,
      rectangleWidth,
      maxWidthOfPageEditor
    );

    const topValueAfterConditionCheck = this.onResizeEdgeDistanceToSet(
      topToSet,
      rectangleHeight,
      maxHeightOfPageEditor
    );

    this.changePosition.emit({
      width: Math.min(rectangleWidth, maxWidthOfPageEditor) + 'px',
      left: leftValueAfterConditionCheck + 'px',
      top: topValueAfterConditionCheck + 'px',
      diffX: this.diffX,
      diffY: this.diffY,
      height: $event.rectangle.height + 'px',
      fieldName: this.fieldData.name
    });
    this.resizeEnd.emit(this.isResizing);
  }

  startChangePosition($event: any, wrapper: any) {

    $event.preventDefault();
    this.el.focus();

    const parentNode = wrapper.parentNode,
      documentImageWrapper = parentNode.parentNode,
      documentImage = documentImageWrapper.querySelector('img'),
      leftMargin = documentImage.offsetLeft + this.pageMargin,
      fieldWidth = parentNode.offsetWidth,
      topMargin = documentImage.offsetTop + this.pageMargin,
      fieldHeight = parentNode.offsetHeight;

    this.pageX = $event.pageX;
    this.pageY = $event.pageY;
    this.left = parentNode.offsetLeft + 'px';
    this.top = parentNode.offsetTop + 'px';
    this.width = parentNode.offsetWidth + 'px';
    this.height = parentNode.offsetHeight + 'px';

    // Document Wrapper
    const maxRight = documentImage.offsetWidth + leftMargin - this.pageMargin * 2,
      maxBottom = documentImage.offsetHeight + topMargin - this.pageMargin * 2;

    // Document
    const initialLeft = parentNode.offsetLeft,
      initialTop = parentNode.offsetTop;

    this.res();

    const draggWatch = (e: any) => {
      e.preventDefault();

      const diffX = (e.pageX - this.pageX) / this.scaleNumber,
        diffY = (e.pageY - this.pageY) / this.scaleNumber;

      const newLeft = initialLeft + diffX,
        newTop = initialTop + diffY;

      // Coord match
      const correctLeft = newLeft >= leftMargin,
        correctRight = newLeft + fieldWidth <= maxRight,
        correctTop = newTop >= topMargin,
        correctBottom = newTop + fieldHeight <= maxBottom;

      // Set new Top and Left based on new coords
      this.left = (correctLeft && correctRight ? newLeft : !correctRight ? maxRight - fieldWidth : leftMargin) + 'px';
      this.top = (correctTop && correctBottom ? newTop : !correctBottom ? maxBottom - fieldHeight : topMargin) + 'px';

      this.changePosition.emit({
        width: this.width,
        left: this.left,
        top: this.top,
        diffX: this.diffX,
        diffY: this.diffY,
        height: fieldHeight + 'px',
        docHolderWidth: documentImageWrapper.offsetWidth,
        fieldName: this.fieldData.name
      });
    };

    const draggStop = (e: MouseEvent) => {
      // Stop dragging spots
      this.dragStop.emit();
      document.removeEventListener('mousemove', draggWatch, false);
      document.removeEventListener('mouseup', draggStop, false);
    };

    document.addEventListener('mousemove', draggWatch, false);
    document.addEventListener('mouseup', draggStop, false);
  }

  public onResizeStart(): void {
    this.isResizing = true;
    this.disableMobileEditing = true;
    this.resizeStart.emit(this.isResizing);
  }

  startMobileChangePosition($event: any, wrapper: any): void {
    setTimeout(() => {
      if (this.disableMobileEditing) {
        return;
      }

      $event.preventDefault();

      this.el.focus();

      const parentNode = wrapper.parentNode,
        documentImageWrapper = parentNode.parentNode,
        documentImage = documentImageWrapper.querySelector('img'),
        leftMargin = documentImage.offsetLeft,
        fieldWidth = parentNode.offsetWidth,
        topMargin = documentImage.offsetTop,
        fieldHeight = parentNode.offsetHeight;

      this.pageX = $event.changedTouches[0].pageX;
      this.pageY = $event.changedTouches[0].pageY;
      this.left = parentNode.offsetLeft + 'px';
      this.top = parentNode.offsetTop + 'px';
      this.width = parentNode.offsetWidth + 'px';
      this.height = parentNode.offsetHeight + 'px';

      // Document Wrapper
      const maxRight = documentImage.offsetWidth + leftMargin,
        maxBottom = documentImage.offsetHeight + topMargin;

      // Document
      const initialLeft = parentNode.offsetLeft,
        initialTop = parentNode.offsetTop;

      const draggWatchMobile = (e: any) => {
        const diffX = (e.changedTouches[0].pageX - this.pageX) / this.scaleNumber,
          diffY = (e.changedTouches[0].pageY - this.pageY) / this.scaleNumber,
          newLeft = initialLeft + diffX,
          newTop = initialTop + diffY;

        // Coord match
        const correctLeft = newLeft >= leftMargin,
          correctRight = newLeft + fieldWidth <= maxRight,
          correctTop = newTop >= topMargin,
          correctBottom = newTop + fieldHeight <= maxBottom;

        // Set new Top and Left based on new coords
        this.left = (correctLeft && correctRight ? newLeft : !correctRight ? maxRight - fieldWidth : leftMargin) + 'px';
        this.top = (correctTop && correctBottom ? newTop : !correctBottom ? maxBottom - fieldHeight : topMargin) + 'px';

        this.changePosition.emit({
          width: this.width,
          left: this.left,
          top: this.top,
          diffX: this.diffX,
          diffY: this.diffY,
          height: fieldHeight + 'px',
          docHolderWidth: documentImageWrapper.offsetWidth,
          fieldName: this.fieldData.name
        });
      };

      const draggStop = (e: any) => {
        // Stop dragging spots
        this.dragStop.emit();
        document.removeEventListener('touchmove', draggWatchMobile, false);
        document.removeEventListener('touchend', draggStop, false);
      };

      document.addEventListener('touchmove', draggWatchMobile, false);
      document.addEventListener('touchend', draggStop, false);
    }, 0);
  }

  emit() {
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

  public restrictChange(event: Event): void {
    event.preventDefault();
  }

  public startDragging(): void {
    this.isDragging = true;
  }

  public stopDragging(): void {
    this.isDragging = false;
  }

  private setEditorConfig(): void {
    this.editorConfig = {
      components: [
        {
          type: 'textarea',
          defaultValue: this.fieldData.description,
          label: '',
          key: this.fieldData.key,
          wysiwyg: {
            toolbar: false
          },
          editor: 'ckeditor',
          disabled: true
        }
      ]
    };
  }

  private onResizeEdgeDistanceToSet(
    edgeValueToSet: number,
    rectangleDistanceValue: number,
    maxAvailableDistanceValueOfPageEditor: number
  ): number {
    const edgeCondition =
      edgeValueToSet + rectangleDistanceValue > maxAvailableDistanceValueOfPageEditor
        ? edgeValueToSet -
          (edgeValueToSet + rectangleDistanceValue - maxAvailableDistanceValueOfPageEditor - this.pageMargin)
        : edgeValueToSet;
    const edgeValueAfterConditionCheck = edgeValueToSet <= this.pageMargin ? this.pageMargin : edgeCondition;

    return edgeValueAfterConditionCheck;
  }
}
