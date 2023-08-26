import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidatorFn, UntypedFormControl } from '@angular/forms';

// validation function
function validateJuriNameFactory(): ValidatorFn {
  return (c: AbstractControl) => {
    var isValid = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/.test(c.value);

    return isValid ? null : { time: { valid: false } };
  };
}

@Directive({
  selector: '[timeValidator][ngModel]',
  providers: [{ provide: NG_VALIDATORS, useExisting: TimeValidatorDirective, multi: true }]
})
export class TimeValidatorDirective implements Validator {
  validator: ValidatorFn;

  constructor() {
    this.validator = validateJuriNameFactory();
  }

  validate(c: UntypedFormControl) {
    return this.validator(c);
  }
}
