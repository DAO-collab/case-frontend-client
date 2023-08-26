import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordValidationComponent } from './password-validation.component';

@NgModule({
  declarations: [PasswordValidationComponent],
  imports: [CommonModule],
  exports: [PasswordValidationComponent]
})
export class PasswordValidationModule {}
