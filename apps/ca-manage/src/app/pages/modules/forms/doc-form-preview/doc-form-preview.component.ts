import { DOCUMENT } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  ElementRef,
  DoCheck,
  HostBinding,
  SimpleChanges,
  OnChanges,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  Inject
} from '@angular/core';
import { Router } from '@angular/router';
import { FlatPickrOutputOptions } from 'angularx-flatpickr/lib/flatpickr.directive';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-doc-form-preview',
  templateUrl: './doc-form-preview.component.html',
  styleUrls: ['./doc-form-preview.component.css']
})
export class DocFormPreviewComponent implements OnChanges, OnInit, DoCheck, OnDestroy, AfterViewInit {
  @ViewChild('wrapper') wrapperDiv?: ElementRef;
  @Input() fieldData: any = {};
  @Input() fieldKey: any = '';
  @Input() saveModel: any;
  @Input() components?: any;
  @Input() userField?: any;
  @Input() realVariable?: any;
  @Output() onChange: EventEmitter<any> = new EventEmitter();

  @Input() @HostBinding('style.width') width?: any;
  @Input() @HostBinding('style.height') height?: any;
  @Input() backgroundWidth!: number;

  @Input() public editTable: boolean = false;
  @Input() public creatorPreview: boolean = false;
  public previewListValue: string = '';
  public previewTableData: string[][] = [[]];

  private pageX?: any;
  private pageY?: any;
  private diffX?: any;
  private diffY?: any;
  private el?: any;
  private res?: any;

  private showSelectTimePopup = false;
  private findTimeFields: any = [];
  private findDateFields: any = [];
  private onChanges = new BehaviorSubject<SimpleChanges | null>(null);
  private selectedInput: any;
  public eventDate: any = [];
  public eventTime: any = [];
  public editorConfig?: any;
  public readonly columnsModelIndex: number = 0;
  public readonly rowsModelIndex: number = 1;

  @Input() @HostBinding('style.left') left?: any;
  @Input() @HostBinding('style.top') top?: any;
  @Input() scaleNumber: number = 1;
  title: string = 'title-hide';

  @HostBinding('style.--table-cell-height')
  @Input()
  tableCellHeight: string = '26px';

  @HostBinding('style.--checkbox-size')
  get checkBoxSize(): string {
    return this.backgroundWidth * 0.053 + 'px';
  }

  @HostBinding('style.--radio-size')
  @Input()
  radioButtonSize: string = '20px';

  @HostBinding('style.--radio-padding')
  get radioLeftPadding(): string {
    return +this.radioButtonSize.split('px')[0] / 4 + +this.radioButtonSize.split('px')[0] / 2 + 'px';
  }

  @HostBinding('style.--radio-selected')
  get radioInnerCircle(): string {
    return +this.radioButtonSize.split('px')[0] * 0.45 + 'px';
  }

  @HostBinding('style.--radio-checkmark')
  get radioCheckmarkLeftPadding(): string {
    return +this.radioButtonSize.split('px')[0] * 0.625 + 'px';
  }

  @HostBinding('style.--font-size') _fontSize: string = '13px';

  @Input() set fontSize(value: string) {
    this._fontSize = value;
    this.setDropdownFontSize();
  }

  @Input() backgroundSize!: number;

  @HostBinding('style.--ng-select-padding')
  get selectPadding(): string {
    const top = this.backgroundWidth * 0.0018;
    const right = this.backgroundWidth * 0.0177;
    const left = this.backgroundWidth * 0.0142;
    return `${top}px ${right}px 0 ${left}px`;
  }

  @HostBinding('style.--ng-select-margin')
  get selectMargin(): string {
    const top = (this.backgroundWidth * 0.0122) / 2;
    const right = this.backgroundWidth * 0.0159;
    const bot = (this.backgroundWidth * 0.0177) / 2;
    return `${top}px ${right}px ${bot}px 0`;
  }

  @HostBinding('style.--ng-select-border-radius')
  get selectBorderRadius(): string {
    const radius = this.backgroundWidth * 0.0071;
    return `${radius}px`;
  }

  @HostBinding('style.--ng-value-icon-size')
  get ngValueIcon(): string {
    const iconSize = this.backgroundWidth * 0.0283;
    return `${iconSize}px`;
  }

  @HostBinding('style.--ng-value-icon-border-width')
  get ngValueIconBorderWidth(): string {
    const iconBorderWidth = this.backgroundWidth * 0.0018;
    return `${iconBorderWidth}px`;
  }

  @HostBinding('style.--ng-value-icon-margin-right')
  get ngValueIconMarginRight(): string {
    const iconMarginRight = this.backgroundWidth * 0.0089;
    return `${iconMarginRight}px`;
  }
  @HostBinding('style.--delete-button-right')
  get deleteButtonRight(): number {
    return this.backgroundWidth! * 0.0389;
  }

  @HostBinding('style.--edit-button-right')
  get editButtonRight(): number {
    return this.backgroundWidth! * 0.0319;
  }

  @HostBinding('style.--table-button-padding')
  get tableButtonPadding(): number {
    return this.backgroundWidth! * 0.0035;
  }

  constructor(public elementRef: ElementRef, public router: Router, @Inject(DOCUMENT) private document: Document) {
    if (!this.saveModel) {
      this.saveModel = {};
    }
  }

