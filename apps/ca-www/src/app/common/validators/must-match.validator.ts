import { UntypedFormGroup } from '@angular/forms';

/**
 * Custom validator to check that two fields match.
 * Returns if another validator has already found an error on the matchingControl.
 * Sets error on matchingControl if validation fails.
 */
export function MustMatch(controlName: string, matchingControlName: string) {
  return (formGroup: UntypedFormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];

    if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
      return;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({
        mustMatch: true
      });
    } else {
      matchingControl.setErrors(null);
    }
  };
}
