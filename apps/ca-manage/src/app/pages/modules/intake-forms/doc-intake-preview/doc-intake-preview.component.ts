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
  AfterViewInit,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-doc-intake-preview',
  templateUrl: './doc-intake-preview.component.html',
  styleUrls: ['./doc-intake-preview.component.css']
})
export class DocIntakePreviewComponent implements OnChanges, OnInit, DoCheck, OnDestroy, AfterViewInit {
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

  @Input() @HostBinding('style.left') left?: any;
  @Input() @HostBinding('style.top') top?: any;
  @Input() scaleNumber: number = 1;
  title: string = 'title-hide';

  constructor(public elementRef: ElementRef, public router: Router) {
    if (!this.saveModel) {
      this.saveModel = {};
    }
  }

  ngOnChanges(changes: SimpleChanges) {
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

  ngAfterViewInit() {
    const input = this.wrapperDiv?.nativeElement.querySelector('input');
    if (input) {
      input.style.fontSize = `${14 * (1 / this.scaleNumber)}px`;
    }
    const ngSelect = this.wrapperDiv?.nativeElement.querySelector('ng-select')
    if (ngSelect) {
      ngSelect.style.fontSize = `${14 * (1 / this.scaleNumber)}px`;
    }
  }

  ngOnDestroy() {
    this.onChanges.complete();
  }

  public currentTime(): string[] | number[] {
    const currentTime = new Date().toLocaleTimeString();

    return currentTime.split(' ')[0].split(':');
  }

  public handleChange(event: any) {
    this.onChange.emit(event);
  }

  ngDoCheck() {
    this.res();
  }

  generateActiveItems(vl: any) {
    return (typeof vl === 'object' && vl) || [vl];
  }
}
