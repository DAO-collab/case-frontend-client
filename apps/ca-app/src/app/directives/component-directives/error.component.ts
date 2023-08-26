import { Component, ElementRef, Renderer2, Input, OnInit, OnChanges, SimpleChange } from '@angular/core';
import { LocalTranslationService } from '../../services/local-translation.service';

@Component({
  selector: 'app-error',
  template: ''
})
export class ErrorComponent implements OnInit, OnChanges {
  private validationsObject: any = {};
  private runnedValidation = false;
  public serverErrorsAdded?: any;
  private fieldName: string = '';
  private lastNormalValue?: string;
  public errorTranslations: any;

  @Input() fieldValue?: string;
  @Input() field: any;
  @Input() regularHtmlElementName: any;
  @Input() validation: any;
  @Input() validationErrors: any[] = [];
  @Input() serverErrors: any;

  constructor(private el: ElementRef, private renderer: Renderer2, private translations: LocalTranslationService) {
    // Activate required validation types
    this.requiredField();
    this.validateEmail();
    this.minField();
    this.maxField();
    this.isNumber();
    this.isDate();
    this.minAmount();
    this.maxNumber();
    this.requiredLength();
    this.pattern();
    this.dups();
  }

  ngOnInit() {
    setTimeout(() => {
      this.ngOnChanges({
        fieldValue: {
          currentValue: this.field && this.field.value
        }
      });
    });

    this.serverErrorsAdded = false;
  }

  private requiredField() {
    this.validationsObject['required'] = (val: any, arg: any) => {
      const v = ('' + val).trim();
      let resp = false;

      if (arg && v && v.length > 0 && val != null) {
        resp = true;
      } else if (!arg) {
        resp = true;
      }

      return { status: resp, message: 'FieldRequiredException' };
    };
  }

  private requiredLength() {
    this.validationsObject['requiredLength'] = (arr: any, arg: any) => {
      const v = arr ? arr : [];
      let resp = false;

      if (v.length >= arg && arg !== false) {
        resp = true;
      } else if (arg === false) {
        resp = true;
      }

      return { status: resp, message: 'FieldRequiredException' };
    };
  }

  private minField() {
    this.validationsObject['min-length'] = (val: any, arg: any) => {
      const resp = val.length > arg;

      return { status: resp, message: 'FieldMinLengthException' };
    };
  }

  private maxField() {
    this.validationsObject['max-length'] = (val: any, arg: any) => {
      const resp = val.length > arg;

      return { status: !resp, message: 'FieldMaxLengthException' };
    };
  }

  private validateEmail() {
    const reg =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    this.validationsObject['email'] = (email: any, arg: any) => {
      const resp = arg ? email === arg : reg.test(String(email).toLowerCase());

      return { status: resp, message: 'FieldEmailTypeException' };
    };
  }

  private dups() {
    this.validationsObject['dups'] = (email: any, arg: any) => {
      return { status: false, message: 'FieldEmailDupsException' };
    };
  }

  private isNumber() {
    this.validationsObject['number'] = (v: any, arg: any) => {
      const toNumber = +v,
        resp = typeof arg === 'function' ? arg(v) : toNumber === toNumber;

      return { status: resp, message: 'FieldValidatorFailedException' };
    };
  }

  private maxNumber() {
    this.validationsObject['max-number'] = (v: any, arg: any) => {
      const toNumber = +v,
        resp = v <= arg;

      return { status: resp, message: 'FieldValidatorFailedException' };
    };
  }

  private minAmount() {
    this.validationsObject['min-required'] = (v: any, arg: any) => {
      const toNumber = +v,
        resp = v >= arg;

      return { status: resp, message: 'FieldRequiredException' };
    };
  }

  private pattern() {
    this.validationsObject['pattern'] = (v: any, pattern: any) => {
      v = v ? v : '';
      const reg = new RegExp(pattern);
      const resp = v.match(reg);

      return { status: resp || v === '', message: 'FieldValidatorFailedException' };
    };
  }

  private isDate() {
    this.validationsObject['date'] = (v: any, arg: any) => {
      const dt = new Date(v).getTime(),
        resp = typeof arg === 'function' ? arg(v) : dt === dt && v.length > 9;

      return { status: resp, message: 'FieldDateTypeException' };
    };
  }

