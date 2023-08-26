import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-form-preview',
  templateUrl: './form-preview.component.html',
  styleUrls: ['./form-preview.component.css']
})
export class FormPreviewComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() components?: any;
  @Input() submission?: any;
  @Output() onChange: EventEmitter<any> = new EventEmitter();

  private showSelectTimePopup = false;
  private findTimeFields: any[] = [];
  private onChanges = new BehaviorSubject<SimpleChanges | null>(null);
  private selectedInput: any;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (Object.keys(this.submission || {}).length) {
      this.components.map((component: any) => {
        component.defaultValue = this.submission[component.key];
      });
    }
    this.findTimeFields = [];
    this.showSelectTimePopup = false;

    this.components.forEach((item: any, index: number) => {
      if (item.type === 'textfield') {
        const temp = {
          index,
          time: !!item.time
        };

        this.findTimeFields.push(temp);

        delete item.time;
      }
    });

    this.onChanges.next(changes);
  }

  ngAfterViewInit() {
    this.onChanges.subscribe(() => {
      setTimeout(() => {
        this.showSelectTimeModal();
      }, 0);
    });
  }

  ngOnDestroy() {
    this.onChanges.complete();
  }

  public handleChange(event: any) {
    this.onChange.emit(event);
  }

  private insertAfter(referenceNode: any, newNode: any) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  private showSelectTimeModal() {
    const allInputs = document.querySelectorAll('mat-formio-textfield input');
    const timeInputs: any[] = [];

    this.findTimeFields.forEach((item, itemIndex) => {
      allInputs.forEach((input, inputIndex) => {
        if (itemIndex === inputIndex && item.time) {
          timeInputs.push(input);
        }
      });
    });

    for (let i = 0; i < timeInputs.length; i++) {
      timeInputs[i].addEventListener('click', () => {
        this.showSelectTimePopup = !this.showSelectTimePopup;

        const element = document.createElement('div');
        const currentDate = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        });
        const splitDate = currentDate.split(':');

        element.setAttribute('class', 'dynamicShowElement-time-toggle');
        element.innerHTML = `
        <div class="select-time-wrapper-flex-content">
          <input type="number" class="hours"> :
          <input type="number" class="minutes"> :
          <input type="number" class="seconds">
          <input type="text" class="period">
        </div>
        `;

        if (this.showSelectTimePopup) {
          this.insertAfter(timeInputs[i].parentNode.parentNode.parentNode, element);

          (document.querySelector('.hours') as any).value = this.convertTime(splitDate[0] as any);
          (document.querySelector('.minutes') as any).value = splitDate[1];
          (document.querySelector('.seconds') as any).value = splitDate[2].slice(0, 2);
          (document.querySelector('.period') as any).value = this.convertTime(splitDate[0] as any, true);

          const periodInput = document.querySelector('.select-time-wrapper-flex-content .period');

          periodInput?.addEventListener('click', () => {
            (periodInput as any).value === 'AM'
              ? ((periodInput as any).value = 'PM')
              : ((periodInput as any).value = 'AM');
          });

          this.selectedInput = timeInputs[i];
        }

        const inputHours = (document.querySelector('.select-time-wrapper-flex-content .hours') as any)?.value || '';
        const inputMinutes = (document.querySelector('.select-time-wrapper-flex-content .minutes') as any)?.value || '';
        const inputSeconds = (document.querySelector('.select-time-wrapper-flex-content .seconds') as any)?.value || '';
        const inputPeriod = (document.querySelector('.select-time-wrapper-flex-content .period') as any)?.value || '';
        const hours = document.querySelector('.hours') as any;
        const minutes = document.querySelector('.minutes') as any;
        const seconds = document.querySelector('.seconds') as any;
        const period = document.querySelector('.period') as any;

        this.setMaxLength(hours);
        this.setMaxLength(minutes);
        this.setMaxLength(seconds);
        this.setMaxLength(period);
        this.setInputDefaultValue(hours, '12', 12);
        this.setInputDefaultValue(minutes, '00', 59);
        this.setInputDefaultValue(seconds, '00', 59);
        this.setInputDefaultValue(period, 'PM');

        if (!this.showSelectTimePopup) {
          (this.selectedInput as any).value = inputHours + ':' + inputMinutes + ':' + inputSeconds + ' ' + inputPeriod;

          const modal = document.querySelector('.dynamicShowElement-time-toggle');

          if (modal) {
            modal.remove();
          }
        }
      });
    }
  }

  private convertTime(value: any, timePeriod = false) {
    if (timePeriod) {
      let period;

      value >= 12 ? (period = 'PM') : (period = 'AM');

      return period;
    } else {
      if (value > 12) {
        return '0' + (value - 12);
      }

      return value;
    }
  }

  private setInputDefaultValue(selector: any, defaultValue: any, highestValue?: any) {
    selector.addEventListener('blur', () => {
      if (
        !(selector.value as any).toString().trim().length ||
        (highestValue && +(selector.value as any) > highestValue)
      ) {
        selector.value = defaultValue;
      } else if ((selector.value as any).toString().trim().length === 1) {
        defaultValue === 'PM' ? (selector.value = 'PM') : (selector.value = '0' + selector.value);
      } else if (defaultValue === 'PM') {
        if (selector.value !== 'PM' || selector.value !== 'AM') {
          selector.value = 'PM';
        }
      }
    });
  }

  private setMaxLength(selector: any, length = 2) {
    selector.addEventListener('keydown', () => {
      if (selector.value.length > length - 1) {
        selector.value = selector.value.slice(0, length - 1);
      }
    });
  }
}
