import { ChangePasswordModalComponent } from './change-password-modal/change-password-modal.component';
import { VerifyModalComponent } from './verify-modal/verify-modal.component';
import { ChangeContactComponent } from './change-contact/change-contact.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { AvatarModalComponent } from './avatar-modal/avatar-modal.component';
import { InternationalPhoneNumberModule } from 'ngx-international-phone-number';
import { PasswordValidationModule } from '@acc/common/components/password-validation/password-validation.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile.component';

import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FlatpickrModule } from 'angularx-flatpickr';
import { AvatarComponent } from './avatar/avatar.component';

import { LoaderModule } from '@acc/common/components/loader/loader.module';
import { ErrorModule } from '@acc/common/components/error/error.module';
import { CaTranslateModule } from '@acc/common/components/translate/ca-translate.module';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';

@NgModule({
  declarations: [
    ProfileComponent,
    AvatarComponent,
    AvatarModalComponent,
    ChangePasswordComponent,
    ChangeContactComponent,
    VerifyModalComponent,
    ChangePasswordModalComponent
  ],
  imports: [
    ImageCropperModule,
    InternationalPhoneNumberModule,
    CommonModule,
    PasswordValidationModule,
    ProfileRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, 'opts/', '/translations/ang.json'),
        deps: [HttpClient]
      }
    }),
    FlatpickrModule.forRoot(),
    LoaderModule,
    ErrorModule,
    CaTranslateModule,
    NgxIntlTelInputModule
  ]
})
export class ProfileModule {}