  ngOnChanges(changes: any) {
    const errors: any[] = [];

    if (changes.fieldValue instanceof SimpleChange) {
      const targetField = this.field ? (this.field.element ? this.field.element.nativeElement : this.field) : null;
      const changeValue = (changes['fieldValue'] && changes['fieldValue'].currentValue) || '';

      if (targetField) {
        this.field = targetField;
      }

      this.lastNormalValue = changeValue;

      this.fieldName = this.field
        ? this.field.getAttribute('ng-reflect-name') || this.field.getAttribute('name') || this.regularHtmlElementName
        : null;

      if (this.serverErrors && this.serverErrors[this.fieldName] && !this.serverErrorsAdded) {
        this.serverErrorsAdded = true;
      } else {
        this.serverErrorsAdded = false;

        if (this.serverErrors && this.serverErrors[this.fieldName]) {
          delete this.serverErrors[this.fieldName];
        }
      }

      this.processServerErrors(this.serverErrors, this.fieldName, errors);
      this.processClientErrors(this.validation, changeValue, this.validationsObject, errors);
      this.checkValidationErrors(this.validationErrors, errors, this.fieldName);

      if (this.lastNormalValue) {
        if (errors.length) {
          if (this.validationErrors.indexOf(this.fieldName) === -1 && this.fieldName) {
            this.validationErrors.push(this.fieldName);
          }
        } else {
          if (this.validationErrors.indexOf(this.fieldName) > -1) {
            this.validationErrors.splice(this.validationErrors.indexOf(this.fieldName), 1);
          }
        }
      }

      if (!this.runnedValidation) {
        this.runnedValidation = true;
      }
    } else {
      this.processServerErrors(
        this.serverErrors,
        this.fieldName || (changes.regularHtmlElementName && changes.regularHtmlElementName.currentValue),
        errors
      );
      this.processClientErrors(this.validation, this.lastNormalValue, this.validationsObject, errors);
      this.checkValidationErrors(this.validationErrors, errors, this.fieldName);
    }

    this.showError(errors);

    if (!errors.length) {
      this.hideError();
    }
  }

  private processClientErrors(validation: any, currentValue: any, validationsObject: any, errors: any): void {
    if (!validation) {
      return;
    }

    Object.keys(validation).forEach(i => {
      const validResult = validationsObject[i](currentValue, validation[i]);

      if (!validResult.status) {
        if (!~errors.indexOf(validResult.message)) {
          errors.push(validResult.message);
        }
      }
    });
  }

  private processServerErrors(serverErrors: any, fieldName: any, errors: any) {
    serverErrors = (serverErrors && serverErrors[fieldName]) || [];

    serverErrors.forEach((err: any) => {
      if (!~errors.indexOf(err.id)) {
        errors.push(err.id);
      }
    });
  }

  private checkValidationErrors(validationErrors: any, errors: any, fieldName: any) {
    if (!validationErrors) {
      return;
    }

    if (errors.length) {
      if (validationErrors.indexOf(fieldName) === -1 && fieldName) {
        validationErrors.push(fieldName);
      }
    } else {
      if (validationErrors.indexOf(fieldName) > -1) {
        validationErrors.splice(validationErrors.indexOf(fieldName), 1);
      }
    }
  }

  private showError(errors: any) {
    if (this.translations.errorsDictionary) {
      this.el.nativeElement.innerHTML = this.errorsListToString(errors);
    } else {
      this.translations.loadErrors().subscribe(() => {
        this.el.nativeElement.innerHTML = this.errorsListToString(errors);
      });
    }

    if (!this.runnedValidation) {
      this.runnedValidation = true;
    } else {
      if (this.field) {
        this.renderer.addClass(this.field, 'not-valid');
      }
    }
  }

  private errorsListToString(errors: any) {
    const stringList = errors.reduce((a: any, err: any) => {
      const fullError = this.translations?.errorsDictionary?.[err];

      return a + (fullError ? '<span>' + fullError + '</span>' : '');
    }, '');

    return stringList;
  }

  private hideError() {
    if (this.field) {
      this.renderer.removeClass(this.field, 'not-valid');
    }
  }
}