  ngAfterViewInit(): void {
    const input = this.wrapperDiv?.nativeElement.querySelector('input');
    if (input) {
      input.style.fontSize = `${14 * (1 / this.scaleNumber)}px`;
    }
    const ngSelect = this.wrapperDiv?.nativeElement.querySelector('ng-select')
    if (ngSelect) {
      ngSelect.style.fontSize = `${14 * (1 / this.scaleNumber)}px`;
    }
    const textArea = this.wrapperDiv?.nativeElement.querySelector('textarea');
    if (textArea) {
      textArea.style.fontSize = `${14 * (1 / this.scaleNumber)}px`;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes?.['fieldData']?.previousValue?.description !== changes?.['fieldData']?.currentValue?.description &&
      this.fieldData.fieldType === 'text-only'
    ) {
      this.setEditorConfig();
    }

    if (Object.keys(this.saveModel || {}).length && Object.keys(this.userField || {}).length) {
      const objectKey: any = Object.keys(this.userField).find(key => {
        if (this.saveModel[this.fieldKey] === '${' + this.userField[key] + '}') {
          return true;
        } else {
          return false;
        }
      });
      this.saveModel[this.fieldKey] = this.realVariable[objectKey] || this.saveModel[this.fieldKey];
    }
    this.findTimeFields = [];
    this.findDateFields = [];
    this.showSelectTimePopup = false;

    this.components.forEach((item: any, index: number) => {
      if (item.type === 'textfield') {
        const temp = {
          index: index,
          key: item.key,
          time: !!item.time
        };

        this.findTimeFields.push(temp);

        delete item.time;
      } else if (item.type === 'datetime') {
        const temp = {
          index: index,
          key: item.key,
          value: item.defaultValue
        };
        this.findDateFields.push(temp);
      }
    });
  }

  ngOnInit() {
    this.setDropdownFontSize();
    this.setPreviewFieldsValues();
    this.setEditorConfig();
    this.el = this.elementRef.nativeElement;
    this.el.setAttribute('tabindex', '0');

    this.res = () => {
      this.el = this.elementRef.nativeElement;

      const parentNode = this.el.closest('.document-image-wrapper');

      if (parentNode) {
        this.diffX = (this.el.offsetWidth - this.el.offsetWidth) / 2;
        this.diffY = (this.el.offsetHeight - this.el.offsetHeight) / 2;
        this.el.classList.add('clear-after');
      }
    };

    window.addEventListener('resize', this.res);
    this.res();
  }

  ngOnDestroy() {
    this.onChanges.complete();
  }

  public currentTime(): string[] | number[] {
    const currentTime = new Date().toLocaleTimeString();

    return currentTime.split(' ')[0].split(':');
  }

  public handleChange(event: any) {
    if (this.creatorPreview) return;
    this.onChange.emit(event);
  }

  public listClick(listValue: string): void {
    this.previewListValue = listValue;
    if (this.creatorPreview) return;
    this.fieldData.description = listValue;
    this.saveModel[this.fieldKey] = listValue;
    this.handleChange(this.saveModel);
  }

  ngDoCheck() {
    this.res();
  }

  generateActiveItems(vl: any) {
    return (typeof vl === 'object' && vl) || [vl];
  }

  public changeTimeAndDate(event: FlatPickrOutputOptions): void {
    this.saveModel[this.fieldKey] = event.dateString;
  }

  public checkboxesChange(value: string): void {
    const checkboxIndex = this.saveModel[this.fieldKey].indexOf(value);
    if (checkboxIndex === -1) {
      this.saveModel[this.fieldKey].push(value);
    } else {
      this.saveModel[this.fieldKey].splice(checkboxIndex, 1);
    }
    this.handleChange(this.saveModel);
  }

  public addNewTableRow(): void {
    this.previewTableData.push([]);
  }

  public deleteTableRow(index: number): void {
    this.previewTableData.splice(index, 1);
  }

  public removeSelectItem(it: string): void {
    const newItems = this.saveModel[this.fieldData.key].filter((item: string) => item !== it);
    this.saveModel[this.fieldData.key] = [...newItems];
  }
  
  public addNewRow(tableData: string[][]): void {
    const tableColumnsLength: number = tableData[0].length;
    const newArray = new Array(tableColumnsLength);
    const updatedTableRows = [...tableData, newArray];
    this.saveModel[this.fieldData.key][1] = [...updatedTableRows];
  }
  
  public deleteRow(deleteRowIndex: number): void {
    const filteredArray = this.saveModel[this.fieldData.key][1].filter((_: any, i: number) => i !== deleteRowIndex);
    this.saveModel[this.fieldData.key][1] = [...filteredArray];
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

  private setDropdownFontSize(): void {
    const fontSizeValue: number = +this._fontSize.split('px')[0];
    const fontSize = (fontSizeValue * 800) / this.backgroundSize;
    this.document.documentElement.style.setProperty('--font-size', fontSize + 'px');
  }

  private setPreviewFieldsValues(): void {
    if (this.fieldData.fieldType === 'list') {
      this.previewListValue = this.fieldData.description;
    }
    if (this.fieldData.fieldType === 'table') {
      this.previewTableData = [...this.fieldData.rows];
    }
  }
}
