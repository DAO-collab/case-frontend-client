import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@www/common/shared.module';

import { SignUpComponent } from './sign-up/sign-up.component';
import { PasswordValidationComponent } from './sign-up/password-validation/password-validation.component';

@NgModule({
  declarations: [SignUpComponent, PasswordValidationComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([]),
    SharedModule,
    TranslateModule,
    NgSelectModule
  ],
  exports: [SignUpComponent]
})
export class AuthModule {}
