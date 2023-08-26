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
  AfterViewInit,
  OnDestroy,
  ViewChild,
  Inject
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { SignsService } from '../../../services/signs.service';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-doc-sign-preview',
  templateUrl: './doc-sign-preview.component.html',
  styleUrls: ['./doc-sign-preview.component.css']
})
export class DocSignPreviewComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy, DoCheck {
  @ViewChild('wrapper') wrapperDiv?: ElementRef;

  @Input() fieldData: any = {};
  @Input() fieldKey: any = '';
  @Input() saveModel?: any;
  @Input() components?: any;
  @Input() userField?: any;
  @Input() realVariable?: any;
  @Output() onChange: EventEmitter<any> = new EventEmitter();

  @Input() @HostBinding('style.width') width?: any;
  @Input() @HostBinding('style.height') height?: any;
  @Input() highlightField: boolean = false;
  @Input() public creatorPreview: boolean = false;
  @Input() backgroundWidth?: number;

  private pageX?: any;
  private pageY?: any;
  private diffX?: any;
  private diffY?: any;
  private el?: any;
  private res?: any;

  private showSelectTimePopup = false;
  private findTimeFields: any[] = [];
  private findDateFields: any[] = [];
  private onChanges = new BehaviorSubject<SimpleChanges | null>(null);
  private selectedInput: any;
  public eventDate: any = [];
  public eventTime: any = [];
  public readonly columnsModelIndex: number = 0;
  public readonly rowsModelIndex: number = 1;
  public previewListValue: string = '';
  public previewTableData: string[][] = [[]];
  public currentTimeForInput!: string;

  public editorConfig?: any;

  @Input() @HostBinding('style.left') left?: any;
  @Input() @HostBinding('style.top') top?: any;
  @Input() scaleNumber: number = 1;
  @Input() public editTable: boolean = false;
  @Input() previewSignatureSrc?: string;
  title: string = 'title-hide';

  @HostBinding('style.--font-size') _fontSize: string = '13px';

  @Input() set fontSize(value: string) {
    this._fontSize = value;
    this.setDropdownFontSize();
  }

  @HostBinding('style.--table-cell-height')
  @Input()
  tableCellHeight: string = '26px';

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

  @Input() backgroundSize?: number;

  @HostBinding('style.--checkbox-size')
  get checkBoxSize(): string {
    return this.backgroundWidth! * 0.053 + 'px';
  }

  @HostBinding('style.--ng-select-padding')
  get selectPadding(): string {
    const top = this.backgroundWidth! * 0.0018;
    const right = this.backgroundWidth! * 0.0177;
    const left = this.backgroundWidth! * 0.0142;
    return `${top}px ${right}px 0 ${left}px`;
  }

  @HostBinding('style.--ng-select-margin')
  get selectMargin(): string {
    const top = this.backgroundWidth! * 0.0122;
    const right = this.backgroundWidth! * 0.0159;
    const bot = this.backgroundWidth! * 0.0177;
    return `${top}px ${right}px ${bot}px 0`;
  }

  @HostBinding('style.--ng-select-border-radius')
  get selectBorderRadius(): string {
    const radius = this.backgroundWidth! * 0.0071;
    return `${radius}px`;
  }

  @HostBinding('style.--ng-value-icon-size')
  get ngValueIcon(): string {
    const iconSize = this.backgroundWidth! * 0.0283;
    return `${iconSize}px`;
  }

  @HostBinding('style.--ng-value-icon-border-width')
  get ngValueIconBorderWidth(): string {
    const iconBorderWidth = this.backgroundWidth! * 0.0018;
    return `${iconBorderWidth}px`;
  }

  @HostBinding('style.--ng-value-icon-margin-right')
  get ngValueIconMarginRight(): string {
    const iconMarginRight = this.backgroundWidth! * 0.0089;
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

  constructor(
    public elementRef: ElementRef,
    public router: Router,
    private signsService: SignsService,
    public utilsService: UtilsService,
    @Inject(DOCUMENT) private document: Document
  ) {
    if (!this.saveModel) {
      this.saveModel = {};
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (Object.keys(this.saveModel || {}).length && Object.keys(this.userField || {}).length) {
      const objectKey = Object.keys(this.userField).find(key => {
        if (this.saveModel[this.fieldKey] === '${' + this.userField[key] + '}') {
          return true;
        } else {
          return false;
        }
      });
      this.saveModel[this.fieldKey] = this.realVariable[objectKey as any] || this.saveModel[this.fieldKey];
      if (this.fieldData.format) {
        this.saveModel[this.fieldKey] = this.utilsService.doMask(this.saveModel[this.fieldKey], this.fieldData.format);
      }
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

    // this.onChanges.next(changes);
  }

  ngOnInit() {
    this.setEditorConfig();
    this.setPreviewFieldsValues();
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
    this.setDropdownFontSize();
    this.setTimeForTimeField();
  }

  public setTimeForTimeField(): void {
    if (this.fieldData.fieldType === 'time') {
      if (this.fieldData.description) {
        this.currentTimeForInput = this.fieldData.description;
      } else {
        const newDate = new Date().toISOString().split('T')[1].split(':');

        this.currentTimeForInput = `${newDate[0]}:${newDate[1]}:${newDate[2].slice(0, 2)} ${+newDate[0] > 12 ? 'PM': 'AM'}`;
      }

      this.saveModel[this.fieldKey] = this.currentTimeForInput;
    } else if (this.fieldData.fieldType === 'date') {
      this.saveModel[this.fieldKey] = this.fieldData.description;
    }
  }

  ngAfterViewInit() {
    const input = this.wrapperDiv?.nativeElement.querySelector('input');
    if (input) {
      input.style.fontSize = `${14 * (1 / this.scaleNumber)}px`;
    }
    const ngSelect = this.wrapperDiv?.nativeElement.querySelector('ng-select')
    if (ngSelect) {
      ngSelect.style.fontSize = `${14 * (1 / this.scaleNumber)}px`;
    }
    const textArea = this.wrapperDiv?.nativeElement.querySelector('textarea')
    if (textArea) {
      textArea.style.fontSize = `${14 * (1 / this.scaleNumber)}px`;
    }
  }

  ngOnDestroy() {
    this.onChanges.complete();
  }

  public handleChange(event: any) {
    if (this.creatorPreview) return;
    this.onChange.emit(event);
  }

  public handleKeyup($event: any, field: any) {
    if (field.format) {
      this.saveModel[field.key] = this.utilsService.doMask(this.saveModel[field.key], field.format);
    }
  }

  ngDoCheck() {
    this.res();
  }

  generateActiveItems(vl: any) {
    return (typeof vl === 'object' && vl) || [vl];
  }

  openSignaturePopup(fieldData: any): void {
    this.signsService.isSignaturePopupOpened$.next({ ...fieldData });
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

  public listClick(listValue: string): void {
    this.fieldData.description = listValue;
    this.saveModel[this.fieldKey] = listValue;
    this.previewListValue = listValue;
    this.handleChange(this.saveModel);
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
    const fontSize = (fontSizeValue * 800) / this.backgroundSize!;
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
