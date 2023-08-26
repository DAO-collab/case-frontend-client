import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';

import { CodeInputModule } from 'angular-code-input';
import { InternationalPhoneNumberModule } from 'ngx-international-phone-number';

import { AuthRoutingModule } from './auth-routing.module';

import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ResetPasswordConfirmComponent } from './reset-password-confirm/reset-password-confirm.component';
import { EnterCodeComponent } from './enter-code/enter-code.component';

import { ErrorModule } from '../common/components/error/error.module';
import { CaTranslateModule } from '../common/components/translate/ca-translate.module';
import { PasswordValidationModule } from '../common/components/password-validation/password-validation.module';

@NgModule({
  declarations: [
    LoginComponent,
    SignupComponent,
    ResetPasswordComponent,
    ResetPasswordConfirmComponent,
    EnterCodeComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    ErrorModule,
    CaTranslateModule,
    PasswordValidationModule,
    NgSelectModule,
    CodeInputModule,
    InternationalPhoneNumberModule
  ]
})
export class AuthModule {}
